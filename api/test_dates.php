<?php
$now = new \DateTimeImmutable();
$startOfMonth = clone $now;
$startOfMonth = $startOfMonth->modify('first day of this month')->setTime(0, 0, 0);
$endOfMonth = clone $now;
$endOfMonth = $endOfMonth->modify('last day of this month')->setTime(23, 59, 59);

echo "Start: " . $startOfMonth->format('Y-m-d H:i:s') . "\n";
echo "End: " . $endOfMonth->format('Y-m-d H:i:s') . "\n";
