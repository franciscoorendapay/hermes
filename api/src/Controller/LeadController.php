<?php

namespace App\Controller;

use App\Entity\Lead;
use App\Entity\User;
use App\Repository\LeadRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Serializer\Exception\NotEncodableValueException;
use Psr\Log\LoggerInterface;

#[Route('/api/leads')]
class LeadController extends AbstractController
{
    #[Route('', name: 'app_lead_index', methods: ['GET'])]
    public function index(Request $request, LeadRepository $leadRepository): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) return $this->json(['error' => 'Unauthenticated'], 401);

        $userIdsParam = $request->query->get('user_ids');
        
        if ($userIdsParam) {
            $userIds = explode(',', $userIdsParam);
            $qb = $leadRepository->createQueryBuilder('l');
            $leads = $qb->where('l.user IN (:userIds)')
                        ->setParameter('userIds', $userIds)
                        ->orderBy('l.id', 'DESC')
                        ->getQuery()
                        ->getResult();
            
            return $this->json($leads, Response::HTTP_OK, [], ['groups' => 'lead:read']);
        }
        
        $page = $request->query->getInt('page', 1);
        $limit = 10; 

        $criteria = ['user' => $user];
        
        $result = $leadRepository->findPaginated($criteria, $page, $limit);

        return $this->json($result, Response::HTTP_OK, [], ['groups' => 'lead:read']);
    }

    #[Route('/stats', name: 'app_lead_stats', methods: ['GET'])]
    public function stats(Request $request, LeadRepository $leadRepository, EntityManagerInterface $em): JsonResponse
    {
        $currentUser = $this->getUser();
        if (!$currentUser instanceof User) {
            return $this->json(['error' => 'Unauthenticated'], Response::HTTP_UNAUTHORIZED);
        }

        $targetUser = $currentUser;
        
        // Allow filtering by specific user ID (e.g. for admin/manager view)
        $userId = $request->query->get('user_id');
        if ($userId) {
            $userRepo = $em->getRepository(User::class);
            $requestedUser = $userRepo->find($userId);
            
            if ($requestedUser) {
                // Ideally check permissions here (is admin or manager of this user?)
                // For now assuming the frontend only sends valid IDs for authorized users
                $targetUser = $requestedUser;
            }
        }

        $stats = $leadRepository->getDashboardStats($targetUser);

        return $this->json($stats, Response::HTTP_OK, [], ['groups' => 'lead:read']);
    }

    #[Route('/admin/all', name: 'app_lead_admin_all', methods: ['GET'])]
    public function adminAll(
        LeadRepository $leadRepository,
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer
    ): JsonResponse {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['error' => 'Unauthenticated'], Response::HTTP_UNAUTHORIZED);
        }

        if (!in_array($user->getRole(), ['admin', 'diretor', 'nacional', 'regional', 'manager'])) {
            return $this->json(['error' => 'Access denied'], Response::HTTP_FORBIDDEN);
        }

        // Returns all leads sorted by id descending
        $leads = $leadRepository->findBy([], ['id' => 'DESC']);
        
        $accreditations = $entityManager->getRepository(\App\Entity\Accreditation::class)->findAll();
        $accByLead = [];
        foreach ($accreditations as $acc) {
            if ($acc->getLead()) {
                $accByLead[$acc->getLead()->getId()] = $acc;
            }
        }

        $json = $serializer->serialize($leads, 'json', ['groups' => 'lead:read']);
        $leadsArray = json_decode($json, true);

        foreach ($leadsArray as &$leadData) {
            if (isset($accByLead[$leadData['id']])) {
                /** @var \App\Entity\Accreditation $acc */
                $acc = $accByLead[$leadData['id']];
                $leadData['documents'] = [
                    'cnpj' => $acc->getDocCnpjUrl(),
                    'photo' => $acc->getDocPhotoUrl(),
                    'residence' => $acc->getDocResidenceUrl(),
                    'activity' => $acc->getDocActivityUrl(),
                    'selfie' => $acc->getSelfieUrl(),
                    'cnhFull' => $acc->getCnhFullUrl(),
                    'cnhFront' => $acc->getCnhFrontUrl(),
                    'cnhBack' => $acc->getCnhBackUrl(),
                    'rgFront' => $acc->getRgFrontUrl(),
                    'rgBack' => $acc->getRgBackUrl(),
                ];
            } else {
                $leadData['documents'] = null;
            }
        }

        return $this->json($leadsArray, Response::HTTP_OK);
    }

    #[Route('/{id}', name: 'app_lead_show', methods: ['GET'])]
    public function show(string $id, LeadRepository $leadRepository): JsonResponse
    {
        $user = $this->getUser();
        $lead = $leadRepository->find($id);

        if (!$lead) {
            return $this->json(['error' => 'Lead not found'], Response::HTTP_NOT_FOUND);
        }

        $userRole = $user instanceof User ? $user->getRole() : '';
        $hasAccess = ($lead->getUser() === $user) || in_array($userRole, ['admin', 'diretor', 'nacional', 'regional', 'manager']);

        if (!$hasAccess) {
            return $this->json(['error' => 'Access denied'], Response::HTTP_FORBIDDEN);
        }

        return $this->json($lead, Response::HTTP_OK, [], ['groups' => 'lead:read']);
    }

    #[Route('', name: 'app_lead_create', methods: ['POST'])]
    public function create(
        Request $request,
        SerializerInterface $serializer,
        ValidatorInterface $validator,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        try {
            /** @var Lead $lead */
            $lead = $serializer->deserialize($request->getContent(), Lead::class, 'json', ['groups' => 'lead:write']);
        } catch (NotEncodableValueException $e) {
            return $this->json(['error' => 'Invalid JSON'], Response::HTTP_BAD_REQUEST);
        }

        // Automatically assign logged in user
        $user = $this->getUser();
        if ($user instanceof User) {
            $lead->setUser($user);
        } else {
             return $this->json(['error' => 'User must be authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        $errors = $validator->validate($lead);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->json(['errors' => $errorMessages], Response::HTTP_BAD_REQUEST);
        }

        $entityManager->persist($lead);
        $entityManager->flush();

        return $this->json($lead, Response::HTTP_CREATED, [], ['groups' => 'lead:read']);
    }

    #[Route('/{id}/assign', name: 'app_lead_assign', methods: ['PUT'])]
    public function assign(
        string $id,
        Request $request,
        LeadRepository $leadRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $user = $this->getUser();
        if (!$user instanceof User || !in_array($user->getRole(), ['admin', 'diretor', 'nacional', 'regional', 'manager'])) {
            return $this->json(['error' => 'Access denied'], Response::HTTP_FORBIDDEN);
        }

        $lead = $leadRepository->find($id);
        if (!$lead) {
            return $this->json(['error' => 'Lead not found'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);
        $newUserId = $data['user_id'] ?? null;

        if (!$newUserId) {
            return $this->json(['error' => 'user_id is required'], Response::HTTP_BAD_REQUEST);
        }

        $newUser = $entityManager->getRepository(User::class)->find($newUserId);
        if (!$newUser) {
            return $this->json(['error' => 'User not found'], Response::HTTP_NOT_FOUND);
        }

        $lead->setUser($newUser);
        $entityManager->flush();

        return $this->json($lead, Response::HTTP_OK, [], ['groups' => 'lead:read']);
    }

    #[Route('/{id}', name: 'app_lead_update', methods: ['PUT', 'PATCH'])]
    public function update(
        string $id,
        Request $request,
        LeadRepository $leadRepository,
        SerializerInterface $serializer,
        ValidatorInterface $validator,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $user = $this->getUser();
        $lead = $leadRepository->find($id);

        if (!$lead) {
            return $this->json(['error' => 'Lead not found'], Response::HTTP_NOT_FOUND);
        }

        $userRole = $user instanceof User ? $user->getRole() : '';
        $hasAccess = ($lead->getUser() === $user) || in_array($userRole, ['admin', 'diretor', 'nacional', 'regional', 'manager']);

        if (!$hasAccess) {
            return $this->json(['error' => 'Access denied'], Response::HTTP_FORBIDDEN);
        }

        try {
            $serializer->deserialize($request->getContent(), Lead::class, 'json', [
                'groups' => 'lead:write',
                'object_to_populate' => $lead
            ]);
        } catch (NotEncodableValueException $e) {
            return $this->json(['error' => 'Invalid JSON'], Response::HTTP_BAD_REQUEST);
        }

        $errors = $validator->validate($lead);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->json(['errors' => $errorMessages], Response::HTTP_BAD_REQUEST);
        }
        
        $lead->setUpdatedAt(new \DateTimeImmutable());
        $entityManager->flush();

        return $this->json($lead, Response::HTTP_OK, [], ['groups' => 'lead:read']);
    }

    #[Route('/{id}', name: 'app_lead_delete', methods: ['DELETE'])]
    public function delete(string $id, LeadRepository $leadRepository, EntityManagerInterface $entityManager): JsonResponse
    {
        $user = $this->getUser();
        $lead = $leadRepository->find($id);

        if (!$lead) {
            return $this->json(['error' => 'Lead not found'], Response::HTTP_NOT_FOUND);
        }

        $userRole = $user instanceof User ? $user->getRole() : '';
        $hasAccess = ($lead->getUser() === $user) || in_array($userRole, ['admin', 'diretor', 'nacional', 'regional', 'manager']);

        if (!$hasAccess) {
            return $this->json(['error' => 'Access denied'], Response::HTTP_FORBIDDEN);
        }

        $entityManager->remove($lead);
        $entityManager->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }

    #[Route('/{id}/visits', name: 'app_lead_visits', methods: ['GET'])]
    public function visits(string $id, LeadRepository $leadRepository, \App\Repository\VisitRepository $visitRepository): JsonResponse
    {
        $lead = $leadRepository->find($id);

        if (!$lead) {
            return $this->json(['message' => 'Lead not found'], Response::HTTP_NOT_FOUND);
        }

        $visits = $visitRepository->createQueryBuilder('v')
            ->leftJoin('v.user', 'u')
            ->addSelect('u')
            ->where('v.lead = :lead')
            ->setParameter('lead', $lead)
            ->orderBy('v.data_visita', 'DESC')
            ->getQuery()
            ->getResult();

        return $this->json($visits, Response::HTTP_OK, [], ['groups' => 'visit:read']);
    }
    #[Route('/admin/all', name: 'app_lead_admin_index', methods: ['GET'])]
    public function adminIndex(LeadRepository $leadRepository): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $leads = $leadRepository->findAll();

        return $this->json($leads, Response::HTTP_OK, [], ['groups' => 'lead:read']);
    }

    #[Route('/{id}/assign', name: 'app_lead_admin_assign', methods: ['PUT'])]
    public function assignUser(
        string $id,
        Request $request,
        LeadRepository $leadRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $lead = $leadRepository->find($id);
        if (!$lead) {
            return $this->json(['error' => 'Lead not found'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);
        $userId = $data['user_id'] ?? null;

        if (!$userId) {
            return $this->json(['error' => 'user_id is required'], Response::HTTP_BAD_REQUEST);
        }

        $userRepo = $entityManager->getRepository(User::class);
        $newUser = $userRepo->find($userId);

        if (!$newUser) {
            return $this->json(['error' => 'User not found'], Response::HTTP_NOT_FOUND);
        }

        $lead->setUser($newUser);
        $entityManager->flush();

        return $this->json($lead, Response::HTTP_OK, [], ['groups' => 'lead:read']);
    }
}
