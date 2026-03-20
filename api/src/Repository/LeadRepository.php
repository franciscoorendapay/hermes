<?php

namespace App\Repository;

use App\Entity\Lead;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Lead>
 */
class LeadRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Lead::class);
    }
    /**
     * @return array<string, mixed>
     */
    public function getDashboardStats(User $user): array
    {
        $qb = $this->createQueryBuilder('l');
        
        $qb->andWhere('l.user = :user')
           ->setParameter('user', $user);

        $now = new \DateTimeImmutable();
        $startOfMonth = clone $now;
        $startOfMonth = $startOfMonth->modify('first day of this month')->setTime(0, 0, 0);
        $endOfMonth = clone $now;
        $endOfMonth = $endOfMonth->modify('last day of this month')->setTime(23, 59, 59);

        // TPV Prometido (funil_app = 4 and in current month based on accreditation)
        try {
            $tpvPrometido = $this->createQueryBuilder('l')
                ->select('SUM(l.tpv)')
                ->join('App\Entity\Accreditation', 'a', 'WITH', 'a.lead = l')
                ->where('l.user = :user')
                ->andWhere('l.appFunnel = 4')
                ->andWhere('a.createdAt >= :startOfMonth')
                ->andWhere('a.createdAt <= :endOfMonth')
                ->setParameter('user', $user)
                ->setParameter('startOfMonth', $startOfMonth)
                ->setParameter('endOfMonth', $endOfMonth)
                ->getQuery()
                ->getSingleScalarResult();
        } catch (\Exception $e) {
            $tpvPrometido = 0;
        }

        // Carteira de Clientes (funil_app = 4 count)
        try {
            $carteiraClientes = $this->createQueryBuilder('l')
                ->select('COUNT(l.id)')
                ->where('l.user = :user')
                ->andWhere('l.appFunnel = 4')
                ->setParameter('user', $user)
                ->getQuery()
                ->getSingleScalarResult();
        } catch (\Exception $e) {
            $carteiraClientes = 0;
        }

        // TPV Total
        try {
            $tpvTotal = $this->createQueryBuilder('l')
                ->select('SUM(l.tpv)')
                ->where('l.user = :user')
                ->setParameter('user', $user)
                ->getQuery()
                ->getSingleScalarResult();
        } catch (\Exception $e) {
            $tpvTotal = 0;
        }

        // Novos Clientes (credenciado = 1 and in current month based on accreditation)
        try {
            $novosClientes = $this->createQueryBuilder('l')
                ->select('COUNT(l.id)')
                ->join('App\Entity\Accreditation', 'a', 'WITH', 'a.lead = l')
                ->where('l.user = :user')
                ->andWhere('l.accreditation = 1')
                ->andWhere('a.createdAt >= :startOfMonth')
                ->andWhere('a.createdAt <= :endOfMonth')
                ->setParameter('user', $user)
                ->setParameter('startOfMonth', $startOfMonth)
                ->setParameter('endOfMonth', $endOfMonth)
                ->getQuery()
                ->getSingleScalarResult();
        } catch (\Exception $e) {
            $novosClientes = 0;
        }

        // Latest Leads (Limit 5)
        $latestLeads = $this->createQueryBuilder('l')
            ->where('l.user = :user')
            ->setParameter('user', $user)
            ->orderBy('l.createdAt', 'DESC')
            ->setMaxResults(5)
            ->getQuery()
            ->getResult();
            
        return [
            'tpvPrometido' => (float) $tpvPrometido,
            'carteiraClientes' => (int) $carteiraClientes,
            'tpvTotal' => (float) $tpvTotal,
            'novosClientes' => (int) $novosClientes,
            'latestLeads' => $latestLeads
        ];
    }

    public function findPaginated(array $criteria, int $page = 1, int $limit = 10)
{
    $qb = $this->createQueryBuilder('l')
        ->where('l.user = :user')
        ->setParameter('user', $criteria['user']);

    $total = count($qb->getQuery()->getResult());

    $leads = $qb->setFirstResult(($page - 1) * $limit)
                ->setMaxResults($limit)
                ->orderBy('l.id', 'DESC')
                ->getQuery()
                ->getResult();

    return [
        'leads' => $leads,
        'meta' => [
            'total' => $total,
            'page' => $page,
            'last_page' => ceil($total / $limit)
        ]
    ];
}
}
