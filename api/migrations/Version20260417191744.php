<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260417191744 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add data_atendimento and entregue_no_prazo to ordens_logistica';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE ordens_logistica ADD data_atendimento DATETIME DEFAULT NULL, ADD entregue_no_prazo TINYINT DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE ordens_logistica DROP data_atendimento, DROP entregue_no_prazo');
    }
}
