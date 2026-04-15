<?php

namespace App\EventListener;

use App\Entity\Lead;
use App\Entity\Visit;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsEntityListener;
use Doctrine\ORM\Event\PreUpdateEventArgs;
use Doctrine\ORM\Events;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;

#[AsEntityListener(event: Events::preUpdate, method: 'preUpdate', entity: Lead::class)]
class LeadChangeListener
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private LoggerInterface $logger
    ) {}

    public function preUpdate(Lead $lead, PreUpdateEventArgs $event): void
    {
        // Get the user who made the change (from lead's user or current security context)
        $user = $lead->getUser();
        
        if (!$user) {
            $this->logger->warning('Cannot create automatic visit: Lead has no associated user');
            return;
        }

        $changeSet = $event->getEntityChangeSet();
        
        // Ignore if no meaningful changes
        if (empty($changeSet)) {
            return;
        }

        // Build description of changes
        $changedFields = $this->buildChangeDescription($changeSet);

        if (empty($changedFields)) {
            return; // No relevant changes to track
        }

        // Create automatic visit
        $visit = new Visit();
        $visit->setLead($lead);
        $visit->setUser($user);
        $visit->setTipo('alteracao_sistema');
        $visit->setStatus('concluida');
        $visit->setDataVisita(new \DateTime());
        $visit->setObservacao("Alteração automática do sistema:\n" . implode("\n", $changedFields));

        $this->entityManager->persist($visit);
        
        $this->logger->info(sprintf(
            'Auto-visit created for Lead ID: %s. Changes: %s',
            $lead->getId(),
            implode(', ', array_keys($changeSet))
        ));
    }

    private function buildChangeDescription(array $changeSet): array
    {
        $descriptions = [];
        
        // Map of fields to human-readable names
        $fieldLabels = [
            'name' => 'Nome',
            'tradeName' => 'Nome Fantasia',
            'companyName' => 'Razão Social',
            'email' => 'E-mail',
            'phone' => 'Telefone',
            'document' => 'Documento',
            'funnelStage' => 'Etapa do Funil',
            'status' => 'Status',
            'observation' => 'Observação',
            'accredited' => 'Credenciado',
            'street' => 'Endereço',
            'number' => 'Número',
            'neighborhood' => 'Bairro',
            'city' => 'Cidade',
            'state' => 'Estado',
            'zipCode' => 'CEP',
            'mcc' => 'MCC',
            'segment' => 'Segmento',
            'tpv' => 'TPV',
        ];

        foreach ($changeSet as $field => $change) {
            // Skip internal/timestamp fields
            if (in_array($field, ['updatedAt', 'updated_at', 'created_at', 'createdAt'])) {
                continue;
            }

            [$oldValue, $newValue] = $change;
            $label = $fieldLabels[$field] ?? ucfirst($field);

            // Format values
            $oldFormatted = $this->formatValue($oldValue);
            $newFormatted = $this->formatValue($newValue);

            $descriptions[] = sprintf(
                "• %s: '%s' → '%s'",
                $label,
                $oldFormatted,
                $newFormatted
            );
        }

        return $descriptions;
    }

    private function formatValue($value): string
    {
        if ($value === null) {
            return '(vazio)';
        }

        if (is_bool($value)) {
            return $value ? 'Sim' : 'Não';
        }

        if ($value instanceof \DateTimeInterface) {
            return $value->format('d/m/Y H:i');
        }

        if (is_object($value)) {
            return get_class($value);
        }

        return (string) $value;
    }
}
