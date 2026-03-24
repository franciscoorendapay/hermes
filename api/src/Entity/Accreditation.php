<?php

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;
use ApiPlatform\Metadata\ApiResource;

#[ORM\Entity]
#[ORM\Table(name: 'accreditations')]
#[ApiResource]
class Accreditation
{
    #[ORM\Id]
    #[ORM\Column(type: 'guid', unique: true)]
    #[Groups(['accreditation:read'])]
    private ?string $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['accreditation:read', 'accreditation:write'])]
    private ?Lead $lead = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['accreditation:read', 'accreditation:write'])]
    private ?User $user = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    #[Groups(['accreditation:read', 'accreditation:write'])]
    private ?string $responsibleName = null;

    #[ORM\Column(length: 20)]
    #[Assert\NotBlank]
    #[Groups(['accreditation:read', 'accreditation:write'])]
    private ?string $responsibleCpf = null;

    #[ORM\Column(type: Types::DATE_IMMUTABLE, nullable: true)]
    #[Groups(['accreditation:read', 'accreditation:write'])]
    private ?\DateTimeImmutable $responsibleBirthDate = null;

    #[ORM\Column(type: Types::DATE_IMMUTABLE, nullable: true)]
    #[Groups(['accreditation:read', 'accreditation:write'])]
    private ?\DateTimeImmutable $companyOpeningDate = null;

    #[ORM\Column(length: 255)]
    #[Groups(['accreditation:read', 'accreditation:write'])]
    private ?string $bankName = null;

    #[ORM\Column(length: 50)]
    #[Groups(['accreditation:read', 'accreditation:write'])]
    private ?string $bankCode = null;

    #[ORM\Column(length: 50)]
    #[Groups(['accreditation:read', 'accreditation:write'])]
    private ?string $accountType = null;

    #[ORM\Column(length: 50, nullable: true)]
    #[Groups(['accreditation:read', 'accreditation:write'])]
    private ?string $accountOperation = null;

    #[ORM\Column(length: 20)]
    #[Groups(['accreditation:read', 'accreditation:write'])]
    private ?string $bankBranch = null;

    #[ORM\Column(length: 5, nullable: true)]
    #[Groups(['accreditation:read', 'accreditation:write'])]
    private ?string $bankBranchDigit = null;

    #[ORM\Column(length: 30)]
    #[Groups(['accreditation:read', 'accreditation:write'])]
    private ?string $bankAccount = null;

    #[ORM\Column(length: 5, nullable: true)]
    #[Groups(['accreditation:read', 'accreditation:write'])]
    private ?string $bankAccountDigit = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['accreditation:read', 'accreditation:write'])]
    private ?string $docCnpjUrl = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['accreditation:read', 'accreditation:write'])]
    private ?string $docPhotoUrl = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['accreditation:read', 'accreditation:write'])]
    private ?string $docResidenceUrl = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['accreditation:read', 'accreditation:write'])]
    private ?string $docActivityUrl = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['accreditation:read', 'accreditation:write'])]
    private ?string $selfieUrl = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['accreditation:read', 'accreditation:write'])]
    private ?string $cnhFullUrl = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['accreditation:read', 'accreditation:write'])]
    private ?string $cnhFrontUrl = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['accreditation:read', 'accreditation:write'])]
    private ?string $cnhBackUrl = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['accreditation:read', 'accreditation:write'])]
    private ?string $rgFrontUrl = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['accreditation:read', 'accreditation:write'])]
    private ?string $rgBackUrl = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['accreditation:read', 'accreditation:write'])]
    private ?string $pendingDocuments = null;

    #[ORM\Column(length: 20, options: ['default' => 'pending'])]
    #[Groups(['accreditation:read', 'accreditation:write'])]
    private ?string $status = 'pending';

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['accreditation:read', 'accreditation:write'])]
    private ?string $rejectionReason = null;

    #[ORM\Column]
    #[Groups(['accreditation:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['accreditation:read'])]
    private ?\DateTimeImmutable $updatedAt = null;

    public function __construct()
    {
        $this->id = Uuid::v4()->toRfc4122();
        $this->createdAt = new \DateTimeImmutable();
        $this->status = 'pending';
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

    // Getters and Setters

    public function getResponsibleName(): ?string { return $this->responsibleName; }
    public function setResponsibleName(string $responsibleName): static { $this->responsibleName = $responsibleName; return $this; }

    public function getResponsibleCpf(): ?string { return $this->responsibleCpf; }
    public function setResponsibleCpf(string $responsibleCpf): static { $this->responsibleCpf = $responsibleCpf; return $this; }

    public function getResponsibleBirthDate(): ?\DateTimeImmutable { return $this->responsibleBirthDate; }
    public function setResponsibleBirthDate(?\DateTimeImmutable $responsibleBirthDate): static { $this->responsibleBirthDate = $responsibleBirthDate; return $this; }

    public function getCompanyOpeningDate(): ?\DateTimeImmutable { return $this->companyOpeningDate; }
    public function setCompanyOpeningDate(?\DateTimeImmutable $companyOpeningDate): static { $this->companyOpeningDate = $companyOpeningDate; return $this; }

    public function getBankName(): ?string { return $this->bankName; }
    public function setBankName(string $bankName): static { $this->bankName = $bankName; return $this; }

    public function getBankCode(): ?string { return $this->bankCode; }
    public function setBankCode(string $bankCode): static { $this->bankCode = $bankCode; return $this; }

    public function getAccountType(): ?string { return $this->accountType; }
    public function setAccountType(string $accountType): static { $this->accountType = $accountType; return $this; }

    public function getAccountOperation(): ?string { return $this->accountOperation; }
    public function setAccountOperation(?string $accountOperation): static { $this->accountOperation = $accountOperation; return $this; }

    public function getBankBranch(): ?string { return $this->bankBranch; }
    public function setBankBranch(string $bankBranch): static { $this->bankBranch = $bankBranch; return $this; }

    public function getBankBranchDigit(): ?string { return $this->bankBranchDigit; }
    public function setBankBranchDigit(?string $bankBranchDigit): static { $this->bankBranchDigit = $bankBranchDigit; return $this; }

    public function getBankAccount(): ?string { return $this->bankAccount; }
    public function setBankAccount(string $bankAccount): static { $this->bankAccount = $bankAccount; return $this; }

    public function getBankAccountDigit(): ?string { return $this->bankAccountDigit; }
    public function setBankAccountDigit(?string $bankAccountDigit): static { $this->bankAccountDigit = $bankAccountDigit; return $this; }

    public function getDocCnpjUrl(): ?string { return $this->docCnpjUrl; }
    public function setDocCnpjUrl(?string $docCnpjUrl): static { $this->docCnpjUrl = $docCnpjUrl; return $this; }

    public function getDocPhotoUrl(): ?string { return $this->docPhotoUrl; }
    public function setDocPhotoUrl(?string $docPhotoUrl): static { $this->docPhotoUrl = $docPhotoUrl; return $this; }

    public function getDocResidenceUrl(): ?string { return $this->docResidenceUrl; }
    public function setDocResidenceUrl(?string $docResidenceUrl): static { $this->docResidenceUrl = $docResidenceUrl; return $this; }

    public function getDocActivityUrl(): ?string { return $this->docActivityUrl; }
    public function setDocActivityUrl(?string $docActivityUrl): static { $this->docActivityUrl = $docActivityUrl; return $this; }

    public function getSelfieUrl(): ?string { return $this->selfieUrl; }
    public function setSelfieUrl(?string $selfieUrl): static { $this->selfieUrl = $selfieUrl; return $this; }

    public function getCnhFullUrl(): ?string { return $this->cnhFullUrl; }
    public function setCnhFullUrl(?string $cnhFullUrl): static { $this->cnhFullUrl = $cnhFullUrl; return $this; }

    public function getCnhFrontUrl(): ?string { return $this->cnhFrontUrl; }
    public function setCnhFrontUrl(?string $cnhFrontUrl): static { $this->cnhFrontUrl = $cnhFrontUrl; return $this; }

    public function getCnhBackUrl(): ?string { return $this->cnhBackUrl; }
    public function setCnhBackUrl(?string $cnhBackUrl): static { $this->cnhBackUrl = $cnhBackUrl; return $this; }

    public function getRgFrontUrl(): ?string { return $this->rgFrontUrl; }
    public function setRgFrontUrl(?string $rgFrontUrl): static { $this->rgFrontUrl = $rgFrontUrl; return $this; }

    public function getRgBackUrl(): ?string { return $this->rgBackUrl; }
    public function setRgBackUrl(?string $rgBackUrl): static { $this->rgBackUrl = $rgBackUrl; return $this; }

    public function getPendingDocuments(): ?string { return $this->pendingDocuments; }
    public function setPendingDocuments(?string $pendingDocuments): static { $this->pendingDocuments = $pendingDocuments; return $this; }

    public function getStatus(): ?string { return $this->status; }
    public function setStatus(string $status): static { $this->status = $status; return $this; }

    public function getRejectionReason(): ?string { return $this->rejectionReason; }
    public function setRejectionReason(?string $rejectionReason): static { $this->rejectionReason = $rejectionReason; return $this; }

    public function getCreatedAt(): ?\DateTimeImmutable { return $this->createdAt; }
    public function setCreatedAt(\DateTimeImmutable $createdAt): static { $this->createdAt = $createdAt; return $this; }
    
    public function getUpdatedAt(): ?\DateTimeImmutable { return $this->updatedAt; }
    public function setUpdatedAt(?\DateTimeImmutable $updatedAt): static { $this->updatedAt = $updatedAt; return $this; }
}
