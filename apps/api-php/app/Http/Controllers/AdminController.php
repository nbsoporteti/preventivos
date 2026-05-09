<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Middleware\JwtAuth;
use App\Services\IdService;

class AdminController
{
    private const ALLOWED_ICONS = [
        'Shield','BookOpen','MessageSquare','Grid3x3','ClipboardCheck','FileCheck','Layers',
        'HeartPulse','HardHat','Flame','AlertTriangle','Truck','Building2','Users','Briefcase',
        'GraduationCap','Lightbulb','Scale','Gavel','Leaf','Factory','Stethoscope','Wrench',
        'Hammer','Cog','Boxes','Package','FileText','FolderOpen','Archive','Image','Video',
        'Link2','Globe','MapPin','Calendar','Clock','Star','Award','Target','Zap','FileSearch',
        'ScrollText','BadgeCheck',
    ];

    public function stats()
    {
        $totalUsers = DB::table('users')->count();
        $totalDownloads = DB::table('descargas_historial')->count();
        $totalResources = DB::table('recursos')->count();

        $sevenDaysAgo = now()->subDays(7);
        $activeUsersCount = DB::table('users')->where('updated_at', '>=', $sevenDaysAgo)->count();

        $countsByResource = DB::table('descargas_historial')
            ->select('recurso_id', DB::raw('COUNT(*) as c'))
            ->groupBy('recurso_id')
            ->orderByDesc('c')
            ->limit(5)
            ->get();

        $topResources = $countsByResource->map(function ($row) {
            $rec = DB::table('recursos')->where('id', $row->recurso_id)->first();
            return [
                'resourceId' => $row->recurso_id,
                'downloadCount' => (int) $row->c,
                'titulo' => $rec?->titulo,
            ];
        });

        return response()->json(compact('totalUsers', 'totalDownloads', 'topResources', 'activeUsersCount', 'totalResources'));
    }

    public function listUsers(Request $request)
    {
        $page = max(1, (int) $request->query('page', 1));
        $limit = min(100, max(1, (int) $request->query('limit', 10)));
        $search = trim($request->query('search', ''));
        $offset = ($page - 1) * $limit;

        $query = DB::table('users');
        if ($search) {
            $like = '%' . addcslashes($search, '%_\\') . '%';
            $query->where(fn($q) => $q->where('nombre', 'LIKE', $like)->orWhere('email', 'LIKE', $like));
        }

        $totalItems = $query->count();
        $totalPages = max(1, (int) ceil($totalItems / $limit));
        $items = $query->orderByDesc('created_at')->offset($offset)->limit($limit)->get();

        return response()->json([
            'items' => $items->map(fn($u) => JwtAuth::formatPublicUser($u)),
            'pagination' => ['page' => $page, 'perPage' => $limit, 'totalItems' => $totalItems, 'totalPages' => $totalPages],
        ]);
    }

    public function updateUser(Request $request, string $id)
    {
        $rol = $request->input('rol', $request->input('role'));
        $activo = $request->has('activo') ? $request->input('activo') : $request->input('active');

        if ($rol === null && $activo === null) {
            return response()->json(['error' => 'Indica rol y/o activo'], 400);
        }

        $validRoles = ['usuario', 'admin'];
        if ($rol !== null && !in_array($rol, $validRoles)) {
            return response()->json(['error' => 'Rol inválido'], 400);
        }

        $updates = ['updated_at' => now()];
        if ($rol !== null) $updates['rol'] = $rol;
        if ($activo !== null) $updates['activo'] = $activo ? 1 : 0;

        DB::table('users')->where('id', $id)->update($updates);
        $user = DB::table('users')->where('id', $id)->first();

        return response()->json([
            'success' => true,
            'message' => 'Usuario actualizado',
            'user' => JwtAuth::formatPublicUser($user),
        ]);
    }

    public function deleteUser(Request $request, string $id)
    {
        $authId = $request->attributes->get('auth_user_public')['id'];
        if ($authId === $id) {
            return response()->json(['error' => 'No puedes eliminar tu propia cuenta'], 400);
        }

        $affected = DB::table('users')->where('id', $id)->delete();
        if ($affected === 0) {
            return response()->json(['error' => 'Usuario no encontrado'], 400);
        }

        return response()->json(['success' => true, 'message' => 'Usuario eliminado']);
    }

    // --- Categories ---

    public function listCategories()
    {
        $list = DB::table('categorias')->orderBy('nombre')->get();
        return response()->json([
            'items' => $list->map(fn($c) => [
                'id' => $c->id,
                'nombre' => $c->nombre,
                'descripcion' => $c->descripcion ?? '',
                'icono' => $c->icono ?? '',
                'created' => $c->created_at,
                'updated' => $c->updated_at,
            ]),
        ]);
    }

    public function createCategory(Request $request)
    {
        $nombre = trim($request->input('nombre', ''));
        if (!$nombre) {
            return response()->json(['error' => 'nombre es obligatorio'], 400);
        }

        $descripcion = trim($request->input('descripcion', ''));
        $icono = $this->normalizeIcon($request->input('icono'));
        if ($icono === false) {
            return response()->json(['error' => 'icono no reconocido; elige uno de la lista'], 400);
        }

        $id = IdService::newId();
        DB::table('categorias')->insert([
            'id' => $id,
            'nombre' => $nombre,
            'descripcion' => $descripcion,
            'icono' => $icono ?? '',
        ]);

        $c = DB::table('categorias')->where('id', $id)->first();
        return response()->json([
            'item' => ['id' => $c->id, 'nombre' => $c->nombre, 'descripcion' => $c->descripcion ?? '', 'icono' => $c->icono ?? '', 'created' => $c->created_at, 'updated' => $c->updated_at],
        ], 201);
    }

    public function updateCategory(Request $request, string $id)
    {
        $updates = ['updated_at' => now()];

        if ($request->has('nombre')) {
            $nombre = trim($request->input('nombre'));
            if (!$nombre) return response()->json(['error' => 'nombre no puede estar vacío'], 400);
            $updates['nombre'] = $nombre;
        }
        if ($request->has('descripcion')) {
            $updates['descripcion'] = trim($request->input('descripcion', ''));
        }
        if ($request->has('icono')) {
            $icono = $this->normalizeIcon($request->input('icono'));
            if ($icono === false) return response()->json(['error' => 'icono no reconocido; elige uno de la lista'], 400);
            $updates['icono'] = $icono ?? '';
        }

        DB::table('categorias')->where('id', $id)->update($updates);
        $c = DB::table('categorias')->where('id', $id)->first();
        if (!$c) return response()->json(['error' => 'Categoría no encontrada'], 400);

        return response()->json([
            'item' => ['id' => $c->id, 'nombre' => $c->nombre, 'descripcion' => $c->descripcion ?? '', 'icono' => $c->icono ?? '', 'created' => $c->created_at, 'updated' => $c->updated_at],
        ]);
    }

    public function deleteCategory(string $id)
    {
        $count = DB::table('recursos')->where('categoria_id', $id)->count();
        if ($count > 0) {
            return response()->json(['error' => 'No se puede eliminar: hay recursos asignados a esta categoría. Reasígnalos primero.'], 400);
        }
        DB::table('categorias')->where('id', $id)->delete();
        return response()->json(['success' => true, 'message' => 'Categoría eliminada']);
    }

    private function normalizeIcon($value)
    {
        if ($value === null || $value === '') return '';
        $s = trim((string) $value);
        if (!$s) return '';
        if (!in_array($s, self::ALLOWED_ICONS)) return false;
        return $s;
    }
}
