<?php

namespace App\Controller;

use App\Entity\OrdemLogistica;
use App\Entity\User;
use App\Repository\LeadRepository;
use App\Repository\OrdemLogisticaRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/logistica')]
class LogisticaController extends AbstractController
{
    private function serializeOrdem(OrdemLogistica $ordem): array
    {
        $lead = $ordem->getLead();
        $createdBy = $ordem->getCreatedBy();

        return [
            'id'          => $ordem->getId(),
            'tipo'        => $ordem->getTipo(),
            'quantidade'  => $ordem->getQuantidade(),
            'status'      => $ordem->getStatus(),
            'observacao'  => $ordem->getObservacao(),
            'created_at'  => $ordem->getCreatedAt()?->format(\DateTimeInterface::ATOM),
            'updated_at'  => $ordem->getUpdatedAt()?->format(\DateTimeInterface::ATOM),
            'created_by'  => $createdBy ? ['id' => $createdBy->getId(), 'name' => $createdBy->getName()] : null,
            'leads'       => $lead ? [
                'id'                 => $lead->getId(),
                'nome_fantasia'      => $lead->getTradeName() ?? $lead->getName(),
                'telefone'           => $lead->getPhone(),
                'endereco_logradouro'=> $lead->getStreet(),
                'endereco_numero'    => $lead->getNumber(),
                'endereco_bairro'    => $lead->getNeighborhood(),
                'endereco_cidade'    => $lead->getCity(),
                'endereco_estado'    => $lead->getState(),
                'endereco_cep'       => $lead->getZipCode(),
                'lat'                => $lead->getLat() ? (float) $lead->getLat() : null,
                'lng'                => $lead->getLng() ? (float) $lead->getLng() : null,
            ] : null,
        ];
    }

    #[Route('/ordens', name: 'logistica_ordens_list', methods: ['GET'])]
    public function list(Request $request, OrdemLogisticaRepository $repository): JsonResponse
    {
        /** @var User|null $user */
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['message' => 'Unauthorized'], 401);
        }

        $filters = [];
        if ($request->query->has('status')) {
            $filters['status'] = $request->query->get('status');
        }
        if ($request->query->has('tipo')) {
            $filters['tipo'] = $request->query->get('tipo');
        }

        if ($request->query->has('lead_id')) {
            $filters['lead_id'] = $request->query->get('lead_id');
        }

        $ordens = $repository->findByFilters($filters);

        return $this->json(array_map([$this, 'serializeOrdem'], $ordens));
    }

    #[Route('/ordens', name: 'logistica_ordens_create', methods: ['POST'])]
    public function create(
        Request $request,
        LeadRepository $leadRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        /** @var User|null $user */
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['message' => 'Unauthorized'], 401);
        }

        $data = json_decode($request->getContent(), true);

        $tiposValidos = ['bobinas', 'entrega_equipamento', 'troca_equipamento', 'retirada_equipamento'];
        if (empty($data['tipo']) || !in_array($data['tipo'], $tiposValidos, true)) {
            return $this->json(['message' => 'Tipo inválido. Use: ' . implode(', ', $tiposValidos)], 400);
        }

        if (empty($data['quantidade']) || (int) $data['quantidade'] < 1) {
            return $this->json(['message' => 'Quantidade deve ser maior que zero'], 400);
        }

        $ordem = new OrdemLogistica();
        $ordem->setTipo($data['tipo']);
        $ordem->setQuantidade((int) $data['quantidade']);
        $ordem->setObservacao($data['observacao'] ?? null);
        $ordem->setCreatedBy($user);

        if (!empty($data['lead_id'])) {
            $lead = $leadRepository->find($data['lead_id']);
            if (!$lead) {
                return $this->json(['message' => 'Lead não encontrado'], 404);
            }
            $ordem->setLead($lead);
        }

        $em->persist($ordem);
        $em->flush();

        return $this->json($this->serializeOrdem($ordem), 201);
    }

    #[Route('/ordens/{id}', name: 'logistica_ordens_show', methods: ['GET'])]
    public function show(string $id, OrdemLogisticaRepository $repository): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['message' => 'Unauthorized'], 401);
        }

        $ordem = $repository->find($id);
        if (!$ordem) {
            return $this->json(['message' => 'Ordem não encontrada'], 404);
        }

        return $this->json($this->serializeOrdem($ordem));
    }

    #[Route('/ordens/{id}/status', name: 'logistica_ordens_status', methods: ['PATCH'])]
    public function updateStatus(
        string $id,
        Request $request,
        OrdemLogisticaRepository $repository,
        EntityManagerInterface $em
    ): JsonResponse {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['message' => 'Unauthorized'], 401);
        }

        $ordem = $repository->find($id);
        if (!$ordem) {
            return $this->json(['message' => 'Ordem não encontrada'], 404);
        }

        $data = json_decode($request->getContent(), true);
        $statusValidos = ['pendente', 'em_andamento', 'concluido', 'cancelado'];

        if (empty($data['status']) || !in_array($data['status'], $statusValidos, true)) {
            return $this->json(['message' => 'Status inválido. Use: ' . implode(', ', $statusValidos)], 400);
        }

        $ordem->setStatus($data['status']);
        if (!empty($data['observacao'])) {
            $ordem->setObservacao($data['observacao']);
        }

        $em->flush();

        return $this->json($this->serializeOrdem($ordem));
    }

    #[Route('/ordens/{id}', name: 'logistica_ordens_delete', methods: ['DELETE'])]
    public function delete(
        string $id,
        OrdemLogisticaRepository $repository,
        EntityManagerInterface $em
    ): JsonResponse {
        /** @var User|null $user */
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['message' => 'Unauthorized'], 401);
        }

        if (!in_array($user->getRole(), ['admin', 'logistica'], true)) {
            return $this->json(['message' => 'Sem permissão'], 403);
        }

        $ordem = $repository->find($id);
        if (!$ordem) {
            return $this->json(['message' => 'Ordem não encontrada'], 404);
        }

        $em->remove($ordem);
        $em->flush();

        return $this->json(null, 204);
    }

    #[Route('/stats', name: 'logistica_stats', methods: ['GET'])]
    public function stats(OrdemLogisticaRepository $repository): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['message' => 'Unauthorized'], 401);
        }

        $counts = $repository->countByStatus();
        $total = array_sum($counts);

        return $this->json([
            'total'        => $total,
            'pendente'     => $counts['pendente'],
            'em_andamento' => $counts['em_andamento'],
            'concluido'    => $counts['concluido'],
            'cancelado'    => $counts['cancelado'],
        ]);
    }
}
