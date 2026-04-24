<?php

namespace App\Command;

use App\Entity\Lead;
use App\Repository\LeadRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Contracts\HttpClient\HttpClientInterface;

#[AsCommand(
    name: 'app:sync-leads',
    description: 'Syncs lead data with Orenda API using email',
)]
class AppSyncLeadsCommand extends Command
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private LeadRepository $leadRepository,
        private HttpClientInterface $httpClient
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('email', null, InputOption::VALUE_OPTIONAL, 'Sync only a specific email')
            ->addOption('limit', null, InputOption::VALUE_OPTIONAL, 'Limit the number of leads to sync', '0')
            ->addOption('missing-token', null, InputOption::VALUE_NONE, 'Sync only leads with api_id but no api_token')
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $email = $input->getOption('email');
        $limit = (int) $input->getOption('limit');
        $missingToken = $input->getOption('missing-token');

        $queryBuilder = $this->leadRepository->createQueryBuilder('l');

        if ($missingToken) {
            $queryBuilder
                ->where('l.apiId IS NOT NULL')
                ->andWhere('l.apiToken IS NULL')
                ->andWhere('l.document IS NOT NULL');
        } else {
            $queryBuilder->where('l.email IS NOT NULL');
        }

        if ($email) {
            $queryBuilder->andWhere('l.email = :email')
                ->setParameter('email', $email);
        }

        if ($limit > 0) {
            $queryBuilder->setMaxResults($limit);
        }

        $leads = $queryBuilder->getQuery()->getResult();
        $total = count($leads);

        $io->title(\sprintf('Syncing %d leads...', $total));
        $updated = 0;

        // Modo --missing-token: busca token individualmente via obterEmpresa.php por email
        if ($missingToken) {
            foreach ($leads as $i => $lead) {
                $io->text(\sprintf('[%d/%d] %s', $i + 1, $total, $lead->getEmail()));

                try {
                    $response = $this->httpClient->request('GET', 'https://orendapay.com.br/dev04-producao/obterEmpresa.php', [
                        'query' => ['email' => $lead->getEmail()]
                    ]);

                    if ($response->getStatusCode() !== 200) {
                        $io->warning(\sprintf('HTTP %d para %s', $response->getStatusCode(), $lead->getEmail()));
                        continue;
                    }

                    $data = $response->toArray();

                    if (!($data['sucesso'] ?? false)) {
                        $io->note(\sprintf('Não encontrado na Orenda: %s', $lead->getEmail()));
                        continue;
                    }

                    $empresa = $data['dados'] ?? [];

                    if (empty($empresa['TOKEN'])) {
                        $io->note(\sprintf('Token ausente na resposta para: %s', $lead->getEmail()));
                        continue;
                    }

                    $lead->setApiToken($empresa['TOKEN']);
                    $updated++;

                    if (($i + 1) % 20 === 0) {
                        $this->entityManager->flush();
                    }
                } catch (\Exception $e) {
                    $io->error(\sprintf('Erro em %s: %s', $lead->getEmail(), $e->getMessage()));
                }
            }

            $this->entityManager->flush();
            $io->success(\sprintf('Concluído. %d leads atualizados.', $updated));
            return Command::SUCCESS;
        }

        $progress = 0;

        foreach ($leads as $lead) {
            $progress++;
            $identifier = $lead->getEmail();
            $io->text(\sprintf('[%d/%d] Syncing: %s', $progress, $total, $identifier));

            try {
                $response = $this->httpClient->request('GET', 'https://orendapay.com.br/dev04-producao/obterEmpresa.php', [
                    'query' => ['email' => $lead->getEmail()]
                ]);

                if ($response->getStatusCode() !== 200) {
                    $io->warning(\sprintf('Error API status for %s: %d', $identifier, $response->getStatusCode()));
                    continue;
                }

                $data = $response->toArray();

                if (!($data['sucesso'] ?? false)) {
                    $io->note(\sprintf('Lead not found in Orenda: %s', $identifier));
                    continue;
                }

                $empresa = $data['dados'] ?? [];

                // Sync completo
                {
                    if (isset($empresa['cod_empresa'])) {
                        $lead->setApiId($empresa['cod_empresa']);
                    }

                    if (isset($empresa['TOKEN'])) {
                        $lead->setApiToken($empresa['TOKEN']);
                    }

                    if (isset($empresa['data_registro'])) {
                        try {
                            $date = new \DateTimeImmutable($empresa['data_registro']);
                            $lead->setAccreditationDate($date);
                        } catch (\Exception $e) {
                            $io->error('Invalid date format: ' . $empresa['data_registro']);
                        }
                    }

                    $lead->setAppFunnel(5);
                    $lead->setAccreditation(1);

                    if (isset($empresa['cpf_cnpj'])) {
                        $lead->setDocument($empresa['cpf_cnpj']);
                    }

                    if (!$lead->getCompanyName() && isset($empresa['nome'])) {
                        $lead->setCompanyName($empresa['nome']);
                    }
                    if (!$lead->getPhone() && isset($empresa['telefone'])) {
                        $lead->setPhone($empresa['telefone']);
                    }

                    if (!$lead->getZipCode() && isset($empresa['cep'])) $lead->setZipCode($empresa['cep']);
                    if (!$lead->getCity() && isset($empresa['cidade'])) $lead->setCity($empresa['cidade']);
                    if (!$lead->getState() && isset($empresa['estado'])) $lead->setState($empresa['estado']);
                    if (!$lead->getNeighborhood() && isset($empresa['bairro'])) $lead->setNeighborhood($empresa['bairro']);
                    if (!$lead->getNumber() && isset($empresa['numero'])) $lead->setNumber($empresa['numero']);
                }

                $updated++;
                
                // Periodic flush
                if ($progress % 10 === 0) {
                    $this->entityManager->flush();
                }

            } catch (\Exception $e) {
                $io->error(\sprintf('Failed to sync %s: %s', $lead->getEmail(), $e->getMessage()));
            }
        }

        $this->entityManager->flush();
        $io->success(\sprintf('Finished. %d leads updated.', $updated));

        return Command::SUCCESS;
    }
}
