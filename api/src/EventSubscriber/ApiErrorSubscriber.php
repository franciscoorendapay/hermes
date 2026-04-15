<?php

namespace App\EventSubscriber;

use App\Service\LoggerService;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\HttpFoundation\Response;

class ApiErrorSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private LoggerService $loggerService
    ) {}

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::EXCEPTION => 'onKernelException',
            KernelEvents::RESPONSE => 'onKernelResponse',
        ];
    }

    /**
     * Log exceptions
     */
    public function onKernelException(ExceptionEvent $event): void
    {
        $exception = $event->getThrowable();
        $request = $event->getRequest();

        // Only log API exceptions (routes starting with /api/)
        if (!str_starts_with($request->getPathInfo(), '/api/')) {
            return;
        }

        $context = [
            'endpoint' => sprintf('%s %s', $request->getMethod(), $request->getPathInfo()),
            'exception' => get_class($exception),
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
            'stack_trace' => $exception->getTraceAsString(),
        ];

        // Add request body if present
        $content = $request->getContent();
        if ($content) {
            try {
                $context['request_body'] = json_decode($content, true);
            } catch (\Exception $e) {
                $context['request_body'] = $content;
            }
        }

        $this->loggerService->logError(
            sprintf('API Exception: %s', $exception->getMessage()),
            $context,
            'CRITICAL'
        );
    }

    /**
     * Log API errors (4xx, 5xx responses)
     */
    public function onKernelResponse(ResponseEvent $event): void
    {
        $request = $event->getRequest();
        $response = $event->getResponse();

        // Only log API responses
        if (!str_starts_with($request->getPathInfo(), '/api/')) {
            return;
        }

        $statusCode = $response->getStatusCode();

        // Only log errors (4xx, 5xx)
        if ($statusCode < 400) {
            return;
        }

        $level = $statusCode >= 500 ? 'ERROR' : 'WARNING';
        
        $context = [
            'method' => $request->getMethod(),
            'endpoint' => $request->getPathInfo(),
            'status_code' => $statusCode,
        ];

        // Add request body
        $content = $request->getContent();
        if ($content) {
            try {
                $context['request_body'] = json_decode($content, true);
            } catch (\Exception $e) {
                // Ignore if not JSON
            }
        }

        // Add response body
        $responseContent = $response->getContent();
        if ($responseContent) {
            try {
                $context['response_body'] = json_decode($responseContent, true);
            } catch (\Exception $e) {
                // Ignore if not JSON
            }
        }

        $this->loggerService->logError(
            sprintf('API Error: %s %s returned %d', $request->getMethod(), $request->getPathInfo(), $statusCode),
            $context,
            $level
        );
    }
}
