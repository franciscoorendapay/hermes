<?php

namespace App\Security;

use App\Entity\User;
use Lexik\Bundle\JWTAuthenticationBundle\Security\Http\Athentication\AuthenticationSuccessHandler as BaseAuthenticationSuccessHandler;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Lexik\Bundle\JWTAuthenticationBundle\Event\AuthenticationSuccessEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;
use Symfony\Component\Security\Http\Authentication\AuthenticationSuccessHandlerInterface;

use Gesdinet\JWTRefreshTokenBundle\Generator\RefreshTokenGeneratorInterface;
use Gesdinet\JWTRefreshTokenBundle\Model\RefreshTokenManagerInterface;

class AuthenticationSuccessHandler implements AuthenticationSuccessHandlerInterface
{
    private $jwtManager;
    private $dispatcher;
    private $refreshTokenManager;
    private $refreshTokenGenerator;

    public function __construct(JWTTokenManagerInterface $jwtManager, EventDispatcherInterface $dispatcher, RefreshTokenManagerInterface $refreshTokenManager, RefreshTokenGeneratorInterface $refreshTokenGenerator)
    {
        $this->jwtManager = $jwtManager;
        $this->dispatcher = $dispatcher;
        $this->refreshTokenManager = $refreshTokenManager;
        $this->refreshTokenGenerator = $refreshTokenGenerator;
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token): Response
    {
        /** @var User $user */
        $user = $token->getUser();
        $jwt = $this->jwtManager->create($user);

        $refreshToken = $this->refreshTokenGenerator->createForUserWithTtl($user, 2592000); // 1 month
        $this->refreshTokenManager->save($refreshToken);

        // Enrich data with user info and roles
        $finalRoles = $user->getRoles(); 
        
        $data = [
            'accessToken' => $jwt,
            'refreshToken' => $refreshToken->getRefreshToken(),
            'user' => [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'name' => $user->getName(),
                'region' => $user->getRegion(),
                'role' => $user->getRole(), // Singular role
                'roles' => $finalRoles
            ]
        ];

        $response = new AuthenticationSuccessEvent($data, $user, new Response());
        $this->dispatcher->dispatch($response, 'lexik_jwt_authentication.on_authentication_success');
        
        // The event listeners (if any) might have modified the data, so we retrieve it back
        $finalData = $response->getData();

        return new \Symfony\Component\HttpFoundation\JsonResponse($finalData);
    }
}
