<?php

namespace App\Controller;

use App\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

class AuthController extends AbstractController
{
    #[Route('/api/auth/login', name: 'api_login', methods: ['POST'])]
    public function login(): JsonResponse
    {
        return $this->json(['message' => 'login check path']);
    }

    #[Route('/api/auth/me', name: 'api_me', methods: ['GET'])]
    public function me(#[CurrentUser] ?User $user): JsonResponse
    {
        if (null === $user) {
            return $this->json(['message' => 'missing credentials'], Response::HTTP_UNAUTHORIZED);
        }

        return $this->json([
            'user' => [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'name' => $user->getName(),
                'region' => $user->getRegion(),
                'role' => $user->getRole(), // Singular role
                'roles' => $user->getRoles() // Keep roles array for compatibility if needed
            ]
        ]);
    }
    #[Route('/api/auth/refresh', name: 'api_refresh_token', methods: ['POST'])]
    public function refresh(): JsonResponse
    {
        return $this->json(['message' => 'RefreshTokenAuthenticator should handle this request'], 500);
    }
}
