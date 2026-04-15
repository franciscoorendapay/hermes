<?php

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity]
#[ORM\Table(name: 'system_settings')]
class SystemSetting
{
    #[ORM\Id]
    #[ORM\Column(type: 'guid', unique: true)]
    #[Groups(['setting:read'])]
    private ?string $id = null;

    #[ORM\Column(length: 100, unique: true)]
    #[Groups(['setting:read'])]
    private string $settingKey;

    #[ORM\Column(type: Types::JSON)]
    #[Groups(['setting:read'])]
    private array $settingValue = [];

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'updated_by', referencedColumnName: 'id', nullable: true)]
    #[Groups(['setting:read'])]
    private ?User $updatedBy = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['setting:read'])]
    private ?\DateTimeInterface $updatedAt = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['setting:read'])]
    private ?\DateTimeInterface $createdAt = null;

    public function __construct()
    {
        $this->id = Uuid::v4()->toRfc4122();
        $this->createdAt = new \DateTime();
        $this->updatedAt = new \DateTime();
    }

    public function getId(): ?string { return $this->id; }

    public function getSettingKey(): string { return $this->settingKey; }
    public function setSettingKey(string $key): static { $this->settingKey = $key; return $this; }

    public function getSettingValue(): array { return $this->settingValue; }
    public function setSettingValue(array $value): static { $this->settingValue = $value; return $this; }

    public function getUpdatedBy(): ?User { return $this->updatedBy; }
    public function setUpdatedBy(?User $user): static { $this->updatedBy = $user; return $this; }

    public function getUpdatedAt(): ?\DateTimeInterface { return $this->updatedAt; }
    public function setUpdatedAt(\DateTimeInterface $dt): static { $this->updatedAt = $dt; return $this; }

    public function getCreatedAt(): ?\DateTimeInterface { return $this->createdAt; }
}
