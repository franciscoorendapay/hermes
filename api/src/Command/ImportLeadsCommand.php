<?php

namespace App\Command;

use App\Entity\Lead;
use App\Entity\Accreditation;
use App\Entity\User;
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
        $count = 0;
        $this->entityManager->beginTransaction();

        $output->writeln('<info>Iniciando processamento...</info>');

        try {
            while (($line = fgets($handle)) !== false) {
                // 1. LIMPEZA DE LIXO: Remove as etiquetas 
                // Usamos # como delimitador para evitar erros de escape
                // $line = preg_replace('#\#', '', $line);
                $line = trim($line);

                if (empty($line)) continue;

                // 2. PARSER: Transforma a linha em array usando o separador ";"
                $data = str_getcsv($line, ';');

                // Ignora o cabeçalho ou linhas que não começam com o ID numérico do lead
                if (!isset($data[0]) || !is_numeric($data[0]) || count($data) < 20) {
                    continue;
                }

                // 3. ENCODING: Converte para UTF-8 (corrige erros de acentuação como ó e ç)
                $data = array_map(function($value) {
                    return $value ? mb_convert_encoding($value, 'UTF-8', 'Windows-1252') : $value;
                }, $data);

                // 4. BUSCA USUÁRIO: UUID ou Email
                $userVal = trim($data[1] ?? '');
                $userRepo = $this->entityManager->getRepository(User::class);
                $user = $userRepo->find($userVal) ?? $userRepo->findOneBy(['email' => $userVal]);

                if (!$user) {
                    $output->writeln("<comment>Usuário '{$userVal}' não existe. Pulando Lead {$data[0]}.</comment>");
                    continue;
                }

                // 5. MAPEAMENTO DO LEAD
                $document = str_replace(['.', ',', 'E+', 'e+'], '', $data[6] ?? '');
                
                $lead = new Lead();
                $lead->setLeadCode(1);
                $lead->setName($data[14] ?: 'Sem nome');
                $lead->setTradeName($data[16] ?? null);
                $lead->setCompanyName($data[14] ?? null);
                $lead->setDocument($document);
                $lead->setEmail($data[21] ?? null);
                $lead->setPhone($data[19] ?? null);
                $lead->setTpv($this->validateDecimal($data[11] ?? 0));
                $lead->setAppFunnel((int)(5));
                $lead->setAccreditation((int)(1));
                $lead->setMcc($data[10] ?? null);
                $lead->setUser($user);
                $lead->setZipCode($data[23] ?? null);
                $lead->setStreet($data[24] ?? null);
                $lead->setNumber($data[25] ?? null);
                $lead->setNeighborhood($data[26] ?? null);
                $lead->setCity($data[27] ?? null);
                $lead->setState($this->validateState($data[28] ?? null));
                $lead->setApiId($data[40] ?? null);
                $lead->setApiToken($data[41] ?? null);

                // Data de registro (Coluna AN = índice 39, formato dd/mm/yyyy HH:mm:ss ou dd/mm/yyyy HH:mm)
                $dateStr = trim($data[39] ?? '');
                if (!empty($dateStr)) {
                    $date = \DateTimeImmutable::createFromFormat('d/m/Y H:i:s', $dateStr);
                    if (!$date) {
                        $date = \DateTimeImmutable::createFromFormat('d/m/Y H:i', $dateStr);
                    }
                    if (!$date) {
                        $date = \DateTimeImmutable::createFromFormat('d/m/Y', $dateStr);
                    }
                    if ($date) {
                        $lead->setCreatedAt($date);
                    }
                }

                // Coordenadas (Coluna 38)
                if (!empty($data[38]) && str_contains($data[38], ',')) {
                    $coords = explode(',', $data[38]);
                    $lead->setLat(trim($coords[0]));
                    $lead->setLng(trim($coords[1] ?? ''));
                }

                $this->entityManager->persist($lead);

                // 6. MAPEAMENTO DA ACCREDITATION
                $accreditation = new Accreditation();
                $accreditation->setLead($lead);
                $accreditation->setUser($user);
                $accreditation->setCreatedAt($lead->getCreatedAt());
                $accreditation->setResponsibleName($data[17] ?? $lead->getName());
                $accreditation->setResponsibleCpf($data[18] ?? $document);
                $accreditation->setBankName($data[31] ?? 'Banco não informado');
                $accreditation->setBankCode('000'); // Fixo para evitar erro de bank_code null
                $accreditation->setAccountType($data[32] ?? 'Conta Corrente');
                $accreditation->setBankBranch($data[34] ?: '0001');
                $accreditation->setBankBranchDigit($data[35] ?? '0');
                $accreditation->setBankAccount($data[36] ?: '00000');
                $accreditation->setBankAccountDigit($data[37] ?? '0');
                $accreditation->setStatus('active');

                $this->entityManager->persist($accreditation);

                $count++;

                // Lote de processamento para evitar gargalo de memória do Doctrine
                if (($count % 50) === 0) {
                    $this->entityManager->flush();
                    $this->entityManager->clear();
                    $output->write('.'); 
                }
            }

            $this->entityManager->flush();
            $this->entityManager->commit();
            fclose($handle);

            $output->writeln("\n<info>Sucesso! $count leads importados.</info>");
            return Command::SUCCESS;

        } catch (\Exception $e) {
            if ($this->entityManager->getConnection()->isTransactionActive()) {
                $this->entityManager->rollback();
            }
            if (isset($handle)) fclose($handle);
            $output->writeln("\n<error>Erro fatal: " . $e->getMessage() . "</error>");
            return Command::FAILURE;
        }
    }

    private function validateState($value) {
        if (!$value) return null;
        $val = trim(str_replace('"', '', $value));
        return (strlen($val) > 2) ? substr($val, 0, 2) : $val;
    }

    private function validateDecimal($value) {
        $clean = str_replace(',', '.', $value);
        return is_numeric($clean) ? (float)$clean : 0.00;
    }
}