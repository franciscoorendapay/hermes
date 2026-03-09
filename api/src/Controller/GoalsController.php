<?php

namespace App\Controller;

use App\Entity\Goal;
use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Psr\Log\LoggerInterface;

#[Route('/api/goals')]
final class GoalsController extends AbstractController
{
    public function __construct(private EntityManagerInterface $entityManager)
    {
    }

    #[Route('', name: 'app_goals_list', methods: ['GET'])]
    public function list(Request $request, LoggerInterface $logger): JsonResponse
    {
        $startTime = microtime(true);
        $mes = $request->query->getInt('mes');
        $ano = $request->query->getInt('ano');
        $userIds = $request->query->get('user_ids');

        if (!$mes || !$ano) {
            return $this->json(['error' => 'Month and Year required'], Response::HTTP_BAD_REQUEST);
        }

        $criteria = [
            'mes' => $mes,
            'ano' => $ano
        ];

        if ($userIds) {
            $ids = explode(',', $userIds);
            $criteria['user'] = $ids;
        }

        $goals = $this->entityManager->getRepository(Goal::class)->findBy($criteria);

        $duration = (microtime(true) - $startTime) * 1000;
        $logger->info(sprintf('API Goals List: %d goals found for %d/%d in %.2f ms', count($goals), $mes, $ano, $duration));

        return $this->json($goals, Response::HTTP_OK, [], ['groups' => 'goal:read']);
    }

    #[Route('', name: 'app_goals_create', methods: ['POST'])]
    public function create(Request $request, #[CurrentUser] ?User $currentUser): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        
        $userId = $data['user_id'] ?? null;
        $mes = $data['mes'] ?? null;
        $ano = $data['ano'] ?? null;

        if (!$userId || !$mes || !$ano) {
            return $this->json(['error' => 'Missing required fields'], Response::HTTP_BAD_REQUEST);
        }

        $user = $this->entityManager->getRepository(User::class)->find($userId);
        if (!$user) {
            return $this->json(['error' => 'User not found'], Response::HTTP_NOT_FOUND);
        }

        $existingGoal = $this->entityManager->getRepository(Goal::class)->findOneBy([
            'user' => $user,
            'mes' => $mes,
            'ano' => $ano
        ]);

        if ($existingGoal) {
            // Update
            $goal = $existingGoal;
            $goal->setUpdatedAt(new \DateTimeImmutable());
        } else {
            // Create
            $goal = new Goal();
            $goal->setUser($user);
            $goal->setMes($mes);
            $goal->setAno($ano);
            $goal->setCreatedBy($currentUser ? $currentUser->getId() : null);
        }

        if (isset($data['meta_clientes'])) $goal->setMetaClientes($data['meta_clientes']);
        if (isset($data['meta_valor'])) $goal->setMetaValor((string)$data['meta_valor']);
        if (isset($data['meta_visitas'])) $goal->setMetaVisitas($data['meta_visitas']);

        $this->entityManager->persist($goal);
        $this->entityManager->flush();

        return $this->json($goal, Response::HTTP_OK, [], ['groups' => 'goal:read']);
    }
}
