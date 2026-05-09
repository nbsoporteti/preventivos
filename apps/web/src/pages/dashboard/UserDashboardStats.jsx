import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import apiServerClient from '@/lib/apiServerClient.js';
import StatisticsCard from '@/components/StatisticsCard.jsx';
import { DownloadCloud, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

function formatRelativeEs(iso) {
	if (!iso) return '—';
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '—';
	const diffMs = Date.now() - d.getTime();
	const sec = Math.floor(diffMs / 1000);
	if (sec < 45) return 'Hace un momento';
	const min = Math.floor(sec / 60);
	if (min < 60) return min <= 1 ? 'Hace 1 minuto' : `Hace ${min} minutos`;
	const h = Math.floor(min / 60);
	if (h < 24) return h === 1 ? 'Hace 1 hora' : `Hace ${h} horas`;
	const days = Math.floor(h / 24);
	if (days === 1) return 'Ayer';
	if (days < 7) return `Hace ${days} días`;
	if (days < 30) {
		const w = Math.floor(days / 7);
		return w <= 1 ? 'Hace 1 semana' : `Hace ${w} semanas`;
	}
	return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
}

const UserDashboardStats = () => {
	const { loading: authLoading } = useAuth();
	const [loading, setLoading] = useState(true);
	const [data, setData] = useState(null);
	const [loadError, setLoadError] = useState(null);

	useEffect(() => {
		if (authLoading) return;

		const token = localStorage.getItem('token');
		if (!token) {
			setLoading(false);
			setData(null);
			setLoadError('No hay sesión');
			return;
		}

		let cancelled = false;
		(async () => {
			setLoading(true);
			setLoadError(null);
			try {
				const res = await apiServerClient.fetch('/users/me/stats', {
					headers: { Authorization: `Bearer ${token}` },
				});
				const json = await res.json().catch(() => ({}));
				if (cancelled) return;
				if (!res.ok) {
					const msg = json.error || 'No se pudieron cargar las estadísticas';
					setLoadError(msg);
					setData(null);
					toast.error(msg);
					return;
				}
				setData(json);
			} catch {
				if (!cancelled) {
					setLoadError('Error de red');
					setData(null);
					toast.error('Error de red al cargar estadísticas');
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [authLoading]);

	if (authLoading || loading) {
		return (
			<div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
				{[1, 2, 3].map((i) => (
					<Skeleton key={i} className="h-32 w-full rounded-xl" />
				))}
			</div>
		);
	}

	if (loadError && !data) {
		return (
			<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-6 text-center text-sm text-destructive">
				{loadError}
			</div>
		);
	}

	const total = data?.totalDownloads ?? 0;
	const fav = data?.favoriteCategory;
	const favPct = data?.favoriteCategoryPct;
	const lastAt = data?.lastDownloadAt;
	const lastTitle = data?.lastResourceTitle;

	return (
		<div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
			<StatisticsCard
				title="Total descargas"
				value={String(total)}
				description="Registros en tu historial"
				icon={DownloadCloud}
			/>
			<StatisticsCard
				title="Categoría más frecuente"
				value={fav || '—'}
				description={
					favPct != null && fav
						? `${favPct}% del total de tus descargas`
						: total === 0
							? 'Descarga recursos para ver tendencias'
							: 'Sin categoría asignada en los recursos'
				}
				icon={Activity}
			/>
			<StatisticsCard
				title="Última descarga"
				value={lastAt ? formatRelativeEs(lastAt) : '—'}
				description={lastTitle || (total === 0 ? 'Aún no hay descargas' : 'Recurso sin título')}
				icon={DownloadCloud}
			/>
		</div>
	);
};

export default UserDashboardStats;
