<?php

namespace App\Repository;

use App\Entity\OrdemLogistica;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class OrdemLogisticaRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, OrdemLogistica::class);
    }

    public function findByFilters(array $filters = []): array
    {
        $qb = $this->createQueryBuilder('o')
            ->leftJoin('o.lead', 'l')
            ->leftJoin('o.createdBy', 'u')
            ->addSelect('l', 'u')
            ->orderBy('COALESCE(o.dataAtendimento, o.createdAt)', 'DESC');

        if (!empty($filters['status'])) {
            $statuses = is_array($filters['status'])
                ? $filters['status']
                : array_map('trim', explode(',', $filters['status']));

            if (count($statuses) === 1) {
                $qb->andWhere('o.status = :status')
                   ->setParameter('status', $statuses[0]);
            } else {
                $qb->andWhere('o.status IN (:statuses)')
                   ->setParameter('statuses', $statuses);
            }
        }

        if (!empty($filters['tipo'])) {
            $qb->andWhere('o.tipo = :tipo')
               ->setParameter('tipo', $filters['tipo']);
        }

        if (!empty($filters['lead_id'])) {
            $qb->andWhere('l.id = :lead_id')
               ->setParameter('lead_id', $filters['lead_id']);
        }

        if (!empty($filters['data_inicio'])) {
            $qb->andWhere('COALESCE(o.dataAtendimento, o.createdAt) >= :data_inicio')
               ->setParameter('data_inicio', new \DateTimeImmutable($filters['data_inicio']));
        }

        if (!empty($filters['data_fim'])) {
            $qb->andWhere('COALESCE(o.dataAtendimento, o.createdAt) <= :data_fim')
               ->setParameter('data_fim', new \DateTimeImmutable($filters['data_fim']));
        }

        return $qb->getQuery()->getResult();
    }

    public function countByStatus(): array
    {
        $result = $this->createQueryBuilder('o')
            ->select('o.status, COUNT(o.id) as total')
            ->groupBy('o.status')
            ->getQuery()
            ->getResult();

        $counts = [
            'pendente' => 0,
            'em_andamento' => 0,
            'concluido' => 0,
            'cancelado' => 0,
        ];

        foreach ($result as $row) {
            $counts[$row['status']] = (int) $row['total'];
        }

        return $counts;
    }
}
