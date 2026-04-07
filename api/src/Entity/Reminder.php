<?php

namespace App\Entity;

use App\Repository\ReminderRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Serializer\Annotation\SerializedName;

#[ORM\Entity(repositoryClass: ReminderRepository::class)]
#[ORM\Table(name: 'lembretes')]
class Reminder
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['reminder:read', 'reminder:write'])]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['reminder:read', 'reminder:write'])]
    private ?User $user = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true)]
    #[Groups(['reminder:read', 'reminder:write'])]
    private ?Lead $lead = null;

    #[ORM\Column(type: Types::STRING, length: 255)]
    #[Groups(['reminder:read', 'reminder:write'])]
    private ?string $data_lembrete = null; // Storing as string YYYY-MM-DD to match frontend for now, or use DATE type

    #[ORM\Column(type: Types::STRING, length: 10)]
    #[Groups(['reminder:read', 'reminder:write'])]
    private ?string $hora_lembrete = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['reminder:read', 'reminder:write'])]
    private ?string $descricao = null;

    #[ORM\Column(length: 50)]
    #[Groups(['reminder:read', 'reminder:write'])]
    private ?string $status = 'pendente';

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['reminder:read'])]
    private ?\DateTimeInterface $created_at = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['reminder:read'])]
    private ?\DateTimeInterface $updated_at = null;

    #[ORM\Column(type: Types::BOOLEAN)]
    #[Groups(['reminder:read', 'reminder:write'])]
    private bool $adicionado_rota = false;

    #[ORM\Column(length: 50)]
    #[Groups(['reminder:read', 'reminder:write'])]
    private ?string $tipo = 'lembrete';

    // Estabelecimento fields
    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['reminder:read', 'reminder:write'])]
    private ?string $estabelecimento_nome = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['reminder:read', 'reminder:write'])]
    private ?string $estabelecimento_endereco = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 8, nullable: true)]
    #[Groups(['reminder:read', 'reminder:write'])]
    private ?string $estabelecimento_lat = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 11, scale: 8, nullable: true)]
    #[Groups(['reminder:read', 'reminder:write'])]
    private ?string $estabelecimento_lng = null;

    #[ORM\Column(length: 20, nullable: true)]
    #[Groups(['reminder:read', 'reminder:write'])]
    private ?string $estabelecimento_cep = null;

    #[ORM\Column(length: 20, nullable: true)]
    #[Groups(['reminder:read', 'reminder:write'])]
    private ?string $estabelecimento_numero = null;

    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['reminder:read', 'reminder:write'])]
    private ?string $estabelecimento_bairro = null;

    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['reminder:read', 'reminder:write'])]
    private ?string $estabelecimento_cidade = null;

    #[ORM\Column(length: 50, nullable: true)]
    #[Groups(['reminder:read', 'reminder:write'])]
    private ?string $estabelecimento_estado = null;


    public function __construct()
    {
        $this->created_at = new \DateTime();
        $this->updated_at = new \DateTime();
    }

    public function getId(): ?int
    {
        return $this->id;
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

    public function getLead(): ?Lead
    {
        return $this->lead;
    }

    public function setLead(?Lead $lead): static
    {
        $this->lead = $lead;
        return $this;
    }

    public function getDataLembrete(): ?string
    {
        return $this->data_lembrete;
    }

    public function setDataLembrete(string $data_lembrete): static
    {
        $this->data_lembrete = $data_lembrete;
        return $this;
    }

    public function getHoraLembrete(): ?string
    {
        return $this->hora_lembrete;
    }

    public function setHoraLembrete(string $hora_lembrete): static
    {
        $this->hora_lembrete = $hora_lembrete;
        return $this;
    }

    public function getDescricao(): ?string
    {
        return $this->descricao;
    }

    public function setDescricao(?string $descricao): static
    {
        $this->descricao = $descricao;
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

    public function getCreatedAt(): ?\DateTimeInterface
    {
        return $this->created_at;
    }

    public function setCreatedAt(\DateTimeInterface $created_at): static
    {
        $this->created_at = $created_at;
        return $this;
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

    public function isAdicionadoRota(): ?bool
    {
        return $this->adicionado_rota;
    }

    public function setAdicionadoRota(bool $adicionado_rota): static
    {
        $this->adicionado_rota = $adicionado_rota;
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

    // Getters and Setters for establishment fields
    public function getEstabelecimentoNome(): ?string { return $this->estabelecimento_nome; }
    public function setEstabelecimentoNome(?string $val): static { $this->estabelecimento_nome = $val; return $this; }

    public function getEstabelecimentoEndereco(): ?string { return $this->estabelecimento_endereco; }
    public function setEstabelecimentoEndereco(?string $val): static { $this->estabelecimento_endereco = $val; return $this; }

    public function getEstabelecimentoLat(): ?string { return $this->estabelecimento_lat; }
    public function setEstabelecimentoLat(?string $val): static { $this->estabelecimento_lat = $val; return $this; }

    public function getEstabelecimentoLng(): ?string { return $this->estabelecimento_lng; }
    public function setEstabelecimentoLng(?string $val): static { $this->estabelecimento_lng = $val; return $this; }

    public function getEstabelecimentoCep(): ?string { return $this->estabelecimento_cep; }
    public function setEstabelecimentoCep(?string $val): static { $this->estabelecimento_cep = $val; return $this; }

    public function getEstabelecimentoNumero(): ?string { return $this->estabelecimento_numero; }
    public function setEstabelecimentoNumero(?string $val): static { $this->estabelecimento_numero = $val; return $this; }

    public function getEstabelecimentoBairro(): ?string { return $this->estabelecimento_bairro; }
    public function setEstabelecimentoBairro(?string $val): static { $this->estabelecimento_bairro = $val; return $this; }

    public function getEstabelecimentoCidade(): ?string { return $this->estabelecimento_cidade; }
    public function setEstabelecimentoCidade(?string $val): static { $this->estabelecimento_cidade = $val; return $this; }

    public function getEstabelecimentoEstado(): ?string { return $this->estabelecimento_estado; }
    public function setEstabelecimentoEstado(?string $val): static { $this->estabelecimento_estado = $val; return $this; }

    #[Groups(['reminder:read'])]
    #[SerializedName('user_id')]
    public function getUserId(): ?string
    {
        return $this->user?->getId();
    }

    #[Groups(['reminder:read'])]
    #[SerializedName('lead_id')]
    public function getLeadId(): ?string
    {
        if ($this->lead) {
            return (string) $this->lead->getId();
        }
        return null;
    }
}
