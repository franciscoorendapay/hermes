<?php

namespace App\Repository;

use App\Entity\Visit;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Visit>
 */
class VisitRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Visit::class);
    }

    public function save(Visit $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(Visit $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * @param array $userIds
     * @return Visit[]
     */
    public function findByUserIds(array $userIds): array
    {
        return $this->createQueryBuilder('v')
            ->leftJoin('v.lead', 'l')
            ->addSelect('l')
            ->leftJoin('v.user', 'u')
            ->addSelect('u')
            ->where('v.user IN (:userIds)')
            ->setParameter('userIds', $userIds)
            ->orderBy('v.data_visita', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
