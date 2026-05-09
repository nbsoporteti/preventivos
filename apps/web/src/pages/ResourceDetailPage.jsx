import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, ChevronRight, Download, Calendar, HardDrive, History, Star, Loader2, Tag, Heart } from 'lucide-react';
import apiServerClient from '@/lib/apiServerClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { toast } from 'sonner';
import { getCategoryBadgeClass } from '@/lib/categoryVisual.js';
import { isFavorite, toggleFavorite } from '@/lib/favoritesStorage.js';
import { mapCatalogRecursoToCard } from '@/lib/mapCatalogRecursoToCard.js';
import {
  MercadoPagoDonationButton,
} from '@/components/MercadoPagoDonationButton.jsx';
import { mergeRecursoCms } from '@/lib/cms/recursoCmsModel.js';

const ResourceDetailPage = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [recurso, setRecurso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [fav, setFav] = useState(false);
  const [cms, setCms] = useState(() => mergeRecursoCms({}));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await apiServerClient.fetch('/catalog/cms/pages/recurso');
        if (!r.ok || cancelled) return;
        const data = await r.json();
        if (!cancelled) setCms(mergeRecursoCms(data));
      } catch {
        /* */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const x = cms.bloques;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) {
        setErr(x.errInvalidLink);
        setLoading(false);
        return;
      }
      setLoading(true);
      setErr(null);
      try {
        const res = await apiServerClient.fetch(`/catalog/recursos/${encodeURIComponent(id)}`);
        if (res.status === 404) {
          if (!cancelled) {
            setErr(x.errNotFound);
            setRecurso(null);
          }
          return;
        }
        if (!res.ok) throw new Error('Error al cargar');
        const data = await res.json();
        if (cancelled) return;
        setRecurso(data.recurso);
        setFav(isFavorite(id));
      } catch {
        if (!cancelled) {
          setErr(x.errLoad);
          setRecurso(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const card = recurso ? mapCatalogRecursoToCard(recurso) : null;
  const title = card?.title || 'Recurso';
  const desc = (recurso?.descripcion || '').slice(0, 160);
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const canonical = `${siteUrl}/recurso/${id}`;

  const handleDownload = useCallback(async () => {
    if (!recurso?.id) return;
    if (!isAuthenticated) {
      toast.message('Inicia sesión para descargar');
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    setDownloading(true);
    try {
      const { ok, blob, filename, error, status } = await apiServerClient.downloadResourceBlob(recurso.id, token);
      if (!ok || !blob) {
        const msg = error?.error || error?.message || 'No se pudo descargar';
        if (status === 429) toast.error(msg, { duration: 6000 });
        else toast.error(msg);
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Descarga iniciada');
    } catch {
      toast.error('Error de red');
    } finally {
      setDownloading(false);
    }
  }, [recurso, isAuthenticated, navigate, location.pathname]);

  const handleFav = () => {
    if (!card) return;
    const next = toggleFavorite({
      id: card.id,
      title: card.title,
      category: card.category,
      fileType: card.fileType,
    });
    setFav(next);
    toast.message(next ? 'Guardado en favoritos' : 'Quitado de favoritos');
  };

  const catClass = card ? getCategoryBadgeClass(card.category, card.categoryId) : '';

  return (
    <>
      <Helmet>
        <title>{`${title} | Biblioteca | Preventivos CL`}</title>
        <meta name="description" content={desc || `Descarga ${title} desde la biblioteca Preventivos CL.`} />
        <meta property="og:title" content={`${title} | Preventivos CL`} />
        <meta property="og:description" content={desc || `Recurso de ${card?.category || 'prevención'}`} />
        <meta property="og:type" content="article" />
        {canonical && <meta property="og:url" content={canonical} />}
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />
        <section className="bg-primary text-primary-foreground py-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex flex-wrap items-center text-sm font-medium text-primary-foreground/80 mb-4 gap-y-1">
              <Link to="/" className="hover:text-white transition-colors flex items-center">
                <Home className="w-4 h-4 mr-1" />
                {x.crumbInicio}
              </Link>
              <ChevronRight className="w-4 h-4 mx-2" />
              <Link to="/biblioteca" className="hover:text-white transition-colors">
                {x.crumbBiblioteca}
              </Link>
              {card?.category && (
                <>
                  <ChevronRight className="w-4 h-4 mx-2" />
                  <Link
                    to={`/category/${recurso.categoria_id}`}
                    className="hover:text-white transition-colors"
                  >
                    {card.category}
                  </Link>
                </>
              )}
            </nav>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight pr-4">
              {loading ? x.loadingTitle : title}
            </h1>
          </div>
        </section>

        <main className="flex-1 py-12 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
            {loading && (
              <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
                {x.cargando}
              </div>
            )}
            {!loading && err && (
              <Card className="border-destructive/30">
                <CardContent className="py-12 text-center">
                  <p className="text-destructive mb-6">{err}</p>
                  <Button asChild variant="outline">
                    <Link to="/biblioteca">{x.errCardBtn}</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
            {!loading && !err && recurso && card && (
              <div className="space-y-8">
                <div className="flex flex-wrap gap-2 items-center">
                  <Badge className={`${catClass} border-none`}>{card.category}</Badge>
                  <Badge variant="outline" className="font-mono">{card.fileType}</Badge>
                  {typeof recurso.download_count === 'number' && recurso.download_count > 0 && (
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {recurso.download_count} {x.descargasWord}
                    </span>
                  )}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">{x.descCardTitle}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {recurso.descripcion || x.sinDescripcion}
                    </p>
                    {Array.isArray(recurso.etiquetas) && recurso.etiquetas.length > 0 && (
                      <div className="flex flex-wrap gap-2 items-center">
                        <Tag className="w-4 h-4 text-muted-foreground" />
                        {recurso.etiquetas.map((t) => (
                          <Badge key={t} variant="secondary">{t}</Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-6 text-sm text-muted-foreground border-t pt-6">
                      <span className="inline-flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {x.publicadoLabel} {new Date(recurso.created).toLocaleDateString('es-CL')}
                      </span>
                      {recurso.updated && recurso.updated !== recurso.created && (
                        <span className="inline-flex items-center gap-2">
                          <History className="w-4 h-4" />
                          {x.actualizadoLabel} {new Date(recurso.updated).toLocaleDateString('es-CL')}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-2">
                        <HardDrive className="w-4 h-4" />
                        {card.fileSize} MB
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button type="button" variant="outline" onClick={handleFav} className="gap-2">
                    <Star className={`w-4 h-4 ${fav ? 'fill-amber-400 text-amber-600' : ''}`} />
                    {fav ? x.favEn : x.favGuardar}
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 bg-secondary hover:bg-secondary/90 text-white gap-2"
                    disabled={downloading}
                    onClick={handleDownload}
                  >
                    {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {x.btnDescargar}
                  </Button>
                </div>

                <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-sky-50/80 to-primary/5 px-4 py-4 sm:px-5 sm:py-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex gap-3 flex-1 min-w-0">
                    <Heart className="w-5 h-5 text-[#009ee3] shrink-0 mt-0.5" aria-hidden />
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      <span className="font-medium text-foreground">{x.donateLeadBold}</span>{' '}
                      {x.donateLeadRest}
                    </p>
                  </div>
                  <MercadoPagoDonationButton className="w-full sm:w-auto shrink-0" size="default" />
                </div>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default ResourceDetailPage;
