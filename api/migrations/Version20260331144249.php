<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260331144249 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            CREATE TABLE system_settings (
              id CHAR(36) NOT NULL,
              setting_key VARCHAR(100) NOT NULL,
              setting_value JSON NOT NULL,
              updated_at DATETIME NOT NULL,
              created_at DATETIME NOT NULL,
              updated_by CHAR(36) DEFAULT NULL,
              UNIQUE INDEX UNIQ_8CAF11475FA1E697 (setting_key),
              INDEX IDX_8CAF114716FE72E1 (updated_by),
              PRIMARY KEY (id)
            ) DEFAULT CHARACTER SET utf8mb4
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE
              system_settings
            ADD
              CONSTRAINT FK_8CAF114716FE72E1 FOREIGN KEY (updated_by) REFERENCES users (id)
        SQL);
        $this->addSql('CREATE UNIQUE INDEX UNIQ_IDENTIFIER_PHONE ON users (phone)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE system_settings DROP FOREIGN KEY FK_8CAF114716FE72E1');
        $this->addSql('DROP TABLE system_settings');
        $this->addSql('DROP INDEX UNIQ_IDENTIFIER_PHONE ON users');
    }
}
