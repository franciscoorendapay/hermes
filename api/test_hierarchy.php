<?php
// test_hierarchy.php
require 'vendor/autoload.php';

use App\Kernel;
use Symfony\Component\HttpFoundation\Request;

$kernel = new Kernel('dev', true);
$kernel->boot();

$request = Request::create('/api/hierarchy', 'GET');
$response = $kernel->handle($request);

echo "Status: " . $response->getStatusCode() . "\n";
echo "Content: " . $response->getContent() . "\n";

$requestLeads = Request::create('/api/leads?user_ids=1,2,3', 'GET');
// Mock the user so it doesn't fail on "Unauthenticated"
$container = $kernel->getContainer();
$userRepo = $container->get('doctrine')->getRepository(\App\Entity\User::class);
$user = $userRepo->findOneBy([]);

// To bypass security we just test the repository instead to see if the query builder fails
$leadRepo = $container->get('doctrine')->getRepository(\App\Entity\Lead::class);
$qb = $leadRepo->createQueryBuilder('l')
    ->where('l.user IN (:userIds)')
    ->setParameter('userIds', ['1', '2', '3'])
    ->orderBy('l.id', 'DESC')
    ->getQuery();

echo "Leads query count: " . count($qb->getResult()) . "\n";
