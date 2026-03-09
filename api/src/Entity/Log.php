<?php

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Serializer\Annotation\Groups;
use App\Repository\LogRepository;

#[ORM\Entity(repositoryClass: LogRepository::class)]
#[ORM\Table(name: 'log')]
#[ORM\Index(name: 'idx_log_category', columns: ['category'])]
#[ORM\Index(name: 'idx_log_level', columns: ['level'])]
#[ORM\Index(name: 'idx_log_created_at', columns: ['created_at'])]
#[ORM\Index(name: 'idx_log_entity', columns: ['entity_type', 'entity_id'])]
class Log
{
    #[ORM\Id]
    #[ORM\Column(type: 'guid', unique: true)]
    #[Groups(['log:read'])]
    private ?string $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: true)]
    #[Groups(['log:read'])]
    private ?User $user = null;

    #[ORM\Column(length: 20)]
    #[Groups(['log:read'])]
    private string $level = 'INFO';

    #[ORM\Column(length: 50)]
    #[Groups(['log:read'])]
    private ?string $category = null;

    #[ORM\Column(length: 50)]
    #[Groups(['log:read'])]
    private ?string $action = null;

    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['log:read'])]
    private ?string $entityType = null;

    #[ORM\Column(type: 'guid', nullable: true)]
    #[Groups(['log:read'])]
    private ?string $entityId = null;

    #[ORM\Column(type: Types::TEXT)]
    #[Groups(['log:read'])]
    private ?string $message = null;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    #[Groups(['log:read'])]
    private ?array $context = null;

    #[ORM\Column(length: 45, nullable: true)]
    #[Groups(['log:read'])]
    private ?string $ipAddress = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['log:read'])]
    private ?string $userAgent = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['log:read'])]
    private ?\DateTimeInterface $createdAt = null;

    public function __construct()
    {
        $this->id = Uuid::v4()->toRfc4122();
        $this->createdAt = new \DateTime();
        $this->context = [];
    }

    // Getters and Setters

    public function getId(): ?string
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

    public function getLevel(): string
    {
        return $this->level;
    }

    public function setLevel(string $level): static
    {
        $this->level = $level;
        return $this;
    }

    public function getCategory(): ?string
    {
        return $this->category;
    }

    public function setCategory(string $category): static
    {
        $this->category = $category;
        return $this;
    }

    public function getAction(): ?string
    {
        return $this->action;
    }

    public function setAction(string $action): static
    {
        $this->action = $action;
        return $this;
    }

    public function getEntityType(): ?string
    {
        return $this->entityType;
    }

    public function setEntityType(?string $entityType): static
    {
        $this->entityType = $entityType;
        return $this;
    }

    public function getEntityId(): ?string
    {
        return $this->entityId;
    }

    public function setEntityId(?string $entityId): static
    {
        $this->entityId = $entityId;
        return $this;
    }

    public function getMessage(): ?string
    {
        return $this->message;
    }

    public function setMessage(string $message): static
    {
        $this->message = $message;
        return $this;
    }

    public function getContext(): ?array
    {
        return $this->context;
    }

    public function setContext(?array $context): static
    {
        $this->context = $context;
        return $this;
    }

    public function addContext(string $key, $value): static
    {
        if ($this->context === null) {
            $this->context = [];
        }
        $this->context[$key] = $value;
        return $this;
    }

    public function getIpAddress(): ?string
    {
        return $this->ipAddress;
    }

    public function setIpAddress(?string $ipAddress): static
    {
        $this->ipAddress = $ipAddress;
        return $this;
    }

    public function getUserAgent(): ?string
    {
        return $this->userAgent;
    }

    public function setUserAgent(?string $userAgent): static
    {
        $this->userAgent = $userAgent;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeInterface
    {
        return $this->createdAt;
    }
}
