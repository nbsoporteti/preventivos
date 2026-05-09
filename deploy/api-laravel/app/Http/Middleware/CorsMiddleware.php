<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CorsMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $allowedRaw = config('cors.allowed_origins', ['*']);
        $origin = $request->header('Origin', '');

        $allowed = in_array('*', $allowedRaw) || in_array($origin, array_map('trim', $allowedRaw));
        $respondOrigin = $allowed ? ($origin ?: '*') : '';

        if ($request->isMethod('OPTIONS')) {
            return response('', 204)
                ->header('Access-Control-Allow-Origin', $respondOrigin)
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
                ->header('Access-Control-Allow-Credentials', 'true')
                ->header('Access-Control-Max-Age', '86400');
        }

        $response = $next($request);

        if ($respondOrigin) {
            $response->header('Access-Control-Allow-Origin', $respondOrigin);
            $response->header('Access-Control-Allow-Credentials', 'true');
        }

        return $response;
    }
}
