<?php

namespace App\Entity;

use App\Repository\VisitRouteRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: VisitRouteRepository::class)]
#[ORM\Table(name: 'visit_routes')]
class VisitRoute
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['route:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    #[ORM\Column(type: Types::DATE_MUTABLE)]
    #[Groups(['route:read', 'route:write'])]
    private ?\DateTimeInterface $date = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['route:read', 'route:write'])]
    private ?string $name = null;

    #[ORM\Column(length: 50)]
    #[Groups(['route:read', 'route:write'])]
    private ?string $status = 'planned';

    #[ORM\Column]
    #[Groups(['route:read'])]
    private ?\DateTimeImmutable $created_at = null;

    #[ORM\OneToMany(mappedBy: 'visitRoute', targetEntity: VisitRouteItem::class, orphanRemoval: true, cascade: ['persist', 'remove'])]
    #[ORM\OrderBy(['sequence' => 'ASC'])]
    #[Groups(['route:read'])]
    private Collection $items;

    public function __construct()
    {
        $this->created_at = new \DateTimeImmutable();
        $this->items = new ArrayCollection();
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

    public function getDate(): ?\DateTimeInterface
    {
        return $this->date;
    }

    public function setDate(\DateTimeInterface $date): static
    {
        $this->date = $date;

        return $this;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(?string $name): static
    {
        $this->name = $name;

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

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->created_at;
    }

    public function setCreatedAt(\DateTimeImmutable $created_at): static
    {
        $this->created_at = $created_at;

        return $this;
    }

    /**
     * @return Collection<int, VisitRouteItem>
     */
    public function getItems(): Collection
    {
        return $this->items;
    }

    public function addItem(VisitRouteItem $item): static
    {
        if (!$this->items->contains($item)) {
            $this->items->add($item);
            $item->setVisitRoute($this);
        }

        return $this;
    }

    public function removeItem(VisitRouteItem $item): static
    {
        if ($this->items->removeElement($item)) {
            // set the owning side to null (unless already changed)
            if ($item->getVisitRoute() === $this) {
                $item->setVisitRoute(null);
            }
        }

        return $this;
    }
}
