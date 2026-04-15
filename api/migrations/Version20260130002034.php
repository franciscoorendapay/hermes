<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260130002034 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE visits (id INT AUTO_INCREMENT NOT NULL, tipo VARCHAR(50) NOT NULL, status VARCHAR(50) NOT NULL, observacao LONGTEXT DEFAULT NULL, lat NUMERIC(10, 8) DEFAULT NULL, lng NUMERIC(11, 8) DEFAULT NULL, data_visita DATETIME NOT NULL, updated_at DATETIME NOT NULL, lead_id CHAR(36) NOT NULL, user_id CHAR(36) NOT NULL, INDEX IDX_444839EA55458D (lead_id), INDEX IDX_444839EAA76ED395 (user_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE visits ADD CONSTRAINT FK_444839EA55458D FOREIGN KEY (lead_id) REFERENCES leads (id)');
        $this->addSql('ALTER TABLE visits ADD CONSTRAINT FK_444839EAA76ED395 FOREIGN KEY (user_id) REFERENCES users (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE visits DROP FOREIGN KEY FK_444839EA55458D');
        $this->addSql('ALTER TABLE visits DROP FOREIGN KEY FK_444839EAA76ED395');
        $this->addSql('DROP TABLE visits');
    }
}
