<?php

namespace App\Controller;

use App\Repository\LogRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/admin')]
class AdminLogController extends AbstractController
{
    public function __construct(
        private LogRepository $logRepository
    ) {}

    #[Route('/logs', name: 'admin_logs_index', methods: ['GET'])]
    public function index(Request $request): JsonResponse
    {
        // Check if user is admin
        // TODO: Add role check when authentication is fully implemented
        // if (!$this->isGranted('ROLE_ADMIN')) {
        //     return $this->json(['error' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        // }

        $category = $request->query->get('category');
        $level = $request->query->get('level');
        $entityType = $request->query->get('entity_type');
        $entityId = $request->query->get('entity_id');
        $limit = (int) $request->query->get('limit', 50);
        $offset = (int) $request->query->get('offset', 0);

        $dateFrom = $request->query->get('date_from');
        $dateTo = $request->query->get('date_to');

        $dateFromObj = $dateFrom ? new \DateTime($dateFrom) : null;
        $dateToObj = $dateTo ? new \DateTime($dateTo) : null;

        $logs = $this->logRepository->findWithFilters(
            $category,
            $level,
            $dateFromObj,
            $dateToObj,
            $entityType,
            $entityId,
            $limit,
            $offset
        );

        return $this->json([
            'logs' => $logs,
            'count' => count($logs),
            'limit' => $limit,
            'offset' => $offset,
        ], Response::HTTP_OK, [], ['groups' => 'log:read']);
    }

    #[Route('/logs/stats', name: 'admin_logs_stats', methods: ['GET'])]
    public function stats(Request $request): JsonResponse
    {
        // Check if user is admin
        // if (!$this->isGranted('ROLE_ADMIN')) {
        //     return $this->json(['error' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        // }

        $dateFrom = $request->query->get('date_from');
        $dateTo = $request->query->get('date_to');

        $dateFromObj = $dateFrom ? new \DateTime($dateFrom) : null;
        $dateToObj = $dateTo ? new \DateTime($dateTo) : null;

        $stats = $this->logRepository->getStats($dateFromObj, $dateToObj);

        // Get errors by day (last 30 days if no date range)
        if (!$dateFromObj) {
            $dateFromObj = new \DateTime('-30 days');
        }
        if (!$dateToObj) {
            $dateToObj = new \DateTime();
        }

        $errorsByDay = $this->getErrorsByDay($dateFromObj, $dateToObj);
        $topErrors = $this->getTopErrors($dateFromObj, $dateToObj);

        return $this->json([
            'total_logs' => $stats['total_logs'],
            'by_level' => $stats['by_level'],
            'by_category' => $stats['by_category'],
            'errors_by_day' => $errorsByDay,
            'top_errors' => $topErrors,
        ], Response::HTTP_OK);
    }

    #[Route('/logs/cleanup', name: 'admin_logs_cleanup', methods: ['POST'])]
    public function cleanup(Request $request): JsonResponse
    {
        // Check if user is admin
        // if (!$this->isGranted('ROLE_ADMIN')) {
        //     return $this->json(['error' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        // }

        $days = (int) $request->query->get('days', 90);
        $date = new \DateTime(sprintf('-%d days', $days));

        $deleted = $this->logRepository->deleteOlderThan($date);

        return $this->json([
            'message' => sprintf('Deleted %d logs older than %d days', $deleted, $days),
            'deleted_count' => $deleted,
        ], Response::HTTP_OK);
    }

    #[Route('/logs/{id}', name: 'admin_logs_show', methods: ['GET'])]
    public function show(string $id): JsonResponse
    {
        // Check if user is admin
        // if (!$this->isGranted('ROLE_ADMIN')) {
        //     return $this->json(['error' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        // }

        $log = $this->logRepository->find($id);

        if (!$log) {
            return $this->json(['error' => 'Log not found'], Response::HTTP_NOT_FOUND);
        }

        return $this->json($log, Response::HTTP_OK, [], ['groups' => 'log:read']);
    }

    private function getErrorsByDay(\DateTime $from, \DateTime $to): array
    {
        // Get error count per day
        $qb = $this->logRepository->createQueryBuilder('l')
            ->select('DATE(l.createdAt) as date, COUNT(l.id) as count')
            ->where('l.level IN (:levels)')
            ->andWhere('l.createdAt >= :from')
            ->andWhere('l.createdAt <= :to')
            ->setParameter('levels', ['ERROR', 'CRITICAL'])
            ->setParameter('from', $from)
            ->setParameter('to', $to)
            ->groupBy('date')
            ->orderBy('date', 'ASC');

        $result = $qb->getQuery()->getResult();

        return array_map(function($row) {
            return [
                'date' => $row['date'],
                'count' => (int) $row['count'],
            ];
        }, $result);
    }

    private function getTopErrors(\DateTime $from, \DateTime $to, int $limit = 10): array
    {
        // Get most common error messages
        $qb = $this->logRepository->createQueryBuilder('l')
            ->select('l.message, COUNT(l.id) as count')
            ->where('l.level IN (:levels)')
            ->andWhere('l.createdAt >= :from')
            ->andWhere('l.createdAt <= :to')
            ->setParameter('levels', ['ERROR', 'CRITICAL'])
            ->setParameter('from', $from)
            ->setParameter('to', $to)
            ->groupBy('l.message')
            ->orderBy('count', 'DESC')
            ->setMaxResults($limit);

        $result = $qb->getQuery()->getResult();

        return array_map(function($row) {
            return [
                'message' => $row['message'],
                'count' => (int) $row['count'],
            ];
        }, $result);
    }
}
