<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260331131759 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // Add the accreditation date column
        $this->addSql('ALTER TABLE leads ADD accreditation_date DATETIME DEFAULT NULL');
        
        // Populate the accreditation date for leads that are already accredited (funil 5). Use the updated_at or created_at (if updated_at is null)
        $this->addSql('UPDATE leads SET accreditation_date = COALESCE(updated_at, created_at) WHERE app_funnel = 5 AND accreditation = 1');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE leads DROP accreditation_date');
    }
}
