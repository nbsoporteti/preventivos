<?php

namespace App\Services;

class IdService
{
    private const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
    private const LENGTH = 15;

    public static function newId(): string
    {
        $s = '';
        $max = strlen(self::ALPHABET) - 1;
        for ($i = 0; $i < self::LENGTH; $i++) {
            $s .= self::ALPHABET[random_int(0, $max)];
        }
        return $s;
    }
}
