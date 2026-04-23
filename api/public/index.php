<?php

if ($_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {
    $auth = $_SERVER['HTTP_AUTHORIZATION']
          ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
          ?? '';

    $hasBearerToken = str_starts_with($auth, 'Bearer ');
    $hasBasicAuth   = ($_SERVER['PHP_AUTH_USER'] ?? '') === 'acesso'
                   && ($_SERVER['PHP_AUTH_PW']   ?? '') === '!Syn3421';

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
