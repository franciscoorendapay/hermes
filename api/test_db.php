<?php
require __DIR__ . '/vendor/autoload.php';

use App\Kernel;
use Symfony\Component\Dotenv\Dotenv;
use App\Entity\Lead;

(new Dotenv())->bootEnv(__DIR__.'/.env');

$kernel = new Kernel($_SERVER['APP_ENV'], (bool) $_SERVER['APP_DEBUG']);
$kernel->boot();

$container = $kernel->getContainer();
$em = $container->get('doctrine')->getManager();
$conn = $em->getConnection();

$sql1 = "SELECT COUNT(*) FROM leads";
$all = $conn->fetchOne($sql1);

$sql2 = "SELECT COUNT(*) FROM leads WHERE app_funnel = 4";
$funnel4 = $conn->fetchOne($sql2);

$sql3 = "SELECT COUNT(*) FROM leads WHERE accreditation = 1";
$acc1 = $conn->fetchOne($sql3);

echo "Total leads: $all\n";
echo "Leads with appFunnel=4: $funnel4\n";
echo "Leads with accreditation=1: $acc1\n";
