
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import ResourceCard from '@/components/ResourceCard.jsx';
import apiServerClient from '@/lib/apiServerClient.js';
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
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, Home, FolderOpen, Search, Loader2 } from 'lucide-react';
import { mapCatalogRecursoToCard } from '@/lib/mapCatalogRecursoToCard.js';
import { mergeCategoriaCms } from '@/lib/cms/categoriaCmsModel.js';
import { fillTemplate } from '@/lib/cms/cmsCore.js';

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: '-created', label: 'Más recientes' },
  { value: '-updated', label: 'Última actualización' },
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

const LS_SORT = 'preventivos_cat_sort';
const LS_TIPO = 'preventivos_cat_tipo';

const CategoryDetailsPage = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [category, setCategory] = useState(null);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cms, setCms] = useState(() => mergeCategoriaCms({}));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await apiServerClient.fetch('/catalog/cms/pages/categoria');
        if (!r.ok || cancelled) return;
        const data = await r.json();
        if (!cancelled) setCms(mergeCategoriaCms(data));
      } catch {
        /* */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const k = cms.bloques;

  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const sort = searchParams.get('sort') || (typeof window !== 'undefined' ? localStorage.getItem(LS_SORT) : null) || '-created';
  const tipo = searchParams.get('tipo') || (typeof window !== 'undefined' ? localStorage.getItem(LS_TIPO) : null) || '';
  const qParam = searchParams.get('q') || '';
  const [localQ, setLocalQ] = useState(qParam);

  useEffect(() => {
    setLocalQ(qParam);
  }, [qParam]);

  const updateParams = useCallback((patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === '' || v === '__all__' || v == null) next.delete(k);
      else next.set(k, String(v));
    });
    if (patch.sort != null) {
      try {
        localStorage.setItem(LS_SORT, patch.sort || sort);
      } catch {
        /* ignore */
      }
    }
    if (patch.tipo !== undefined) {
      try {
        if (patch.tipo) localStorage.setItem(LS_TIPO, patch.tipo);
        else localStorage.removeItem(LS_TIPO);
      } catch {
        /* ignore */
      }
    }
    if (!patch.page) next.set('page', '1');
    setSearchParams(next);
  }, [searchParams, setSearchParams, sort]);

  const fetchResources = useCallback(async () => {
    if (!id) {
      setError(k.errInvalid);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        sort,
      });
      if (tipo) params.set('tipo', tipo);
      const q = qParam.trim();
      if (q.length >= 2) params.set('q', q);

      const res = await apiServerClient.fetch(
        `/catalog/categories/${encodeURIComponent(id)}/recursos?${params}`,
      );
      if (res.status === 404) {
        setError(k.errNotFound);
        setCategory(null);
        setItems([]);
        return;
      }
      if (!res.ok) throw new Error(k.errLoad);
      const data = await res.json();
      setCategory(data.category);
      const rows = Array.isArray(data.recursos) ? data.recursos : [];
      setItems(rows.map((r) => mapCatalogRecursoToCard(r)));
      setPagination({
        page: data.pagination?.page ?? page,
        totalPages: data.pagination?.totalPages ?? 1,
        totalItems: data.pagination?.totalItems ?? rows.length,
      });
    } catch (e) {
      setError(e.message || 'Error al cargar');
      setCategory(null);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [id, page, sort, tipo, qParam]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const pageTitle = useMemo(
    () => (category?.nombre ? `${category.nombre} | Preventivos CL` : 'Categoría | Preventivos CL'),
    [category],
  );

  const onSubmitSearch = (e) => {
    e.preventDefault();
    updateParams({ q: localQ.trim(), page: '1' });
  };

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta
          name="description"
          content={category?.descripcion || k.metaDescFallback}
        />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />

        <section className="bg-primary text-primary-foreground py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center text-sm font-medium text-primary-foreground/80 mb-6">
              <Link to="/" className="hover:text-white transition-colors flex items-center">
                <Home className="w-4 h-4 mr-1" />
                {k.crumbInicio}
              </Link>
              <ChevronRight className="w-4 h-4 mx-2" />
              <Link to="/biblioteca" className="hover:text-white/90 transition-colors">
                {k.crumbBiblioteca}
              </Link>
              <ChevronRight className="w-4 h-4 mx-2" />
              <span className="text-white">
                {isLoading ? '…' : category?.nombre || k.fallbackCategoryName}
              </span>
            </nav>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4" style={{ letterSpacing: '-0.02em' }}>
              {isLoading ? <Skeleton className="h-10 w-64 bg-primary-foreground/20" /> : (category?.nombre || k.fallbackCategoryName)}
            </h1>
            <p className="text-lg text-primary-foreground/90 max-w-3xl leading-relaxed">
              {isLoading
                ? <Skeleton className="h-6 w-full max-w-xl bg-primary-foreground/20 mt-2" />
                : (category?.descripcion || k.descFallback)}
            </p>
          </div>
        </section>

        <section className="flex-1 py-12 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {error && (
              <div className="mb-8 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {!error && !isLoading && category && (
              <div className="space-y-6 mb-10">
                <form onSubmit={onSubmitSearch} className="flex flex-col sm:flex-row gap-4 max-w-xl">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder={fillTemplate(k.searchPlaceholderTpl, { nombre: category?.nombre || '' })}
                      value={localQ}
                      onChange={(e) => setLocalQ(e.target.value)}
                      className="pl-10 h-12 bg-background"
                    />
                  </div>
                  <Button type="submit" className="h-12">{k.btnBuscar}</Button>
                </form>

                <div className="grid sm:grid-cols-2 gap-4 max-w-xl">
                  <div className="space-y-2">
                    <Label>{k.labelOrdenar}</Label>
                    <Select
                      value={sort}
                      onValueChange={(v) => updateParams({ sort: v, page: '1' })}
                    >
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
                  <div className="space-y-2">
                    <Label>{k.labelTipo}</Label>
                    <Select
                      value={tipo || '__all__'}
                      onValueChange={(v) =>
                        updateParams({ tipo: v === '__all__' ? '' : v, page: '1' })
                      }
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
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="bg-card rounded-xl p-6 border border-border/50 shadow-sm flex flex-col h-full">
                    <div className="flex gap-4 mb-4">
                      <Skeleton className="w-12 h-12 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/4" />
                      </div>
                    </div>
                    <Skeleton className="h-16 w-full mb-4 flex-1" />
                    <Skeleton className="h-10 w-full rounded-md mt-auto" />
                  </div>
                ))}
              </div>
            ) : items.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground mb-6">
                  {fillTemplate(k.countTpl, {
                    n: pagination.totalItems,
                    plural: pagination.totalItems !== 1 ? 's' : '',
                  })}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map((resource) => (
                    <ResourceCard key={resource.id} resource={resource} />
                  ))}
                </div>
                {pagination.totalPages > 1 && (
                  <div className="flex justify-center gap-4 mt-12">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={page <= 1}
                      onClick={() => updateParams({ page: String(page - 1) })}
                    >
                      {k.btnAnterior}
                    </Button>
                    <span className="text-sm text-muted-foreground self-center tabular-nums">
                      {fillTemplate(k.paginaDeTemplate, { page, pages: pagination.totalPages })}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={page >= pagination.totalPages}
                      onClick={() => updateParams({ page: String(page + 1) })}
                    >
                      {k.btnSiguiente}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-24 bg-card rounded-2xl border border-border/50 max-w-3xl mx-auto">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <FolderOpen className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {error ? k.errTitle : qParam ? k.emptyTitleNoResults : k.emptyTitleVacía}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {error
                    ? k.emptyBodyError
                    : qParam
                      ? fillTemplate(k.emptyBodyQ, { q: qParam })
                      : k.emptyBodyNoQ}
                </p>
                {qParam ? (
                  <Button onClick={() => updateParams({ q: '', page: '1' })} variant="outline">
                    {k.btnLimpiar}
                  </Button>
                ) : (
                  <Button asChild variant="outline">
                    <Link to="/biblioteca">{k.btnVerBiblioteca}</Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default CategoryDetailsPage;
