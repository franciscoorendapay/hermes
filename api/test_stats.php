<?php
require __DIR__ . '/vendor/autoload.php';

use App\Kernel;
use Symfony\Component\Dotenv\Dotenv;
use App\Entity\User;
use App\Repository\LeadRepository;

(new Dotenv())->bootEnv(__DIR__.'/.env');

$kernel = new Kernel($_SERVER['APP_ENV'], (bool) $_SERVER['APP_DEBUG']);
$kernel->boot();

$container = $kernel->getContainer();
$em = $container->get('doctrine')->getManager();

$registry = $container->get('doctrine');
$leadRepo = new LeadRepository($registry);
$userRepo = $em->getRepository(User::class);

$users = $userRepo->findAll();
if (empty($users)) {
    echo "No users found\n";
    exit;
}

foreach ($users as $user) {
    if ($user->getRole() === 'admin') continue; // Often admins have no stats
    
    echo "\nUser: " . $user->getName() . " (" . $user->getId() . ")\n";
    $stats = $leadRepo->getDashboardStats($user);
    echo "TPV Prometido: " . $stats['tpvPrometido'] . "\n";
    echo "Novos Clientes: " . $stats['novosClientes'] . "\n";
    echo "Carteira Clientes: " . $stats['carteiraClientes'] . "\n";
    echo "TPV Total: " . $stats['tpvTotal'] . "\n";
}
