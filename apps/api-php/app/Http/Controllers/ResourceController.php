<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Services\IdService;

class ResourceController
{
    private const SORT_MAP = [
        '-created' => 'r.created_at DESC',
        'created' => 'r.created_at ASC',
        '-updated' => 'r.updated_at DESC',
        'updated' => 'r.updated_at ASC',
        'titulo' => 'r.titulo ASC',
        '-titulo' => 'r.titulo DESC',
    ];

    private const EXT_TIPO = ['pdf' => 'PDF', 'docx' => 'DOCX', 'xlsx' => 'XLSX', 'xls' => 'XLSX', 'ppt' => 'PPT', 'pptx' => 'PPT'];

    public function index(Request $request)
    {
        $page = max(1, (int) $request->query('page', 1));
        $limit = min(100, max(1, (int) $request->query('limit', 10)));
        $offset = ($page - 1) * $limit;
        $search = trim($request->query('search', ''));
        $categoriaId = trim($request->query('categoria_id', ''));
        $activo = $request->query('activo');
        $sortKey = $request->query('sort', '');

        $orderSql = self::SORT_MAP[$sortKey] ?? 'r.created_at DESC';

        $binds = [];
        $where = '1=1';
        if ($search) {
            $like = '%' . addcslashes($search, '%_\\') . '%';
            $where .= " AND (r.titulo LIKE ? OR r.descripcion LIKE ?)";
            $binds[] = $like;
            $binds[] = $like;
        }
        if ($categoriaId) {
            $where .= " AND r.categoria_id = ?";
            $binds[] = $categoriaId;
        }
        if ($activo !== null) {
            $av = strtolower((string) $activo);
            if ($av === 'true' || $av === '1') $where .= " AND (r.activo IS NULL OR r.activo = 1)";
            elseif ($av === 'false' || $av === '0') $where .= " AND r.activo = 0";
        }

        $totalItems = (int) DB::selectOne("SELECT COUNT(*) as c FROM recursos r WHERE {$where}", $binds)->c;
        $totalPages = max(1, (int) ceil($totalItems / $limit));

        $rows = DB::select(
            "SELECT r.*, c.nombre AS categoria_nombre FROM recursos r LEFT JOIN categorias c ON c.id = r.categoria_id WHERE {$where} ORDER BY {$orderSql} LIMIT ? OFFSET ?",
            array_merge($binds, [$limit, $offset])
        );

        $downloadCounts = self::downloadCountMap();

        $items = array_map(fn($r) => [
            'id' => $r->id,
            'titulo' => $r->titulo,
            'descripcion' => $r->descripcion,
            'categoria_id' => $r->categoria_id,
            'categoria' => $r->categoria_nombre,
            'referencia_interna' => $r->referencia_interna ?? '',
            'ruta_archivo' => $r->ruta_archivo,
            'tipo_archivo' => $r->tipo_archivo,
            'activo' => $r->activo === null || $r->activo == 1,
            'archivo_url' => $r->archivo_url,
            'created' => $r->created_at,
            'updated' => $r->updated_at,
            'downloadCount' => $downloadCounts[$r->id] ?? 0,
        ], $rows);

        return response()->json([
            'items' => $items,
            'pagination' => ['page' => $page, 'perPage' => $limit, 'totalItems' => $totalItems, 'totalPages' => $totalPages],
        ]);
    }

    public function upload(Request $request)
    {
        if (!$request->hasFile('file') || !$request->file('file')->isValid()) {
            return response()->json(['error' => 'Selecciona un archivo'], 400);
        }

        $titulo = trim($request->input('titulo', ''));
        $categoriaId = trim($request->input('categoria_id', ''));
        $descripcion = trim($request->input('descripcion', ''));
        $tipoArchivo = trim($request->input('tipo_archivo', ''));
        $activo = $request->input('activo') !== 'false' && $request->input('activo') !== false;
        $referenciaInterna = mb_substr(trim($request->input('referencia_interna', '')), 0, 2000);

        if (!$titulo || !$categoriaId) {
            return response()->json(['error' => 'titulo y categoria_id son obligatorios'], 400);
        }

        $file = $request->file('file');
        $filename = $file->getClientOriginalName() ?: 'archivo';
        if (!$tipoArchivo) $tipoArchivo = self::guessTipo($filename);

        $id = IdService::newId();
        $safeName = self::safeFilename($filename);
        $relativePath = "{$id}/{$safeName}";

        Storage::disk('uploads')->putFileAs($id, $file, $safeName);
        $peso = round($file->getSize() / (1024 * 1024), 2);

        DB::table('recursos')->insert([
            'id' => $id,
            'titulo' => $titulo,
            'descripcion' => $descripcion,
            'categoria_id' => $categoriaId,
            'tipo_archivo' => $tipoArchivo,
            'peso_archivo' => $peso,
            'activo' => $activo ? 1 : 0,
            'ruta_archivo' => "upload://{$safeName}",
            'archivo_url' => $safeName,
            'archivo_path' => $relativePath,
            'referencia_interna' => $referenciaInterna ?: null,
        ]);

        $created = DB::table('recursos')->where('id', $id)->first();

        return response()->json([
            'success' => true,
            'message' => 'Recurso creado con archivo',
            'resource' => ['id' => $created->id, 'titulo' => $created->titulo, 'descripcion' => $created->descripcion, 'categoria_id' => $created->categoria_id, 'ruta_archivo' => $created->ruta_archivo, 'tipo_archivo' => $created->tipo_archivo],
        ], 201);
    }

    public function importUrl(Request $request)
    {
        $titulo = trim($request->input('titulo', ''));
        $categoriaId = trim($request->input('categoria_id', ''));
        $descripcion = trim($request->input('descripcion', ''));
        $sourceUrl = trim($request->input('sourceUrl', $request->input('url', '')));
        $tipoArchivo = trim($request->input('tipo_archivo', ''));
        $activo = $request->input('activo') !== false && $request->input('activo') !== 'false';
        $referenciaInterna = mb_substr(trim($request->input('referencia_interna', '')), 0, 2000);

        if (!$titulo || !$categoriaId || !$sourceUrl) {
            return response()->json(['error' => 'titulo, categoria_id y sourceUrl son obligatorios'], 400);
        }

        if (!filter_var($sourceUrl, FILTER_VALIDATE_URL) || !preg_match('/^https?:\/\//', $sourceUrl)) {
            return response()->json(['error' => 'Solo se permiten enlaces http o https'], 400);
        }

        try {
            $content = file_get_contents($sourceUrl, false, stream_context_create(['http' => ['timeout' => 30, 'user_agent' => 'PreventivosCL-AdminImport/1.0']]));
            if ($content === false) throw new \Exception('No se pudo descargar');
        } catch (\Throwable $e) {
            return response()->json(['error' => 'No se pudo descargar el archivo: ' . $e->getMessage()], 400);
        }

        $filename = basename(parse_url($sourceUrl, PHP_URL_PATH)) ?: 'descarga';
        if (!$tipoArchivo) $tipoArchivo = self::guessTipo($filename);

        $id = IdService::newId();
        $safeName = self::safeFilename($filename);
        $relativePath = "{$id}/{$safeName}";

        Storage::disk('uploads')->put($relativePath, $content);
        $peso = round(strlen($content) / (1024 * 1024), 2);

        DB::table('recursos')->insert([
            'id' => $id,
            'titulo' => $titulo,
            'descripcion' => $descripcion,
            'categoria_id' => $categoriaId,
            'tipo_archivo' => $tipoArchivo,
            'peso_archivo' => $peso,
            'activo' => $activo ? 1 : 0,
            'ruta_archivo' => "upload://{$safeName}",
            'archivo_url' => $safeName,
            'archivo_path' => $relativePath,
            'referencia_interna' => $referenciaInterna ?: null,
        ]);

        $created = DB::table('recursos')->where('id', $id)->first();

        return response()->json([
            'success' => true,
            'message' => 'Recurso importado correctamente',
            'resource' => ['id' => $created->id, 'titulo' => $created->titulo, 'descripcion' => $created->descripcion, 'categoria_id' => $created->categoria_id, 'ruta_archivo' => $created->ruta_archivo, 'tipo_archivo' => $created->tipo_archivo],
        ], 201);
    }

    public function replaceFile(Request $request, string $id)
    {
        if (!$request->hasFile('file') || !$request->file('file')->isValid()) {
            return response()->json(['error' => 'Selecciona un archivo'], 400);
        }

        $file = $request->file('file');
        $filename = $file->getClientOriginalName() ?: 'archivo';
        $tipoArchivo = trim($request->input('tipo_archivo', '')) ?: self::guessTipo($filename);

        $safeName = self::safeFilename($filename);
        $relativePath = "{$id}/{$safeName}";

        Storage::disk('uploads')->deleteDirectory($id);
        Storage::disk('uploads')->putFileAs($id, $file, $safeName);
        $peso = round($file->getSize() / (1024 * 1024), 2);

        DB::table('recursos')->where('id', $id)->update([
            'ruta_archivo' => "upload://{$safeName}",
            'archivo_url' => $safeName,
            'archivo_path' => $relativePath,
            'tipo_archivo' => $tipoArchivo,
            'peso_archivo' => $peso,
            'updated_at' => now(),
        ]);

        $updated = DB::table('recursos')->where('id', $id)->first();
        return response()->json([
            'success' => true,
            'message' => 'Archivo actualizado',
            'resource' => ['id' => $updated->id, 'titulo' => $updated->titulo, 'ruta_archivo' => $updated->ruta_archivo, 'tipo_archivo' => $updated->tipo_archivo, 'archivo_url' => $updated->archivo_url],
        ]);
    }

    public function replaceImportUrl(Request $request, string $id)
    {
        $sourceUrl = trim($request->input('sourceUrl', $request->input('url', '')));
        $tipoArchivo = trim($request->input('tipo_archivo', ''));

        if (!$sourceUrl) return response()->json(['error' => 'sourceUrl es obligatorio'], 400);
        if (!filter_var($sourceUrl, FILTER_VALIDATE_URL) || !preg_match('/^https?:\/\//', $sourceUrl)) {
            return response()->json(['error' => 'Solo se permiten enlaces http o https'], 400);
        }

        try {
            $content = file_get_contents($sourceUrl, false, stream_context_create(['http' => ['timeout' => 30]]));
            if ($content === false) throw new \Exception('No se pudo descargar');
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }

        $filename = basename(parse_url($sourceUrl, PHP_URL_PATH)) ?: 'descarga';
        if (!$tipoArchivo) $tipoArchivo = self::guessTipo($filename);

        $safeName = self::safeFilename($filename);
        $relativePath = "{$id}/{$safeName}";

        Storage::disk('uploads')->deleteDirectory($id);
        Storage::disk('uploads')->put($relativePath, $content);
        $peso = round(strlen($content) / (1024 * 1024), 2);

        DB::table('recursos')->where('id', $id)->update([
            'ruta_archivo' => "upload://{$safeName}",
            'archivo_url' => $safeName,
            'archivo_path' => $relativePath,
            'tipo_archivo' => $tipoArchivo,
            'peso_archivo' => $peso,
            'updated_at' => now(),
        ]);

        $updated = DB::table('recursos')->where('id', $id)->first();
        return response()->json([
            'success' => true,
            'message' => 'Archivo importado correctamente',
            'resource' => ['id' => $updated->id, 'titulo' => $updated->titulo, 'ruta_archivo' => $updated->ruta_archivo, 'tipo_archivo' => $updated->tipo_archivo, 'archivo_url' => $updated->archivo_url],
        ]);
    }

    public function store(Request $request)
    {
        $titulo = $request->input('titulo', $request->input('name'));
        $descripcion = $request->input('descripcion', $request->input('description', ''));
        $categoriaId = $request->input('categoria_id', $request->input('category'));
        $rutaArchivo = $request->input('ruta_archivo', $request->input('file_url'));
        $tipoArchivo = $request->input('tipo_archivo', 'PDF');
        $activo = $request->has('activo') ? (bool) $request->input('activo') : true;
        $referenciaInterna = mb_substr(trim($request->input('referencia_interna', '')), 0, 2000);

        if (!$titulo || !$categoriaId || !$rutaArchivo) {
            return response()->json(['error' => 'titulo, categoria_id y ruta_archivo son obligatorios'], 400);
        }

        $id = IdService::newId();
        DB::table('recursos')->insert([
            'id' => $id,
            'titulo' => $titulo,
            'descripcion' => $descripcion,
            'categoria_id' => $categoriaId,
            'ruta_archivo' => $rutaArchivo,
            'tipo_archivo' => $tipoArchivo,
            'activo' => $activo ? 1 : 0,
            'referencia_interna' => $referenciaInterna ?: null,
        ]);

        $resource = DB::table('recursos')->where('id', $id)->first();
        return response()->json([
            'success' => true,
            'message' => 'Recurso creado',
            'resource' => ['id' => $resource->id, 'titulo' => $resource->titulo, 'descripcion' => $resource->descripcion, 'categoria_id' => $resource->categoria_id, 'ruta_archivo' => $resource->ruta_archivo, 'tipo_archivo' => $resource->tipo_archivo],
        ], 201);
    }

    public function update(Request $request, string $id)
    {
        $fields = ['titulo', 'descripcion', 'categoria_id', 'ruta_archivo', 'tipo_archivo', 'activo', 'referencia_interna'];
        $updates = ['updated_at' => now()];
        $hasAny = false;

        foreach ($fields as $f) {
            if ($request->has($f)) {
                $hasAny = true;
                $val = $request->input($f);
                if ($f === 'activo') $val = $val ? 1 : 0;
                if ($f === 'referencia_interna') $val = mb_substr(trim((string) $val), 0, 2000);
                $updates[$f] = $val;
            }
        }
        if ($request->has('name') && !$request->has('titulo')) { $updates['titulo'] = $request->input('name'); $hasAny = true; }
        if ($request->has('category') && !$request->has('categoria_id')) { $updates['categoria_id'] = $request->input('category'); $hasAny = true; }
        if ($request->has('file_url') && !$request->has('ruta_archivo')) { $updates['ruta_archivo'] = $request->input('file_url'); $hasAny = true; }

        if (!$hasAny) return response()->json(['error' => 'Indica al menos un campo'], 400);

        DB::table('recursos')->where('id', $id)->update($updates);
        $r = DB::table('recursos')->where('id', $id)->first();

        return response()->json([
            'success' => true,
            'message' => 'Recurso actualizado',
            'resource' => [
                'id' => $r->id, 'titulo' => $r->titulo, 'descripcion' => $r->descripcion,
                'categoria_id' => $r->categoria_id, 'referencia_interna' => $r->referencia_interna ?? '',
                'ruta_archivo' => $r->ruta_archivo, 'tipo_archivo' => $r->tipo_archivo,
                'activo' => $r->activo === null || $r->activo == 1,
            ],
        ]);
    }

    public function destroy(string $id)
    {
        DB::table('recursos')->where('id', $id)->delete();
        Storage::disk('uploads')->deleteDirectory($id);
        return response()->json(['success' => true, 'message' => 'Recurso eliminado']);
    }

    public static function downloadCountMap(): array
    {
        $rows = DB::table('descargas_historial')
            ->select('recurso_id', DB::raw('COUNT(*) as c'))
            ->groupBy('recurso_id')
            ->get();
        $map = [];
        foreach ($rows as $r) {
            $map[$r->recurso_id] = (int) $r->c;
        }
        return $map;
    }

    private static function guessTipo(string $name): string
    {
        $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
        return self::EXT_TIPO[$ext] ?? 'PDF';
    }

    private static function safeFilename(string $name): string
    {
        $base = pathinfo($name, PATHINFO_BASENAME);
        $safe = preg_replace('/[^\w.\-\s]+/u', '_', $base);
        return mb_substr($safe, 0, 120) ?: 'archivo.bin';
    }
}
