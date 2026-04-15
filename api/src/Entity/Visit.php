<?php

namespace App\Entity;

use App\Repository\VisitRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: VisitRepository::class)]
#[ORM\Table(name: 'visits')]
#[ORM\HasLifecycleCallbacks]
class Visit
{
    #[ORM\Id]
    #[ORM\Column(type: 'guid', unique: true)]
    #[Groups(['visit:read'])]
    private ?string $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['visit:read', 'visit:write'])]
    private ?Lead $lead = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['visit:read', 'visit:write'])]
    private ?User $user = null;

    #[ORM\Column(length: 50)]
    #[Assert\NotBlank]
    #[Groups(['visit:read', 'visit:write'])]
    private ?string $tipo = null;

    #[ORM\Column(length: 50)]
    #[Assert\NotBlank]
    #[Groups(['visit:read', 'visit:write'])]
    private ?string $status = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['visit:read', 'visit:write'])]
    private ?string $observacao = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 8, nullable: true)]
    #[Groups(['visit:read', 'visit:write'])]
    private ?string $lat = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 11, scale: 8, nullable: true)]
    #[Groups(['visit:read', 'visit:write'])]
    private ?string $lng = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['visit:read', 'visit:write'])]
    private ?\DateTimeInterface $data_visita = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['visit:read'])]
    private ?\DateTimeInterface $created_at = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['visit:read'])]
    private ?\DateTimeInterface $updated_at = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['visit:read', 'visit:write'])]
    private ?string $endereco_visita = null;

    public function __construct()
    {
        $this->id = Uuid::v4()->toRfc4122();
        $this->created_at = new \DateTime();
        $this->updated_at = new \DateTime();
    }

    #[ORM\PreUpdate]
    public function setUpdatedAtValue(): void
    {
        $this->updated_at = new \DateTime();
    }

    public function getId(): ?string
    {
        return $this->id;
    }

    public function getLead(): ?Lead
    {
        return $this->lead;
    }

    public function setLead(?Lead $lead): static
    {
        $this->lead = $lead;

        return $this;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;

        return $this;
    }

    public function getTipo(): ?string
    {
        return $this->tipo;
    }

    public function setTipo(string $tipo): static
    {
        $this->tipo = $tipo;

        return $this;
    }

    public function getStatus(): ?string
    {
        return $this->status;
    }

    public function setStatus(string $status): static
    {
        $this->status = $status;

        return $this;
    }

    public function getObservacao(): ?string
    {
        return $this->observacao;
    }

    public function setObservacao(?string $observacao): static
    {
        $this->observacao = $observacao;

        return $this;
    }

    public function getLat(): ?string
    {
        return $this->lat;
    }

    public function setLat(?string $lat): static
    {
        $this->lat = $lat;

        return $this;
    }

    public function getLng(): ?string
    {
        return $this->lng;
    }

    public function setLng(?string $lng): static
    {
        $this->lng = $lng;

        return $this;
    }

    public function getDataVisita(): ?\DateTimeInterface
    {
        return $this->data_visita;
    }

    public function setDataVisita(\DateTimeInterface $data_visita): static
    {
        $this->data_visita = $data_visita;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeInterface
    {
        return $this->created_at;
    }

    public function getUpdatedAt(): ?\DateTimeInterface
    {
        return $this->updated_at;
    }

    public function setUpdatedAt(\DateTimeInterface $updated_at): static
    {
        $this->updated_at = $updated_at;

        return $this;
    }

    public function getEnderecoVisita(): ?string
    {
        return $this->endereco_visita;
    }

    public function setEnderecoVisita(?string $endereco_visita): static
    {
        $this->endereco_visita = $endereco_visita;

        return $this;
    }
}
