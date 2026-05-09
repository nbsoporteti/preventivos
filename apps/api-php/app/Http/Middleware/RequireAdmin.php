<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RequireAdmin
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->attributes->get('auth_user_public');
        if (!$user || ($user['rol'] ?? '') !== 'admin') {
            return response()->json(['error' => 'Admin access required'], 403);
        }
        return $next($request);
    }
}
