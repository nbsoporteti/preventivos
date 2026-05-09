<?php

namespace App\Services;

use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class EmailService
{
    private static function isConfigured(): bool
    {
        $user = env('MAIL_USERNAME', '');
        $pass = env('MAIL_PASSWORD', '');
        if (!$user || !$pass) return false;
        if (str_contains($user, 'your-email') || str_contains($user, 'example')) return false;
        return true;
    }

    private static function webAppUrl(): string
    {
        $url = env('WEB_APP_URL', '');
        if ($url) return rtrim($url, '/');
        $domain = env('WEBSITE_DOMAIN', 'localhost:3000');
        $protocol = str_contains($domain, 'localhost') ? 'http' : 'https';
        return "{$protocol}://{$domain}";
    }

    public static function sendVerification(string $email, string $otpCode): void
    {
        if (!self::isConfigured()) {
            Log::warning("[email] SMTP no configurado. OTP para {$email}: {$otpCode}");
            return;
        }

        try {
            Mail::raw("Tu código de verificación Preventivos CL: {$otpCode} (válido 10 minutos)", function ($msg) use ($email) {
                $msg->to($email)
                    ->subject('Verifica tu correo - Preventivos CL');
            });
        } catch (\Throwable $e) {
            Log::error("Error enviando email verificación: " . $e->getMessage());
        }
    }

    public static function sendWelcome(string $email, string $name): void
    {
        if (!self::isConfigured()) {
            Log::info("[email] SMTP omitido. Bienvenida a {$email}");
            return;
        }

        try {
            $who = $name ?: 'usuario';
            Mail::raw("Hola {$who}. Tu correo ya está verificado. Ya puedes iniciar sesión.", function ($msg) use ($email) {
                $msg->to($email)
                    ->subject('Correo verificado - Preventivos CL');
            });
        } catch (\Throwable $e) {
            Log::error("Error enviando email bienvenida: " . $e->getMessage());
        }
    }

    public static function sendPasswordRecovery(string $email, string $token): void
    {
        $link = self::webAppUrl() . '/resetear-contrasena/' . urlencode($token);

        if (!self::isConfigured()) {
            Log::warning("[email] SMTP no configurado. Enlace recuperación para {$email}: {$link}");
            return;
        }

        try {
            Mail::raw("Restablecer contraseña: {$link}", function ($msg) use ($email) {
                $msg->to($email)
                    ->subject('Recuperar contraseña - Preventivos CL');
            });
        } catch (\Throwable $e) {
            Log::error("Error enviando email recovery: " . $e->getMessage());
        }
    }
}
