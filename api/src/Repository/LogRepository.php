<?php

namespace App\Repository;

use App\Entity\Log;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Log>
 */
class LogRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Log::class);
    }

    public function save(Log $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * Find logs with filters
     */
    public function findWithFilters(
        ?string $category = null,
        ?string $level = null,
        ?\DateTimeInterface $dateFrom = null,
        ?\DateTimeInterface $dateTo = null,
        ?string $entityType = null,
        ?string $entityId = null,
        int $limit = 50,
        int $offset = 0
    ): array {
        $qb = $this->createQueryBuilder('l')
            ->leftJoin('l.user', 'u')
            ->addSelect('u')
            ->orderBy('l.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->setFirstResult($offset);

        if ($category) {
            $qb->andWhere('l.category = :category')
               ->setParameter('category', $category);
        }

        if ($level) {
            $qb->andWhere('l.level = :level')
               ->setParameter('level', $level);
        }

        if ($dateFrom) {
            $qb->andWhere('l.createdAt >= :dateFrom')
               ->setParameter('dateFrom', $dateFrom);
        }

        if ($dateTo) {
            $qb->andWhere('l.createdAt <= :dateTo')
               ->setParameter('dateTo', $dateTo);
        }

        if ($entityType) {
            $qb->andWhere('l.entityType = :entityType')
               ->setParameter('entityType', $entityType);
        }

        if ($entityId) {
            $qb->andWhere('l.entityId = :entityId')
               ->setParameter('entityId', $entityId);
        }

        return $qb->getQuery()->getResult();
    }

    /**
     * Get statistics
     */
    public function getStats(
        ?\DateTimeInterface $dateFrom = null,
        ?\DateTimeInterface $dateTo = null
    ): array {
        $qb = $this->createQueryBuilder('l');

        if ($dateFrom) {
            $qb->andWhere('l.createdAt >= :dateFrom')
               ->setParameter('dateFrom', $dateFrom);
        }

        if ($dateTo) {
            $qb->andWhere('l.createdAt <= :dateTo')
               ->setParameter('dateTo', $dateTo);
        }

        // Total logs
        $total = (int) $qb->select('COUNT(l.id)')
            ->getQuery()
            ->getSingleScalarResult();

        // By level
        $byLevel = $this->createQueryBuilder('l')
            ->select('l.level, COUNT(l.id) as count')
            ->groupBy('l.level');
        
        if ($dateFrom) {
            $byLevel->andWhere('l.createdAt >= :dateFrom')
                    ->setParameter('dateFrom', $dateFrom);
        }
        if ($dateTo) {
            $byLevel->andWhere('l.createdAt <= :dateTo')
                    ->setParameter('dateTo', $dateTo);
        }

        $byLevelData = [];
        foreach ($byLevel->getQuery()->getResult() as $row) {
            $byLevelData[$row['level']] = (int) $row['count'];
        }

        // By category
        $byCategory = $this->createQueryBuilder('l')
            ->select('l.category, COUNT(l.id) as count')
            ->groupBy('l.category');
        
        if ($dateFrom) {
            $byCategory->andWhere('l.createdAt >= :dateFrom')
                       ->setParameter('dateFrom', $dateFrom);
        }
        if ($dateTo) {
            $byCategory->andWhere('l.createdAt <= :dateTo')
                       ->setParameter('dateTo', $dateTo);
        }

        $byCategoryData = [];
        foreach ($byCategory->getQuery()->getResult() as $row) {
            $byCategoryData[$row['category']] = (int) $row['count'];
        }

        return [
            'total_logs' => $total,
            'by_level' => $byLevelData,
            'by_category' => $byCategoryData,
        ];
    }

    /**
     * Delete old logs
     */
    public function deleteOlderThan(\DateTimeInterface $date): int
    {
        return $this->createQueryBuilder('l')
            ->delete()
            ->where('l.createdAt < :date')
            ->andWhere('l.level NOT IN (:keepLevels)')
            ->setParameter('date', $date)
            ->setParameter('keepLevels', ['ERROR', 'CRITICAL'])
            ->getQuery()
            ->execute();
    }
}
