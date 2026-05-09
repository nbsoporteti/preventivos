<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\JwtService;

class JwtAuth
{
    public function handle(Request $request, Closure $next)
    {
        $header = $request->header('Authorization', '');
        if (!str_starts_with($header, 'Bearer ')) {
            return response()->json(['error' => 'Missing or invalid authorization header'], 401);
        }

        $token = trim(substr($header, 7));

        try {
            $decoded = JwtService::verify($token);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Invalid or expired token'], 401);
        }

        $user = DB::table('users')->where('id', $decoded->sub)->first();
        if (!$user) {
            return response()->json(['error' => 'Invalid or expired token'], 401);
        }

        if (!$user->activo) {
            return response()->json(['error' => 'Cuenta deshabilitada'], 403);
        }

        $request->attributes->set('auth_user', $user);
        $request->attributes->set('auth_user_public', self::formatPublicUser($user));

        return $next($request);
    }

    public static function formatPublicUser($row): array
    {
        if (!$row) return [];
        $nombre = $row->nombre ?? '';
        $created = $row->created_at ? (is_string($row->created_at) ? $row->created_at : $row->created_at->toISOString()) : null;
        return [
            'id' => $row->id,
            'nombre' => $nombre,
            'name' => $nombre,
            'email' => $row->email,
            'rol' => $row->rol,
            'role' => $row->rol,
            'email_verificado' => (bool) $row->email_verificado,
            'email_verified' => (bool) $row->email_verificado,
            'activo' => (bool) ($row->activo ?? true),
            'active' => (bool) ($row->activo ?? true),
            'created' => $created,
        ];
    }
}
