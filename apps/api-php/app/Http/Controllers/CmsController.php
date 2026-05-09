<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\IdService;

class CmsController
{
    private const ALLOWED_SLUGS = [
        'inicio', 'donar', 'nosotros', 'contacto', 'biblioteca',
        'recurso', 'categoria', 'aprende', 'login', 'registro',
        'verificar_email', 'recuperar_contrasena', 'resetear_contrasena',
    ];

    private const SLUG_RE = '/^[a-z0-9][a-z0-9_\-]{0,63}$/';

    public function listPages()
    {
        $rows = DB::table('cms_paginas')->orderBy('slug')->get();
        return response()->json([
            'pages' => $rows->map(fn($r) => [
                'id' => $r->id,
                'slug' => $r->slug,
                'meta_title' => $r->meta_title ?? '',
                'meta_description' => $r->meta_description ?? '',
                'updated' => $r->updated_at,
            ]),
        ]);
    }

    public function getPage(string $slug)
    {
        if (!preg_match(self::SLUG_RE, $slug) || !in_array($slug, self::ALLOWED_SLUGS)) {
            return response()->json(['error' => 'Página no encontrada'], 404);
        }

        $rec = DB::table('cms_paginas')->where('slug', $slug)->first();
        if (!$rec) {
            return response()->json([
                'slug' => $slug,
                'meta_title' => '',
                'meta_description' => '',
                'bloques' => (object) [],
                'exists' => false,
            ]);
        }

        return response()->json([
            'id' => $rec->id,
            'slug' => $rec->slug,
            'meta_title' => $rec->meta_title ?? '',
            'meta_description' => $rec->meta_description ?? '',
            'bloques' => self::parseBloques($rec->bloques_json),
            'exists' => true,
        ]);
    }

    public function putPage(Request $request, string $slug)
    {
        if (!preg_match(self::SLUG_RE, $slug) || !in_array($slug, self::ALLOWED_SLUGS)) {
            return response()->json(['error' => 'Página no encontrada'], 404);
        }

        $bloques = $request->input('bloques');
        if ($bloques !== null && (!is_array($bloques) && !is_object($bloques))) {
            return response()->json(['error' => 'bloques debe ser un objeto JSON'], 400);
        }

        $jsonStr = json_encode($bloques ?? (object) []);
        if (strlen($jsonStr) > 100000) {
            return response()->json(['error' => 'Contenido demasiado largo'], 400);
        }

        $metaTitle = $request->has('meta_title') ? mb_substr((string) $request->input('meta_title'), 0, 200) : '';
        $metaDesc = $request->has('meta_description') ? mb_substr((string) $request->input('meta_description'), 0, 500) : '';

        $existing = DB::table('cms_paginas')->where('slug', $slug)->first();

        if ($existing) {
            $mt = $request->has('meta_title') ? $metaTitle : $existing->meta_title;
            $md = $request->has('meta_description') ? $metaDesc : $existing->meta_description;

            DB::table('cms_paginas')->where('id', $existing->id)->update([
                'bloques_json' => $jsonStr,
                'meta_title' => $mt,
                'meta_description' => $md,
                'updated_at' => now(),
            ]);

            $updated = DB::table('cms_paginas')->where('id', $existing->id)->first();
            return response()->json([
                'id' => $updated->id,
                'slug' => $updated->slug,
                'meta_title' => $updated->meta_title ?? '',
                'meta_description' => $updated->meta_description ?? '',
                'bloques' => self::parseBloques($updated->bloques_json),
            ]);
        }

        $id = IdService::newId();
        DB::table('cms_paginas')->insert([
            'id' => $id,
            'slug' => $slug,
            'meta_title' => $metaTitle,
            'meta_description' => $metaDesc,
            'bloques_json' => $jsonStr,
        ]);

        $created = DB::table('cms_paginas')->where('id', $id)->first();
        return response()->json([
            'id' => $created->id,
            'slug' => $created->slug,
            'meta_title' => $created->meta_title ?? '',
            'meta_description' => $created->meta_description ?? '',
            'bloques' => self::parseBloques($created->bloques_json),
        ]);
    }

    public function publicPage(string $slug)
    {
        if (!preg_match(self::SLUG_RE, $slug) || !in_array($slug, self::ALLOWED_SLUGS)) {
            return response()->json(['error' => 'Página no encontrada'], 404);
        }

        $rec = DB::table('cms_paginas')->where('slug', $slug)->first();
        if (!$rec) {
            return response()->json([
                'slug' => $slug,
                'meta_title' => '',
                'meta_description' => '',
                'bloques' => (object) [],
            ]);
        }

        return response()->json([
            'slug' => $slug,
            'meta_title' => $rec->meta_title ?? '',
            'meta_description' => $rec->meta_description ?? '',
            'bloques' => self::parseBloques($rec->bloques_json),
        ]);
    }

    private static function parseBloques($raw): object
    {
        if (!$raw) return (object) [];
        $decoded = json_decode($raw, false);
        return is_object($decoded) ? $decoded : (object) [];
    }
}
