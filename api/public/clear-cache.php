<?php
/**
 * TEMPORARY FILE - DELETE AFTER USE
 * Access via: https://api.hermes.orendapay.com.br/clear-cache.php
 */

// Security: only allow from specific IPs (optional)
// $allowedIps = ['YOUR_IP_HERE'];
// if (!in_array($_SERVER['REMOTE_ADDR'], $allowedIps)) {
//     die('Access denied');
// }

echo "<h1>Symfony Cache Clear</h1>";
echo "<pre>";

// Change to project root
chdir(__DIR__ . '/..');

// Clear production cache
echo "Clearing production cache...\n";
exec('php bin/console cache:clear --env=prod 2>&1', $output, $returnCode);
echo implode("\n", $output);
echo "\nReturn code: $returnCode\n\n";

// Clear opcache if available
if (function_exists('opcache_reset')) {
    echo "Clearing OPcache...\n";
    opcache_reset();
    echo "OPcache cleared!\n\n";
}

// Show cache status
echo "Cache warmup...\n";
exec('php bin/console cache:warmup --env=prod 2>&1', $warmupOutput);
echo implode("\n", $warmupOutput);

echo "\n\n<strong>✅ DONE! Now delete this file for security.</strong>";
echo "</pre>";
?>
