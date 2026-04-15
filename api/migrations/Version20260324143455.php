<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260324143455 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE accreditations ADD selfie_url VARCHAR(255) DEFAULT NULL, ADD cnh_full_url VARCHAR(255) DEFAULT NULL, ADD cnh_front_url VARCHAR(255) DEFAULT NULL, ADD cnh_back_url VARCHAR(255) DEFAULT NULL, ADD rg_front_url VARCHAR(255) DEFAULT NULL, ADD rg_back_url VARCHAR(255) DEFAULT NULL');

    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE accreditations DROP selfie_url, DROP cnh_full_url, DROP cnh_front_url, DROP cnh_back_url, DROP rg_front_url, DROP rg_back_url');

    }
}
