<?php

namespace App\Controller;

use App\Entity\User;
use App\Entity\UserHierarchy;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/hierarchy')]
class HierarchyController extends AbstractController
{
    #[Route('', name: 'app_hierarchy_index', methods: ['GET'])]
    public function index(EntityManagerInterface $em): JsonResponse
    {
        $hierarchy = $em->getRepository(UserHierarchy::class)->findAll();
        
        $data = [];
        foreach ($hierarchy as $h) {
            if (!$h->getManager() || !$h->getSubordinate()) {
                continue;
            }
            $data[] = [
                'id' => $h->getId(),
                'manager_id' => $h->getManager()->getId(),
                'subordinate_id' => $h->getSubordinate()->getId(),
                'manager_nome' => $h->getManager()->getName(),
                'subordinate_nome' => $h->getSubordinate()->getName(),
            ];
        }

        return $this->json($data);
    }

    #[Route('', name: 'app_hierarchy_create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        
        $managerId = $data['manager_id'] ?? null;
        $subordinateId = $data['subordinate_id'] ?? null;
        
        if (!$managerId || !$subordinateId) {
            return $this->json(['error' => 'Missing manager or subordinate'], 400);
        }

        $manager = $em->getRepository(User::class)->find($managerId);
        $subordinate = $em->getRepository(User::class)->find($subordinateId);

        if (!$manager || !$subordinate) {
            return $this->json(['error' => 'User not found'], 404);
        }

        $existing = $em->getRepository(UserHierarchy::class)->findOneBy([
            'manager' => $manager,
            'subordinate' => $subordinate
        ]);

        if ($existing) {
            return $this->json(['error' => 'Already linked'], 409);
        }

        $h = new UserHierarchy();
        $h->setManager($manager);
        $h->setSubordinate($subordinate);
        
        $em->persist($h);
        $em->flush();

        return $this->json(['success' => true]);
    }

    #[Route('/{id}', name: 'app_hierarchy_delete', methods: ['DELETE'])]
    public function delete(string $id, EntityManagerInterface $em): JsonResponse
    {
        $h = $em->getRepository(UserHierarchy::class)->find($id);
        if ($h) {
            $em->remove($h);
            $em->flush();
        }

        return $this->json(['success' => true]);
    }
}
