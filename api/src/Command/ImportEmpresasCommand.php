<?php

namespace App\Command;

use App\Entity\Accreditation;
use App\Entity\Lead;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Contracts\HttpClient\HttpClientInterface;

#[AsCommand(
    name: 'app:import-empresas',
    description: 'Importa empresas de um CSV exportado do sistema Orenda como leads',
)]
class ImportEmpresasCommand extends Command
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private HttpClientInterface $httpClient
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('user', null, InputOption::VALUE_REQUIRED, 'Email ou UUID do usuário que receberá os leads')
            ->addOption('file', null, InputOption::VALUE_OPTIONAL, 'Caminho do arquivo CSV', null)
            ->addOption('dry-run', null, InputOption::VALUE_NONE, 'Simula a importação sem salvar no banco')
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $userVal = $input->getOption('user');
        $filePath = $input->getOption('file');
        $dryRun = $input->getOption('dry-run');

        if (!$userVal) {
            $io->error('Informe o usuário com --user=<email ou uuid>');
            return Command::FAILURE;
        }

        $userRepo = $this->entityManager->getRepository(User::class);
        $user = $userRepo->find($userVal) ?? $userRepo->findOneBy(['email' => $userVal]);

        if (!$user) {
            $io->error("Usuário '{$userVal}' não encontrado.");
            return Command::FAILURE;
        }

        if (!$filePath) {
            $io->error('Informe o caminho do arquivo com --file=<caminho>');
            return Command::FAILURE;
        }

        if (!file_exists($filePath)) {
            $io->error("Arquivo não encontrado: {$filePath}");
            return Command::FAILURE;
        }

        $handle = fopen($filePath, 'r');
        if (!$handle) {
            $io->error("Não foi possível abrir o arquivo: {$filePath}");
            return Command::FAILURE;
        }

        $io->title(sprintf('Importando empresas para o usuário: %s', $user->getEmail() ?? $user->getId()));
        if ($dryRun) {
            $io->note('Modo DRY-RUN ativo. Nenhum dado será salvo.');
        }

        $leadRepo = $this->entityManager->getRepository(Lead::class);

        $count = 0;
        $skipped = 0;
        $errors = 0;
        $tokensFetched = 0;
        $lineNumber = 0;

        // Lê cabeçalho
        $header = fgetcsv($handle, 0, ';');
        $lineNumber++;

        try {
            while (($data = fgetcsv($handle, 0, ';')) !== false) {
                $lineNumber++;

                if (count($data) < 9) {
                    $io->warning("Linha {$lineNumber}: colunas insuficientes, pulando.");
                    $errors++;
                    continue;
                }

                // Colunas: cod_empresa;nome;cpf_cnpj;cpf_cnpj_somente_numeros;email;telefone;responsavel;cidade;estado;status;data_registro;ultimo_acesso
                $codEmpresa  = trim($data[0] ?? '');
                $nome        = trim($data[1] ?? '');
                $document    = trim($data[3] ?? ''); // cpf_cnpj_somente_numeros
                $email       = trim($data[4] ?? '');
                $telefone    = trim($data[5] ?? '');
                $responsavel = trim($data[6] ?? '');
                $cidade      = trim($data[7] ?? '');
                $estado      = trim($data[8] ?? '');
                $dataRegistro = trim($data[10] ?? '');

                // Remove prefixo "_" gerado por exports do sistema
                $document = ltrim($document, '_');
                $email    = ltrim($email, '_');

                // Valida documento mínimo
                $document = preg_replace('/\D/', '', $document);

                // Verifica duplicata por cod_empresa (apiId)
                if ($codEmpresa) {
                    $existing = $leadRepo->findOneBy(['apiId' => $codEmpresa]);
                    if ($existing) {
                        $io->text("  [SKIP] cod_empresa={$codEmpresa} já existe (lead {$existing->getId()})");
                        $skipped++;
                        continue;
                    }
                }

                // Verifica duplicata por documento
                if ($document) {
                    $existing = $leadRepo->findOneBy(['document' => $document, 'user' => $user]);
                    if ($existing) {
                        $io->text("  [SKIP] documento={$document} já existe para esse usuário");
                        $skipped++;
                        continue;
                    }
                }

                $io->text(sprintf('  [%d] %s (%s)', $count + 1, $nome, $document));

                if ($dryRun) {
                    $count++;
                    continue;
                }

                $lead = new Lead();
                $lead->setUser($user);
                $lead->setName($nome ?: 'Sem nome');
                $lead->setCompanyName($nome ?: null);
                $lead->setDocument($document ?: null);
                $lead->setEmail($email ?: null);
                $lead->setPhone($telefone ?: null);
                $lead->setFirstContactName($responsavel ?: $nome ?: null);
                $lead->setCity($cidade ?: null);
                $lead->setState($this->normalizeState($estado));
                $lead->setApiId($codEmpresa ?: null);
                $lead->setAppFunnel(5);
                $lead->setAccreditation(1);

                // Busca token na API Orenda pelo CPF/CNPJ
                if ($document && !$dryRun) {
                    $apiToken = $this->fetchOrendaToken($document, $io);
                    if ($apiToken) {
                        $lead->setApiToken($apiToken);
                        $tokensFetched++;
                        $io->text("    → token obtido");
                    }
                }

                $createdAt = $this->parseDate($dataRegistro);
                if ($createdAt) {
                    $lead->setCreatedAt($createdAt);
                    $lead->setAccreditationDate($createdAt);
                }

                $this->entityManager->persist($lead);

                // Cria credenciamento básico vinculado ao lead
                $accreditation = new Accreditation();
                $accreditation->setLead($lead);
                $accreditation->setUser($user);
                $accreditation->setCreatedAt($lead->getCreatedAt());
                $accreditation->setResponsibleName($responsavel ?: $nome ?: 'Não informado');
                $accreditation->setResponsibleCpf($document ?: '00000000000');
                $accreditation->setBankName('Banco não informado');
                $accreditation->setBankCode('000');
                $accreditation->setAccountType('Conta Corrente');
                $accreditation->setBankBranch('0001');
                $accreditation->setBankBranchDigit('0');
                $accreditation->setBankAccount('00000');
                $accreditation->setBankAccountDigit('0');
                $accreditation->setStatus('active');

                $this->entityManager->persist($accreditation);

                $count++;

                if ($count % 50 === 0) {
                    $this->entityManager->flush();
                    $this->entityManager->clear();
                    // Re-fetch user após clear
                    $user = $userRepo->find($user->getId());
                    $io->write('.');
                }
            }

            if (!$dryRun) {
                $this->entityManager->flush();
            }

            fclose($handle);

            $io->newLine();
            $io->success(sprintf(
                'Concluído! %d leads importados (%d com token), %d ignorados (duplicados), %d erros.',
                $count,
                $tokensFetched,
                $skipped,
                $errors
            ));

            return Command::SUCCESS;

        } catch (\Exception $e) {
            if (!$dryRun && $this->entityManager->getConnection()->isTransactionActive()) {
                $this->entityManager->rollback();
            }
            if (isset($handle) && is_resource($handle)) {
                fclose($handle);
            }
            $io->error('Erro fatal na linha ' . $lineNumber . ': ' . $e->getMessage());
            return Command::FAILURE;
        }
    }

    private function fetchOrendaToken(string $document, SymfonyStyle $io): ?string
    {
        try {
            $response = $this->httpClient->request('GET', 'https://orendapay.com.br/dev04-producao/obterEmpresa.php', [
                'query' => ['cpf_cnpj' => $document],
                'timeout' => 10,
            ]);

            if ($response->getStatusCode() !== 200) {
                return null;
            }

            $data = $response->toArray();

            if (!($data['sucesso'] ?? false)) {
                return null;
            }

            $token = $data['dados']['TOKEN'] ?? null;

            return $token ?: null;

        } catch (\Exception $e) {
            $io->text("    → erro ao buscar token: " . $e->getMessage());
            return null;
        }
    }

    private function normalizeState(?string $value): ?string
    {
        if (!$value) return null;
        $val = strtoupper(trim($value));
        return strlen($val) > 2 ? substr($val, 0, 2) : $val;
    }

    private function parseDate(string $value): ?\DateTimeImmutable
    {
        if (empty($value) || $value === '0000-00-00 00:00:00') {
            return null;
        }

        foreach (['Y-m-d H:i:s', 'Y-m-d H:i', 'Y-m-d', 'd/m/Y H:i:s', 'd/m/Y'] as $format) {
            $date = \DateTimeImmutable::createFromFormat($format, $value);
            if ($date !== false) {
                return $date;
            }
        }

        return null;
    }
}
