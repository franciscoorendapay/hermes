<?php

namespace App\Service;

use App\Entity\Log;
use App\Entity\User;
use App\Entity\Visit;
use App\Entity\Accreditation;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\RequestStack;
use Psr\Log\LoggerInterface as PsrLoggerInterface;

class LoggerService
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private RequestStack $requestStack,
        private PsrLoggerInterface $logger
    ) {}

    /**
     * Log a visit action
     */
    public function logVisit(Visit $visit, string $action, ?User $user = null): void
    {
        $lead = $visit->getLead();
        
        $log = new Log();
        $log->setLevel('INFO');
        $log->setCategory('visit');
        $log->setAction($action);
        $log->setEntityType('Visit');
        $log->setEntityId($visit->getId());
        $log->setMessage(sprintf('Visita %s para Lead: %s', $action, $lead ? $lead->getName() : 'N/A'));
        $log->setUser($user ?? $visit->getUser());
        
        $log->setContext([
            'visit_id' => $visit->getId(),
            'lead_id' => $lead?->getId(),
            'lead_name' => $lead?->getName(),
            'tipo' => $visit->getTipo(),
            'status' => $visit->getStatus(),
            'user_name' => $visit->getUser()?->getName(),
        ]);

        $this->addRequestInfo($log);
        $this->persist($log);
    }

    /**
     * Log an accreditation action
     */
    public function logAccreditation(Accreditation $accreditation, string $action, array $additionalContext = [], ?User $user = null): void
    {
        $lead = $accreditation->getLead();
        
        $level = in_array($action, ['error', 'rejected']) ? 'ERROR' : 'INFO';
        
        $log = new Log();
        $log->setLevel($level);
        $log->setCategory('accreditation');
        $log->setAction($action);
        $log->setEntityType('Accreditation');
        $log->setEntityId($accreditation->getId());
        $log->setMessage(sprintf('Credenciamento %s: %s', $action, $lead ? $lead->getName() : 'N/A'));
        
        if ($user) {
            $log->setUser($user);
        } elseif ($accreditation->getUser()) {
            $log->setUser($accreditation->getUser());
        }
        
        $context = array_merge([
            'accreditation_id' => $accreditation->getId(),
            'lead_id' => $lead?->getId(),
            'lead_name' => $lead?->getName(),
            'user_name' => $accreditation->getUser()?->getName(),
        ], $additionalContext);
        
        $log->setContext($context);

        $this->addRequestInfo($log);
        $this->persist($log);
    }

    /**
     * Log an error or exception
     */
    public function logError(string $message, array $context = [], string $level = 'ERROR'): void
    {
        $log = new Log();
        $log->setLevel($level);
        $log->setCategory('api_error');
        $log->setAction('error');
        $log->setMessage($message);
        $log->setContext($context);

        $this->addRequestInfo($log);
        $this->persist($log);

        // Also log to Symfony logger for traditional logs
        $this->logger->error($message, $context);
    }

    /**
     * Log API request/response
     */
    public function logApiRequest(string $method, string $endpoint, int $statusCode, ?array $requestBody = null, ?array $responseBody = null, ?\Throwable $exception = null): void
    {
        $level = $statusCode >= 500 ? 'CRITICAL' : ($statusCode >= 400 ? 'ERROR' : 'INFO');
        
        $log = new Log();
        $log->setLevel($level);
        $log->setCategory('api_request');
        $log->setAction('request');
        $log->setMessage(sprintf('%s %s - %d', $method, $endpoint, $statusCode));
        
        $context = [
            'method' => $method,
            'endpoint' => $endpoint,
            'status_code' => $statusCode,
        ];

        if ($requestBody) {
            $context['request_body'] = $requestBody;
        }

        if ($responseBody) {
            $context['response_body'] = $responseBody;
        }

        if ($exception) {
            $context['exception'] = get_class($exception);
            $context['exception_message'] = $exception->getMessage();
            $context['stack_trace'] = $exception->getTraceAsString();
        }

        $log->setContext($context);
        $this->addRequestInfo($log);
        $this->persist($log);
    }

    /**
     * Log a system event
     */
    public function logSystem(string $message, string $action, array $context = [], string $level = 'INFO'): void
    {
        $log = new Log();
        $log->setLevel($level);
        $log->setCategory('system');
        $log->setAction($action);
        $log->setMessage($message);
        $log->setContext($context);

        $this->addRequestInfo($log);
        $this->persist($log);
    }

    /**
     * Add request information (IP, User-Agent) to log
     */
    private function addRequestInfo(Log $log): void
    {
        $request = $this->requestStack->getCurrentRequest();
        
        if ($request) {
            $log->setIpAddress($request->getClientIp());
            $log->setUserAgent($request->headers->get('User-Agent'));
        }
    }

    /**
     * Persist log to database
     */
    private function persist(Log $log): void
    {
        try {
            $this->entityManager->persist($log);
            $this->entityManager->flush();
        } catch (\Exception $e) {
            // If logging fails, log to Symfony logger as fallback
            $this->logger->error('Failed to persist log to database', [
                'error' => $e->getMessage(),
                'log_message' => $log->getMessage(),
            ]);
        }
    }
}
