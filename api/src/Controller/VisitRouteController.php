<?php

namespace App\Controller;

use App\Entity\VisitRoute;
use App\Entity\VisitRouteItem;
use App\Repository\ReminderRepository;
use App\Repository\VisitRouteRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/api/visit-routes')]
class VisitRouteController extends AbstractController
{
    #[Route('', name: 'app_visit_route_index', methods: ['GET'])]
    public function index(Request $request, VisitRouteRepository $visitRouteRepository): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['message' => 'Unauthorized'], 401);
        }

        $dateStr = $request->query->get('date');
        $criteria = ['user' => $user];
        
        if ($dateStr) {
            $criteria['date'] = new \DateTime($dateStr);
        }

        $routes = $visitRouteRepository->findBy($criteria, ['date' => 'DESC']);

        return $this->json($routes, 200, [], ['groups' => ['route:read', 'reminder:read', 'lead:read']]);
    }

    #[Route('', name: 'app_visit_route_save', methods: ['POST'])]
    public function save(
        Request $request,
        EntityManagerInterface $entityManager,
        ReminderRepository $reminderRepository,
        VisitRouteRepository $visitRouteRepository
    ): JsonResponse {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['message' => 'Unauthorized'], 401);
        }

        $data = json_decode($request->getContent(), true);
        if (!isset($data['date']) || !isset($data['items'])) {
            return $this->json(['message' => 'Missing date or items'], 400);
        }

        $dateStr = $data['date'];
        $date = new \DateTime($dateStr);

        // Check if route already exists for this date and user
        $existingRoute = $visitRouteRepository->findOneBy([
            'user' => $user,
            'date' => $date
        ]);

        $route = $existingRoute ?? new VisitRoute();
        
        if (!$existingRoute) {
            $route->setUser($user);
            $route->setDate($date);
            $route->setName("Rota de " . $date->format('d/m/Y'));
        }

        // Default status
        if(isset($data['status'])) {
            $route->setStatus($data['status']);
        }
        
        // Use a transaction or just standard flow.
        // To update items, the easiest is to clear existing items and add new ones, 
        // OR intelligently update. Since it's a "save current state" action, clearing and re-adding is robust for order.
        // NOTE: orphanRemoval=true on items collection should handle deletion.

        // Remove existing items and reset Reminder status
        foreach ($route->getItems() as $item) {
            $reminder = $item->getReminder();
            if ($reminder) {
                $reminder->setAdicionadoRota(false);
            }
            $route->removeItem($item);
            $entityManager->remove($item);
        }
        
        // Add new items
        foreach ($data['items'] as $index => $itemData) {
            $reminderId = $itemData['reminderId'] ?? null;
            if (!$reminderId) continue;

            $reminder = $reminderRepository->find($reminderId);
            if ($reminder) {
                // Ensure reminder belongs to user? Or just check existence.
                
                $routeItem = new VisitRouteItem();
                $routeItem->setReminder($reminder);
                $routeItem->setSequence($index);
                
                $route->addItem($routeItem);
                
                // Also mark reminder as added to route if not already
                $reminder->setAdicionadoRota(true);
            }
        }

        $entityManager->persist($route);
        $entityManager->flush();

        return $this->json($route, 200, [], ['groups' => ['route:read', 'reminder:read', 'lead:read']]);
    }
}
