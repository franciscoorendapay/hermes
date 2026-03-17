<?php
// fix_csv.php
$inputFile = __DIR__ . '/leads.csv';   // caminho do seu CSV original
$outputFile = __DIR__ . '/leads_fixed.csv'; // CSV corrigido

if (!file_exists($inputFile)) {
    die("Arquivo $inputFile não encontrado.\n");
}

$input = fopen($inputFile, 'r');
$output = fopen($outputFile, 'w');

$header = fgetcsv($input);
if (!$header) die("Arquivo vazio.\n");

// Escrever cabeçalho
fputcsv($output, $header);

// Índice da coluna 'name'
$nameIndex = array_search('name', $header);

while (($row = fgetcsv($input)) !== false) {
    // Se 'name' estiver vazio, colocar valor padrão
    if (empty($row[$nameIndex])) {
        $row[$nameIndex] = 'Nome não informado';
    }
    fputcsv($output, $row);
}

fclose($input);
fclose($output);

echo "CSV corrigido criado em: $outputFile\n";