<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260123175632 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE accreditations (id CHAR(36) NOT NULL, responsible_name VARCHAR(255) NOT NULL, responsible_cpf VARCHAR(20) NOT NULL, responsible_birth_date DATE DEFAULT NULL, company_opening_date DATE DEFAULT NULL, bank_name VARCHAR(255) NOT NULL, bank_code VARCHAR(50) NOT NULL, account_type VARCHAR(50) NOT NULL, account_operation VARCHAR(50) DEFAULT NULL, bank_branch VARCHAR(20) NOT NULL, bank_branch_digit VARCHAR(5) DEFAULT NULL, bank_account VARCHAR(30) NOT NULL, bank_account_digit VARCHAR(5) DEFAULT NULL, doc_cnpj_url VARCHAR(255) DEFAULT NULL, doc_photo_url VARCHAR(255) DEFAULT NULL, doc_residence_url VARCHAR(255) DEFAULT NULL, doc_activity_url VARCHAR(255) DEFAULT NULL, pending_documents LONGTEXT DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, lead_id CHAR(36) NOT NULL, user_id CHAR(36) NOT NULL, INDEX IDX_933D6C3D55458D (lead_id), INDEX IDX_933D6C3DA76ED395 (user_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE leads (id CHAR(36) NOT NULL, name VARCHAR(255) NOT NULL, lead_code INT DEFAULT NULL, trade_name VARCHAR(255) DEFAULT NULL, company_name VARCHAR(255) DEFAULT NULL, document VARCHAR(50) DEFAULT NULL, email VARCHAR(180) DEFAULT NULL, phone VARCHAR(50) DEFAULT NULL, tpv VARCHAR(50) DEFAULT NULL, app_funnel INT DEFAULT NULL, accreditation INT DEFAULT NULL, mcc VARCHAR(50) DEFAULT NULL, zip_code VARCHAR(20) DEFAULT NULL, street VARCHAR(255) DEFAULT NULL, number VARCHAR(50) DEFAULT NULL, neighborhood VARCHAR(255) DEFAULT NULL, city VARCHAR(255) DEFAULT NULL, state VARCHAR(2) DEFAULT NULL, lat VARCHAR(50) DEFAULT NULL, lng VARCHAR(50) DEFAULT NULL, notes LONGTEXT DEFAULT NULL, segment VARCHAR(100) DEFAULT NULL, payment_term VARCHAR(100) DEFAULT NULL, debit_share VARCHAR(50) DEFAULT NULL, credit_share VARCHAR(50) DEFAULT NULL, installment_share VARCHAR(50) DEFAULT NULL, equipment_count INT DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, user_id CHAR(36) DEFAULT NULL, INDEX IDX_17904552A76ED395 (user_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE refresh_tokens (id CHAR(36) NOT NULL, refresh_token VARCHAR(128) NOT NULL, username VARCHAR(255) NOT NULL, valid DATETIME NOT NULL, UNIQUE INDEX UNIQ_9BACE7E1C74F2195 (refresh_token), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE user_hierarchy (id CHAR(36) NOT NULL, created_at DATETIME NOT NULL, manager_id CHAR(36) NOT NULL, subordinate_id CHAR(36) NOT NULL, INDEX IDX_FA9AA54A783E3463 (manager_id), INDEX IDX_FA9AA54A5A373861 (subordinate_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE user_roles (id CHAR(36) NOT NULL, role VARCHAR(255) NOT NULL, created_at DATETIME NOT NULL, user_id CHAR(36) NOT NULL, INDEX IDX_54FCD59FA76ED395 (user_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE users (id CHAR(36) NOT NULL, email VARCHAR(180) NOT NULL, password VARCHAR(255) NOT NULL, name VARCHAR(180) NOT NULL, phone VARCHAR(180) NOT NULL, region VARCHAR(2) DEFAULT NULL, created_at DATETIME NOT NULL, status SMALLINT DEFAULT 1 NOT NULL, UNIQUE INDEX UNIQ_IDENTIFIER_EMAIL (email), UNIQUE INDEX UNIQ_IDENTIFIER_PHONE (phone), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE accreditations ADD CONSTRAINT FK_933D6C3D55458D FOREIGN KEY (lead_id) REFERENCES leads (id)');
        $this->addSql('ALTER TABLE accreditations ADD CONSTRAINT FK_933D6C3DA76ED395 FOREIGN KEY (user_id) REFERENCES users (id)');
        $this->addSql('ALTER TABLE leads ADD CONSTRAINT FK_17904552A76ED395 FOREIGN KEY (user_id) REFERENCES users (id)');
        $this->addSql('ALTER TABLE user_hierarchy ADD CONSTRAINT FK_FA9AA54A783E3463 FOREIGN KEY (manager_id) REFERENCES users (id)');
        $this->addSql('ALTER TABLE user_hierarchy ADD CONSTRAINT FK_FA9AA54A5A373861 FOREIGN KEY (subordinate_id) REFERENCES users (id)');
        $this->addSql('ALTER TABLE user_roles ADD CONSTRAINT FK_54FCD59FA76ED395 FOREIGN KEY (user_id) REFERENCES users (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE accreditations DROP FOREIGN KEY FK_933D6C3D55458D');
        $this->addSql('ALTER TABLE accreditations DROP FOREIGN KEY FK_933D6C3DA76ED395');
        $this->addSql('ALTER TABLE leads DROP FOREIGN KEY FK_17904552A76ED395');
        $this->addSql('ALTER TABLE user_hierarchy DROP FOREIGN KEY FK_FA9AA54A783E3463');
        $this->addSql('ALTER TABLE user_hierarchy DROP FOREIGN KEY FK_FA9AA54A5A373861');
        $this->addSql('ALTER TABLE user_roles DROP FOREIGN KEY FK_54FCD59FA76ED395');
        $this->addSql('DROP TABLE accreditations');
        $this->addSql('DROP TABLE leads');
        $this->addSql('DROP TABLE refresh_tokens');
        $this->addSql('DROP TABLE user_hierarchy');
        $this->addSql('DROP TABLE user_roles');
        $this->addSql('DROP TABLE users');
    }
}
