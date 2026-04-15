<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260205040209 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE goals (id CHAR(36) NOT NULL, mes INT NOT NULL, ano INT NOT NULL, meta_clientes INT DEFAULT NULL, meta_valor NUMERIC(15, 2) DEFAULT NULL, meta_visitas INT DEFAULT NULL, created_by VARCHAR(255) DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, user_id CHAR(36) NOT NULL, INDEX IDX_C7241E2FA76ED395 (user_id), UNIQUE INDEX unique_user_month_goal (user_id, mes, ano), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE goals ADD CONSTRAINT FK_C7241E2FA76ED395 FOREIGN KEY (user_id) REFERENCES users (id)');
        // $this->addSql('ALTER TABLE user_roles DROP FOREIGN KEY `FK_54FCD59FA76ED395`');
        $this->addSql('DROP TABLE user_roles');
        $this->addSql('ALTER TABLE leads ADD name VARCHAR(255) NOT NULL');
        $this->addSql('ALTER TABLE users ADD role VARCHAR(50) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE user_roles (id CHAR(36) CHARACTER SET utf8mb4 NOT NULL COLLATE `utf8mb4_0900_ai_ci`, role VARCHAR(255) CHARACTER SET utf8mb4 NOT NULL COLLATE `utf8mb4_0900_ai_ci`, created_at DATETIME NOT NULL, user_id CHAR(36) CHARACTER SET utf8mb4 NOT NULL COLLATE `utf8mb4_0900_ai_ci`, INDEX IDX_54FCD59FA76ED395 (user_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_0900_ai_ci` ENGINE = InnoDB COMMENT = \'\' ');
        $this->addSql('ALTER TABLE user_roles ADD CONSTRAINT `FK_54FCD59FA76ED395` FOREIGN KEY (user_id) REFERENCES users (id) ON UPDATE NO ACTION ON DELETE NO ACTION');
        $this->addSql('ALTER TABLE goals DROP FOREIGN KEY FK_C7241E2FA76ED395');
        $this->addSql('DROP TABLE goals');
        $this->addSql('ALTER TABLE leads DROP name');
        $this->addSql('ALTER TABLE users DROP role');
    }
}
