<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Middleware\JwtAuth;
use App\Services\IdService;

class UserController
{
    public function stats(Request $request)
    {
        $userId = $request->attributes->get('auth_user_public')['id'];
        $payload = self::buildStatsPayload($userId);
        return response()->json($payload);
    }

    public function statsByid(Request $request, string $id)
    {
        $authId = $request->attributes->get('auth_user_public')['id'];
        if ($authId !== $id) {
            return response()->json(['error' => 'Solo puedes ver tus propias estadísticas'], 403);
        }
        return response()->json(self::buildStatsPayload($id));
    }

    public function downloads(Request $request, string $id)
    {
        $authId = $request->attributes->get('auth_user_public')['id'];
        if ($authId !== $id) {
            return response()->json(['error' => 'Solo puedes ver tu propio historial'], 403);
        }

        $page = max(1, (int) $request->query('page', 1));
        $limit = min(100, max(1, (int) $request->query('limit', 50)));
        $offset = ($page - 1) * $limit;

        $totalItems = DB::table('descargas_historial')->where('usuario_id', $id)->count();
        $totalPages = max(1, (int) ceil($totalItems / $limit));

        $items = DB::table('descargas_historial as d')
            ->leftJoin('recursos as r', 'r.id', '=', 'd.recurso_id')
            ->where('d.usuario_id', $id)
            ->orderByDesc('d.fecha_descarga')
            ->offset($offset)->limit($limit)
            ->select('d.id', 'd.fecha_descarga', 'd.created_at', 'd.recurso_id', 'r.titulo', 'r.tipo_archivo')
            ->get();

        $mapped = $items->map(fn($row) => [
            'id' => $row->id,
            'fecha_descarga' => $row->fecha_descarga,
            'created' => $row->fecha_descarga ?? $row->created_at,
            'recurso_id' => $row->recurso_id,
            'recurso' => $row->titulo ? [
                'id' => $row->recurso_id,
                'titulo' => $row->titulo,
                'tipo_archivo' => $row->tipo_archivo,
            ] : null,
        ]);

        return response()->json([
            'items' => $mapped,
            'pagination' => compact('page', 'limit', 'totalItems', 'totalPages'),
        ]);
    }

    public function recordDownload(Request $request)
    {
        $resourceId = $request->input('resourceId', '');
        if (!$resourceId) {
            return response()->json(['error' => 'resourceId es obligatorio'], 400);
        }

        $userId = $request->attributes->get('auth_user_public')['id'];
        $ip = $request->header('X-Forwarded-For', $request->ip());
        $ip = explode(',', $ip)[0] ?? 'unknown';

        $resource = DB::table('recursos')->where('id', $resourceId)->first();
        if (!$resource || !$resource->activo) {
            return response()->json(['error' => 'Recurso no encontrado'], 404);
        }

        $dlId = IdService::newId();
        DB::table('descargas_historial')->insert([
            'id' => $dlId,
            'usuario_id' => $userId,
            'recurso_id' => $resourceId,
            'ip_usuario' => trim($ip),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Descarga registrada',
            'downloadId' => $dlId,
        ], 201);
    }

    public function show(Request $request, string $id)
    {
        $authId = $request->attributes->get('auth_user_public')['id'];
        if ($authId !== $id) {
            return response()->json(['error' => 'Solo puedes ver tu propio perfil'], 403);
        }

        $user = DB::table('users')->where('id', $id)->first();
        if (!$user) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        return response()->json(JwtAuth::formatPublicUser($user));
    }

    public function update(Request $request, string $id)
    {
        $authId = $request->attributes->get('auth_user_public')['id'];
        if ($authId !== $id) {
            return response()->json(['error' => 'Solo puedes actualizar tu propio perfil'], 403);
        }

        $nombre = trim($request->input('nombre', $request->input('name', '')));
        $email = $request->input('email');

        if (!$nombre && !$email) {
            return response()->json(['error' => 'Indica al menos nombre o correo'], 400);
        }

        if ($email) {
            $normalized = strtolower(trim($email));
            $exists = DB::table('users')->where('email', $normalized)->where('id', '!=', $id)->exists();
            if ($exists) {
                return response()->json(['error' => 'El correo ya está en uso'], 400);
            }
        }

        $updates = ['updated_at' => now()];
        if ($nombre) $updates['nombre'] = $nombre;
        if ($email) $updates['email'] = strtolower(trim($email));

        DB::table('users')->where('id', $id)->update($updates);
        $user = DB::table('users')->where('id', $id)->first();

        return response()->json([
            'success' => true,
            'message' => 'Perfil actualizado',
            'user' => JwtAuth::formatPublicUser($user),
        ]);
    }

    private static function buildStatsPayload(string $userId): array
    {
        $downloads = DB::table('descargas_historial as d')
            ->leftJoin('recursos as r', 'r.id', '=', 'd.recurso_id')
            ->where('d.usuario_id', $userId)
            ->orderByDesc('d.fecha_descarga')
            ->select('d.*', 'r.titulo as recurso_titulo', 'r.categoria_id')
            ->get();

        $categorias = DB::table('categorias')->pluck('nombre', 'id');

        $totalDownloads = $downloads->count();
        $catCounts = [];
        $lastDownloadAt = null;
        $lastResourceTitle = null;

        foreach ($downloads as $row) {
            $label = $row->categoria_id ? ($categorias[$row->categoria_id] ?? 'Sin categoría') : 'Sin categoría';
            $catCounts[$label] = ($catCounts[$label] ?? 0) + 1;

            $ts = $row->fecha_descarga ?? $row->created_at;
            if ($ts && (!$lastDownloadAt || $ts > $lastDownloadAt)) {
                $lastDownloadAt = $ts;
                $lastResourceTitle = $row->recurso_titulo;
            }
        }

        $favoriteCategory = null;
        $favoriteCategoryPct = null;
        if (!empty($catCounts) && $totalDownloads > 0) {
            arsort($catCounts);
            $favoriteCategory = array_key_first($catCounts);
            $favoriteCategoryPct = (int) round(($catCounts[$favoriteCategory] / $totalDownloads) * 100);
        }

        return compact('totalDownloads', 'favoriteCategory', 'favoriteCategoryPct', 'lastDownloadAt', 'lastResourceTitle');
    }
}
