<?php

use App\Entity\User;
use App\Kernel;
use Symfony\Bundle\FrameworkBundle\Console\Application;
use Symfony\Component\HttpFoundation\Request;

require_once dirname(__DIR__) . '/vendor/autoload_runtime.php';

return function (array $context) {
    $kernel = new \App\Kernel($context['APP_ENV'], (bool) $context['APP_DEBUG']);
    $kernel->boot();
    $container = $kernel->getContainer();
    $em = $container->get('doctrine')->getManager();
    $hasher = $container->get('security.user_password_hasher');

    // Check if user exists
    $repo = $em->getRepository(User::class);
    if ($repo->findOneBy(['email' => 'admin@hermes.com'])) {
        echo "User already exists\n";
        return;
    }

    $user = new User();
    $user->setEmail('admin@hermes.com');
    $user->setName('Admin User');
    $user->setPhone('11999999999');
    $user->setRole('admin'); // Or 'admin' if role management requires it
    $user->setStatus(1);
    
    // Hash password
    $hashedPassword = $hasher->hashPassword($user, 'password');
    $user->setPassword($hashedPassword);

    $em->persist($user);
    $em->flush();

    echo "User created successfully\n";
};
