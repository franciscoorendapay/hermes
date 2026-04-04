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
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $email = $input->getOption('email');
        $limit = (int) $input->getOption('limit');

        $queryBuilder = $this->leadRepository->createQueryBuilder('l')
            ->where('l.email IS NOT NULL');

        if ($email) {
            $queryBuilder->andWhere('l.email = :email')
                ->setParameter('email', $email);
        }

        if ($limit > 0) {
            $queryBuilder->setMaxResults($limit);
        }

        $leads = $queryBuilder->getQuery()->getResult();
        $total = count($leads);

        $io->title(sprintf('Syncing %d leads...', $total));
        $progress = 0;
        $updated = 0;

        foreach ($leads as $lead) {
            $progress++;
            $io->text(sprintf('[%d/%d] Syncing: %s', $progress, $total, $lead->getEmail()));

            try {
                $response = $this->httpClient->request('GET', 'https://orendapay.com.br/dev04-producao/obterEmpresa.php', [
                    'query' => ['email' => $lead->getEmail()]
                ]);

                if ($response->getStatusCode() !== 200) {
                    $io->warning(sprintf('Error API status for %s: %d', $lead->getEmail(), $response->getStatusCode()));
                    continue;
                }

                $data = $response->toArray();

                if (!($data['sucesso'] ?? false)) {
                    $io->note(sprintf('Lead not found in Orenda: %s', $lead->getEmail()));
                    continue;
                }

                $empresa = $data['dados'] ?? [];
                
                // Update basic Orenda IDs
                if (isset($empresa['cod_empresa'])) {
                    $lead->setApiId($empresa['cod_empresa']);
                }
                
                if (isset($empresa['TOKEN'])) {
                    $lead->setApiToken($empresa['TOKEN']);
                }

                // Update Accreditation Date
                if (isset($empresa['data_registro'])) {
                    try {
                        $date = new \DateTimeImmutable($empresa['data_registro']);
                        $lead->setAccreditationDate($date);
                    } catch (\Exception $e) {
                        $io->error('Invalid date format: ' . $empresa['data_registro']);
                    }
                }

                // If found in Orenda, force to funnel 5 (Accredited)
                $lead->setAppFunnel(5);
                $lead->setAccreditation(1);

                // Update other info (force update for tokens and document as requested)
                if (isset($empresa['cpf_cnpj'])) {
                    $lead->setDocument($empresa['cpf_cnpj']);
                }
                
                // Update names and contact ONLY if empty (avoid overwriting custom names)
                if (!$lead->getCompanyName() && isset($empresa['nome'])) {
                    $lead->setCompanyName($empresa['nome']);
                }
                if (!$lead->getPhone() && isset($empresa['telefone'])) {
                    $lead->setPhone($empresa['telefone']);
                }
                
                // Address info (ONLY if empty)
                if (!$lead->getZipCode() && isset($empresa['cep'])) $lead->setZipCode($empresa['cep']);
                if (!$lead->getCity() && isset($empresa['cidade'])) $lead->setCity($empresa['cidade']);
                if (!$lead->getState() && isset($empresa['estado'])) $lead->setState($empresa['estado']);
                if (!$lead->getNeighborhood() && isset($empresa['bairro'])) $lead->setNeighborhood($empresa['bairro']);
                if (!$lead->getNumber() && isset($empresa['numero'])) $lead->setNumber($empresa['numero']);

                $updated++;
                
                // Periodic flush
                if ($progress % 10 === 0) {
                    $this->entityManager->flush();
                }

            } catch (\Exception $e) {
                $io->error(sprintf('Failed to sync %s: %s', $lead->getEmail(), $e->getMessage()));
            }
        }

        $this->entityManager->flush();
        $io->success(sprintf('Finished. %d leads updated.', $updated));

        return Command::SUCCESS;
    }
}
