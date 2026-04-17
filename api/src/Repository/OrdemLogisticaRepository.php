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
            ->orderBy('o.createdAt', 'DESC');

        if (!empty($filters['status'])) {
            $qb->andWhere('o.status = :status')
               ->setParameter('status', $filters['status']);
        }

        if (!empty($filters['tipo'])) {
            $qb->andWhere('o.tipo = :tipo')
               ->setParameter('tipo', $filters['tipo']);
        }

        if (!empty($filters['lead_id'])) {
            $qb->andWhere('l.id = :lead_id')
               ->setParameter('lead_id', $filters['lead_id']);
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
