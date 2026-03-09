<?php

namespace App\Security;

use App\Repository\UserRepository;
use Lexik\Bundle\JWTAuthenticationBundle\Security\Http\Authentication\AuthenticationFailureHandler as LexikAuthenticationFailureHandler;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Http\Authentication\AuthenticationFailureHandlerInterface;

class AuthenticationFailureHandler implements AuthenticationFailureHandlerInterface
{
    private $userRepository;
    private $lexikHandler;

    public function __construct(UserRepository $userRepository, LexikAuthenticationFailureHandler $lexikHandler)
    {
        $this->userRepository = $userRepository;
        $this->lexikHandler = $lexikHandler;
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): Response
    {
        $data = json_decode($request->getContent(), true);
        $email = $data['email'] ?? null;

        if ($email) {
            $user = $this->userRepository->findOneBy(['email' => $email]);

            if ($user && $user->getPassword() === null) {
                return new JsonResponse([
                    'code' => 403,
                    'message' => 'Password setup required',
                    'type' => 'PASSWORD_SETUP_REQUIRED',
                    'email' => $email
                ], Response::HTTP_FORBIDDEN);
            }
        }

        return $this->lexikHandler->onAuthenticationFailure($request, $exception);
    }
}
