<?php
require 'vendor/autoload.php';

$kernel = new App\Kernel('dev', true);
$kernel->boot();
$em = $kernel->getContainer()->get('doctrine')->getManager();
$conn = $em->getConnection();

$start = date('Y-m-01 00:00:00');
$end   = date('Y-m-t 23:59:59');

echo "=== ACCREDITATION RECORDS THIS MONTH ($start to $end) ===\n";
$rows = $conn->fetchAllAssociative(
    'SELECT l.id, l.name, l.tpv, l.accreditation, l.app_funnel, a.created_at as acc_created
     FROM leads l
     INNER JOIN accreditation a ON a.lead_id = l.id
     WHERE a.created_at >= ? AND a.created_at <= ?
     LIMIT 20',
    [$start, $end]
);
foreach ($rows as $r) {
    echo $r['name'] . ' | tpv=' . ($r['tpv'] ?? 'NULL') . ' | accred=' . $r['accreditation'] . ' | funnel=' . $r['app_funnel'] . ' | acc_created=' . $r['acc_created'] . "\n";
}
echo 'Total rows: ' . count($rows) . "\n\n";

echo "=== CARTEIRA (accreditation=1 no date filter) ===\n";
$cart = $conn->fetchOne('SELECT COUNT(*) FROM leads WHERE accreditation = 1');
echo 'Count: ' . $cart . "\n\n";

echo "=== TPV SUM for accredited leads this month ===\n";
$tpvSum = $conn->fetchOne(
    'SELECT SUM(l.tpv) FROM leads l
     INNER JOIN accreditation a ON a.lead_id = l.id
     WHERE l.accreditation = 1 AND a.created_at >= ? AND a.created_at <= ?',
    [$start, $end]
);
echo 'TPV Sum accredited this month: ' . ($tpvSum ?? 'NULL') . "\n\n";

echo "=== TPV SUM for ALL accredited leads (no date) ===\n";
$tpvSumAll = $conn->fetchOne('SELECT SUM(l.tpv) FROM leads l WHERE l.accreditation = 1');
echo 'TPV Sum all accredited: ' . ($tpvSumAll ?? 'NULL') . "\n\n";

echo "=== NOVOS CLIENTES count this month ===\n";
$novos = $conn->fetchOne(
    'SELECT COUNT(l.id) FROM leads l
     INNER JOIN accreditation a ON a.lead_id = l.id
     WHERE l.accreditation = 1 AND a.created_at >= ? AND a.created_at <= ?',
    [$start, $end]
);
echo 'Novos Clientes: ' . $novos . "\n";
