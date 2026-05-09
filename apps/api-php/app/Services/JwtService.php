<?php

namespace App\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class JwtService
{
    public static function sign(array $user): string
    {
        $days = (int) env('JWT_EXPIRY_DAYS', 7);
        $payload = [
            'sub' => $user['id'],
            'email' => $user['email'],
            'rol' => $user['rol'],
            'iat' => time(),
            'exp' => time() + ($days * 86400),
        ];
        return JWT::encode($payload, self::secret(), 'HS256');
    }

    public static function verify(string $token): object
    {
        return JWT::decode($token, new Key(self::secret(), 'HS256'));
    }

    private static function secret(): string
    {
        $s = env('JWT_SECRET', '');
        if (!$s && env('APP_ENV') === 'production') {
            throw new \RuntimeException('JWT_SECRET es obligatorio en producción');
        }
        return $s ?: 'dev-only-change-me';
    }
}
