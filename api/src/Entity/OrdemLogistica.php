<?php

namespace App\Entity;

use App\Repository\OrdemLogisticaRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: OrdemLogisticaRepository::class)]
#[ORM\Table(name: 'ordens_logistica')]
#[ORM\HasLifecycleCallbacks]
class OrdemLogistica
{
    #[ORM\Id]
    #[ORM\Column(type: 'guid', unique: true)]
    private ?string $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?Lead $lead = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $createdBy = null;

    #[ORM\Column(length: 50)]
    private ?string $tipo = null;

    #[ORM\Column]
    private int $quantidade = 1;

    #[ORM\Column(length: 50)]
    private string $status = 'pendente';

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $observacao = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $updatedAt = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $dataAtendimento = null;

    #[ORM\Column(nullable: true)]
    private ?bool $entregueNoPrazo = null;

    public function __construct()
    {
        $this->id = Uuid::v4()->toRfc4122();
        $this->createdAt = new \DateTimeImmutable();
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): ?string { return $this->id; }

    public function getLead(): ?Lead { return $this->lead; }
    public function setLead(?Lead $lead): static { $this->lead = $lead; return $this; }

    public function getCreatedBy(): ?User { return $this->createdBy; }
    public function setCreatedBy(?User $createdBy): static { $this->createdBy = $createdBy; return $this; }

    public function getTipo(): ?string { return $this->tipo; }
    public function setTipo(string $tipo): static { $this->tipo = $tipo; return $this; }

    public function getQuantidade(): int { return $this->quantidade; }
    public function setQuantidade(int $quantidade): static { $this->quantidade = $quantidade; return $this; }

    public function getStatus(): string { return $this->status; }
    public function setStatus(string $status): static { $this->status = $status; return $this; }

    public function getObservacao(): ?string { return $this->observacao; }
    public function setObservacao(?string $observacao): static { $this->observacao = $observacao; return $this; }

    public function getCreatedAt(): ?\DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): ?\DateTimeImmutable { return $this->updatedAt; }

    public function getDataAtendimento(): ?\DateTimeImmutable { return $this->dataAtendimento; }
    public function setDataAtendimento(?\DateTimeImmutable $dataAtendimento): static { $this->dataAtendimento = $dataAtendimento; return $this; }

    public function isEntregueNoPrazo(): ?bool { return $this->entregueNoPrazo; }
    public function setEntregueNoPrazo(?bool $entregueNoPrazo): static { $this->entregueNoPrazo = $entregueNoPrazo; return $this; }
}
