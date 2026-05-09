<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Services\IdService;
use App\Services\DownloadQuotaService;

class DownloadController
{
    public function download(Request $request, string $resourceId)
    {
        $user = $request->attributes->get('auth_user');
        $userId = $user->id;
        $ip = explode(',', $request->header('X-Forwarded-For', $request->ip()))[0] ?? 'unknown';

        $recurso = DB::table('recursos')->where('id', $resourceId)->first();
        if (!$recurso) return response()->json(['error' => 'Recurso no encontrado'], 404);
        if (!$recurso->activo) return response()->json(['error' => 'Recurso no encontrado'], 404);

        $dailyLimit = DownloadQuotaService::getDailyLimit($user);
        if (is_finite($dailyLimit)) {
            $used = DownloadQuotaService::countDownloadsToday($userId);
            if ($used >= $dailyLimit) {
                return response()->json([
                    'error' => "Has alcanzado el límite diario de descargas ({$dailyLimit}). Prueba mañana o contacta al administrador.",
                    'limite' => $dailyLimit,
                    'usado' => $used,
                ], 429);
            }
        }

        $content = null;
        $contentType = 'application/octet-stream';

        if ($recurso->archivo_path) {
            $diskPath = $recurso->archivo_path;
            if (!Storage::disk('uploads')->exists($diskPath)) {
                return response()->json(['error' => 'El recurso no tiene archivo asociado'], 404);
            }
            $content = Storage::disk('uploads')->get($diskPath);
            $fn = $recurso->archivo_url ?? '';
            if (str_ends_with(strtolower($fn), '.pdf')) $contentType = 'application/pdf';
        } elseif ($recurso->ruta_archivo && str_starts_with($recurso->ruta_archivo, 'http')) {
            try {
                $ctx = stream_context_create(['http' => ['timeout' => 30, 'follow_location' => true]]);
                $content = file_get_contents($recurso->ruta_archivo, false, $ctx);
                if ($content === false) throw new \Exception('fetch failed');
                $headers = $http_response_header ?? [];
                foreach ($headers as $h) {
                    if (stripos($h, 'content-type:') === 0) {
                        $contentType = trim(substr($h, 13));
                        break;
                    }
                }
            } catch (\Throwable $e) {
                return response()->json(['error' => 'No se pudo obtener el archivo'], 502);
            }
        } else {
            return response()->json(['error' => 'El recurso no tiene archivo asociado'], 404);
        }

        // Record download
        try {
            $dlId = IdService::newId();
            DB::table('descargas_historial')->insert([
                'id' => $dlId, 'usuario_id' => $userId,
                'recurso_id' => $resourceId, 'ip_usuario' => trim($ip),
            ]);
        } catch (\Throwable $e) {
            // Non-blocking
        }

        $safeName = preg_replace('/[^\w\s\-\.]+/u', '_', $recurso->titulo ?? 'recurso');
        $safeName = mb_substr($safeName, 0, 120);
        $ext = ($recurso->tipo_archivo === 'PDF' && !str_contains($safeName, '.')) ? '.pdf' : '';

        return response($content, 200)
            ->header('Content-Type', $contentType)
            ->header('Content-Disposition', "attachment; filename=\"{$safeName}{$ext}\"");
    }
}
