<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CatalogController
{
    private const SORT_MAP = [
        '-created' => 'r.created_at DESC', 'created' => 'r.created_at ASC',
        '-updated' => 'r.updated_at DESC', 'updated' => 'r.updated_at ASC',
        'titulo' => 'r.titulo ASC', '-titulo' => 'r.titulo DESC',
    ];

    private const QUERY_MIN = 2;
    private const QUERY_MAX = 120;
    private const DEFAULT_LIMIT = 12;
    private const MAX_LIMIT = 48;
    private const ID_RE = '/^[a-z0-9]{15}$/';

    public function search(Request $request)
    {
        $raw = trim($request->query('q', ''));
        if (mb_strlen($raw) < self::QUERY_MIN) {
            return response()->json(['query' => $raw, 'recursos' => [], 'pagination' => ['page' => 1, 'perPage' => self::MAX_LIMIT, 'totalItems' => 0, 'totalPages' => 0]]);
        }
        if (mb_strlen($raw) > self::QUERY_MAX) return response()->json(['error' => 'La búsqueda es demasiado larga'], 400);

        $page = max(1, (int) $request->query('page', 1));
        $perPage = min(self::MAX_LIMIT, max(1, (int) $request->query('limit', self::MAX_LIMIT)));
        $like = '%' . addcslashes($raw, '%_\\') . '%';

        $binds = [$like, $like];
        $where = "(r.activo IS NULL OR r.activo = 1) AND (r.titulo LIKE ? OR r.descripcion LIKE ?)";

        $tipo = strtoupper(trim($request->query('tipo', '')));
        if ($tipo && in_array($tipo, ['PDF', 'DOCX', 'XLSX', 'PPT'])) { $where .= " AND r.tipo_archivo = ?"; $binds[] = $tipo; }

        $catId = trim($request->query('categoria_id', ''));
        if ($catId && preg_match(self::ID_RE, $catId)) { $where .= " AND r.categoria_id = ?"; $binds[] = $catId; }

        $totalItems = (int) DB::selectOne("SELECT COUNT(*) as c FROM recursos r WHERE {$where}", $binds)->c;
        $totalPages = max(1, (int) ceil($totalItems / $perPage));
        $offset = ($page - 1) * $perPage;

        $rows = DB::select("SELECT r.*, c.nombre AS categoria_nombre FROM recursos r LEFT JOIN categorias c ON c.id = r.categoria_id WHERE {$where} ORDER BY r.created_at DESC LIMIT ? OFFSET ?", array_merge($binds, [$perPage, $offset]));
        $countMap = ResourceController::downloadCountMap();
        $recursos = array_map(fn($r) => self::mapPublic($r, $countMap[$r->id] ?? 0), $rows);

        return response()->json(['query' => $raw, 'recursos' => $recursos, 'pagination' => compact('page', 'perPage', 'totalItems', 'totalPages')]);
    }

    public function highlights(Request $request)
    {
        $limit = min(12, max(1, (int) $request->query('limit', 10)));
        $countMap = ResourceController::downloadCountMap();

        $recent = DB::select("SELECT r.*, c.nombre AS categoria_nombre FROM recursos r LEFT JOIN categorias c ON c.id = r.categoria_id WHERE (r.activo IS NULL OR r.activo = 1) ORDER BY r.updated_at DESC LIMIT ?", [$limit]);

        arsort($countMap);
        $topIds = array_slice(array_keys($countMap), 0, $limit);
        $popular = [];
        foreach ($topIds as $id) {
            $row = DB::selectOne("SELECT r.*, c.nombre AS categoria_nombre FROM recursos r LEFT JOIN categorias c ON c.id = r.categoria_id WHERE r.id = ? AND (r.activo IS NULL OR r.activo = 1) LIMIT 1", [$id]);
            if ($row) $popular[] = self::mapPublic($row, $countMap[$id] ?? 0);
        }

        $recentMapped = array_map(fn($r) => self::mapPublic($r, $countMap[$r->id] ?? 0), $recent);
        return response()->json(['popular' => $popular, 'recent' => $recentMapped]);
    }

    public function recursos(Request $request)
    {
        $page = max(1, (int) $request->query('page', 1));
        $limit = min(self::MAX_LIMIT, max(1, (int) $request->query('limit', self::DEFAULT_LIMIT)));
        $sortKey = $request->query('sort', '-updated');
        $orderSql = self::SORT_MAP[$sortKey] ?? 'r.updated_at DESC';

        $binds = [];
        $where = "(r.activo IS NULL OR r.activo = 1)";

        $catId = trim($request->query('categoria_id', ''));
        if ($catId && preg_match(self::ID_RE, $catId)) { $where .= " AND r.categoria_id = ?"; $binds[] = $catId; }

        $tipo = strtoupper(trim($request->query('tipo', '')));
        if ($tipo && in_array($tipo, ['PDF', 'DOCX', 'XLSX', 'PPT'])) { $where .= " AND r.tipo_archivo = ?"; $binds[] = $tipo; }

        $rawQ = trim($request->query('q', ''));
        if (mb_strlen($rawQ) >= self::QUERY_MIN && mb_strlen($rawQ) <= self::QUERY_MAX) {
            $like = '%' . addcslashes($rawQ, '%_\\') . '%';
            $where .= " AND (r.titulo LIKE ? OR r.descripcion LIKE ?)";
            $binds[] = $like; $binds[] = $like;
        }

        $totalItems = (int) DB::selectOne("SELECT COUNT(*) as c FROM recursos r WHERE {$where}", $binds)->c;
        $totalPages = max(1, (int) ceil($totalItems / $limit));
        $offset = ($page - 1) * $limit;

        $rows = DB::select("SELECT r.*, c.nombre AS categoria_nombre FROM recursos r LEFT JOIN categorias c ON c.id = r.categoria_id WHERE {$where} ORDER BY {$orderSql} LIMIT ? OFFSET ?", array_merge($binds, [$limit, $offset]));
        $countMap = ResourceController::downloadCountMap();
        $recursos = array_map(fn($r) => self::mapPublic($r, $countMap[$r->id] ?? 0), $rows);

        return response()->json(['recursos' => $recursos, 'pagination' => ['page' => $page, 'perPage' => $limit, 'totalItems' => $totalItems, 'totalPages' => $totalPages]]);
    }

    public function recursoDetail(string $id)
    {
        if (!preg_match(self::ID_RE, $id)) return response()->json(['error' => 'Recurso no encontrado'], 404);

        $r = DB::selectOne("SELECT r.*, c.nombre AS categoria_nombre FROM recursos r LEFT JOIN categorias c ON c.id = r.categoria_id WHERE r.id = ? LIMIT 1", [$id]);
        if (!$r || ($r->activo !== null && !$r->activo)) return response()->json(['error' => 'Recurso no encontrado'], 404);

        $countMap = ResourceController::downloadCountMap();
        $etiquetas = DB::table('recursos_etiquetas as re')
            ->join('etiquetas as e', 'e.id', '=', 're.etiqueta_id')
            ->where('re.recurso_id', $id)
            ->pluck('e.nombre')
            ->filter()
            ->values()
            ->toArray();

        $recurso = self::mapPublic($r, $countMap[$r->id] ?? 0);
        $recurso['etiquetas'] = $etiquetas;

        return response()->json(['recurso' => $recurso]);
    }

    public function categories()
    {
        $categories = DB::table('categorias')->orderBy('nombre')->get();
        $counts = DB::table('recursos')
            ->select('categoria_id', DB::raw('COUNT(*) as n'))
            ->whereRaw('(activo IS NULL OR activo = 1)')
            ->groupBy('categoria_id')
            ->pluck('n', 'categoria_id');

        $payload = $categories->map(fn($c) => [
            'id' => $c->id, 'nombre' => $c->nombre, 'descripcion' => $c->descripcion ?? '',
            'icono' => $c->icono ?: null, 'recursos_count' => (int) ($counts[$c->id] ?? 0),
        ]);

        return response()->json(['categories' => $payload]);
    }

    public function categoryRecursos(Request $request, string $id)
    {
        if (!preg_match(self::ID_RE, $id)) return response()->json(['error' => 'Categoría no encontrada'], 404);

        $category = DB::table('categorias')->where('id', $id)->first();
        if (!$category) return response()->json(['error' => 'Categoría no encontrada'], 404);

        $page = max(1, (int) $request->query('page', 1));
        $limit = min(self::MAX_LIMIT, max(1, (int) $request->query('limit', self::DEFAULT_LIMIT)));
        $sortKey = $request->query('sort', '-created');
        $orderSql = self::SORT_MAP[$sortKey] ?? 'r.created_at DESC';

        $binds = [$id];
        $where = "r.categoria_id = ? AND (r.activo IS NULL OR r.activo = 1)";

        $tipo = strtoupper(trim($request->query('tipo', '')));
        if ($tipo && in_array($tipo, ['PDF', 'DOCX', 'XLSX', 'PPT'])) { $where .= " AND r.tipo_archivo = ?"; $binds[] = $tipo; }

        $rawQ = trim($request->query('q', ''));
        if (mb_strlen($rawQ) >= self::QUERY_MIN && mb_strlen($rawQ) <= self::QUERY_MAX) {
            $like = '%' . addcslashes($rawQ, '%_\\') . '%';
            $where .= " AND (r.titulo LIKE ? OR r.descripcion LIKE ?)";
            $binds[] = $like; $binds[] = $like;
        }

        $totalItems = (int) DB::selectOne("SELECT COUNT(*) as c FROM recursos r WHERE {$where}", $binds)->c;
        $totalPages = max(1, (int) ceil($totalItems / $limit));
        $offset = ($page - 1) * $limit;

        $rows = DB::select("SELECT r.*, c.nombre AS categoria_nombre FROM recursos r LEFT JOIN categorias c ON c.id = r.categoria_id WHERE {$where} ORDER BY {$orderSql} LIMIT ? OFFSET ?", array_merge($binds, [$limit, $offset]));
        $countMap = ResourceController::downloadCountMap();
        $recursos = array_map(fn($r) => self::mapPublic($r, $countMap[$r->id] ?? 0), $rows);

        return response()->json([
            'category' => ['id' => $category->id, 'nombre' => $category->nombre, 'descripcion' => $category->descripcion ?? '', 'icono' => $category->icono ?: null],
            'recursos' => $recursos,
            'pagination' => ['page' => $page, 'perPage' => $limit, 'totalItems' => $totalItems, 'totalPages' => $totalPages],
        ]);
    }

    public function categoryDetail(string $id)
    {
        if (!preg_match(self::ID_RE, $id)) return response()->json(['error' => 'Categoría no encontrada'], 404);
        $cat = DB::table('categorias')->where('id', $id)->first();
        if (!$cat) return response()->json(['error' => 'Categoría no encontrada'], 404);

        $count = DB::table('recursos')->where('categoria_id', $id)->whereRaw('(activo IS NULL OR activo = 1)')->count();
        return response()->json(['category' => ['id' => $cat->id, 'nombre' => $cat->nombre, 'descripcion' => $cat->descripcion ?? '', 'icono' => $cat->icono ?: null, 'recursos_count' => $count]]);
    }

    private static function mapPublic($r, int $downloadCount = 0): array
    {
        return [
            'id' => $r->id, 'titulo' => $r->titulo, 'descripcion' => $r->descripcion ?? '',
            'tipo_archivo' => $r->tipo_archivo ?? 'PDF', 'peso_archivo' => $r->peso_archivo,
            'created' => $r->created_at, 'updated' => $r->updated_at,
            'categoria_id' => $r->categoria_id, 'categoria_nombre' => $r->categoria_nombre ?? '—',
            'download_count' => $downloadCount,
        ];
    }
}
