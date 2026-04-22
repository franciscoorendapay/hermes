<?php

// Proteção: libera OPTIONS (CORS preflight), Bearer token (JWT) e Basic Auth
if ($_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION']
                ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
                ?? '';

    $hasBearerToken = str_starts_with($authHeader, 'Bearer ');

    // Basic Auth via header Authorization (React sem token) ou via PHP_AUTH (browser)
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
