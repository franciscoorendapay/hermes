<?php

// Proteção: libera OPTIONS (CORS), Bearer token (JWT) e Basic Auth
if ($_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {

    // Tenta todas as fontes possíveis do header Authorization
    $authHeader = $_SERVER['HTTP_AUTHORIZATION']
                ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
                ?? '';

    if (empty($authHeader) && function_exists('getallheaders')) {
        $allHeaders = getallheaders();
        $authHeader = $allHeaders['Authorization'] ?? $allHeaders['authorization'] ?? '';
    }

    $hasBearerToken = str_starts_with($authHeader, 'Bearer ');

    $hasBasicAuth = (str_starts_with($authHeader, 'Basic ')
                  && base64_decode(substr($authHeader, 6)) === 'acesso:!Syn3421')
                || (($_SERVER['PHP_AUTH_USER'] ?? '') === 'acesso'
                  && ($_SERVER['PHP_AUTH_PW']   ?? '') === '!Syn3421');

    if (!$hasBearerToken && !$hasBasicAuth) {
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
