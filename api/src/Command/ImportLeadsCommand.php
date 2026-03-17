<?php

namespace App\Command;

use App\Entity\Lead;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Attribute\AsCommand;

#[AsCommand(name: 'app:import-leads')]
class ImportLeadsCommand extends Command
{
    private $entityManager;

    public function __construct(EntityManagerInterface $entityManager)
    {
        parent::__construct();
        $this->entityManager = $entityManager;
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $csvFile = __DIR__ . '/../../csv/leads.csv';
        if (!file_exists($csvFile)) {
            $output->writeln('<error>Arquivo CSV não encontrado.</error>');
            return Command::FAILURE;
        }

        $handle = fopen($csvFile, 'r');
        // Lê o cabeçalho
        $header = fgetcsv($handle);

        $count = 0;
        while (($data = fgetcsv($handle)) !== false) {
            // Se a linha estiver vazia ou tiver poucas colunas, pula
            if (count($data) < 20) continue;

            $lead = new Lead();
            
            // MAPEAMENTO BASEADO NO SEU EXEMPLO:
            // 0: cod_lead, 6: doc, 11: tpv, 14: nome1, 15: nome2, 16: nome_fantasia, 19: contato1, 21: email1, 23: cep, 28: uf
            
            $lead->setLeadCode((int)$data[0]);
            $lead->setName(!empty($data[14]) ? $data[14] : 'Sem nome');
            $lead->setTradeName($data[15] ?? null);
            $lead->setCompanyName($data[16] ?? null);
            $lead->setDocument($data[6] ?? null);
            $lead->setEmail($data[21] ?? null);
            $lead->setPhone($data[19] ?? null);
            $lead->setTpv($data[11] ?? null);
            $lead->setAppFunnel((int)($data[3] ?? 0));
            $lead->setAccreditation((int)($data[4] ?? 0));
            $lead->setMcc($data[10] ?? null);
            $lead->setZipCode($data[23] ?? null);
            $lead->setStreet($data[24] ?? null);
            $lead->setNumber($data[25] ?? null);
            $lead->setNeighborhood($data[26] ?? null);
            $lead->setCity($data[27] ?? null);
            
            // Validação de Estado (UF)
            $lead->setState($this->validateState($data[28] ?? null));

            $lead->setNotes($data[30] ?? null); // Endereço/Complemento
            $lead->setSegment($data[31] ?? null); // Banco
            $lead->setPaymentTerm($data[32] ?? null); // Tipo conta
            
            // Tratamento de Coordenadas (Coluna 38 no seu novo exemplo)
            if (!empty($data[38]) && str_contains($data[38], ',')) {
                $coords = explode(',', $data[38]);
                $lead->setLat(trim($coords[0]));
                $lead->setLng(trim($coords[1] ?? ''));
            }

            $lead->setApiId($data[40] ?? null);
            $lead->setApiToken($data[41] ?? null);

            $this->entityManager->persist($lead);
            $count++;

            // Flush a cada 50 registros para performance
            if (($count % 50) === 0) {
                $this->entityManager->flush();
            }
        }

        $this->entityManager->flush();
        fclose($handle);

        $output->writeln("<info>Sucesso! $count leads foram importados.</info>");
        return Command::SUCCESS;
    }

    private function validateState($value)
    {
        if (!$value) return null;
        $val = trim(str_replace('"', '', $value));
        // Se o valor for maior que 2 (ex: "Santa Catarina"), pega só as 2 primeiras letras
        return (strlen($val) > 2) ? substr($val, 0, 2) : $val;
    }

    private function validateDecimal($value)
    {
        if ($value === null || $value === '' || !is_numeric($value)) {
            return null;
        }
        $floatVal = (float)$value;
        return number_format($floatVal, 2, '.', '');
    }
}