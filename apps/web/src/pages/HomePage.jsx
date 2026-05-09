
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import SearchBar from '@/components/SearchBar.jsx';
import CategoryFilter from '@/components/CategoryFilter.jsx';
import CategoryCard from '@/components/CategoryCard.jsx';
import ResourceCard from '@/components/ResourceCard.jsx';
import apiServerClient from '@/lib/apiServerClient.js';
import { mapCatalogRecursoToCard } from '@/lib/mapCatalogRecursoToCard.js';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SlidersHorizontal, Library, Star, FolderOpen, Search as SearchIcon, Heart } from 'lucide-react';
import { MercadoPagoDonationButton } from '@/components/MercadoPagoDonationButton.jsx';
import { getFavoriteEntries } from '@/lib/favoritesStorage.js';
import { mergeHomeCms } from '@/lib/cms/homeCmsModel.js';
import { fillTemplate } from '@/lib/cms/cmsCore.js';

const HomePage = () => {
  const searchInputRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTipo, setSearchTipo] = useState('');
  const [searchCategoryId, setSearchCategoryId] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [searchTotal, setSearchTotal] = useState(0);

  const [highlightPopular, setHighlightPopular] = useState([]);
  const [highlightRecent, setHighlightRecent] = useState([]);
  const [highlightsLoading, setHighlightsLoading] = useState(true);

  const [favorites, setFavorites] = useState([]);

  const [cms, setCms] = useState(() => mergeHomeCms({}));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await apiServerClient.fetch('/catalog/cms/pages/inicio');
        if (!r.ok || cancelled) return;
        const data = await r.json();
        if (!cancelled) setCms(mergeHomeCms(data));
      } catch {
        /* defaults */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const b = cms.bloques;

  const refreshFavorites = useCallback(() => {
    setFavorites(getFavoriteEntries());
  }, []);

  useEffect(() => {
    refreshFavorites();
  }, [refreshFavorites]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') refreshFavorites();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [refreshFavorites]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const res = await apiServerClient.fetch('/catalog/categories');
        if (!res.ok) throw new Error('No se pudieron cargar las categorías');
        const data = await res.json();
        if (!cancelled) {
          setCategories(Array.isArray(data.categories) ? data.categories : []);
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e.message || 'Error al cargar el catálogo');
          setCategories([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (isLoading) return undefined;
    let cancelled = false;
    const load = async () => {
      setHighlightsLoading(true);
      try {
        const res = await apiServerClient.fetch('/catalog/highlights?limit=8');
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        const popRaw = Array.isArray(data.popular) ? data.popular : [];
        const recRaw = Array.isArray(data.recent) ? data.recent : [];
        const popularIds = new Set(popRaw.map((r) => r.id));
        const recDeduped = recRaw.filter((r) => !popularIds.has(r.id));
        setHighlightPopular(popRaw.map((r) => mapCatalogRecursoToCard(r)));
        setHighlightRecent(recDeduped.map((r) => mapCatalogRecursoToCard(r)));
      } catch {
        if (!cancelled) {
          setHighlightPopular([]);
          setHighlightRecent([]);
        }
      } finally {
        if (!cancelled) setHighlightsLoading(false);
      }
    };

    let timerId;
    let usedIdle = false;
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      usedIdle = true;
      timerId = window.requestIdleCallback(() => { load(); }, { timeout: 1800 });
    } else {
      timerId = setTimeout(load, 120);
    }

    return () => {
      cancelled = true;
      if (usedIdle && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(timerId);
      } else {
        clearTimeout(timerId);
      }
    };
  }, [isLoading]);

  useEffect(() => {
    let cancelled = false;
    const q = searchTerm.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError(null);
      setSearchTotal(0);
      return undefined;
    }
    setSearchLoading(true);
    setSearchError(null);
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q, limit: '50', page: '1' });
        if (searchTipo) params.set('tipo', searchTipo);
        if (searchCategoryId) params.set('categoria_id', searchCategoryId);
        const res = await apiServerClient.fetch(`/catalog/search?${params}`);
        if (cancelled) return;
        if (!res.ok) {
          setSearchError('No se pudo buscar recursos');
          setSearchResults([]);
          setSearchTotal(0);
          return;
        }
        const data = await res.json();
        const rows = Array.isArray(data.recursos) ? data.recursos : [];
        setSearchResults(rows.map((r) => mapCatalogRecursoToCard(r)));
        setSearchTotal(data.pagination?.totalItems ?? rows.length);
      } catch {
        if (!cancelled) {
          setSearchError('No se pudo buscar recursos');
          setSearchResults([]);
          setSearchTotal(0);
        }
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchTerm, searchTipo, searchCategoryId]);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      const diff = (b.recursos_count || 0) - (a.recursos_count || 0);
      if (diff !== 0) return diff;
      return (a.nombre || '').localeCompare(b.nombre || '', 'es');
    });
  }, [categories]);

  const quickFilters = useMemo(
    () => sortedCategories.slice(0, 4).map((c) => c.nombre),
    [sortedCategories],
  );

  const handleCategoryChange = (categoryName, checked) => {
    if (checked) {
      setSelectedCategories([...selectedCategories, categoryName]);
    } else {
      setSelectedCategories(selectedCategories.filter((c) => c !== categoryName));
    }
  };

  const handleQuickFilterClick = (filter) => {
    if (selectedCategories.includes(filter)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== filter));
    } else {
      setSelectedCategories([...selectedCategories, filter]);
    }
  };

  const filteredCategories = sortedCategories.filter((category) => {
    const matchesSearch =
      category.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      selectedCategories.length === 0 || selectedCategories.includes(category.nombre);
    return matchesSearch && matchesFilter;
  });

  const filterCategories = sortedCategories.map((c) => ({
    id: c.id,
    name: c.nombre,
    icon: c.icono || 'Shield',
  }));

  const categoriesForCards = filteredCategories.map((c) => ({
    ...c,
    icono: c.icono || 'Shield',
  }));

  const searchMoreHref = useMemo(() => {
    const p = new URLSearchParams();
    const q = searchTerm.trim();
    if (q.length >= 2) p.set('q', q);
    if (searchTipo) p.set('tipo', searchTipo);
    if (searchCategoryId) p.set('categoria', searchCategoryId);
    const qs = p.toString();
    return qs ? `/biblioteca?${qs}` : '/biblioteca';
  }, [searchTerm, searchTipo, searchCategoryId]);

  const scrollToBuscar = () => {
    document.getElementById('buscar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => searchInputRef.current?.focus(), 450);
  };

  const scrollToExplorar = () => {
    document.getElementById('explorar-categorias')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const hasHighlightSection =
    !highlightsLoading && (highlightPopular.length > 0 || highlightRecent.length > 0);
  const defaultHighlightTab = highlightPopular.length > 0 ? 'popular' : 'recent';

  return (
    <>
      <Helmet>
        <title>{cms.meta_title}</title>
        <meta name="description" content={cms.meta_description} />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />

        <main id="main-content">
          <section
            className="bg-gradient-to-br from-primary via-primary/88 to-slate-800 text-white py-16 md:py-20 relative overflow-hidden"
            aria-labelledby="hero-heading"
          >
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1685631188070-e5d4c9b2df6d')] bg-cover bg-center opacity-[0.12] mix-blend-overlay pointer-events-none" />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <p className="text-sm font-medium uppercase tracking-wider text-white/75 mb-3">
                    {b.heroEyebrow}
                  </p>
                  <h1
                    id="hero-heading"
                    className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4"
                    style={{ letterSpacing: '-0.02em', textWrap: 'balance' }}
                  >
                    {b.heroTitle}
                  </h1>
                  <p className="text-lg md:text-xl leading-relaxed mb-3 text-white/90 max-w-prose">
                    {b.heroLead}
                  </p>
                  <p className="text-sm text-white/75 mb-8 max-w-prose border-l-2 border-white/30 pl-4">
                    {b.heroBulletLine}
                  </p>
                  <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                    <Button
                      type="button"
                      size="lg"
                      variant="secondary"
                      className="bg-white text-primary hover:bg-white/95 shadow-md"
                      onClick={scrollToExplorar}
                    >
                      <FolderOpen className="w-5 h-5 mr-2" />
                      {b.heroBtnExplorar}
                    </Button>
                    <Button
                      type="button"
                      size="lg"
                      variant="outline"
                      className="border-white/80 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
                      onClick={scrollToBuscar}
                    >
                      <SearchIcon className="w-5 h-5 mr-2" />
                      {b.heroBtnBuscar}
                    </Button>
                  </div>
                  <p className="mt-6">
                    <Link
                      to="/biblioteca"
                      className="inline-flex items-center gap-2 text-sm font-medium text-white/90 underline-offset-4 hover:underline"
                    >
                      <Library className="w-4 h-4" />
                      {b.heroCatalogLink}
                    </Link>
                  </p>
                </div>
                <div className="hidden lg:block">
                  <img
                    src="https://images.unsplash.com/photo-1685631188070-e5d4c9b2df6d"
                    alt=""
                    className="rounded-2xl shadow-2xl object-cover h-[380px] w-full ring-1 ring-white/10"
                    decoding="async"
                  />
                </div>
              </div>
            </div>
          </section>

          <aside
            className="bg-gradient-to-r from-sky-50/90 via-background to-primary/5 border-y border-primary/15"
            aria-label="Colaboración con el proyecto"
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 max-w-5xl mx-auto">
                <div className="flex gap-3">
                  <div className="hidden sm:flex h-11 w-11 shrink-0 rounded-xl bg-[#009ee3]/15 items-center justify-center">
                    <Heart className="w-5 h-5 text-[#009ee3]" aria-hidden />
                  </div>
                  <p className="text-sm md:text-[15px] text-foreground/90 leading-relaxed max-w-xl">
                    <span className="font-semibold text-foreground">{b.asideBold}</span>{' '}
                    {b.asideRest}
                  </p>
                </div>
                <MercadoPagoDonationButton className="w-full md:w-auto shrink-0" size="default" />
              </div>
            </div>
          </aside>

          <section
            id="buscar"
            className="py-8 bg-white shadow-sm border-b border-border/50 scroll-mt-24"
            aria-labelledby="buscar-heading"
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <h2 id="buscar-heading" className="text-lg font-semibold text-foreground mb-4">
                {b.buscarHeading}
              </h2>
              <SearchBar
                ref={searchInputRef}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                quickFilters={quickFilters}
                onQuickFilterClick={handleQuickFilterClick}
                selectedQuickFilters={selectedCategories}
                fileType={searchTipo}
                onFileTypeChange={setSearchTipo}
                categoryId={searchCategoryId}
                onCategoryIdChange={setSearchCategoryId}
                categoryOptions={sortedCategories}
              />
            </div>
          </section>

          <section className="flex-1 py-12 bg-muted/30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              {loadError && (
                <div className="mb-8 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {loadError} {b.loadErrorHint}
                </div>
              )}

              {highlightsLoading && (
                <div className="mb-14 flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden />
                  {b.highlightsLoadingLabel}
                </div>
              )}

              {hasHighlightSection && (
                <div className="mb-14">
                  <h2 className="text-2xl font-bold tracking-tight mb-1">{b.destTitle}</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    {b.destSubtitle}
                  </p>
                  <Tabs defaultValue={defaultHighlightTab} className="w-full">
                    <TabsList className="mb-6 h-auto flex-wrap justify-start gap-1 bg-muted/80 p-1">
                      {highlightPopular.length > 0 && (
                        <TabsTrigger value="popular" className="data-[state=active]:bg-background">
                          {b.tabPopular}
                        </TabsTrigger>
                      )}
                      {highlightRecent.length > 0 && (
                        <TabsTrigger value="recent" className="data-[state=active]:bg-background">
                          {b.tabRecent}
                        </TabsTrigger>
                      )}
                    </TabsList>
                    {highlightPopular.length > 0 && (
                      <TabsContent value="popular" className="mt-0 focus-visible:outline-none">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {highlightPopular.map((resource) => (
                            <ResourceCard key={`pop-${resource.id}`} resource={resource} highlight="popular" />
                          ))}
                        </div>
                      </TabsContent>
                    )}
                    {highlightRecent.length > 0 && (
                      <TabsContent value="recent" className="mt-0 focus-visible:outline-none">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {highlightRecent.map((resource) => (
                            <ResourceCard key={`rec-${resource.id}`} resource={resource} highlight="recent" />
                          ))}
                        </div>
                      </TabsContent>
                    )}
                  </Tabs>
                </div>
              )}

              {favorites.length > 0 && (
                <div className="mb-14 rounded-2xl border border-amber-200/60 bg-amber-50/50 dark:bg-amber-950/25 p-6 md:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <Star className="w-6 h-6 text-amber-600 fill-amber-400/30" aria-hidden />
                      <h2 className="text-xl font-bold">{b.favTitle}</h2>
                    </div>
                    <Button variant="outline" size="sm" asChild className="shrink-0 border-amber-300/80">
                      <Link to="/biblioteca">{b.favLinkBiblioteca}</Link>
                    </Button>
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {favorites.slice(0, 9).map((f) => (
                      <li key={f.id}>
                        <Link
                          to={`/recurso/${f.id}`}
                          className="block rounded-xl border border-amber-200/80 bg-background/80 p-4 shadow-sm transition hover:border-amber-400/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <p className="font-medium text-foreground line-clamp-2 leading-snug">{f.title}</p>
                          <p className="text-xs text-muted-foreground mt-2">{f.category}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 font-mono">{f.fileType}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <aside className="hidden lg:block" aria-label="Filtrar categorías en la lista">
                  <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50 sticky top-24">
                    {isLoading ? (
                      <p className="text-sm text-muted-foreground">Cargando filtros…</p>
                    ) : (
                      <CategoryFilter
                        categories={filterCategories}
                        selectedCategories={selectedCategories}
                        onCategoryChange={handleCategoryChange}
                      />
                    )}
                  </div>
                </aside>

                <div className="lg:hidden mb-6 space-y-2">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="w-full bg-card">
                        <SlidersHorizontal className="w-4 h-4 mr-2" />
                        {b.filtrosBtnLabel}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left">
                      <p className="text-sm text-muted-foreground mt-10 mb-4">
                        {fillTemplate(b.filtrosCountTemplate, {
                          current: categoriesForCards.length,
                          total: sortedCategories.length,
                        })}
                      </p>
                      <div className="mt-2">
                        {!isLoading && (
                          <CategoryFilter
                            categories={filterCategories}
                            selectedCategories={selectedCategories}
                            onCategoryChange={handleCategoryChange}
                          />
                        )}
                      </div>
                    </SheetContent>
                  </Sheet>
                  <p className="text-center text-sm text-muted-foreground">
                    {fillTemplate(b.filtrosCountTemplate, {
                      current: categoriesForCards.length,
                      total: sortedCategories.length,
                    })}
                  </p>
                </div>

                <div className="lg:col-span-3" id="explorar-categorias">
                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 scroll-mt-24">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">{b.exploreTitle}</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        {b.exploreSubtitle}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground tabular-nums hidden sm:block">
                      {b.exploreCountLead}
                      <strong>{categoriesForCards.length}</strong>
                      {fillTemplate(b.exploreCountMid, { total: sortedCategories.length })}
                    </p>
                  </div>
                  {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <div
                          key={n}
                          className="rounded-2xl border border-sky-300/50 bg-gradient-to-br from-white via-sky-50 to-blue-50 ring-1 ring-inset ring-white/70 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06)] dark:border-slate-600/60 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 dark:ring-white/[0.06] p-6 flex flex-col h-[320px]"
                        >
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <Skeleton className="w-14 h-14 rounded-xl" />
                            <Skeleton className="h-6 w-20 rounded-full" />
                          </div>
                          <Skeleton className="h-6 w-4/5 mb-3" />
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-5/6 mb-auto" />
                          <Skeleton className="h-10 w-full rounded-md mt-6" />
                        </div>
                      ))}
                    </div>
                  ) : categoriesForCards.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {categoriesForCards.map((category) => (
                        <CategoryCard key={category.id} category={category} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-24 bg-card rounded-2xl border border-border/50">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                        <SlidersHorizontal className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{b.emptyCatTitle}</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        {b.emptyCatBody}
                      </p>
                      <Button
                        variant="outline"
                        className="mt-6"
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedCategories([]);
                        }}
                      >
                        {b.emptyCatBtn}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {searchTerm.trim().length >= 2 && (
                <div
                  id="resultados-busqueda"
                  className="mt-14 border-t border-border/50 pt-12 scroll-mt-24"
                  role="region"
                  aria-live="polite"
                  aria-labelledby="resultados-busqueda-heading"
                >
                  <h2 id="resultados-busqueda-heading" className="text-2xl font-bold tracking-tight mb-2">
                    {b.searchResultsTitle}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    {fillTemplate(b.searchResultsForQ, { q: searchTerm.trim() })}
                    {searchTotal
                      ? fillTemplate(b.searchResultsTotalPart, { total: searchTotal })
                      : ''}
                    . {b.searchResultsFooter}
                  </p>
                  {searchError && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive mb-6">
                      {searchError}
                    </div>
                  )}
                  {searchLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[1, 2, 3].map((n) => (
                        <div key={n} className="rounded-xl border border-border/40 bg-card p-6 h-[280px] flex flex-col">
                          <div className="flex justify-between mb-4">
                            <Skeleton className="h-12 w-12 rounded-lg" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                          </div>
                          <Skeleton className="h-5 w-3/4 mb-3" />
                          <Skeleton className="h-4 w-full flex-1 mb-4" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      ))}
                    </div>
                  )}
                  {!searchLoading && !searchError && searchResults.length === 0 && (
                    <p className="text-muted-foreground text-center py-12 bg-card rounded-xl border border-border/50">
                      {b.searchNoResultsMsg}
                    </p>
                  )}
                  {!searchLoading && searchResults.length > 0 && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {searchResults.map((resource) => (
                          <ResourceCard key={resource.id} resource={resource} />
                        ))}
                      </div>
                      <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
                        <Button asChild variant="default">
                          <Link to={searchMoreHref}>{b.searchContinueBiblioteca}</Link>
                        </Button>
                        <Button type="button" variant="outline" onClick={scrollToBuscar}>
                          {b.searchRefineSearch}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default HomePage;
