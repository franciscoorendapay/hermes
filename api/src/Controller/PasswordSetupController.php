<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

class PasswordSetupController extends AbstractController
{
    #[Route('/api/auth/setup-password', name: 'api_auth_setup_password', methods: ['POST'])]
    public function setupPassword(
        Request $request,
        UserRepository $userRepository,
        UserPasswordHasherInterface $passwordHasher,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);
        $email = $data['email'] ?? null;
        $plainPassword = $data['password'] ?? null;

        if (!$email || !$plainPassword) {
            return $this->json(['message' => 'Email and password are required'], Response::HTTP_BAD_REQUEST);
        }

        $user = $userRepository->findOneBy(['email' => $email]);

        if (!$user) {
            return $this->json(['message' => 'Invalid request'], Response::HTTP_FORBIDDEN);
        }

        if ($user->getPassword() !== null) {
            return $this->json(['message' => 'Password already set. Please login.'], Response::HTTP_CONFLICT);
        }
        
        if (strlen($plainPassword) < 6) {
             return $this->json(['message' => 'Password must be at least 6 characters'], Response::HTTP_BAD_REQUEST);
        }

        $hashedPassword = $passwordHasher->hashPassword($user, $plainPassword);
        $user->setPassword($hashedPassword);
        
        $entityManager->flush();

        return $this->json(['message' => 'Password set successfully. You can now login.']);
    }
}
