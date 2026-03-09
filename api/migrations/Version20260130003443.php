<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260130003443 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE lembretes (id INT AUTO_INCREMENT NOT NULL, data_lembrete VARCHAR(255) NOT NULL, hora_lembrete VARCHAR(10) NOT NULL, descricao LONGTEXT DEFAULT NULL, status VARCHAR(50) NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, adicionado_rota TINYINT NOT NULL, tipo VARCHAR(50) NOT NULL, estabelecimento_nome VARCHAR(255) DEFAULT NULL, estabelecimento_endereco VARCHAR(255) DEFAULT NULL, estabelecimento_lat NUMERIC(10, 8) DEFAULT NULL, estabelecimento_lng NUMERIC(11, 8) DEFAULT NULL, estabelecimento_cep VARCHAR(20) DEFAULT NULL, estabelecimento_numero VARCHAR(20) DEFAULT NULL, estabelecimento_bairro VARCHAR(100) DEFAULT NULL, estabelecimento_cidade VARCHAR(100) DEFAULT NULL, estabelecimento_estado VARCHAR(50) DEFAULT NULL, user_id CHAR(36) NOT NULL, lead_id CHAR(36) DEFAULT NULL, INDEX IDX_669C80C3A76ED395 (user_id), INDEX IDX_669C80C355458D (lead_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE lembretes ADD CONSTRAINT FK_669C80C3A76ED395 FOREIGN KEY (user_id) REFERENCES users (id)');
        $this->addSql('ALTER TABLE lembretes ADD CONSTRAINT FK_669C80C355458D FOREIGN KEY (lead_id) REFERENCES leads (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE lembretes DROP FOREIGN KEY FK_669C80C3A76ED395');
        $this->addSql('ALTER TABLE lembretes DROP FOREIGN KEY FK_669C80C355458D');
        $this->addSql('DROP TABLE lembretes');
    }
}
