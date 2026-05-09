
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import apiServerClient from '@/lib/apiServerClient.js';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Download, FileText, Calendar, Loader2 } from 'lucide-react';

const DownloadHistoryPage = () => {
  const { user } = useAuth();
  const [downloads, setDownloads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingResourceId, setDownloadingResourceId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchHistory = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await apiServerClient.fetch(`/users/${user.id}/downloads`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json().catch(() => ({}));
        if (cancelled) return;
        if (response.ok) {
          setDownloads(Array.isArray(data.items) ? data.items : []);
        } else {
          toast.error(data.error || 'Error al cargar el historial');
          setDownloads([]);
        }
      } catch {
        if (!cancelled) toast.error('Error al cargar el historial');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchHistory();
    return () => { cancelled = true; };
  }, [user]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const handleDownloadAgain = async (item) => {
    const resourceId = item.recurso_id || item.recurso?.id;
    if (!resourceId) {
      toast.error('No se puede identificar el recurso para descargar');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Sesión expirada. Vuelve a iniciar sesión');
      return;
    }
    setDownloadingResourceId(resourceId);
    try {
      const { ok, blob, filename, error, status } = await apiServerClient.downloadResourceBlob(resourceId, token);
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
      setDownloadingResourceId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (downloads.length === 0) {
    return (
      <Card className="border-border/50 bg-card py-16 text-center">
        <CardContent className="flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Download className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No hay descargas</h3>
          <p className="text-muted-foreground">Aún no has descargado ningún recurso de la biblioteca.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {downloads.map((item) => {
        const resourceId = item.recurso_id || item.recurso?.id;
        const rowKey = item.id || `${resourceId}-${item.created}`;
        const busy = resourceId && downloadingResourceId === resourceId;
        return (
          <Card key={rowKey} className="border-border/50 bg-card overflow-hidden hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 gap-4">
              <div className="flex items-start gap-4">
                <div className="mt-1 p-2 rounded-lg bg-primary/10 text-primary">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-base md:text-lg text-foreground line-clamp-1">
                    {item.recurso?.titulo || item.resourceTitle || 'Recurso Descargado'}
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                    <Badge variant="secondary" className="font-normal">
                      {item.recurso?.tipo_archivo || 'Archivo'}
                    </Badge>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(item.created || item.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full sm:w-auto shrink-0"
                disabled={!resourceId || busy}
                onClick={() => handleDownloadAgain(item)}
              >
                {busy ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Descargar de nuevo
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default DownloadHistoryPage;
