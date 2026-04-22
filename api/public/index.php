<?php

// Proteção de acesso: libera OPTIONS (CORS preflight), Bearer token (React/JWT) e Basic Auth
if ($_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    $apiKey     = $_SERVER['HTTP_X_API_KEY'] ?? '';

    $hasBearerToken = str_starts_with($authHeader, 'Bearer ');
    $hasValidApiKey = $apiKey === 'Sy7xP!k2mNqR9vLw';
    $hasBasicAuth   = (($_SERVER['PHP_AUTH_USER'] ?? '') === 'acesso'
                    && ($_SERVER['PHP_AUTH_PW']   ?? '') === '!Syn3421');

    if (!$hasBearerToken && !$hasValidApiKey && !$hasBasicAuth) {
        header('WWW-Authenticate: Basic realm="API Access"');
        http_response_code(401);
        exit('Unauthorized');
    }
}

use App\Kernel;

require_once dirname(__DIR__).'/vendor/autoload_runtime.php';

return function (array $context) {
    return new Kernel($context['APP_ENV'], (bool) $context['APP_DEBUG']);
};
