<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity]
#[ORM\Table(name: 'goals')]
#[ORM\UniqueConstraint(name: 'unique_user_month_goal', fields: ['user', 'mes', 'ano'])]
class Goal
{
    #[ORM\Id]
    #[ORM\Column(type: 'guid', unique: true)]
    #[Groups(['goal:read', 'goal:write'])]
    private ?string $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['goal:read', 'goal:write'])]
    private ?User $user = null;

    #[ORM\Column(type: 'integer')]
    #[Assert\Range(min: 1, max: 12)]
    #[Groups(['goal:read', 'goal:write'])]
    private int $mes;

    #[ORM\Column(type: 'integer')]
    #[Groups(['goal:read', 'goal:write'])]
    private int $ano;

    #[ORM\Column(type: 'integer', nullable: true)]
    #[Groups(['goal:read', 'goal:write'])]
    private ?int $meta_clientes = null;

    #[ORM\Column(type: 'decimal', precision: 15, scale: 2, nullable: true)]
    #[Groups(['goal:read', 'goal:write'])]
    private ?string $meta_valor = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    #[Groups(['goal:read', 'goal:write'])]
    private ?int $meta_visitas = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $created_by = null;

    #[ORM\Column]
    #[Groups(['goal:read'])]
    private ?\DateTimeImmutable $created_at = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $updated_at = null;

    public function __construct()
    {
        $this->id = Uuid::v4()->toRfc4122();
        $this->created_at = new \DateTimeImmutable();
    }

    public function getId(): ?string
    {
        return $this->id;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): self
    {
        $this->user = $user;
        return $this;
    }

    public function getMes(): int
    {
        return $this->mes;
    }

    public function setMes(int $mes): self
    {
        $this->mes = $mes;
        return $this;
    }

    public function getAno(): int
    {
        return $this->ano;
    }

    public function setAno(int $ano): self
    {
        $this->ano = $ano;
        return $this;
    }

    public function getMetaClientes(): ?int
    {
        return $this->meta_clientes;
    }

    public function setMetaClientes(?int $meta_clientes): self
    {
        $this->meta_clientes = $meta_clientes;
        return $this;
    }

    public function getMetaValor(): ?string
    {
        return $this->meta_valor;
    }

    public function setMetaValor(?string $meta_valor): self
    {
        $this->meta_valor = $meta_valor;
        return $this;
    }

    public function getMetaVisitas(): ?int
    {
        return $this->meta_visitas;
    }

    public function setMetaVisitas(?int $meta_visitas): self
    {
        $this->meta_visitas = $meta_visitas;
        return $this;
    }

    public function getCreatedBy(): ?string
    {
        return $this->created_by;
    }

    public function setCreatedBy(?string $created_by): self
    {
        $this->created_by = $created_by;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->created_at;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updated_at;
    }

    public function setUpdatedAt(?\DateTimeImmutable $updated_at): self
    {
        $this->updated_at = $updated_at;
        return $this;
    }
}
