<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260130010428 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE visit_route_items (id INT AUTO_INCREMENT NOT NULL, sequence INT NOT NULL, visit_route_id INT NOT NULL, reminder_id INT NOT NULL, INDEX IDX_F8BB724331BA6AF1 (visit_route_id), INDEX IDX_F8BB7243D987BE75 (reminder_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE visit_routes (id INT AUTO_INCREMENT NOT NULL, date DATE NOT NULL, name VARCHAR(255) DEFAULT NULL, status VARCHAR(50) NOT NULL, created_at DATETIME NOT NULL, user_id CHAR(36) NOT NULL, INDEX IDX_8152686A76ED395 (user_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE visit_route_items ADD CONSTRAINT FK_F8BB724331BA6AF1 FOREIGN KEY (visit_route_id) REFERENCES visit_routes (id)');
        $this->addSql('ALTER TABLE visit_route_items ADD CONSTRAINT FK_F8BB7243D987BE75 FOREIGN KEY (reminder_id) REFERENCES lembretes (id)');
        $this->addSql('ALTER TABLE visit_routes ADD CONSTRAINT FK_8152686A76ED395 FOREIGN KEY (user_id) REFERENCES users (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE visit_route_items DROP FOREIGN KEY FK_F8BB724331BA6AF1');
        $this->addSql('ALTER TABLE visit_route_items DROP FOREIGN KEY FK_F8BB7243D987BE75');
        $this->addSql('ALTER TABLE visit_routes DROP FOREIGN KEY FK_8152686A76ED395');
        $this->addSql('DROP TABLE visit_route_items');
        $this->addSql('DROP TABLE visit_routes');
    }
}
