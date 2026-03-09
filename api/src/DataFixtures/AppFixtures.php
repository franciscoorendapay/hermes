<?php

namespace App\DataFixtures;

use App\Entity\Accreditation;
use App\Entity\Lead;
use App\Entity\User;
use App\Entity\UserRole;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AppFixtures extends Fixture
{
    public function __construct(
        private UserPasswordHasherInterface $passwordHasher
    ) {
    }

    public function load(ObjectManager $manager): void
    {
        // 1. Create Admin User (All Permissions)
        $admin = new User();
        $admin->setEmail('admin@hermes.com');
        $admin->setName('Admin User');
        $admin->setRegion('SP');
        $admin->setPhone('11999990000');
        $admin->setPassword($this->passwordHasher->hashPassword($admin, 'password'));
        $admin->setCreatedAt(new \DateTimeImmutable());
        $admin->setRole('comercial');
        $manager->persist($admin);

        $manager->flush();
    }
}
