<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\IdService;

class LmsController
{
    private const SLUG_RE = '/^[a-z0-9]+(?:-[a-z0-9]+)*$/';
    private const ID_RE = '/^[a-z0-9]{15}$/';

    // --- Admin: Actividades ---

    public function adminListActividades()
    {
        $rows = DB::select("SELECT a.*, c.nombre AS categoria_nombre FROM lms_actividades a LEFT JOIN categorias c ON c.id = a.categoria_id ORDER BY a.orden, a.titulo");
        $allItems = DB::table('lms_items')->select('id', 'actividad_id')->get();
        $countByAct = [];
        foreach ($allItems as $it) {
            $countByAct[$it->actividad_id] = ($countByAct[$it->actividad_id] ?? 0) + 1;
        }

        $items = array_map(fn($a) => [
            'id' => $a->id, 'titulo' => $a->titulo, 'slug' => $a->slug,
            'descripcion' => $a->descripcion ?? '', 'orden' => (int) ($a->orden ?? 0),
            'activo' => (bool) $a->activo, 'item_count' => $countByAct[$a->id] ?? 0,
            'updated' => $a->updated_at, 'categoria_id' => $a->categoria_id,
            'categoria_nombre' => $a->categoria_nombre,
        ], $rows);

        return response()->json(['items' => $items]);
    }

    public function adminCreateActividad(Request $request)
    {
        $titulo = trim($request->input('titulo', ''));
        $slug = strtolower(trim($request->input('slug', '')));
        $descripcion = trim($request->input('descripcion', ''));
        $orden = (int) $request->input('orden', 0);
        $activo = $request->input('activo') !== false;
        $categoriaId = $this->resolveCategoriaId($request);

        if (!$titulo || !$slug || !preg_match(self::SLUG_RE, $slug)) {
            return response()->json(['error' => 'Título y slug son obligatorios (slug: minúsculas y guiones)'], 400);
        }
        if ($categoriaId === false) return response()->json(['error' => 'Categoría inválida'], 400);

        $id = IdService::newId();
        try {
            DB::table('lms_actividades')->insert([
                'id' => $id, 'titulo' => $titulo, 'slug' => $slug, 'descripcion' => $descripcion,
                'orden' => $orden, 'activo' => $activo ? 1 : 0, 'categoria_id' => $categoriaId,
            ]);
        } catch (\Throwable $e) {
            if (str_contains(strtolower($e->getMessage()), 'duplicate') || str_contains(strtolower($e->getMessage()), 'unique')) {
                return response()->json(['error' => 'El slug ya existe'], 409);
            }
            return response()->json(['error' => 'No se pudo crear la actividad'], 500);
        }

        $created = DB::table('lms_actividades')->where('id', $id)->first();
        return response()->json(['item' => self::mapActividad($created)]);
    }

    public function adminUpdateActividad(Request $request, string $id)
    {
        $titulo = trim($request->input('titulo', ''));
        $slug = strtolower(trim($request->input('slug', '')));
        $descripcion = trim($request->input('descripcion', ''));
        $orden = (int) $request->input('orden', 0);
        $activo = $request->input('activo') !== false;
        $categoriaId = $this->resolveCategoriaId($request);

        if (!$titulo || !$slug || !preg_match(self::SLUG_RE, $slug)) {
            return response()->json(['error' => 'Título y slug inválidos'], 400);
        }
        if ($categoriaId === false) return response()->json(['error' => 'Categoría inválida'], 400);

        DB::table('lms_actividades')->where('id', $id)->update([
            'titulo' => $titulo, 'slug' => $slug, 'descripcion' => $descripcion,
            'orden' => $orden, 'activo' => $activo ? 1 : 0, 'categoria_id' => $categoriaId, 'updated_at' => now(),
        ]);

        $updated = DB::table('lms_actividades')->where('id', $id)->first();
        if (!$updated) return response()->json(['error' => 'No encontrada'], 404);
        return response()->json(['item' => self::mapActividad($updated)]);
    }

    public function adminDeleteActividad(string $id)
    {
        DB::table('lms_actividades')->where('id', $id)->delete();
        return response()->json(['ok' => true]);
    }

    public function adminListItems(string $actId)
    {
        $items = DB::table('lms_items')->where('actividad_id', $actId)->orderBy('orden')->orderBy('created_at')->get();
        return response()->json(['items' => $items->map(fn($it) => self::mapItem($it))]);
    }

    public function adminCreateItem(Request $request)
    {
        $actividadId = trim($request->input('actividad_id', ''));
        $enunciado = trim($request->input('enunciado', ''));
        $tipo = trim($request->input('tipo', 'single'));
        $opciones = self::parseOpciones($request);
        $indiceCorrecto = (int) $request->input('indice_correcto', -1);
        $explicacion = trim($request->input('explicacion', ''));
        $orden = (int) $request->input('orden', 0);

        if (!$actividadId || !$enunciado) return response()->json(['error' => 'actividad_id y enunciado son obligatorios'], 400);
        if (!in_array($tipo, ['single', 'true_false'])) return response()->json(['error' => 'tipo debe ser single o true_false'], 400);
        if (!$opciones) return response()->json(['error' => 'opciones_json debe ser un JSON array de al menos 2 strings'], 400);
        if ($tipo === 'true_false' && count($opciones) !== 2) return response()->json(['error' => 'true_false requiere exactamente 2 opciones'], 400);
        if ($indiceCorrecto < 0 || $indiceCorrecto >= count($opciones)) return response()->json(['error' => 'indice_correcto fuera de rango'], 400);

        $id = IdService::newId();
        DB::table('lms_items')->insert([
            'id' => $id, 'actividad_id' => $actividadId, 'enunciado' => $enunciado, 'tipo' => $tipo,
            'opciones_json' => json_encode($opciones), 'indice_correcto' => $indiceCorrecto,
            'explicacion' => $explicacion, 'orden' => $orden,
        ]);

        $created = DB::table('lms_items')->where('id', $id)->first();
        return response()->json(['item' => self::mapItem($created)]);
    }

    public function adminUpdateItem(Request $request, string $id)
    {
        $enunciado = trim($request->input('enunciado', ''));
        $tipo = trim($request->input('tipo', 'single'));
        $opciones = self::parseOpciones($request);
        $indiceCorrecto = (int) $request->input('indice_correcto', -1);
        $explicacion = trim($request->input('explicacion', ''));
        $orden = (int) $request->input('orden', 0);

        if (!$enunciado) return response()->json(['error' => 'enunciado es obligatorio'], 400);
        if (!in_array($tipo, ['single', 'true_false'])) return response()->json(['error' => 'tipo debe ser single o true_false'], 400);
        if (!$opciones) return response()->json(['error' => 'opciones_json inválido'], 400);
        if ($tipo === 'true_false' && count($opciones) !== 2) return response()->json(['error' => 'true_false requiere exactamente 2 opciones'], 400);
        if ($indiceCorrecto < 0 || $indiceCorrecto >= count($opciones)) return response()->json(['error' => 'indice_correcto fuera de rango'], 400);

        DB::table('lms_items')->where('id', $id)->update([
            'enunciado' => $enunciado, 'tipo' => $tipo, 'opciones_json' => json_encode($opciones),
            'indice_correcto' => $indiceCorrecto, 'explicacion' => $explicacion, 'orden' => $orden, 'updated_at' => now(),
        ]);

        $updated = DB::table('lms_items')->where('id', $id)->first();
        return response()->json(['item' => self::mapItem($updated)]);
    }

    public function adminDeleteItem(string $id)
    {
        DB::table('lms_items')->where('id', $id)->delete();
        return response()->json(['ok' => true]);
    }

    // --- Banco ---

    public function adminListBanco()
    {
        $rows = DB::table('lms_banco_items')->orderBy('orden')->orderBy('created_at')->get();
        return response()->json(['items' => $rows->map(fn($it) => self::mapItem($it))]);
    }

    public function adminCreateBanco(Request $request)
    {
        $enunciado = trim($request->input('enunciado', ''));
        $tipo = trim($request->input('tipo', 'single'));
        $opciones = self::parseOpciones($request);
        $indiceCorrecto = (int) $request->input('indice_correcto', -1);
        $explicacion = trim($request->input('explicacion', ''));
        $orden = (int) $request->input('orden', 0);

        if (!$enunciado) return response()->json(['error' => 'enunciado es obligatorio'], 400);
        if (!in_array($tipo, ['single', 'true_false'])) return response()->json(['error' => 'tipo debe ser single o true_false'], 400);
        if (!$opciones) return response()->json(['error' => 'opciones_json debe ser un JSON array de al menos 2 strings'], 400);
        if ($tipo === 'true_false' && count($opciones) !== 2) return response()->json(['error' => 'true_false requiere exactamente 2 opciones'], 400);
        if ($indiceCorrecto < 0 || $indiceCorrecto >= count($opciones)) return response()->json(['error' => 'indice_correcto fuera de rango'], 400);

        $id = IdService::newId();
        DB::table('lms_banco_items')->insert([
            'id' => $id, 'enunciado' => $enunciado, 'tipo' => $tipo,
            'opciones_json' => json_encode($opciones), 'indice_correcto' => $indiceCorrecto,
            'explicacion' => $explicacion, 'orden' => $orden,
        ]);

        $created = DB::table('lms_banco_items')->where('id', $id)->first();
        return response()->json(['item' => self::mapItem($created)]);
    }

    public function adminUpdateBanco(Request $request, string $id)
    {
        $enunciado = trim($request->input('enunciado', ''));
        $tipo = trim($request->input('tipo', 'single'));
        $opciones = self::parseOpciones($request);
        $indiceCorrecto = (int) $request->input('indice_correcto', -1);
        $explicacion = trim($request->input('explicacion', ''));
        $orden = (int) $request->input('orden', 0);

        if (!$enunciado) return response()->json(['error' => 'enunciado es obligatorio'], 400);
        if (!in_array($tipo, ['single', 'true_false'])) return response()->json(['error' => 'tipo debe ser single o true_false'], 400);
        if (!$opciones) return response()->json(['error' => 'opciones_json inválido'], 400);
        if ($tipo === 'true_false' && count($opciones) !== 2) return response()->json(['error' => 'true_false requiere exactamente 2 opciones'], 400);
        if ($indiceCorrecto < 0 || $indiceCorrecto >= count($opciones)) return response()->json(['error' => 'indice_correcto fuera de rango'], 400);

        DB::table('lms_banco_items')->where('id', $id)->update([
            'enunciado' => $enunciado, 'tipo' => $tipo, 'opciones_json' => json_encode($opciones),
            'indice_correcto' => $indiceCorrecto, 'explicacion' => $explicacion, 'orden' => $orden, 'updated_at' => now(),
        ]);

        $updated = DB::table('lms_banco_items')->where('id', $id)->first();
        return response()->json(['item' => self::mapItem($updated)]);
    }

    public function adminDeleteBanco(string $id)
    {
        DB::table('lms_banco_items')->where('id', $id)->delete();
        return response()->json(['ok' => true]);
    }

    public function adminImportBanco(Request $request, string $actividadId)
    {
        if (!preg_match(self::ID_RE, $actividadId)) return response()->json(['error' => 'Actividad inválida'], 400);

        $ids = $request->input('ids', []);
        if (!is_array($ids) || empty($ids)) return response()->json(['error' => 'Enviá ids: array de preguntas del banco'], 400);

        $cleanIds = array_values(array_unique(array_filter(array_map(fn($x) => trim((string) $x), $ids), fn($x) => preg_match(self::ID_RE, $x))));
        if (empty($cleanIds)) return response()->json(['error' => 'Ningún id válido'], 400);

        $existing = DB::table('lms_items')->where('actividad_id', $actividadId)->pluck('orden');
        $nextOrden = $existing->isEmpty() ? 0 : $existing->max() + 1;

        $imported = [];
        foreach ($cleanIds as $bid) {
            $banco = DB::table('lms_banco_items')->where('id', $bid)->first();
            if (!$banco) continue;

            $nid = IdService::newId();
            DB::table('lms_items')->insert([
                'id' => $nid, 'actividad_id' => $actividadId, 'enunciado' => $banco->enunciado,
                'tipo' => $banco->tipo, 'opciones_json' => $banco->opciones_json,
                'indice_correcto' => $banco->indice_correcto, 'explicacion' => $banco->explicacion ?? '',
                'orden' => $nextOrden,
            ]);
            $created = DB::table('lms_items')->where('id', $nid)->first();
            $imported[] = self::mapItem($created);
            $nextOrden++;
        }

        if (empty($imported)) return response()->json(['error' => 'No se encontraron preguntas del banco para esos ids'], 400);
        return response()->json(['imported' => count($imported), 'items' => $imported]);
    }

    // --- Public LMS ---

    public function publicListActividades()
    {
        $rows = DB::select("SELECT a.*, c.nombre AS cat_nombre FROM lms_actividades a LEFT JOIN categorias c ON c.id = a.categoria_id WHERE a.activo = 1 ORDER BY a.orden, a.titulo");
        $allItems = DB::table('lms_items')->select('id', 'actividad_id')->get();
        $countByAct = [];
        foreach ($allItems as $it) $countByAct[$it->actividad_id] = ($countByAct[$it->actividad_id] ?? 0) + 1;

        $actividades = array_map(fn($a) => [
            'id' => $a->id, 'titulo' => $a->titulo, 'slug' => $a->slug,
            'descripcion' => $a->descripcion ?? '', 'orden' => (int) ($a->orden ?? 0),
            'item_count' => $countByAct[$a->id] ?? 0,
            'categoria' => $a->categoria_id ? ['id' => $a->categoria_id, 'nombre' => $a->cat_nombre ?? '—'] : null,
        ], $rows);

        return response()->json(['actividades' => $actividades]);
    }

    public function publicGetActividad(string $slug)
    {
        if (!preg_match(self::SLUG_RE, $slug)) return response()->json(['error' => 'Actividad no encontrada'], 404);

        $act = DB::selectOne("SELECT a.*, c.nombre AS cat_nombre FROM lms_actividades a LEFT JOIN categorias c ON c.id = a.categoria_id WHERE a.slug = ? AND a.activo = 1 LIMIT 1", [$slug]);
        if (!$act) return response()->json(['error' => 'Actividad no encontrada'], 404);

        $items = DB::table('lms_items')->where('actividad_id', $act->id)->orderBy('orden')->orderBy('created_at')->get();
        $preguntas = $items->map(function ($row) {
            $opciones = json_decode($row->opciones_json, true) ?: [];
            return ['id' => $row->id, 'enunciado' => $row->enunciado, 'tipo' => $row->tipo === 'true_false' ? 'true_false' : 'single', 'opciones' => $opciones, 'orden' => (int) $row->orden];
        });

        return response()->json([
            'actividad' => [
                'id' => $act->id, 'titulo' => $act->titulo, 'slug' => $act->slug, 'descripcion' => $act->descripcion ?? '',
                'categoria' => $act->categoria_id ? ['id' => $act->categoria_id, 'nombre' => $act->cat_nombre ?? '—'] : null,
            ],
            'preguntas' => $preguntas,
        ]);
    }

    public function publicSubmitIntento(Request $request, string $slug)
    {
        if (!preg_match(self::SLUG_RE, $slug)) return response()->json(['error' => 'Actividad no encontrada'], 404);

        $answers = $request->input('answers');
        if (!$answers || !is_array($answers)) return response()->json(['error' => 'Se requiere answers como objeto { [idPregunta]: índice }'], 400);

        $userId = $request->attributes->get('auth_user_public')['id'] ?? null;
        if (!$userId) return response()->json(['error' => 'Usuario no válido'], 401);

        $act = DB::table('lms_actividades')->where('slug', $slug)->where('activo', 1)->first();
        if (!$act) return response()->json(['error' => 'Actividad no encontrada'], 404);

        $items = DB::table('lms_items')->where('actividad_id', $act->id)->orderBy('orden')->orderBy('created_at')->get();
        if ($items->isEmpty()) return response()->json(['error' => 'Esta actividad no tiene preguntas'], 400);

        $puntaje = 0;
        $detalle = [];
        $normalizedAnswers = [];

        foreach ($items as $it) {
            $picked = $answers[$it->id] ?? -1;
            $idx = is_numeric($picked) ? (int) $picked : -1;
            $normalizedAnswers[$it->id] = $idx;
            $correcto = $idx === (int) $it->indice_correcto;
            if ($correcto) $puntaje++;

            $opciones = json_decode($it->opciones_json, true) ?: [];
            $okIdx = (int) $it->indice_correcto;
            $detalle[] = [
                'item_id' => $it->id, 'enunciado' => $it->enunciado ?? '',
                'seleccion' => $idx,
                'texto_seleccion' => ($idx >= 0 && $idx < count($opciones)) ? $opciones[$idx] : '— Sin respuesta —',
                'texto_correcto' => $opciones[$okIdx] ?? '—',
                'correcto' => $correcto, 'indice_correcto' => $okIdx,
                'explicacion' => $it->explicacion ?? '',
            ];
        }

        $maxPuntos = $items->count();
        $intentoId = IdService::newId();
        DB::table('lms_intentos')->insert([
            'id' => $intentoId, 'usuario_id' => $userId, 'actividad_id' => $act->id,
            'respuestas_json' => json_encode($normalizedAnswers), 'puntaje' => $puntaje, 'max_puntos' => $maxPuntos,
        ]);

        return response()->json([
            'intento_id' => $intentoId, 'puntaje' => $puntaje, 'max_puntos' => $maxPuntos,
            'porcentaje' => $maxPuntos ? round(($puntaje / $maxPuntos) * 1000) / 10 : 0,
            'detalle' => $detalle,
        ]);
    }

    public function publicMisIntentos(Request $request)
    {
        $userId = $request->attributes->get('auth_user_public')['id'] ?? null;
        if (!$userId) return response()->json(['error' => 'Usuario no válido'], 401);

        $rows = DB::select("SELECT i.*, a.titulo AS act_titulo, a.slug AS act_slug FROM lms_intentos i LEFT JOIN lms_actividades a ON a.id = i.actividad_id WHERE i.usuario_id = ? ORDER BY i.created_at DESC", [$userId]);
        $items = array_map(fn($r) => [
            'id' => $r->id, 'actividad_id' => $r->actividad_id, 'titulo' => $r->act_titulo,
            'slug' => $r->act_slug, 'puntaje' => (int) $r->puntaje, 'max_puntos' => (int) $r->max_puntos,
            'created' => $r->created_at,
        ], $rows);

        return response()->json(['intentos' => $items]);
    }

    // --- Helpers ---

    private function resolveCategoriaId(Request $request)
    {
        $val = $request->input('categoria_id');
        if ($val === null || $val === '') return null;
        $s = trim((string) $val);
        if (!$s) return null;
        if (!preg_match(self::ID_RE, $s)) return false;
        return $s;
    }

    private static function mapActividad($a): array
    {
        return ['id' => $a->id, 'titulo' => $a->titulo, 'slug' => $a->slug, 'descripcion' => $a->descripcion ?? '', 'orden' => (int) ($a->orden ?? 0), 'activo' => (bool) $a->activo, 'categoria_id' => $a->categoria_id];
    }

    private static function mapItem($it): array
    {
        return [
            'id' => $it->id, 'actividad_id' => $it->actividad_id ?? null,
            'enunciado' => $it->enunciado, 'tipo' => $it->tipo,
            'opciones_json' => $it->opciones_json, 'indice_correcto' => (int) $it->indice_correcto,
            'explicacion' => $it->explicacion ?? '', 'orden' => (int) ($it->orden ?? 0),
        ];
    }

    private static function parseOpciones(Request $request): ?array
    {
        $raw = $request->input('opciones_json', $request->input('opciones'));
        if (is_string($raw)) {
            $v = json_decode($raw, true);
            return is_array($v) && count($v) >= 2 && array_reduce($v, fn($c, $x) => $c && is_string($x), true) ? $v : null;
        }
        if (is_array($raw)) {
            return count($raw) >= 2 && array_reduce($raw, fn($c, $x) => $c && is_string($x), true) ? $raw : null;
        }
        return null;
    }
}
