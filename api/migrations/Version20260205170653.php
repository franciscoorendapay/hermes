<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260205170653 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE leads ADD anticipation_rate NUMERIC(10, 2) DEFAULT NULL, ADD pix_rate NUMERIC(10, 2) DEFAULT NULL, ADD visa_debit NUMERIC(10, 2) DEFAULT NULL, ADD visa_credit NUMERIC(10, 2) DEFAULT NULL, ADD visa_installment2to6 NUMERIC(10, 2) DEFAULT NULL, ADD visa_installment7to12 NUMERIC(10, 2) DEFAULT NULL, ADD visa_installment13to18 NUMERIC(10, 2) DEFAULT NULL, ADD master_debit NUMERIC(10, 2) DEFAULT NULL, ADD master_credit NUMERIC(10, 2) DEFAULT NULL, ADD master_installment2to6 NUMERIC(10, 2) DEFAULT NULL, ADD master_installment7to12 NUMERIC(10, 2) DEFAULT NULL, ADD master_installment13to18 NUMERIC(10, 2) DEFAULT NULL, ADD elo_debit NUMERIC(10, 2) DEFAULT NULL, ADD elo_credit NUMERIC(10, 2) DEFAULT NULL, ADD elo_installment2to6 NUMERIC(10, 2) DEFAULT NULL, ADD elo_installment7to12 NUMERIC(10, 2) DEFAULT NULL, ADD elo_installment13to18 NUMERIC(10, 2) DEFAULT NULL, ADD others_debit NUMERIC(10, 2) DEFAULT NULL, ADD others_credit NUMERIC(10, 2) DEFAULT NULL, ADD others_installment2to6 NUMERIC(10, 2) DEFAULT NULL, ADD others_installment7to12 NUMERIC(10, 2) DEFAULT NULL, ADD others_installment13to18 NUMERIC(10, 2) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE leads DROP anticipation_rate, DROP pix_rate, DROP visa_debit, DROP visa_credit, DROP visa_installment2to6, DROP visa_installment7to12, DROP visa_installment13to18, DROP master_debit, DROP master_credit, DROP master_installment2to6, DROP master_installment7to12, DROP master_installment13to18, DROP elo_debit, DROP elo_credit, DROP elo_installment2to6, DROP elo_installment7to12, DROP elo_installment13to18, DROP others_debit, DROP others_credit, DROP others_installment2to6, DROP others_installment7to12, DROP others_installment13to18');
    }
}
