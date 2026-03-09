<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Gesdinet\JWTRefreshTokenBundle\Model\AbstractRefreshToken;
use Symfony\Component\Uid\Uuid;
use DateTimeInterface;

#[ORM\Entity(repositoryClass: 'Gesdinet\JWTRefreshTokenBundle\Entity\RefreshTokenRepository')]
#[ORM\Table(name: 'refresh_tokens')]
class RefreshToken extends AbstractRefreshToken
{
    #[ORM\Id]
    #[ORM\Column(type: 'guid', unique: true)]
    protected int|string|null $id = null;

    public function __construct()
    {
        $this->id = Uuid::v4()->toRfc4122();
    }

    #[ORM\Column(length: 128, unique: true)]
    protected ?string $refreshToken = null;

    #[ORM\Column(length: 255)]
    protected ?string $username = null;

    #[ORM\Column(type: 'datetime')]
    protected ?DateTimeInterface $valid = null;
}
