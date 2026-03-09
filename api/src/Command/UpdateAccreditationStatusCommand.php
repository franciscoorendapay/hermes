<?php

namespace App\Command;

use App\Entity\Accreditation;
use App\Service\AccreditationService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'accreditation:update-status',
    description: 'Updates accreditation status from external API every 10 seconds',
)]
class UpdateAccreditationStatusCommand extends Command
{
    public function __construct(
        private EntityManagerInterface $em,
        private AccreditationService $accreditationService
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('time-limit', 't', \Symfony\Component\Console\Input\InputOption::VALUE_OPTIONAL, 'Time limit in seconds', 0);
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $timeLimit = (int) $input->getOption('time-limit');
        $startTime = time();

        $io->title('Starting Accreditation Status Updater');
        if ($timeLimit > 0) {
            $io->text("Running with time limit: {$timeLimit} seconds");
        }

        while (true) {
            $io->section('Checking statuses at ' . date('H:i:s'));

            // Check if time limit exceeded
            if ($timeLimit > 0 && (time() - $startTime) >= $timeLimit) {
                $io->success("Time limit of {$timeLimit}s reached. Exiting.");
                break;
            }

            // clear EM to avoid memory leaks
            $this->em->clear();

            // Find accreditations that are candidates for update
            // We check 'approved' (sent to API) and 'analysis' (just in case)
            // But mainly we need those that have API credentials in their Lead
            
            $query = $this->em->createQuery(
                'SELECT a, l 
                 FROM App\Entity\Accreditation a
                 JOIN a.lead l
                 WHERE a.status IN (:statuses)
                 AND l.apiId IS NOT NULL
                 AND l.apiToken IS NOT NULL'
            )->setParameter('statuses', ['approved', 'analysis']);

            $accreditations = $query->getResult();

            $io->text(sprintf('Found %d accreditations to check.', count($accreditations)));

            foreach ($accreditations as $accreditation) {
                // Check time limit inside loop as well to be safe
                if ($timeLimit > 0 && (time() - $startTime) >= $timeLimit) {
                    break;
                }

                $io->text("Checking Accreditation ID: " . $accreditation->getId());
                
                try {
                    $result = $this->accreditationService->checkAccreditationStatus($accreditation);
                    $io->text("Result: " . $result);
                } catch (\Exception $e) {
                    $io->error("Error checking status: " . $e->getMessage());
                }
            }

            $io->text('Sleeping for 10 seconds...');
            sleep(10);
        }

        return Command::SUCCESS;
    }
}
