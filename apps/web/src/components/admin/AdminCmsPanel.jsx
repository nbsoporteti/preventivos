import React, { useEffect, useState } from 'react';
import apiServerClient from '@/lib/apiServerClient.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ExternalLink, Loader2, Save } from 'lucide-react';
import { CMS_PAGE_REGISTRY, CMS_PAGE_ORDER, cmsPreviewPath } from '@/lib/cms/cmsRegistry.js';

const AdminCmsPanel = () => {
	const [slug, setSlug] = useState(CMS_PAGE_ORDER[0] || 'inicio');
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const cfg0 = CMS_PAGE_REGISTRY[slug];
	const [merged, setMerged] = useState(() => cfg0?.merge({}) || { meta_title: '', meta_description: '', bloques: {} });

	useEffect(() => {
		const cfg = CMS_PAGE_REGISTRY[slug];
		if (!cfg) {
			setLoading(false);
			return undefined;
		}
		setMerged(cfg.merge({}));
		let cancelled = false;
		(async () => {
			setLoading(true);
			try {
				const token = localStorage.getItem('token');
				const res = await apiServerClient.fetch(`/admin/cms/pages/${encodeURIComponent(slug)}`, {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (!res.ok) {
					const err = await res.json().catch(() => ({}));
					throw new Error(err.error || 'No se pudo cargar');
				}
				const data = await res.json();
				if (!cancelled) setMerged(cfg.merge(data));
			} catch (e) {
				if (!cancelled) {
					toast.error(e.message || 'Error al cargar el CMS');
					setMerged(cfg.merge({}));
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [slug]);

	const setBloque = (key, value) => {
		setMerged((m) => ({
			...m,
			bloques: { ...m.bloques, [key]: value },
		}));
	};

	const save = async () => {
		const cfg = CMS_PAGE_REGISTRY[slug];
		if (!cfg) {
			toast.error('Página no configurada');
			return;
		}
		setSaving(true);
		try {
			const token = localStorage.getItem('token');
			const bloques = cfg.save(merged);
			const res = await apiServerClient.fetch(`/admin/cms/pages/${encodeURIComponent(slug)}`, {
				method: 'PUT',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					meta_title: merged.meta_title,
					meta_description: merged.meta_description,
					bloques,
				}),
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error(err.error || 'No se pudo guardar');
			}
			const data = await res.json();
			setMerged(cfg.merge(data));
			toast.success('Página guardada');
		} catch (e) {
			toast.error(e.message || 'Error al guardar');
		} finally {
			setSaving(false);
		}
	};

	const cfg = CMS_PAGE_REGISTRY[slug];
	const previewHref = cmsPreviewPath(slug);

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
				<div className="space-y-2 max-w-lg">
					<Label>Página</Label>
					<Select value={slug} onValueChange={setSlug}>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent className="max-h-[min(24rem,70vh)]">
							{CMS_PAGE_ORDER.map((s) => (
								<SelectItem key={s} value={s}>
									{CMS_PAGE_REGISTRY[s]?.label || s}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button variant="outline" size="sm" asChild>
						<a href={previewHref} target="_blank" rel="noopener noreferrer" className="gap-2">
							<ExternalLink className="w-4 h-4" />
							Ver en el sitio
						</a>
					</Button>
					<Button size="sm" onClick={save} disabled={saving || loading || !cfg} className="gap-2">
						{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
						Guardar cambios
					</Button>
				</div>
			</div>

			{loading ? (
				<div className="flex justify-center py-16">
					<Loader2 className="w-8 h-8 animate-spin text-primary" />
				</div>
			) : cfg ? (
				<div className="space-y-10">
					{cfg.fieldGroups.map((group) => (
						<div key={group.title} className="space-y-4">
							<h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
								{group.title}
							</h3>
							<div className="grid gap-6 max-w-3xl">
								{group.fields.map((f) => {
									if (f.type === 'meta' && f.key === '_meta_title') {
										return (
											<div key={f.key} className="space-y-2">
												<Label htmlFor={`${slug}-${f.key}`}>{f.label}</Label>
												<Input
													id={`${slug}-${f.key}`}
													value={merged.meta_title}
													onChange={(e) =>
														setMerged((m) => ({ ...m, meta_title: e.target.value }))
													}
												/>
											</div>
										);
									}
									if (f.type === 'meta' && f.key === '_meta_description') {
										return (
											<div key={f.key} className="space-y-2">
												<Label htmlFor={`${slug}-${f.key}`}>{f.label}</Label>
												<Textarea
													id={`${slug}-${f.key}`}
													rows={f.rows || 2}
													value={merged.meta_description}
													onChange={(e) =>
														setMerged((m) => ({ ...m, meta_description: e.target.value }))
													}
												/>
											</div>
										);
									}
									const rows = f.rows || 2;
									return (
										<div key={f.key} className="space-y-2">
											<Label htmlFor={`${slug}-${f.key}`}>{f.label || f.key}</Label>
											<Textarea
												id={`${slug}-${f.key}`}
												rows={rows}
												value={merged.bloques[f.key] ?? ''}
												onChange={(e) => setBloque(f.key, e.target.value)}
											/>
										</div>
									);
								})}
							</div>
						</div>
					))}
				</div>
			) : null}
		</div>
	);
};

export default AdminCmsPanel;
