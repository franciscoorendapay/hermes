<?php
$host = '127.0.0.1';
$db   = 'hermes-superdb';
$user = 'symfony';
$pass = '123456';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
     $pdo = new PDO($dsn, $user, $pass, $options);
     echo "Connection successful with user 'symfony'\n";
} catch (\PDOException $e) {
     echo "Error: " . $e->getMessage() . "\n";
     exit(1);
}
