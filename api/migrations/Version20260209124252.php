<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260209124252 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE accreditations ADD status VARCHAR(20) DEFAULT \'pending\' NOT NULL, ADD rejection_reason LONGTEXT DEFAULT NULL');
        $this->addSql('ALTER TABLE leads ADD api_id VARCHAR(100) DEFAULT NULL, ADD api_token VARCHAR(255) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE accreditations DROP status, DROP rejection_reason');
        $this->addSql('ALTER TABLE leads DROP api_id, DROP api_token');
    }
}
