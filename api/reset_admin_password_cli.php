<?php

require __DIR__ . '/vendor/autoload.php';

use App\Kernel;
use App\Entity\User;
use Symfony\Component\Dotenv\Dotenv;

// Load .env if available, just to be safe with DB vars
if (file_exists(__DIR__.'/.env')) {
    (new Dotenv())->bootEnv(__DIR__.'/.env');
}

$kernel = new Kernel($_SERVER['APP_ENV'] ?? 'dev', (bool) ($_SERVER['APP_DEBUG'] ?? true));
$kernel->boot();

$container = $kernel->getContainer();
$entityManager = $container->get('doctrine')->getManager();
$hasher = $container->get('security.user_password_hasher');

$email = 'admin@hermes.com';
$newPassword = 'password';

echo "Updating password for $email...\n";

$user = $entityManager->getRepository(User::class)->findOneBy(['email' => $email]);

if (!$user) {
    echo "USER NOT FOUND: Creating one...\n";
    // Verify if creation works here or if we should exit
    // If not found, let's create it properly using Entity Manager
    $user = new User();
    $user->setEmail($email);
    $user->setName('Admin User');
    $user->setPhone('11999999999');
    $user->setRole('comercial'); 
    $user->setRegion('SP');
    $user->setStatus(1);
    $user->setCreatedAt(new \DateTimeImmutable());
    $entityManager->persist($user);
} else {
    echo "User found (ID: " . $user->getId() . ")\n";
}

$hashedPassword = $hasher->hashPassword($user, $newPassword);
$user->setPassword($hashedPassword);

$entityManager->flush();

echo "SUCCESS: Password updated to '$newPassword'.\n";
