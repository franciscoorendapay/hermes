<?php

use App\Kernel;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\HttpFoundation\Request;

require_once dirname(__FILE__) . '/vendor/autoload_runtime.php';

return function (array $context) {
    $kernel = new Kernel($context['APP_ENV'], (bool) $context['APP_DEBUG']);
    $kernel->boot();
    $container = $kernel->getContainer();

    $entityManager = $container->get('doctrine')->getManager();
    $hasher = $container->get('security.user_password_hasher');

    $email = 'admin@hermes.com';
    $newPassword = 'admin123';

    $user = $entityManager->getRepository(User::class)->findOneBy(['email' => $email]);

    if (!$user) {
        echo "Usuário $email não encontrado.\n";
        exit(1);
    }

    $hashedPassword = $hasher->hashPassword($user, $newPassword);
    $user->setPassword($hashedPassword);

    $entityManager->persist($user);
    $entityManager->flush();

    echo "Senha atualizada com sucesso para $email\n";
    echo "Novo hash: " . $hashedPassword . "\n";
};
