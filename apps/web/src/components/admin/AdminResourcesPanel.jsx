import React, { useState, useEffect, useCallback, useRef } from 'react';
import apiServerClient from '@/lib/apiServerClient.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  Loader2,
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Link2,
  Upload,
  HardDrive,
} from 'lucide-react';

const PAGE_SIZE = 10;
const TIPOS = ['PDF', 'DOCX', 'XLSX', 'PPT'];

function shortenUrl(s, max = 48) {
  if (!s) return '—';
  const t = String(s);
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function hasStoredFile(r) {
  const a = r?.archivo_url;
  if (a == null) return false;
  if (Array.isArray(a)) return a.length > 0 && Boolean(a[0]);
  return String(a).length > 0;
}

const emptyForm = () => ({
  titulo: '',
  descripcion: '',
  categoria_id: '',
  referencia_interna: '',
  ruta_archivo: '',
  tipo_archivo: 'PDF',
  activo: true,
});

const SORT_OPTIONS = [
  { value: '-created', label: 'Más recientes' },
  { value: '-updated', label: 'Actualizados recientemente' },
  { value: 'titulo', label: 'Título (A–Z)' },
  { value: '-titulo', label: 'Título (Z–A)' },
];

const AdminResourcesPanel = () => {
  const fileInputRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterActivo, setFilterActivo] = useState('all');
  const [sortBy, setSortBy] = useState('-created');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [fileSource, setFileSource] = useState('upload');
  const [file, setFile] = useState(null);
  const [importUrl, setImportUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiServerClient.fetch('/catalog/categories');
        if (!res.ok) return;
        const data = await res.json();
        setCategories(Array.isArray(data.categories) ? data.categories : []);
      } catch {
        toast.error('No se pudieron cargar las categorías');
      }
    })();
  }, []);

  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        sort: sortBy,
      });
      if (search.trim()) params.set('search', search.trim());
      if (filterCategoria.trim()) params.set('categoria_id', filterCategoria.trim());
      if (filterActivo === 'true' || filterActivo === 'false') params.set('activo', filterActivo);
      const res = await apiServerClient.fetch(`/admin/resources?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'No se pudieron cargar los recursos');
        setItems([]);
        return;
      }
      setItems(Array.isArray(data.items) ? data.items : []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalItems(data.pagination?.totalItems ?? 0);
    } catch {
      toast.error('Error de red al cargar recursos');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterCategoria, filterActivo, sortBy]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const openCreate = () => {
    setDialogMode('create');
    setEditingId(null);
    setForm(emptyForm());
    setFileSource('upload');
    setFile(null);
    setImportUrl('');
    setDialogOpen(true);
  };

  const openEdit = (r) => {
    setDialogMode('edit');
    setEditingId(r.id);
    setForm({
      titulo: r.titulo || '',
      descripcion: r.descripcion || '',
      categoria_id: r.categoria_id || '',
      referencia_interna: r.referencia_interna || '',
      ruta_archivo: r.ruta_archivo || '',
      tipo_archivo: r.tipo_archivo || 'PDF',
      activo: r.activo !== false,
    });
    setFile(null);
    setImportUrl('');
    setFileSource(hasStoredFile(r) ? 'upload' : 'url');
    setDialogOpen(true);
  };

  const saveResource = async () => {
    if (!form.titulo.trim() || !form.categoria_id) {
      toast.error('Completa título y categoría');
      return;
    }

    if (dialogMode === 'create') {
      if (fileSource === 'upload' && !file) {
        toast.error('Selecciona un archivo para subir');
        return;
      }
      if (fileSource === 'import' && !importUrl.trim()) {
        toast.error('Indica la URL del archivo a importar');
        return;
      }
      if (fileSource === 'url' && !form.ruta_archivo.trim()) {
        toast.error('Indica la URL pública del archivo');
        return;
      }
    } else {
      const currentRow = items.find((x) => x.id === editingId);
      if (fileSource === 'url') {
        const hasFile = hasStoredFile(currentRow || {});
        if (!hasFile && !form.ruta_archivo.trim()) {
          toast.error('Indica la URL pública del archivo');
          return;
        }
      }
    }

    setSaving(true);
    const token = localStorage.getItem('token');
    try {
      if (dialogMode === 'create') {
        if (fileSource === 'upload') {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('titulo', form.titulo.trim());
          fd.append('descripcion', form.descripcion.trim());
          fd.append('categoria_id', form.categoria_id);
          fd.append('tipo_archivo', form.tipo_archivo);
          fd.append('activo', form.activo ? 'true' : 'false');
          if (form.referencia_interna.trim()) fd.append('referencia_interna', form.referencia_interna.trim());
          const res = await apiServerClient.fetch('/admin/resources/upload', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            toast.error(data.error || 'No se pudo subir el recurso');
            return;
          }
          toast.success('Recurso creado con archivo subido');
        } else if (fileSource === 'import') {
          const res = await apiServerClient.fetch('/admin/resources/import-url', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              titulo: form.titulo.trim(),
              descripcion: form.descripcion.trim(),
              categoria_id: form.categoria_id,
              tipo_archivo: form.tipo_archivo,
              activo: form.activo,
              sourceUrl: importUrl.trim(),
              referencia_interna: form.referencia_interna.trim(),
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            toast.error(data.error || 'No se pudo importar');
            return;
          }
          toast.success('Recurso importado desde la URL');
        } else {
          const res = await apiServerClient.fetch('/admin/resources', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              titulo: form.titulo.trim(),
              descripcion: form.descripcion.trim(),
              categoria_id: form.categoria_id,
              ruta_archivo: form.ruta_archivo.trim(),
              tipo_archivo: form.tipo_archivo,
              activo: form.activo,
              referencia_interna: form.referencia_interna.trim(),
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            toast.error(data.error || 'No se pudo crear');
            return;
          }
          toast.success('Recurso creado');
        }
      } else {
        const metaBody = {
          titulo: form.titulo.trim(),
          descripcion: form.descripcion.trim(),
          categoria_id: form.categoria_id,
          tipo_archivo: form.tipo_archivo,
          activo: form.activo,
          referencia_interna: form.referencia_interna.trim(),
        };
        if (fileSource === 'url') {
          metaBody.ruta_archivo = form.ruta_archivo.trim();
        }

        const metaRes = await apiServerClient.fetch(`/admin/resources/${editingId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(metaBody),
        });
        const metaData = await metaRes.json().catch(() => ({}));
        if (!metaRes.ok) {
          toast.error(metaData.error || 'No se pudo actualizar los datos');
          return;
        }

        if (fileSource === 'upload' && file) {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('tipo_archivo', form.tipo_archivo);
          const fres = await apiServerClient.fetch(`/admin/resources/${editingId}/file`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
          });
          const fdData = await fres.json().catch(() => ({}));
          if (!fres.ok) {
            toast.error(fdData.error || 'Datos guardados pero falló la subida del archivo');
            fetchResources();
            return;
          }
        } else if (fileSource === 'import' && importUrl.trim()) {
          const ires = await apiServerClient.fetch(`/admin/resources/${editingId}/import-url`, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sourceUrl: importUrl.trim(),
              tipo_archivo: form.tipo_archivo,
            }),
          });
          const iData = await ires.json().catch(() => ({}));
          if (!ires.ok) {
            toast.error(iData.error || 'Datos guardados pero falló la importación');
            fetchResources();
            return;
          }
        }

        toast.success('Recurso actualizado');
      }

      setDialogOpen(false);
      setFile(null);
      setImportUrl('');
      fetchResources();
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await apiServerClient.fetch(`/admin/resources/${deletingItem.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'No se pudo eliminar');
        return;
      }
      toast.success('Recurso eliminado');
      setDeleteOpen(false);
      setDeletingItem(null);
      fetchResources();
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-end sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por título o descripción…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground whitespace-nowrap">
            {totalItems} recurso{totalItems !== 1 ? 's' : ''}
          </p>
          <Button type="button" onClick={openCreate} className="shrink-0">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo recurso
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:items-end">
        <div className="space-y-2 min-w-[160px]">
          <Label className="text-xs text-muted-foreground">Categoría</Label>
          <Select
            value={filterCategoria || '__all__'}
            onValueChange={(v) => {
              setFilterCategoria(v === '__all__' ? '' : v);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas las categorías</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 min-w-[160px]">
          <Label className="text-xs text-muted-foreground">Estado</Label>
          <Select
            value={filterActivo}
            onValueChange={(v) => {
              setFilterActivo(v);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="true">Solo publicados (activo)</SelectItem>
              <SelectItem value="false">Solo inactivos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 min-w-[200px]">
          <Label className="text-xs text-muted-foreground">Ordenar por</Label>
          <Select
            value={sortBy}
            onValueChange={(v) => {
              setSortBy(v);
              setPage(1);
            }}
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
      </div>

      <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Tipo archivo</TableHead>
                <TableHead className="text-right tabular-nums w-24">Descargas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden md:table-cell">Origen</TableHead>
                <TableHead className="hidden lg:table-cell">Actualizado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                    No hay recursos con estos criterios.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium max-w-[200px]">
                      <span className="line-clamp-2" title={r.titulo}>
                        {r.titulo}
                      </span>
                    </TableCell>
                    <TableCell>{r.categoria || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.tipo_archivo || 'PDF'}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {r.downloadCount ?? 0}
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.activo !== false ? 'outline' : 'destructive'}>
                        {r.activo !== false ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-[240px]">
                      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                        {hasStoredFile(r) && (
                          <span className="inline-flex items-center gap-1 text-foreground/80">
                            <HardDrive className="w-3 h-3" />
                            Archivo en servidor
                          </span>
                        )}
                        {r.ruta_archivo?.startsWith('http') && (
                          <span className="flex items-center gap-1" title={r.ruta_archivo}>
                            <Link2 className="w-3 h-3 shrink-0" />
                            {shortenUrl(r.ruta_archivo)}
                          </span>
                        )}
                        {!hasStoredFile(r) && !r.ruta_archivo?.startsWith('http') && r.ruta_archivo && (
                          <span title={r.ruta_archivo}>{shortenUrl(r.ruta_archivo)}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                      {formatDate(r.updated)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(r)} title="Editar">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setDeletingItem(r);
                            setDeleteOpen(true);
                          }}
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogMode === 'create' ? 'Nuevo recurso' : 'Editar recurso'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="res-titulo">Título</Label>
              <Input
                id="res-titulo"
                value={form.titulo}
                onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                placeholder="Nombre del recurso"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="res-desc">Descripción</Label>
              <Textarea
                id="res-desc"
                value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                placeholder="Resumen opcional"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select
                value={form.categoria_id || undefined}
                onValueChange={(v) => setForm((f) => ({ ...f, categoria_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="res-ref-interna">Referencia interna (solo admin)</Label>
              <Textarea
                id="res-ref-interna"
                value={form.referencia_interna}
                onChange={(e) => setForm((f) => ({ ...f, referencia_interna: e.target.value }))}
                placeholder="Códigos internos, notas para el equipo… No se muestra en la web pública."
                rows={2}
              />
            </div>

            <div className="space-y-3 rounded-lg border border-border/50 p-4 bg-muted/20">
              <Label className="text-base">Archivo del recurso</Label>
              <RadioGroup value={fileSource} onValueChange={setFileSource}>
                <div className="flex items-start gap-3">
                  <RadioGroupItem value="upload" id="fs-upload" className="mt-1" />
                  <div>
                    <Label htmlFor="fs-upload" className="font-medium cursor-pointer">
                      Subir desde mi equipo
                    </Label>
                    <p className="text-xs text-muted-foreground">Hasta 20 MB. Se guarda en el servidor (API).</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <RadioGroupItem value="import" id="fs-import" className="mt-1" />
                  <div>
                    <Label htmlFor="fs-import" className="font-medium cursor-pointer">
                      Importar desde URL
                    </Label>
                    <p className="text-xs text-muted-foreground">La API descarga el archivo y lo sube al servidor.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <RadioGroupItem value="url" id="fs-url" className="mt-1" />
                  <div>
                    <Label htmlFor="fs-url" className="font-medium cursor-pointer">
                      Solo enlace (sin subir)
                    </Label>
                    <p className="text-xs text-muted-foreground">URL https pública; la descarga sale de ese enlace.</p>
                  </div>
                </div>
              </RadioGroup>

              {fileSource === 'upload' && (
                <div className="space-y-2 pt-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Elegir archivo
                  </Button>
                  {file && (
                    <p className="text-sm text-muted-foreground break-all">
                      Seleccionado: <strong>{file.name}</strong> ({Math.round(file.size / 1024)} KB)
                    </p>
                  )}
                  {dialogMode === 'edit' && (
                    <p className="text-xs text-muted-foreground">
                      Si ya hay archivo en servidor, súbelo de nuevo solo para reemplazarlo.
                    </p>
                  )}
                </div>
              )}

              {fileSource === 'import' && (
                <div className="space-y-2 pt-2">
                  <Label htmlFor="import-url">URL del archivo</Label>
                  <Input
                    id="import-url"
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    placeholder="https://ejemplo.com/documento.pdf"
                  />
                </div>
              )}

              {fileSource === 'url' && (
                <div className="space-y-2 pt-2">
                  <Label htmlFor="res-url">URL pública del archivo</Label>
                  <Input
                    id="res-url"
                    value={form.ruta_archivo}
                    onChange={(e) => setForm((f) => ({ ...f, ruta_archivo: e.target.value }))}
                    placeholder="https://…"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Tipo de archivo</Label>
              <Select
                value={form.tipo_archivo}
                onValueChange={(v) => setForm((f) => ({ ...f, tipo_archivo: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
              <div>
                <Label htmlFor="res-activo">Publicado (activo)</Label>
                <p className="text-xs text-muted-foreground">Si está inactivo, no aparece en el catálogo público.</p>
              </div>
              <Switch
                id="res-activo"
                checked={form.activo}
                onCheckedChange={(v) => setForm((f) => ({ ...f, activo: v }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="button" onClick={saveResource} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar recurso?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingItem
                ? `Se eliminará «${deletingItem.titulo}». El historial de descargas puede quedar con referencias rotas.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminResourcesPanel;
