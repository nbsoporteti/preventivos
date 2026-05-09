
import React, { useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, FileSpreadsheet, Presentation, Download, Calendar, HardDrive, Loader2, Star, ExternalLink, TrendingUp, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import apiServerClient from '@/lib/apiServerClient.js';
import { toast } from 'sonner';
import { getCategoryBadgeClass } from '@/lib/categoryVisual.js';
import { isFavorite, toggleFavorite } from '@/lib/favoritesStorage.js';

const ResourceCard = ({ resource, highlight }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [downloading, setDownloading] = useState(false);
  const [fav, setFav] = useState(() => isFavorite(resource?.id));

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'XLSX':
        return <FileSpreadsheet className="w-8 h-8 text-emerald-700" />;
      case 'DOCX':
        return <FileText className="w-8 h-8 text-blue-700" />;
      case 'PPT':
        return <Presentation className="w-8 h-8 text-violet-700" />;
      case 'PDF':
        return <FileText className="w-8 h-8 text-slate-700 dark:text-slate-300" />;
      default:
        return <FileText className="w-8 h-8 text-slate-600" />;
    }
  };

  const catClass = getCategoryBadgeClass(resource.category, resource.categoryId);

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleFavoriteClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const next = toggleFavorite({
      id: resource.id,
      title: resource.title,
      category: resource.category,
      fileType: resource.fileType,
    });
    setFav(next);
    toast.message(next ? 'Guardado en favoritos' : 'Quitado de favoritos');
  }, [resource]);

  const handleDownload = async () => {
    if (!resource?.id) {
      toast.error('Recurso no disponible para descargar');
      return;
    }
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
      const { ok, blob, filename, error, status } = await apiServerClient.downloadResourceBlob(resource.id, token);
      if (!ok || !blob) {
        const msg = error?.error || error?.message || 'No se pudo descargar el archivo';
        if (status === 429) {
          toast.error(msg, { duration: 6000 });
        } else {
          toast.error(msg);
        }
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Descarga iniciada');
    } catch (e) {
      console.error(e);
      toast.error('Error de red al descargar');
    } finally {
      setDownloading(false);
    }
  };

  const updatedRecently =
    resource.updatedAt &&
    Date.now() - new Date(resource.updatedAt).getTime() < 30 * 24 * 60 * 60 * 1000;

  return (
    <Card className="h-full flex flex-col overflow-hidden rounded-xl border-sky-200/65 bg-gradient-to-b from-white via-sky-50/40 to-blue-50/50 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06)] ring-1 ring-inset ring-white/80 transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_12px_28px_-14px_rgba(37,99,235,0.18)] dark:border-slate-600/65 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 dark:ring-white/[0.07]">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-shrink-0 rounded-lg bg-sky-100/90 p-2 ring-1 ring-sky-200/60 dark:bg-slate-800 dark:ring-slate-600/50">
            {getFileIcon(resource.fileType)}
          </div>
          <div className="flex-1 min-w-0 flex flex-col items-end gap-2">
            <div className="flex flex-wrap justify-end gap-1">
              {highlight === 'popular' && (
                <Badge variant="secondary" className="font-normal gap-1 border-amber-200 bg-amber-50 text-amber-900">
                  <TrendingUp className="w-3 h-3" />
                  Popular
                </Badge>
              )}
              {highlight === 'recent' && (
                <Badge variant="secondary" className="font-normal gap-1 border-violet-200 bg-violet-50 text-violet-900">
                  <Sparkles className="w-3 h-3" />
                  Nuevo
                </Badge>
              )}
              {updatedRecently && !highlight && (
                <Badge variant="outline" className="text-xs font-normal">
                  Actualizado
                </Badge>
              )}
            </div>
            <Badge variant="outline" className="font-mono text-xs font-semibold">
              {resource.fileType}
            </Badge>
            <Badge className={`${catClass} border-none`}>
              {resource.category}
            </Badge>
          </div>
        </div>
        <CardTitle className="text-lg leading-snug mt-4 line-clamp-2 text-slate-900 dark:text-slate-50" title={resource.title}>
          <Link
            to={`/recurso/${resource.id}`}
            className="hover:text-primary hover:underline underline-offset-2"
          >
            {resource.title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <CardDescription className="text-sm leading-relaxed line-clamp-3 mb-4 text-slate-600 dark:text-slate-400">
          {resource.description}
        </CardDescription>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-sky-200/50 pt-4 text-xs text-slate-600 dark:border-slate-600/60 dark:text-slate-400 mt-auto">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>{formatDate(resource.uploadDate)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 shrink-0" />
            <span>{resource.fileSize} MB</span>
          </div>
          {typeof resource.downloadCount === 'number' && resource.downloadCount > 0 && (
            <span className="tabular-nums">{resource.downloadCount} descargas</span>
          )}
        </div>
      </CardContent>
      <CardFooter className="mt-auto pt-0 flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0 border-amber-200"
          title={fav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
          onClick={handleFavoriteClick}
        >
          <Star className={`w-4 h-4 ${fav ? 'fill-amber-400 text-amber-600' : ''}`} />
        </Button>
        <Button type="button" variant="outline" className="flex-1" asChild>
          <Link to={`/recurso/${resource.id}`}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Ver ficha
          </Link>
        </Button>
        <Button
          type="button"
          className="flex-1 bg-secondary hover:bg-secondary/90 text-white transition-all duration-200 active:scale-[0.98]"
          disabled={downloading}
          onClick={handleDownload}
        >
          {downloading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Descargar
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ResourceCard;
