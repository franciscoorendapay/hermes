<?php

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Serializer\Annotation\SerializedName;

#[ORM\Entity]
#[ORM\Table(name: 'leads')]
class Lead
{
    #[ORM\Id]
    #[ORM\Column(type: 'guid', unique: true)]
    #[Groups(['lead:read', 'accreditation:read'])]
    private ?string $id = null;

    #[ORM\ManyToOne(inversedBy: 'leads')]
    #[Groups(['lead:read'])]
    private ?User $user = null;

    #[ORM\Column(length: 255, nullable: false)]
    #[Groups(['lead:read', 'lead:write', 'accreditation:read', 'visit:read'])]
    #[Assert\NotNull(message: 'Name cannot be null')]
    private ?string $name = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?int $leadCode = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['lead:read', 'lead:write', 'accreditation:read', 'visit:read'])]
    private ?string $tradeName = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['lead:read', 'lead:write', 'accreditation:read', 'visit:read'])]
    private ?string $companyName = null;

    #[ORM\Column(length: 50, nullable: true)]
    #[Groups(['lead:read', 'lead:write', 'accreditation:read'])]
    private ?string $document = null;

    #[ORM\Column(length: 180, nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?string $email = null;

    #[ORM\Column(length: 50, nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?string $phone = null;

    #[ORM\Column(length: 50, nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?string $tpv = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?int $appFunnel = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?int $accreditation = null;

    #[ORM\Column(length: 50, nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?string $mcc = null;

    #[ORM\Column(length: 20, nullable: true)]
    #[Groups(['lead:read', 'lead:write', 'accreditation:read'])]
    #[SerializedName('zip_code')]
    private ?string $zipCode = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['lead:read', 'lead:write', 'accreditation:read'])]
    private ?string $street = null;

    #[ORM\Column(length: 50, nullable: true)]
    #[Groups(['lead:read', 'lead:write', 'accreditation:read'])]
    private ?string $number = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['lead:read', 'lead:write', 'accreditation:read'])]
    private ?string $neighborhood = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['lead:read', 'lead:write', 'accreditation:read'])]
    private ?string $city = null;

    #[ORM\Column(length: 2, nullable: true)]
    #[Groups(['lead:read', 'lead:write', 'accreditation:read'])]
    private ?string $state = null;

    #[ORM\Column(length: 50, nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    #[SerializedName('lat')]
    private ?string $lat = null;

    #[ORM\Column(length: 50, nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    #[SerializedName('lng')]
    private ?string $lng = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?string $notes = null;

    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?string $segment = null;

    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?string $paymentTerm = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2, nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?string $debitShare = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2, nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?string $creditShare = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2, nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?string $installmentShare = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2, nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?string $installmentShare712 = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?int $equipmentCount = null;

    #[ORM\Column]
    #[Groups(['lead:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['lead:read'])]
    private ?\DateTimeImmutable $updatedAt = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?\DateTimeImmutable $accreditationDate = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?string $firstContactName = null;

    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?string $apiId = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?string $apiToken = null;

    #[ORM\Column(type: Types::BOOLEAN, nullable: true, options: ['default' => false])]
    #[Groups(['lead:read', 'lead:write'])]
    private ?bool $isDecisionMaker = false;

    public function __construct()
    {
        $this->id = Uuid::v4()->toRfc4122();
        $this->createdAt = new \DateTimeImmutable();
    }

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

    public function getName(): ?string { return $this->name; }
    public function setName(string $name): static { $this->name = $name; return $this; }

    public function getLeadCode(): ?int { return $this->leadCode; }
    public function setLeadCode(?int $leadCode): static { $this->leadCode = $leadCode; return $this; }

    public function getTradeName(): ?string { return $this->tradeName; }
    public function setTradeName(?string $tradeName): static { $this->tradeName = $tradeName; return $this; }

    public function getCompanyName(): ?string { return $this->companyName; }
    public function setCompanyName(?string $companyName): static { $this->companyName = $companyName; return $this; }

    public function getDocument(): ?string { return $this->document; }
    public function setDocument(?string $document): static { $this->document = $document; return $this; }

    public function getEmail(): ?string { return $this->email; }
    public function setEmail(?string $email): static { $this->email = $email; return $this; }

    public function getPhone(): ?string { return $this->phone; }
    public function setPhone(?string $phone): static { $this->phone = $phone; return $this; }

    public function getTpv(): ?string { return $this->tpv; }
    public function setTpv(?string $tpv): static { $this->tpv = $tpv; return $this; }

    public function getAppFunnel(): ?int { return $this->appFunnel; }
    public function setAppFunnel(?int $appFunnel): static { $this->appFunnel = $appFunnel; return $this; }

    public function getAccreditation(): ?int { return $this->accreditation; }
    public function setAccreditation(?int $accreditation): static { $this->accreditation = $accreditation; return $this; }

    public function getMcc(): ?string { return $this->mcc; }
    public function setMcc(?string $mcc): static { $this->mcc = $mcc; return $this; }

    public function getZipCode(): ?string { return $this->zipCode; }
    public function setZipCode(?string $zipCode): static { $this->zipCode = $zipCode; return $this; }

    public function getStreet(): ?string { return $this->street; }
    public function setStreet(?string $street): static { $this->street = $street; return $this; }

    public function getNumber(): ?string { return $this->number; }
    public function setNumber(?string $number): static { $this->number = $number; return $this; }

    public function getNeighborhood(): ?string { return $this->neighborhood; }
    public function setNeighborhood(?string $neighborhood): static { $this->neighborhood = $neighborhood; return $this; }

    public function getCity(): ?string { return $this->city; }
    public function setCity(?string $city): static { $this->city = $city; return $this; }

    public function getState(): ?string { return $this->state; }
    public function setState(?string $state): static { $this->state = $state; return $this; }

    public function getLat(): ?string { return $this->lat; }
    public function setLat(?string $lat): static { $this->lat = $lat; return $this; }

    public function getLng(): ?string { return $this->lng; }
    public function setLng(?string $lng): static { $this->lng = $lng; return $this; }

    public function getNotes(): ?string { return $this->notes; }
    public function setNotes(?string $notes): static { $this->notes = $notes; return $this; }

    public function getSegment(): ?string { return $this->segment; }
    public function setSegment(?string $segment): static { $this->segment = $segment; return $this; }

    public function getPaymentTerm(): ?string { return $this->paymentTerm; }
    public function setPaymentTerm(?string $paymentTerm): static { $this->paymentTerm = $paymentTerm; return $this; }

    public function getDebitShare() { return $this->debitShare; }
    public function setDebitShare($debitShare): static { $this->debitShare = $debitShare; return $this; }

    public function getCreditShare() { return $this->creditShare; }
    public function setCreditShare($creditShare): static { $this->creditShare = $creditShare; return $this; }

    public function getInstallmentShare() { return $this->installmentShare; }
    public function setInstallmentShare($installmentShare): static { $this->installmentShare = $installmentShare; return $this; }

    public function getInstallmentShare712() { return $this->installmentShare712; }
    public function setInstallmentShare712($installmentShare712): static { $this->installmentShare712 = $installmentShare712; return $this; }

    public function getEquipmentCount(): ?int { return $this->equipmentCount; }
    public function setEquipmentCount(?int $equipmentCount): static { $this->equipmentCount = $equipmentCount; return $this; }

    public function getCreatedAt(): ?\DateTimeImmutable { return $this->createdAt; }
    public function setCreatedAt(\DateTimeImmutable $createdAt): static { $this->createdAt = $createdAt; return $this; }
    
    public function getUpdatedAt(): ?\DateTimeImmutable { return $this->updatedAt; }
    public function setUpdatedAt(?\DateTimeImmutable $updatedAt): static { $this->updatedAt = $updatedAt; return $this; }

    public function getAccreditationDate(): ?\DateTimeImmutable { return $this->accreditationDate; }
    public function setAccreditationDate(?\DateTimeImmutable $accreditationDate): static { $this->accreditationDate = $accreditationDate; return $this; }

    public function getFirstContactName(): ?string { return $this->firstContactName; }
    public function setFirstContactName(?string $firstContactName): static { $this->firstContactName = $firstContactName; return $this; }

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2, nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?string $anticipationRate = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2, nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?string $pixRate = null;

    // Visa
    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2, nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?string $visaDebit = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2, nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?string $visaCredit = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2, nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?string $visaInstallment2to6 = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2, nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?string $visaInstallment7to12 = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2, nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?string $visaInstallment13to18 = null;

    // Mastercard
    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2, nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?string $masterDebit = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2, nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?string $masterCredit = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2, nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?string $masterInstallment2to6 = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2, nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?string $masterInstallment7to12 = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2, nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?string $masterInstallment13to18 = null;

    // Elo
    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2, nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?string $eloDebit = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2, nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?string $eloCredit = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2, nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?string $eloInstallment2to6 = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2, nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?string $eloInstallment7to12 = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2, nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?string $eloInstallment13to18 = null;

    // Others
    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2, nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?string $othersDebit = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2, nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?string $othersCredit = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2, nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?string $othersInstallment2to6 = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2, nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?string $othersInstallment7to12 = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2, nullable: true)]
    #[Groups(['lead:read', 'lead:write'])]
    private ?string $othersInstallment13to18 = null;

    public function getAnticipationRate() { return $this->anticipationRate; }
    public function setAnticipationRate($val): static { $this->anticipationRate = $val; return $this; }
    public function getPixRate() { return $this->pixRate; }
    public function setPixRate($val): static { $this->pixRate = $val; return $this; }

    // Visa Getters/Setters
    public function getVisaDebit() { return $this->visaDebit; }
    public function setVisaDebit($val): static { $this->visaDebit = $val; return $this; }
    public function getVisaCredit() { return $this->visaCredit; }
    public function setVisaCredit($val): static { $this->visaCredit = $val; return $this; }
    public function getVisaInstallment2to6() { return $this->visaInstallment2to6; }
    public function setVisaInstallment2to6($val): static { $this->visaInstallment2to6 = $val; return $this; }
    public function getVisaInstallment7to12() { return $this->visaInstallment7to12; }
    public function setVisaInstallment7to12($val): static { $this->visaInstallment7to12 = $val; return $this; }
    public function getVisaInstallment13to18() { return $this->visaInstallment13to18; }
    public function setVisaInstallment13to18($val): static { $this->visaInstallment13to18 = $val; return $this; }

    // Master Getters/Setters
    public function getMasterDebit() { return $this->masterDebit; }
    public function setMasterDebit($val): static { $this->masterDebit = $val; return $this; }
    public function getMasterCredit() { return $this->masterCredit; }
    public function setMasterCredit($val): static { $this->masterCredit = $val; return $this; }
    public function getMasterInstallment2to6() { return $this->masterInstallment2to6; }
    public function setMasterInstallment2to6($val): static { $this->masterInstallment2to6 = $val; return $this; }
    public function getMasterInstallment7to12() { return $this->masterInstallment7to12; }
    public function setMasterInstallment7to12($val): static { $this->masterInstallment7to12 = $val; return $this; }
    public function getMasterInstallment13to18() { return $this->masterInstallment13to18; }
    public function setMasterInstallment13to18($val): static { $this->masterInstallment13to18 = $val; return $this; }

    // Elo Getters/Setters
    public function getEloDebit() { return $this->eloDebit; }
    public function setEloDebit($val): static { $this->eloDebit = $val; return $this; }
    public function getEloCredit() { return $this->eloCredit; }
    public function setEloCredit($val): static { $this->eloCredit = $val; return $this; }
    public function getEloInstallment2to6() { return $this->eloInstallment2to6; }
    public function setEloInstallment2to6($val): static { $this->eloInstallment2to6 = $val; return $this; }
    public function getEloInstallment7to12() { return $this->eloInstallment7to12; }
    public function setEloInstallment7to12($val): static { $this->eloInstallment7to12 = $val; return $this; }
    public function getEloInstallment13to18() { return $this->eloInstallment13to18; }
    public function setEloInstallment13to18($val): static { $this->eloInstallment13to18 = $val; return $this; }

    // Others Getters/Setters
    public function getOthersDebit() { return $this->othersDebit; }
    public function setOthersDebit($val): static { $this->othersDebit = $val; return $this; }
    public function getOthersCredit() { return $this->othersCredit; }
    public function setOthersCredit($val): static { $this->othersCredit = $val; return $this; }
    public function getOthersInstallment2to6() { return $this->othersInstallment2to6; }
    public function setOthersInstallment2to6($val): static { $this->othersInstallment2to6 = $val; return $this; }
    public function getOthersInstallment7to12() { return $this->othersInstallment7to12; }
    public function setOthersInstallment7to12($val): static { $this->othersInstallment7to12 = $val; return $this; }
    public function getOthersInstallment13to18() { return $this->othersInstallment13to18; }
    public function setOthersInstallment13to18($val): static { $this->othersInstallment13to18 = $val; return $this; }

    public function getIsDecisionMaker(): ?bool { return $this->isDecisionMaker; }
    public function setIsDecisionMaker($isDecisionMaker): static { $this->isDecisionMaker = (bool) $isDecisionMaker; return $this; }

    public function getApiId(): ?string { return $this->apiId; }
    public function setApiId(?string $apiId): static { $this->apiId = $apiId; return $this; }

    public function getApiToken(): ?string { return $this->apiToken; }
    public function setApiToken(?string $apiToken): static { $this->apiToken = $apiToken; return $this; }
}
