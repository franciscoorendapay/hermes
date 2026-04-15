<?php

namespace App\Entity;

use App\Repository\VisitRouteItemRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: VisitRouteItemRepository::class)]
#[ORM\Table(name: 'visit_route_items')]
class VisitRouteItem
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['route:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'items')]
    #[ORM\JoinColumn(nullable: false)]
    private ?VisitRoute $visitRoute = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['route:read'])]
    private ?Reminder $reminder = null;

    #[ORM\Column]
    #[Groups(['route:read'])]
    private ?int $sequence = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getVisitRoute(): ?VisitRoute
    {
        return $this->visitRoute;
    }

    public function setVisitRoute(?VisitRoute $visitRoute): static
    {
        $this->visitRoute = $visitRoute;

        return $this;
    }

    public function getReminder(): ?Reminder
    {
        return $this->reminder;
    }

    public function setReminder(?Reminder $reminder): static
    {
        $this->reminder = $reminder;

        return $this;
    }

    public function getSequence(): ?int
    {
        return $this->sequence;
    }

    public function setSequence(int $sequence): static
    {
        $this->sequence = $sequence;

        return $this;
    }
}
