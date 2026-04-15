<?php

namespace App\Controller;

use App\Entity\Reminder;
use App\Repository\LeadRepository;
use App\Repository\ReminderRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Serializer\SerializerInterface;
use Psr\Log\LoggerInterface;

use App\Entity\User;

#[Route('/api/reminders')]
class ReminderController extends AbstractController
{
    #[Route('', name: 'app_reminder_index', methods: ['GET'])]
    public function index(Request $request, ReminderRepository $reminderRepository, LoggerInterface $logger): JsonResponse
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
            $reminders = $reminderRepository->findByUserIds($ids);
        } else {
            $reminders = $reminderRepository->findByUserIds([$user->getId()]);
        }

        $duration = (microtime(true) - $startTime) * 1000;
        $logger->info(sprintf('API Reminder Index: %d reminders found in %.2f ms', count($reminders), $duration));

        return $this->json($reminders, 200, [], ['groups' => ['reminder:read', 'lead:read']]);
    }

    #[Route('', name: 'app_reminder_new', methods: ['POST'])]
    public function new(
        Request $request,
        LeadRepository $leadRepository,
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator
    ): JsonResponse {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['message' => 'Unauthorized'], 401);
        }

        $data = json_decode($request->getContent(), true);

        $reminder = new Reminder();
        $reminder->setUser($user);

        // Handle Lead association if provided
        if (!empty($data['lead_id'])) {
            $lead = $leadRepository->find($data['lead_id']);
            if (!$lead) {
                return $this->json(['message' => 'Lead not found'], 404);
            }
            $reminder->setLead($lead);
        }

        // Basic fields
        $reminder->setDataLembrete($data['data_lembrete'] ?? '');
        $reminder->setHoraLembrete($data['hora_lembrete'] ?? '');
        $reminder->setDescricao($data['descricao'] ?? null);
        $reminder->setStatus($data['status'] ?? 'pendente');
        $reminder->setTipo($data['tipo'] ?? 'lembrete');
        $reminder->setAdicionadoRota($data['adicionado_rota'] ?? false);

        // Establishment fields
        if (isset($data['estabelecimento_nome'])) $reminder->setEstabelecimentoNome($data['estabelecimento_nome']);
        if (isset($data['estabelecimento_endereco'])) $reminder->setEstabelecimentoEndereco($data['estabelecimento_endereco']);
        if (isset($data['estabelecimento_lat'])) $reminder->setEstabelecimentoLat($data['estabelecimento_lat']);
        if (isset($data['estabelecimento_lng'])) $reminder->setEstabelecimentoLng($data['estabelecimento_lng']);
        if (isset($data['estabelecimento_cep'])) $reminder->setEstabelecimentoCep($data['estabelecimento_cep']);
        if (isset($data['estabelecimento_numero'])) $reminder->setEstabelecimentoNumero($data['estabelecimento_numero']);
        if (isset($data['estabelecimento_bairro'])) $reminder->setEstabelecimentoBairro($data['estabelecimento_bairro']);
        if (isset($data['estabelecimento_cidade'])) $reminder->setEstabelecimentoCidade($data['estabelecimento_cidade']);
        if (isset($data['estabelecimento_estado'])) $reminder->setEstabelecimentoEstado($data['estabelecimento_estado']);

        // Check for duplicates if needed (similar to useReminders logic)
        // ...

        $errors = $validator->validate($reminder);
        if (count($errors) > 0) {
            return $this->json(['errors' => (string) $errors], 400);
        }

        $entityManager->persist($reminder);
        $entityManager->flush();

        return $this->json($reminder, 200, [], ['groups' => ['reminder:read', 'lead:read']]);
    }

    #[Route('/{id}', name: 'app_reminder_update', methods: ['PATCH', 'PUT'])]
    public function update(
        int $id,
        Request $request,
        ReminderRepository $reminderRepository,
        EntityManagerInterface $entityManager,
        LeadRepository $leadRepository
    ): JsonResponse {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['message' => 'Unauthorized'], 401);
        }

        $reminder = $reminderRepository->find($id);

        if (!$reminder) {
            return $this->json(['message' => 'Reminder not found'], 404);
        }

        if ($reminder->getUser() !== $user) {
            return $this->json(['message' => 'Access denied'], 403);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['status'])) {
            $reminder->setStatus($data['status']);
        }
        
        if (isset($data['lead_id'])) {
             $lead = $leadRepository->find($data['lead_id']);
             if ($lead) {
                 $reminder->setLead($lead);
             }
        }
        
        if (isset($data['adicionado_rota'])) {
            $reminder->setAdicionadoRota($data['adicionado_rota']);
        }

        $reminder->setUpdatedAt(new \DateTime());
        $entityManager->flush();

        return $this->json($reminder, 200, [], ['groups' => ['reminder:read', 'lead:read']]);
    }
}
