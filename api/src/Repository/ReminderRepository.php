<?php

namespace App\Repository;

use App\Entity\Reminder;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Reminder>
 */
class ReminderRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Reminder::class);
    }

    /**
     * @param array $userIds
     * @return Reminder[]
     */
    public function findByUserIds(array $userIds): array
    {
        return $this->createQueryBuilder('r')
            ->leftJoin('r.lead', 'l')
            ->addSelect('l')
            ->leftJoin('r.user', 'u')
            ->addSelect('u')
            ->where('r.user IN (:userIds)')
            ->setParameter('userIds', $userIds)
            ->orderBy('r.data_lembrete', 'ASC')
            ->addOrderBy('r.hora_lembrete', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
