<?php

namespace App\Command;

use App\Entity\Lead;
use App\Entity\Accreditation;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Attribute\AsCommand;

#[AsCommand(name: 'app:import-from-api', description: 'Importa empresas da API externa para leads e credenciamentos')]
class ImportFromApiCommand extends Command
{
    private const API_URL = 'https://orendapay.com.br/dev04-producao/obterTodasEmpresas.php';

    public function __construct(private EntityManagerInterface $entityManager)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('user', null, InputOption::VALUE_OPTIONAL, 'Email ou UUID do usuário admin destino');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        // 1. Buscar dados da API externa
        $output->writeln('<info>Buscando dados da API externa...</info>');
        $json = @file_get_contents(self::API_URL);
        if ($json === false) {
            $output->writeln('<error>Falha ao conectar na API: ' . self::API_URL . '</error>');
            return Command::FAILURE;
        }

        $response = json_decode($json, true);
        if (!isset($response['sucesso']) || !$response['sucesso'] || empty($response['dados'])) {
            $output->writeln('<error>Resposta inválida da API.</error>');
            return Command::FAILURE;
        }

        $empresas = $response['dados'];
        $total = count($empresas);
        $output->writeln("<info>Total de registros recebidos: {$total}</info>");

        // 2. Localizar usuário admin destino
        $userRepo = $this->entityManager->getRepository(User::class);
        $userOpt = $input->getOption('user');

        if ($userOpt) {
            $adminUser = $userRepo->find($userOpt) ?? $userRepo->findOneBy(['email' => $userOpt]);
        } else {
            $adminUser = $userRepo->findOneBy(['role' => 'admin']);
        }

        if (!$adminUser) {
            $output->writeln('<error>Usuário admin não encontrado. Use --user=email@exemplo.com para especificar.</error>');
            return Command::FAILURE;
        }

        $output->writeln("<info>Atribuindo leads ao usuário: {$adminUser->getName()} ({$adminUser->getEmail()})</info>");

        // 3. Pré-carregar documentos já existentes para checar duplicatas eficientemente
        $output->writeln('<info>Carregando documentos existentes...</info>');
        $existingDocs = [];
        $conn = $this->entityManager->getConnection();
        $rows = $conn->fetchAllAssociative('SELECT document FROM leads WHERE document IS NOT NULL AND document != \'\'');
        foreach ($rows as $row) {
            $existingDocs[$row['document']] = true;
        }
        $output->writeln('<info>Documentos já cadastrados: ' . count($existingDocs) . '</info>');

        // 4. Processar cada empresa
        $imported = 0;
        $skipped = 0;
        $errors = 0;

        $this->entityManager->beginTransaction();

        try {
            foreach ($empresas as $empresa) {
                // Limpar e normalizar o CPF/CNPJ (somente dígitos)
                $rawDoc = $empresa['cpf_cnpj'] ?? '';
                $document = preg_replace('/\D/', '', $rawDoc);

                if (empty($document)) {
                    $skipped++;
                    continue;
                }

                // Pular se já cadastrado
                if (isset($existingDocs[$document])) {
                    $skipped++;
                    continue;
                }

                // Mapear status externo para campos internos
                $extStatus = $empresa['status'] ?? 'pending';
                [$appFunnel, $accreditationFlag, $accreditationStatus] = $this->mapStatus($extStatus);

                // Montar o Lead
                $lead = new Lead();
                $lead->setUser($adminUser);
                $lead->setName($empresa['nome'] ?: 'Sem nome');
                $lead->setDocument($document);
                $lead->setEmail($empresa['email'] ?: $empresa['business_email'] ?: null);
                $lead->setPhone($this->cleanPhone($empresa['telefone'] ?? $empresa['business_phone'] ?? null));
                $lead->setMcc($empresa['mcc'] ?: null);
                $lead->setSegment($this->resolveSegment($empresa['atividade'] ?? null));
                $lead->setZipCode($this->cleanZip($empresa['cep'] ?: $empresa['postal_code'] ?? null));
                $lead->setStreet($empresa['endereco'] ?: $empresa['line1'] ?: null);
                $lead->setNumber($empresa['numero'] ?: $empresa['line3'] ?: null);
                $lead->setNeighborhood($empresa['bairro'] ?: $empresa['neighborhood'] ?: null);
                $lead->setCity($empresa['cidade'] ?: $empresa['city'] ?: null);
                $lead->setState($this->validateState($empresa['estado'] ?: $empresa['state'] ?? null));
                $lead->setLeadCode(is_numeric($empresa['cod_empresa'] ?? null) ? (int)$empresa['cod_empresa'] : null);
                $lead->setApiId($empresa['seller_id'] ?: $empresa['cod_empresa'] ?: null);
                $lead->setAppFunnel($appFunnel);
                $lead->setAccreditation($accreditationFlag);

                // Data de registro
                $createdAt = $this->parseDate($empresa['data_registro'] ?? null);
                if ($createdAt) {
                    $lead->setCreatedAt($createdAt);
                }

                // Accreditation: data de credenciamento se status = enabled
                if ($accreditationFlag === 1) {
                    $lead->setAccreditationDate($createdAt ?? new \DateTimeImmutable());
                }

                $this->entityManager->persist($lead);

                // Montar a Accreditation
                $accreditation = new Accreditation();
                $accreditation->setLead($lead);
                $accreditation->setUser($adminUser);
                $accreditation->setStatus($accreditationStatus);
                $accreditation->setCreatedAt($lead->getCreatedAt());

                // CPF do responsável: taxpayer_id (CPF puro) ou extrair do documento se pessoa física
                $responsibleCpf = preg_replace('/\D/', '', $empresa['taxpayer_id'] ?? '');
                if (empty($responsibleCpf) && strlen($document) === 11) {
                    $responsibleCpf = $document;
                }
                if (empty($responsibleCpf)) {
                    $responsibleCpf = '00000000000';
                }

                $accreditation->setResponsibleName($empresa['responsavel'] ?: $empresa['nome'] ?: 'Responsável');
                $accreditation->setResponsibleCpf($responsibleCpf);

                // Datas do responsável / empresa
                $accreditation->setResponsibleBirthDate($this->parseBirthDate($empresa['birthdate'] ?? null));
                if (!empty($empresa['business_opening_date'])) {
                    $oDate = \DateTimeImmutable::createFromFormat('d/m/Y', $empresa['business_opening_date']);
                    if ($oDate) $accreditation->setCompanyOpeningDate($oDate);
                }

                $accreditation->setBankName('Banco não informado');
                $accreditation->setBankCode('000');
                $accreditation->setAccountType('Conta Corrente');
                $accreditation->setBankBranch('0001');
                $accreditation->setBankAccount('00000');

                $this->entityManager->persist($accreditation);

                // Marcar como já importado para evitar duplicatas dentro do mesmo lote
                $existingDocs[$document] = true;
                $imported++;

                if (($imported % 50) === 0) {
                    $this->entityManager->flush();
                    $this->entityManager->clear();
                    // Após clear, precisamos re-buscar o adminUser
                    $adminUser = $userRepo->find($adminUser->getId());
                    $output->write('.');
                }
            }

            $this->entityManager->flush();
            $this->entityManager->commit();

            $output->writeln("\n<info>Concluído! Importados: {$imported} | Ignorados (duplicata/sem doc): {$skipped} | Erros: {$errors}</info>");
            return Command::SUCCESS;

        } catch (\Exception $e) {
            if ($this->entityManager->getConnection()->isTransactionActive()) {
                $this->entityManager->rollback();
            }
            $output->writeln("\n<error>Erro fatal: " . $e->getMessage() . '</error>');
            $output->writeln('<error>' . $e->getTraceAsString() . '</error>');
            return Command::FAILURE;
        }
    }

    /**
     * Mapeia o status externo para [appFunnel, accreditationFlag, accreditationStatus].
     */
    private function mapStatus(string $status): array
    {
        return match ($status) {
            'enabled'  => [5, 1, 'active'],
            'denied'   => [5, 1, 'rejected'],
            'pending'  => [3, 0, 'pending'],
            default    => [1, 0, 'pending'],
        };
    }

    private function cleanPhone(?string $phone): ?string
    {
        if (!$phone) return null;
        return preg_replace('/\D/', '', $phone) ?: null;
    }

    private function cleanZip(?string $zip): ?string
    {
        if (!$zip) return null;
        return preg_replace('/\D/', '', $zip) ?: null;
    }

    private function validateState(?string $value): ?string
    {
        if (!$value) return null;
        $val = strtoupper(trim(preg_replace('/[^a-zA-Z]/', '', $value)));
        return (strlen($val) >= 2) ? substr($val, 0, 2) : null;
    }

    private function resolveSegment(?string $atividade): ?string
    {
        if (!$atividade) return null;
        // Se for código numérico puro, retorna null (não é label legível)
        if (is_numeric(trim($atividade))) return null;
        return trim($atividade);
    }

    private function parseBirthDate(?string $dateStr): \DateTimeImmutable
    {
        $today = new \DateTimeImmutable('today');
        if (empty($dateStr)) return $today;

        foreach (['Y-m-d', 'd/m/Y', 'Y-m-d H:i:s', 'd/m/Y H:i:s'] as $format) {
            $d = \DateTimeImmutable::createFromFormat($format, $dateStr);
            if ($d !== false && (int)$d->format('Y') >= 1900) {
                return $d;
            }
        }

        return $today;
    }

    private function parseDate(?string $dateStr): ?\DateTimeImmutable
    {
        if (!$dateStr) return null;
        $date = \DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $dateStr);
        if (!$date) $date = \DateTimeImmutable::createFromFormat('Y-m-d', $dateStr);
        if (!$date) $date = \DateTimeImmutable::createFromFormat('d/m/Y H:i:s', $dateStr);
        if (!$date) $date = \DateTimeImmutable::createFromFormat('d/m/Y', $dateStr);
        return $date ?: null;
    }
}
