<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Services\IdService;
use App\Services\JwtService;
use App\Services\OtpService;
use App\Http\Middleware\JwtAuth;
use App\Services\EmailService;

class AuthController
{
    public function register(Request $request)
    {
        $nombre = trim($request->input('nombre', $request->input('name', '')));
        $email = $request->input('email', '');
        $password = $request->input('password', '');
        $passwordConfirm = $request->input('passwordConfirm', '');

        if (!$nombre || !$email || !$password || !$passwordConfirm) {
            return response()->json(['error' => 'Todos los campos son obligatorios'], 400);
        }
        if ($password !== $passwordConfirm) {
            return response()->json(['error' => 'Las contraseñas no coinciden'], 400);
        }
        if (strlen($password) < 8) {
            return response()->json(['error' => 'La contraseña debe tener al menos 8 caracteres'], 400);
        }

        $normalizedEmail = strtolower(trim($email));

        $existing = DB::table('users')->where('email', $normalizedEmail)->first();
        if ($existing) {
            return response()->json(['error' => 'El correo ya está registrado'], 400);
        }

        $id = IdService::newId();
        $passwordHash = Hash::make($password);

        try {
            DB::table('users')->insert([
                'id' => $id,
                'email' => $normalizedEmail,
                'password_hash' => $passwordHash,
                'nombre' => $nombre,
                'rol' => 'usuario',
                'email_verificado' => 0,
                'activo' => 1,
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'No se pudo crear la cuenta'], 400);
        }

        $otpCode = OtpService::generate();
        OtpService::store($normalizedEmail, $otpCode);
        EmailService::sendVerification($normalizedEmail, $otpCode);

        return response()->json([
            'success' => true,
            'message' => 'Registro exitoso. Revisa tu correo para el código de verificación.',
            'userId' => $id,
        ], 201);
    }

    public function verifyEmail(Request $request)
    {
        $email = $request->input('email', '');
        $otpCode = $request->input('otpCode', '');

        if (!$email || !$otpCode) {
            return response()->json(['error' => 'Correo y código OTP son obligatorios'], 400);
        }

        $normalizedEmail = strtolower(trim($email));

        if (!OtpService::verify($normalizedEmail, $otpCode)) {
            return response()->json(['error' => 'Código OTP inválido o expirado'], 400);
        }

        $user = DB::table('users')->where('email', $normalizedEmail)->first();
        if (!$user) {
            return response()->json(['error' => 'Usuario no encontrado'], 400);
        }

        DB::table('users')->where('email', $normalizedEmail)->update([
            'email_verificado' => 1,
            'updated_at' => now(),
        ]);

        EmailService::sendWelcome($normalizedEmail, $user->nombre ?? '');

        return response()->json([
            'success' => true,
            'message' => 'Correo verificado correctamente',
        ]);
    }

    public function resendOtp(Request $request)
    {
        $email = $request->input('email', '');
        if (!$email) {
            return response()->json(['error' => 'El correo es obligatorio'], 400);
        }

        $normalizedEmail = strtolower(trim($email));
        $user = DB::table('users')->where('email', $normalizedEmail)->first();
        if (!$user) {
            return response()->json(['error' => 'Usuario no encontrado'], 400);
        }

        $otpCode = OtpService::generate();
        OtpService::store($normalizedEmail, $otpCode);
        EmailService::sendVerification($normalizedEmail, $otpCode);

        return response()->json([
            'success' => true,
            'message' => 'Nuevo código enviado a tu correo',
        ]);
    }

    public function login(Request $request)
    {
        $email = $request->input('email', '');
        $password = $request->input('password', '');

        if (!$email || !$password) {
            return response()->json(['error' => 'Correo y contraseña son obligatorios'], 400);
        }

        $normalizedEmail = strtolower(trim($email));
        $user = DB::table('users')->where('email', $normalizedEmail)->first();

        if (!$user) {
            return response()->json(['error' => 'Correo o contraseña inválidos'], 401);
        }

        if (!$user->activo) {
            return response()->json(['error' => 'Cuenta deshabilitada. Contacta al administrador.'], 403);
        }

        if (!Hash::check(trim($password), $user->password_hash)) {
            return response()->json(['error' => 'Correo o contraseña inválidos'], 401);
        }

        $token = JwtService::sign([
            'id' => $user->id,
            'email' => $user->email,
            'rol' => $user->rol,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Sesión iniciada',
            'token' => $token,
            'user' => JwtAuth::formatPublicUser($user),
        ]);
    }

    public function logout(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Sesión cerrada',
        ]);
    }

    public function forgotPassword(Request $request)
    {
        $email = $request->input('email', '');
        if (!$email) {
            return response()->json(['error' => 'El correo es obligatorio'], 400);
        }

        $normalizedEmail = strtolower(trim($email));
        $user = DB::table('users')->where('email', $normalizedEmail)->first();

        if (!$user) {
            return response()->json([
                'success' => true,
                'message' => 'Si el correo existe, se envió un enlace de recuperación',
            ]);
        }

        $token = $user->id . '_' . time() . '_' . bin2hex(random_bytes(5));

        DB::table('password_resets')->where('email', $normalizedEmail)->delete();
        DB::table('password_resets')->insert([
            'email' => $normalizedEmail,
            'token' => $token,
            'expires_at' => now()->addHour(),
            'created_at' => now(),
        ]);

        EmailService::sendPasswordRecovery($normalizedEmail, $token);

        return response()->json([
            'success' => true,
            'message' => 'Si el correo existe, se envió un enlace de recuperación',
        ]);
    }

    public function resetPassword(Request $request)
    {
        $token = $request->input('token', '');
        $password = $request->input('password', '');
        $passwordConfirm = $request->input('passwordConfirm', '');

        if (!$token || !$password || !$passwordConfirm) {
            return response()->json(['error' => 'Token y contraseñas son obligatorios'], 400);
        }
        if ($password !== $passwordConfirm) {
            return response()->json(['error' => 'Las contraseñas no coinciden'], 400);
        }
        if (strlen($password) < 8) {
            return response()->json(['error' => 'La contraseña debe tener al menos 8 caracteres'], 400);
        }

        $record = DB::table('password_resets')
            ->where('token', $token)
            ->where('expires_at', '>', now())
            ->first();

        if (!$record) {
            return response()->json(['error' => 'Token inválido o expirado'], 400);
        }

        $passwordHash = Hash::make($password);
        $affected = DB::table('users')
            ->where('email', $record->email)
            ->update(['password_hash' => $passwordHash, 'updated_at' => now()]);

        DB::table('password_resets')->where('token', $token)->delete();

        if ($affected === 0) {
            return response()->json(['error' => 'Usuario no encontrado'], 400);
        }

        return response()->json([
            'success' => true,
            'message' => 'Contraseña actualizada',
        ]);
    }

    public function me(Request $request)
    {
        return response()->json(['user' => $request->attributes->get('auth_user_public')]);
    }

    public function changePassword(Request $request)
    {
        $currentPassword = $request->input('currentPassword', '');
        $newPassword = $request->input('newPassword', '');
        $newPasswordConfirm = $request->input('newPasswordConfirm', '');

        if (!$currentPassword || !$newPassword || !$newPasswordConfirm) {
            return response()->json(['error' => 'Todos los campos son obligatorios'], 400);
        }
        if ($newPassword !== $newPasswordConfirm) {
            return response()->json(['error' => 'Las nuevas contraseñas no coinciden'], 400);
        }
        if (strlen($newPassword) < 8) {
            return response()->json(['error' => 'La contraseña debe tener al menos 8 caracteres'], 400);
        }

        $user = $request->attributes->get('auth_user');
        if (!Hash::check(trim($currentPassword), $user->password_hash)) {
            return response()->json(['error' => 'La contraseña actual no es correcta'], 400);
        }

        $passwordHash = Hash::make($newPassword);
        DB::table('users')->where('id', $user->id)->update([
            'password_hash' => $passwordHash,
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Contraseña actualizada correctamente',
        ]);
    }
}
