<?php

namespace App\Controller;

use App\Entity\Visit;
use App\Repository\LeadRepository;
use App\Repository\VisitRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Psr\Log\LoggerInterface;

use App\Entity\User;

#[Route('/api/visits')]
class VisitController extends AbstractController
{
    #[Route('', name: 'app_visit_index', methods: ['GET'])]
    public function index(Request $request, VisitRepository $visitRepository, LoggerInterface $logger): JsonResponse
    {
        $startTime = microtime(true);
        /** @var User|null $user */
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['message' => 'Unauthorized'], 401);
        }

        $userIds = $request->query->get('user_ids');
        $criteria = [];

        if ($userIds) {
            $ids = explode(',', $userIds);
            $visits = $visitRepository->findByUserIds($ids);
        } else {
            $visits = $visitRepository->findByUserIds([$user->getId()]);
        }

        $duration = (microtime(true) - $startTime) * 1000;
        $logger->info(sprintf('API Visit Index: %d visits found in %.2f ms', count($visits), $duration));

        return $this->json($visits, 200, [], ['groups' => 'visit:read']);
    }

    #[Route('', name: 'app_visit_new', methods: ['POST'])]
    public function new(
        Request $request,
        LeadRepository $leadRepository,
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator,
        \App\Service\LoggerService $loggerService
    ): JsonResponse {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['message' => 'Unauthorized'], 401);
        }

        $data = json_decode($request->getContent(), true);

        if (!isset($data['lead_id'])) {
            return $this->json(['message' => 'Missing lead_id'], 400);
        }

        $lead = $leadRepository->find($data['lead_id']);
        if (!$lead) {
            return $this->json(['message' => 'Lead not found'], 404);
        }

        // Optional: Check if lead belongs to user?
        // if ($lead->getUser() !== $user) { ... }

        $visit = new Visit();
        $visit->setLead($lead);
        $visit->setUser($user);
        $visit->setTipo($data['tipo'] ?? 'visita');
        $visit->setStatus($data['status'] ?? 'planned');
        $visit->setObservacao($data['observacao'] ?? null);
        $visit->setLat($data['lat'] ?? null);
        $visit->setLng($data['lng'] ?? null);
        $visit->setEnderecoVisita($data['endereco_visita'] ?? null);
        
        $visitDate = isset($data['data_visita']) ? new \DateTime($data['data_visita']) : new \DateTime();
        $visit->setDataVisita($visitDate);
        
        $visit->setUpdatedAt(new \DateTime());

        $errors = $validator->validate($visit);
        if (count($errors) > 0) {
            return $this->json(['errors' => (string) $errors], 400);
        }

        $entityManager->persist($visit);
        $entityManager->flush();

        // Log visit creation
        $loggerService->logVisit($visit, 'created', $user);

        return $this->json($visit, 201, [], ['groups' => 'visit:read']);
    }

    #[Route('/{id}', name: 'app_visit_show', methods: ['GET'])]
    public function show(string $id, VisitRepository $visitRepository): JsonResponse
    {
        $visit = $visitRepository->find($id);

        if (!$visit) {
            return $this->json(['message' => 'Visit not found'], 404);
        }

        return $this->json($visit, 200, [], ['groups' => 'visit:read']);
    }

    #[Route('/{id}', name: 'app_visit_update', methods: ['PUT'])]
    public function update(
        string $id,
        Request $request,
        VisitRepository $visitRepository,
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator
    ): JsonResponse {
        $visit = $visitRepository->find($id);

        if (!$visit) {
            return $this->json(['message' => 'Visit not found'], 404);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['tipo'])) {
            $visit->setTipo($data['tipo']);
        }

        if (isset($data['status'])) {
            $visit->setStatus($data['status']);
        }

        if (isset($data['observacao'])) {
            $visit->setObservacao($data['observacao']);
        }

        if (isset($data['lat'])) {
            $visit->setLat($data['lat']);
        }

        if (isset($data['lng'])) {
            $visit->setLng($data['lng']);
        }

        if (isset($data['endereco_visita'])) {
            $visit->setEnderecoVisita($data['endereco_visita']);
        }

        if (isset($data['data_visita'])) {
            $visit->setDataVisita(new \DateTime($data['data_visita']));
        }

        $errors = $validator->validate($visit);
        if (count($errors) > 0) {
            return $this->json(['errors' => (string) $errors], 400);
        }

        $entityManager->flush();

        return $this->json($visit, 200, [], ['groups' => 'visit:read']);
    }

    #[Route('/{id}', name: 'app_visit_delete', methods: ['DELETE'])]
    public function delete(
        string $id,
        VisitRepository $visitRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $visit = $visitRepository->find($id);

        if (!$visit) {
            return $this->json(['message' => 'Visit not found'], 404);
        }

        $entityManager->remove($visit);
        $entityManager->flush();

        return $this->json(null, 204);
    }
}
