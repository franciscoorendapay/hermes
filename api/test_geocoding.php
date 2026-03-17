<?php

$lat = -5.8289;
$lng = -35.2267;
$url = "https://nominatim.openstreetmap.org/reverse?format=json&lat=$lat&lon=$lng&accept-language=pt-br";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_USERAGENT, 'HermesCRM/1.0 (contact@hermes.com.br)');
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Status: $httpCode\n";
echo "Response:\n";
if ($response) {
    $data = json_decode($response, true);
    echo "KEYS:\n";
    print_r(array_keys($data['address'] ?? []));
    echo "FULL DISPLAY NAME: " . ($data['display_name'] ?? 'N/A') . "\n";
} else {
    echo "Empty response";
}
echo "\n";
