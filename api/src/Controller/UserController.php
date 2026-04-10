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
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Serializer\Exception\NotEncodableValueException;

#[Route('/api/users')]
class UserController extends AbstractController
{
    #[Route('', name: 'app_user_index', methods: ['GET'])]
    public function index(UserRepository $userRepository): JsonResponse
    {
        return $this->json($userRepository->findAll(), Response::HTTP_OK, [], ['groups' => 'user:read']);
    }

    #[Route('/commercial', name: 'app_user_commercial', methods: ['GET'])]
    public function commercial(UserRepository $userRepository): JsonResponse
    {
        // Only allow admin users to access this endpoint
        // Note: In production, add proper role checking
        // $this->denyAccessUnlessGranted('ROLE_ADMIN');

        // Find users with comercial or manager role
        $users = $userRepository->createQueryBuilder('u')
            ->where('u.role IN (:roles)')
            ->setParameter('roles', ['comercial', 'manager'])
            ->orderBy('u.name', 'ASC')
            ->getQuery()
            ->getResult();

        return $this->json($users, Response::HTTP_OK, [], ['groups' => 'user:read']);
    }

    #[Route('/{id}', name: 'app_user_show', methods: ['GET'])]
    public function show(User $user): JsonResponse
    {
        return $this->json($user, Response::HTTP_OK, [], ['groups' => 'user:read']);
    }

    #[Route('', name: 'app_user_create', methods: ['POST'])]
    public function create(
        Request $request,
        SerializerInterface $serializer,
        ValidatorInterface $validator,
        EntityManagerInterface $entityManager,
        UserPasswordHasherInterface $passwordHasher
    ): JsonResponse {
        try {
            /** @var User $user */
            // deserialize will handle basic fields like name, email, region, phone
            $user = $serializer->deserialize($request->getContent(), User::class, 'json', ['groups' => 'user:write']);
        } catch (NotEncodableValueException $e) {
            return $this->json(['error' => 'Invalid JSON'], Response::HTTP_BAD_REQUEST);
        }

        $errors = $validator->validate($user, null, ['create']);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->json(['errors' => $errorMessages], Response::HTTP_BAD_REQUEST);
        }

        if ($user->getPassword()) {
             $hashedPassword = $passwordHasher->hashPassword($user, $user->getPassword());
             $user->setPassword($hashedPassword);
        }
        
        $user->setCreatedAt(new \DateTimeImmutable());
        
        // Handle Roles - Compatibility if 'roles' array is sent manually (though serializer might handle it via setRoles)
        $data = json_decode($request->getContent(), true);
        if (isset($data['role'])) {
            $user->setRole($data['role']);
        } elseif (isset($data['roles']) && is_array($data['roles']) && !empty($data['roles'])) {
            $user->setRole($data['roles'][0]);
        }

        if (array_key_exists('includeInStats', $data)) {
            $user->setIncludeInStats((bool) $data['includeInStats']);
        }

        $entityManager->persist($user);
        $entityManager->flush();

        return $this->json($user, Response::HTTP_CREATED, [], ['groups' => 'user:read']);
    }

    #[Route('/{id}', name: 'app_user_update', methods: ['PUT', 'PATCH'])]
    public function update(
        Request $request,
        User $user,
        SerializerInterface $serializer,
        ValidatorInterface $validator,
        EntityManagerInterface $entityManager,
        UserPasswordHasherInterface $passwordHasher
    ): JsonResponse {
        try {
            $serializer->deserialize($request->getContent(), User::class, 'json', [
                'groups' => 'user:write',
                'object_to_populate' => $user
            ]);
        } catch (NotEncodableValueException $e) {
            return $this->json(['error' => 'Invalid JSON'], Response::HTTP_BAD_REQUEST);
        }

        $errors = $validator->validate($user);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->json(['errors' => $errorMessages], Response::HTTP_BAD_REQUEST);
        }
        
        $data = json_decode($request->getContent(), true);
        if (isset($data['password']) && !empty($data['password'])) {
             $hashedPassword = $passwordHasher->hashPassword($user, $data['password']);
             $user->setPassword($hashedPassword);
        }

        // Handle explicit 'roles' array to single role if sent
        if (isset($data['roles']) && is_array($data['roles']) && !empty($data['roles'])) {
            $user->setRole($data['roles'][0]);
        }
        if (isset($data['role'])) {
            $user->setRole($data['role']);
        }

        if (array_key_exists('includeInStats', $data)) {
            $user->setIncludeInStats((bool) $data['includeInStats']);
        }

        try {
            $entityManager->flush();
        } catch (\Throwable $e) {
            return $this->json(['error' => 'Erro ao salvar: ' . $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        return $this->json($user, Response::HTTP_OK, [], ['groups' => 'user:read']);
    }

    #[Route('/{id}', name: 'app_user_delete', methods: ['DELETE'])]
    public function delete(User $user, EntityManagerInterface $entityManager): JsonResponse
    {
        $entityManager->remove($user);
        $entityManager->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }
}
