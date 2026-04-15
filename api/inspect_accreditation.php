<?php

use App\Entity\Accreditation;
use Symfony\Component\Dotenv\Dotenv;
use Symfony\Bundle\FrameworkBundle\Console\Application;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Output\BufferedOutput;

require __DIR__.'/vendor/autoload.php';

$kernel = new \App\Kernel('dev', true);
$kernel->boot();
$container = $kernel->getContainer();
$em = $container->get('doctrine.orm.entity_manager');

$repository = $em->getRepository(Accreditation::class);
$latest = $repository->findBy([], ['createdAt' => 'DESC'], 1);

if (empty($latest)) {
    echo "No accreditations found.\n";
    exit;
}

$acc = $latest[0];
echo "Accreditation ID: " . $acc->getId() . "\n";
echo "Responsible: " . $acc->getResponsibleName() . "\n";
echo "Doc CNPJ: " . $acc->getDocCnpjUrl() . "\n";
echo "Doc Photo: " . $acc->getDocPhotoUrl() . "\n";
echo "Doc Residence: " . $acc->getDocResidenceUrl() . "\n";
echo "Doc Activity: " . $acc->getDocActivityUrl() . "\n";
echo "Pending Docs: " . $acc->getPendingDocuments() . "\n";
echo "Status: " . $acc->getStatus() . "\n";
echo "Created At: " . $acc->getCreatedAt()->format('Y-m-d H:i:s') . "\n";
