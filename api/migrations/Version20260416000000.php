<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260416000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create ordens_logistica table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE ordens_logistica (id CHAR(36) NOT NULL, lead_id CHAR(36) DEFAULT NULL, created_by_id CHAR(36) NOT NULL, tipo VARCHAR(50) NOT NULL, quantidade INT NOT NULL DEFAULT 1, status VARCHAR(50) NOT NULL DEFAULT \'pendente\', observacao LONGTEXT DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, INDEX IDX_OL_LEAD (lead_id), INDEX IDX_OL_CREATED_BY (created_by_id), INDEX IDX_OL_STATUS (status), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE ordens_logistica ADD CONSTRAINT FK_OL_LEAD FOREIGN KEY (lead_id) REFERENCES leads (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE ordens_logistica ADD CONSTRAINT FK_OL_CREATED_BY FOREIGN KEY (created_by_id) REFERENCES users (id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE ordens_logistica DROP FOREIGN KEY FK_OL_LEAD');
        $this->addSql('ALTER TABLE ordens_logistica DROP FOREIGN KEY FK_OL_CREATED_BY');
        $this->addSql('DROP TABLE ordens_logistica');
    }
}
