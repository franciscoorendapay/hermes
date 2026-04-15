<?php

use App\Entity\User;
use App\Kernel;

require __DIR__ . '/vendor/autoload.php';

$kernel = new Kernel('dev', true);
$kernel->boot();

$container = $kernel->getContainer();
$em = $container->get('doctrine')->getManager();
$hasher = $container->get('security.user_password_hasher');

// Check if user exists
$repo = $em->getRepository(User::class);
if ($repo->findOneBy(['email' => 'admin@hermes.com'])) {
    echo "User already exists\n";
    exit(0);
}

$user = new User();
$user->setEmail('admin@hermes.com');
$user->setName('Admin User');
$user->setPhone('11999999999');
$user->setRole('comercial');
$user->setStatus(1);
$user->setRegion('SP');

// Hash password
$hashedPassword = $hasher->hashPassword($user, 'password');
$user->setPassword($hashedPassword);

$em->persist($user);
$em->flush();

echo "User created successfully\n";
