<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260127121742 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE leads CHANGE debit_share debit_share NUMERIC(10, 2) DEFAULT NULL, CHANGE credit_share credit_share NUMERIC(10, 2) DEFAULT NULL, CHANGE installment_share installment_share NUMERIC(10, 2) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE leads CHANGE debit_share debit_share VARCHAR(50) DEFAULT NULL, CHANGE credit_share credit_share VARCHAR(50) DEFAULT NULL, CHANGE installment_share installment_share VARCHAR(50) DEFAULT NULL');
    }
}
