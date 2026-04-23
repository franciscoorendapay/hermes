<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$allHeaders = function_exists('getallheaders') ? getallheaders() : [];

echo json_encode([
    'HTTP_AUTHORIZATION'          => $_SERVER['HTTP_AUTHORIZATION'] ?? null,
    'REDIRECT_HTTP_AUTHORIZATION' => $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null,
    'PHP_AUTH_USER'               => $_SERVER['PHP_AUTH_USER'] ?? null,
    'PHP_AUTH_PW'                 => $_SERVER['PHP_AUTH_PW'] ?? null,
    'getallheaders_Authorization' => $allHeaders['Authorization'] ?? $allHeaders['authorization'] ?? null,
    'REQUEST_METHOD'              => $_SERVER['REQUEST_METHOD'],
    'server_auth_keys'            => array_values(array_filter(
        array_keys($_SERVER),
        fn($k) => str_contains($k, 'AUTH') || $k === 'HTTP_AUTHORIZATION'
    )),
], JSON_PRETTY_PRINT);
