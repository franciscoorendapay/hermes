<?php

namespace App\Command;

use App\Entity\Lead;
use App\Entity\Accreditation;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:fix-lead-erisson',
    description: 'Fix Erisson lead status',
)]
class FixLeadStatusCommand extends Command
{
    private EntityManagerInterface $entityManager;

    public function __construct(EntityManagerInterface $entityManager)
    {
        $this->entityManager = $entityManager;
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $leadRepo = $this->entityManager->getRepository(Lead::class);
        $leads = $leadRepo->createQueryBuilder('l')
            ->where('l.name LIKE :name OR l.tradeName LIKE :name OR l.companyName LIKE :name')
            ->setParameter('name', '%Pastelanche%')
            ->getQuery()
            ->getResult();

        if (count($leads) === 0) {
            $io->error("Nenhum lead encontrado com 'Pastelanche'.");
            return Command::FAILURE;
        }

        foreach ($leads as $lead) {
            $io->section("Atualizando Lead: " . $lead->getName());
            
            $lead->setAppFunnel(5);
            $lead->setAccreditation(0);
            $this->entityManager->persist($lead);

            // Find or creat Accreditation
            $accreditationRepo = $this->entityManager->getRepository(Accreditation::class);
            $accreditation = $accreditationRepo->findOneBy(['lead' => $lead]);

            if (!$accreditation) {
                $io->text("Criando nova Accreditação...");
                $accreditation = new Accreditation();
                $accreditation->setLead($lead);
                $accreditation->setUser($lead->getUser());
            } else {
                $io->text("Atualizando Accreditação existente...");
            }

            $accreditation->setStatus('pending');
            $this->entityManager->persist($accreditation);
        }

        $this->entityManager->flush();
        $io->success('Leads atualizados com sucesso.');

        return Command::SUCCESS;
    }
}
