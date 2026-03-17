<?php

namespace App\Controller;

use App\Entity\Accreditation;
use App\Service\AccreditationService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/api/accreditations')]
class AccreditationController extends AbstractController
{
    private AccreditationService $service;
    private EntityManagerInterface $em;

    public function __construct(AccreditationService $service, EntityManagerInterface $em)
    {
        $this->service = $service;
        $this->em = $em;
    }

    #[Route('', name: 'app_accreditation_index', methods: ['GET'])]
    public function index(Request $request): JsonResponse
    {
        $status = $request->query->get('status');
        $criteria = [];
        if ($status) {
            if (str_contains($status, ',')) {
                $criteria['status'] = explode(',', $status);
            } else {
                $criteria['status'] = $status;
            }
        }

        try {
            $qb = $this->em->createQueryBuilder();
            $qb->select('a')
               ->from(Accreditation::class, 'a')
               ->innerJoin('a.lead', 'l') // Filter out orphaned records
               ->orderBy('a.createdAt', 'DESC');

            if ($status) {
                if (str_contains($status, ',')) {
                    $qb->andWhere('a.status IN (:statuses)')
                       ->setParameter('statuses', explode(',', $status));
                } else {
                    $qb->andWhere('a.status = :status')
                       ->setParameter('status', $status);
                }
            }

            $accreditations = $qb->getQuery()->getResult();

            return $this->json($accreditations, 200, [], ['groups' => 'accreditation:read']);
        } catch (\Throwable $e) {
            return $this->json([
                'title' => 'An error occurred during serialization',
                'detail' => $e->getMessage(),
                'status' => 500
            ], 500);
        }
    }

    #[Route('/{id}', name: 'app_accreditation_show', methods: ['GET'])]
    public function show(Accreditation $accreditation): JsonResponse
    {
        return $this->json($accreditation, 200, [], ['groups' => 'accreditation:read']);
    }

    #[Route('', name: 'app_accreditation_create', methods: ['POST'])]
    public function create(
        Request $request,
        SerializerInterface $serializer,
        \Symfony\Component\Validator\Validator\ValidatorInterface $validator
    ): JsonResponse {
        try {
            /** @var Accreditation $accreditation */
            $accreditation = $serializer->deserialize($request->getContent(), Accreditation::class, 'json', ['groups' => 'accreditation:write']);
        } catch (\Symfony\Component\Serializer\Exception\NotEncodableValueException $e) {
            return $this->json(['error' => 'Invalid JSON'], 400);
        }

        $user = $this->getUser();
        if ($user) {
            $accreditation->setUser($user);
        }

        // Fix for "cascade persist" error on Lead
        // The serializer might have created a new Lead object if it couldn't find the existing one.
        // We need to ensure we use the EXISTING lead from the database.
        $data = json_decode($request->getContent(), true);
        if (isset($data['lead'])) {
            $leadId = $data['lead'];
            // If it's an IRI, extract ID
            if (is_string($leadId) && str_contains($leadId, '/api/leads/')) {
                $leadId = basename($leadId);
            } elseif (is_array($leadId) && isset($leadId['id'])) {
                $leadId = $leadId['id'];
            }
            
            if (is_string($leadId)) {
                $lead = $this->em->getRepository(\App\Entity\Lead::class)->find($leadId);
                if ($lead) {
                    $accreditation->setLead($lead);
                }
            }
        }
        
        // Validation
        $errors = $validator->validate($accreditation);
        if (count($errors) > 0) {
            $msgs = [];
            foreach ($errors as $error) {
                $msgs[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->json(['errors' => $msgs], 400);
        }

        $this->em->persist($accreditation);
        $this->em->flush();

        return $this->json($accreditation, 201, [], ['groups' => 'accreditation:read']);
    }

    #[Route('/{id}', name: 'app_accreditation_update', methods: ['PUT', 'PATCH'])]
    public function update(
        Accreditation $accreditation,
        Request $request,
        SerializerInterface $serializer,
        \Symfony\Component\Validator\Validator\ValidatorInterface $validator
    ): JsonResponse {
        try {
            $serializer->deserialize($request->getContent(), Accreditation::class, 'json', [
                'groups' => 'accreditation:write',
                'object_to_populate' => $accreditation
            ]);
        } catch (\Symfony\Component\Serializer\Exception\NotEncodableValueException $e) {
            return $this->json(['error' => 'Invalid JSON'], 400);
        }

        // Handle Lead association if passed (reuse logic from create or extract to shared method, but inline is fine for now)
        $data = json_decode($request->getContent(), true);
        if (isset($data['lead'])) {
             $leadId = $data['lead'];
            // If it's an IRI, extract ID
            if (is_string($leadId) && str_contains($leadId, '/api/leads/')) {
                $leadId = basename($leadId);
            } elseif (is_array($leadId) && isset($leadId['id'])) {
                $leadId = $leadId['id'];
            }
            
            if (is_string($leadId)) {
                $lead = $this->em->getRepository(\App\Entity\Lead::class)->find($leadId);
                if ($lead) {
                    $accreditation->setLead($lead);
                }
            }
        }

        $errors = $validator->validate($accreditation);
        if (count($errors) > 0) {
            $msgs = [];
             foreach ($errors as $error) {
                $msgs[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->json(['errors' => $msgs], 400);
        }

        $this->em->flush();

        return $this->json($accreditation, 200, [], ['groups' => 'accreditation:read']);
    }

    #[Route('/{id}/submit', methods: ['POST'])]
    public function submit(Accreditation $accreditation): JsonResponse
    {
        try {
            // Updated flow: Submit directly to external API bypassing admin approval
            $result = $this->service->approveAndSend($accreditation);
            return $this->json($result);
        } catch (\Throwable $e) {
            return $this->json(['error' => $e->getMessage()], 500);
        }
    }

    #[Route('/{id}/approve', methods: ['POST'])]
    public function approve(Accreditation $accreditation): JsonResponse
    {
        try {
            $result = $this->service->approveAndSend($accreditation);
            return $this->json($result);
        } catch (\Throwable $e) {
            return $this->json(['error' => $e->getMessage()], 500);
        }
    }

    #[Route('/resend/{leadId}', name: 'app_accreditation_resend', methods: ['POST'])]
    public function resend(string $leadId): JsonResponse
    {
        // Find existing accreditation by lead_id
        $repository = $this->em->getRepository(Accreditation::class);
        $accreditation = $repository->findOneBy(['lead' => $leadId]);

        if (!$accreditation) {
            return $this->json([
                'success' => false,
                'error' => 'Credenciamento não encontrado para este lead'
            ], 404);
        }

        // Verify accreditation is in pending or analysis status
        if ($accreditation->getStatus() !== 'pending' && $accreditation->getStatus() !== 'analysis') {
            return $this->json([
                'success' => false,
                'error' => 'Credenciamento não está em análise'
            ], 400);
        }

        // Resend accreditation
        try {
            $result = $this->service->approveAndSend($accreditation);

            if (!$result['success']) {
                return $this->json([
                    'success' => false,
                    'error' => $result['error'] ?? 'Erro ao reenviar credenciamento'
                ], 400);
            }

            return $this->json([
                'success' => true,
                'message' => 'Credenciamento reenviado com sucesso',
                'accreditation' => $accreditation
            ], 200, [], ['groups' => 'accreditation:read']);

        } catch (\Throwable $e) {
            return $this->json([
                'success' => false,
                'error' => 'Erro ao reenviar credenciamento: ' . $e->getMessage()
            ], 500);
        }
    }
    
    // Default list and get are handled buy API Platform if configured or custom if needed.
    // For now, we rely on standard GET operations exposed by API Platform for Accreditation entity
    // or we can add a specific custom endpoint for "pending" if filtering is complex.
    // But ?status=pending usually works with API Platform filters.
}
