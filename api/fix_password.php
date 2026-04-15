<?php
$host = '127.0.0.1';
$db   = 'hermes-superdb';
$user = 'root';
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
     
     // Hash password reliably
     $hashedPassword = password_hash('password', PASSWORD_BCRYPT);
     echo "Generated hash: " . $hashedPassword . "\n";

     $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE email = ?");
     $stmt->execute([$hashedPassword, 'admin@hermes.com']);
     
     echo "Password updated successfully for admin@hermes.com\n";

     // Verify
     $stmt = $pdo->prepare("SELECT password FROM users WHERE email = ?");
     $stmt->execute(['admin@hermes.com']);
     $stored = $stmt->fetchColumn();
     echo "Stored hash: " . $stored . "\n";

} catch (\PDOException $e) {
     echo "Error: " . $e->getMessage();
     exit(1);
}
