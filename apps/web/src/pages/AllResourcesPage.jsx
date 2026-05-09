import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import ResourceCard from '@/components/ResourceCard.jsx';
import apiServerClient from '@/lib/apiServerClient.js';
import { mapCatalogRecursoToCard } from '@/lib/mapCatalogRecursoToCard.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Home, ChevronRight, Search, Loader2, Heart } from 'lucide-react';
import {
  MercadoPagoDonationButton,
} from '@/components/MercadoPagoDonationButton.jsx';
import { mergeBibliotecaCms } from '@/lib/cms/bibliotecaCmsModel.js';
import { fillTemplate } from '@/lib/cms/cmsCore.js';

const PAGE_SIZE = 12;
const SORT_OPTIONS = [
  { value: '-updated', label: 'Última actualización' },
  { value: '-created', label: 'Más recientes' },
  { value: 'titulo', label: 'Título A–Z' },
  { value: '-titulo', label: 'Título Z–A' },
];

const TIPOS = [
  { value: '__all__', label: 'Todos los tipos' },
  { value: 'PDF', label: 'PDF' },
  { value: 'DOCX', label: 'DOCX' },
  { value: 'XLSX', label: 'XLSX' },
  { value: 'PPT', label: 'PPT' },
];

const AllResourcesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cms, setCms] = useState(() => mergeBibliotecaCms({}));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await apiServerClient.fetch('/catalog/cms/pages/biblioteca');
        if (!r.ok || cancelled) return;
        const data = await r.json();
        if (!cancelled) setCms(mergeBibliotecaCms(data));
      } catch {
        /* defaults */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const t = cms.bloques;
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0 });
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState(null);

  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const sort = searchParams.get('sort') || '-updated';
  const tipo = searchParams.get('tipo') || '';
  const categoriaId = searchParams.get('categoria') || '';
  const qInput = searchParams.get('q') || '';

  const [localQ, setLocalQ] = useState(qInput);

  useEffect(() => {
    setLocalQ(qInput);
  }, [qInput]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiServerClient.fetch('/catalog/categories');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setCategories(Array.isArray(data.categories) ? data.categories : []);
      } catch {
        /* ignore */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setLoadErr(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        sort,
      });
      if (tipo) params.set('tipo', tipo);
      if (categoriaId) params.set('categoria_id', categoriaId);
      const q = qInput.trim();
      if (q.length >= 2) params.set('q', q);

      const res = await apiServerClient.fetch(`/catalog/recursos?${params}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoadErr(data.error || 'No se pudo cargar la biblioteca');
        setItems([]);
        return;
      }
      const rows = Array.isArray(data.recursos) ? data.recursos : [];
      setItems(rows.map((r) => mapCatalogRecursoToCard(r)));
      setPagination({
        page: data.pagination?.page ?? page,
        totalPages: data.pagination?.totalPages ?? 1,
        totalItems: data.pagination?.totalItems ?? rows.length,
      });
    } catch {
      setLoadErr('Error de red');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, sort, tipo, categoriaId, qInput]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const updateParams = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === '' || v === '__all__' || v == null) next.delete(k);
      else next.set(k, String(v));
    });
    if (!patch.page) next.set('page', '1');
    setSearchParams(next);
  };

  const onSubmitSearch = (e) => {
    e.preventDefault();
    updateParams({ q: localQ.trim(), page: '1' });
  };

  const title = cms.meta_title;

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={cms.meta_description} />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />
        <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center text-sm font-medium text-primary-foreground/80 mb-4">
              <Link to="/" className="hover:text-white transition-colors flex items-center gap-1">
                <Home className="w-4 h-4" />
                {t.crumbInicio}
              </Link>
              <ChevronRight className="w-4 h-4 mx-2" />
              <span className="text-white">{t.crumbBiblioteca}</span>
            </nav>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{t.heroTitle}</h1>
            <p className="mt-2 text-primary-foreground/90 max-w-2xl">
              {t.heroLead}
            </p>
          </div>
        </section>

        <div className="bg-white/95 border-b border-border/60 shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 max-w-4xl">
              <p className="text-sm text-muted-foreground flex items-start gap-2">
                <Heart className="w-4 h-4 text-[#009ee3] shrink-0 mt-0.5" aria-hidden />
                <span>
                  {t.donateLine}
                </span>
              </p>
              <MercadoPagoDonationButton size="default" className="w-full sm:w-auto shrink-0" label="Donar" />
            </div>
          </div>
        </div>

        <main className="flex-1 py-10 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <form onSubmit={onSubmitSearch} className="mb-8 flex flex-col lg:flex-row gap-4 lg:items-end">
              <div className="flex-1 space-y-2 max-w-xl">
                <Label htmlFor="bib-q">{t.labelBuscar}</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="bib-q"
                    className="pl-9"
                    placeholder={t.placeholderBuscar}
                    value={localQ}
                    onChange={(e) => setLocalQ(e.target.value)}
                  />
                </div>
              </div>
              <Button type="submit">{t.btnBuscar}</Button>
            </form>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              <div className="space-y-2">
                <Label>{t.labelCategoria}</Label>
                <Select
                  value={categoriaId || '__all__'}
                  onValueChange={(v) => updateParams({ categoria: v === '__all__' ? '' : v, page: '1' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todas las categorías</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre} ({c.recursos_count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t.labelTipo}</Label>
                <Select
                  value={tipo || '__all__'}
                  onValueChange={(v) => updateParams({ tipo: v === '__all__' ? '' : v, page: '1' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t.labelOrden}</Label>
                <Select value={sort} onValueChange={(v) => updateParams({ sort: v, page: '1' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loadErr && (
              <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {loadErr}
              </div>
            )}

            <p className="text-sm text-muted-foreground mb-6">
              {loading
                ? 'Cargando…'
                : fillTemplate(t.recursosEncontradosTemplate, {
                    n: pagination.totalItems,
                    plural: pagination.totalItems !== 1 ? 's' : '',
                  })}
            </p>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-20 rounded-xl border bg-card text-muted-foreground">
                {t.emptyListMsg}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </div>
            )}

            {!loading && pagination.totalPages > 1 && (
              <div className="flex justify-center gap-4 mt-12">
                <Button
                  type="button"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => updateParams({ page: String(page - 1) })}
                >
                  {t.btnAnterior}
                </Button>
                <span className="text-sm text-muted-foreground self-center tabular-nums">
                  {fillTemplate(t.paginaDeTemplate, { page, pages: pagination.totalPages })}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  disabled={page >= pagination.totalPages}
                  onClick={() => updateParams({ page: String(page + 1) })}
                >
                  {t.btnSiguiente}
                </Button>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default AllResourcesPage;
