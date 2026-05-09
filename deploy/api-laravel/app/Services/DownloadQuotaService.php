<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DownloadQuotaService
{
    public static function getDailyLimit($userRecord): float
    {
        $rol = $userRecord->rol ?? 'usuario';
        if ($rol === 'admin') {
            return INF;
        }

        $roleName = $rol === 'admin' ? 'Admin' : 'Usuario';
        $row = DB::table('roles')->where('nombre', $roleName)->first();
        $n = $row ? (int) $row->limite_descargas_diarias : 10;
        return $n >= 0 ? $n : 10;
    }

    public static function countDownloadsToday(string $userId): int
    {
        $start = Carbon::today('UTC');
        $end = Carbon::tomorrow('UTC');

        return (int) DB::table('descargas_historial')
            ->where('usuario_id', $userId)
            ->where('fecha_descarga', '>=', $start)
            ->where('fecha_descarga', '<', $end)
            ->count();
    }
}
