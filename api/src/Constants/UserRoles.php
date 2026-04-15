<?php

namespace App\Constants;

class UserRoles
{
    public const ADMIN = 'admin';
    public const DIRETOR = 'diretor';
    public const NACIONAL = 'nacional';
    public const REGIONAL = 'regional';
    public const COMERCIAL = 'comercial';
    public const LOGISTICA = 'logistica';

    public static function getAll(): array
    {
        return [
            self::ADMIN,
            self::DIRETOR,
            self::NACIONAL,
            self::REGIONAL,
            self::COMERCIAL,
            self::LOGISTICA,
        ];
    }
}
