<?php

namespace App\Entity;

use App\Repository\UserRepository;
use BcMath\Number;
use Doctrine\DBAL\Schema\UniqueConstraint;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Uid\Uuid;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\UniqueConstraint(name: 'UNIQ_IDENTIFIER_EMAIL', fields: ['email'])]
#[ORM\UniqueConstraint(name: 'UNIQ_IDENTIFIER_PHONE', fields: ['phone'])]
#[ORM\Table(name: 'users')]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\Column(type: 'guid', unique: true)]
    #[Groups(['user:read', 'goal:read', 'accreditation:read', 'lead:read', 'visit:read'])]
    private ?string $id = null;

    #[ORM\Column(length: 180)]
    #[Assert\NotBlank]
    #[Assert\Email]
    #[Groups(['user:read', 'user:write'])]
    private ?string $email = null;

    #[ORM\Column(length: 50, nullable: true)]
    #[Groups(['user:read', 'user:write'])]
    private ?string $role = 'comercial'; // Default role

    /**
     * @var Collection<int, Lead>
     */
    #[ORM\OneToMany(targetEntity: Lead::class, mappedBy: 'user')]
    private Collection $leads;

    #[ORM\Column(nullable: true)]
    #[Groups(['user:write'])]
    private ?string $password = null;

    #[ORM\Column(length: 180)]
    #[Assert\NotBlank]
    #[Groups(['user:read', 'user:write', 'lead:read', 'visit:read', 'accreditation:read'])]
    private ?string $name = null;

    #[ORM\Column(length: 180)]
    #[Groups(['user:read', 'user:write'])]
    private ?string $phone = null;

    #[ORM\Column(length: 2, nullable: true)]
    #[Groups(['user:read', 'user:write'])]
    #[Assert\Choice(choices: ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'], message: 'Estado inválido.')]
    private ?string $region = null;

    #[ORM\Column]
    #[Groups(['user:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(type: Types::SMALLINT, options:['default' => 1])]
    #[Groups(['user:read', 'user:write'])]
    private int $status = 1;

    #[ORM\Column(type: 'boolean', options: ['default' => true])]
    #[Groups(['user:read', 'user:write'])]
    private bool $includeInStats = true;

    public function __construct()
    {
        $this->id = Uuid::v4()->toRfc4122();
        $this->leads = new ArrayCollection();
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?string
    {
        return $this->id;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(string $email): static
    {
        $this->email = $email;

        return $this;
    }

    /**
     * A visual identifier that represents this user.
     *
     * @see UserInterface
     */
    public function getUserIdentifier(): string
    {
        return (string) $this->email;
    }

    /**
     * @see UserInterface
     */
    public function getRoles(): array
    {
        // Guaranteed to have at least one role if we default to 'comercial' or similar.
        // But let's be safe.
        return $this->role ? [$this->role] : [];
    }
    
    public function getRole(): ?string
    {
        return $this->role;
    }
    
    public function setRole(?string $role): static
    {
        $this->role = $role;
        return $this;
    }

    public function setRoles(array $roles): static
    {
        // Compatibility with some Symfony logic if it tries to set roles as array
        if (count($roles) > 0) {
            $this->role = $roles[0];
        }
        return $this;
    }

    /**
     * @see PasswordAuthenticatedUserInterface
     */
    public function getPassword(): ?string
    {
        return $this->password;
    }

    public function setPassword(?string $password): static
    {
        $this->password = $password;

        return $this;
    }

    /**
     * Ensure the session doesn't contain actual password hashes by CRC32C-hashing them, as supported since Symfony 7.3.
     */
    public function __serialize(): array
    {
        $data = (array) $this;
        $data["\0".self::class."\0password"] = hash('crc32c', (string) $this->password);

        return $data;
    }

    #[\Deprecated]
    public function eraseCredentials(): void
    {
        // @deprecated, to be removed when upgrading to Symfony 8
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;

        return $this;
    }

    public function getPhone(): ?string
    {
        return $this->phone;
    }

    public function setPhone(?string $phone): static
    {
        $this->phone = $phone;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;

        return $this;
    }

    public function getStatus(): int
    {
        return $this->status;
    }

    public function setStatus(int $status): static
    {
        $this->status = $status;
        return $this;
    }

    public function isIncludeInStats(): bool
    {
        return $this->includeInStats;
    }

    public function setIncludeInStats(bool $includeInStats): static
    {
        $this->includeInStats = $includeInStats;
        return $this;
    }

    public function getRegion(): ?string
    {
        return $this->region;
    }

    public function setRegion(?string $region): static
    {
        $this->region = $region;

        return $this;
    }

    /**
     * @return Collection<int, Lead>
     */
    public function getLeads(): Collection
    {
        return $this->leads;
    }

    public function addLead(Lead $lead): static
    {
        if (!$this->leads->contains($lead)) {
            $this->leads->add($lead);
            $lead->setUser($this);
        }

        return $this;
    }

    public function removeLead(Lead $lead): static
    {
        if ($this->leads->removeElement($lead)) {
            // set the owning side to null (unless already changed)
            if ($lead->getUser() === $this) {
                $lead->setUser(null);
            }
        }

        return $this;
    }
}
