<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class OtpService
{
    public static function generate(): string
    {
        return str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
    }

    public static function store(string $email, string $code, int $expiresInMinutes = 10): void
    {
        DB::table('otp_codes')->where('email', $email)->delete();
        DB::table('otp_codes')->insert([
            'email' => $email,
            'code' => $code,
            'expires_at' => now()->addMinutes($expiresInMinutes),
            'created_at' => now(),
        ]);
    }

    public static function verify(string $email, string $code): bool
    {
        $record = DB::table('otp_codes')
            ->where('email', $email)
            ->where('code', $code)
            ->where('expires_at', '>', now())
            ->first();

        if (!$record) {
            return false;
        }

        DB::table('otp_codes')->where('email', $email)->delete();
        return true;
    }
}
