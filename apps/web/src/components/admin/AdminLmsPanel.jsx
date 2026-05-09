import React, { useState, useEffect, useCallback, useMemo } from 'react';
import apiServerClient from '@/lib/apiServerClient.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Loader2,
  Pencil,
  Trash2,
  Plus,
  ChevronUp,
  ChevronDown,
  GripVertical,
  ArrowLeft,
  Save,
  MoreHorizontal,
  MessageCircleQuestion,
  Library,
} from 'lucide-react';

const emptyActividad = () => ({
  titulo: '',
  slug: '',
  descripcion: '',
  orden: '0',
  activo: true,
  categoria_id: '',
});

const LMS_SIN_CATEGORIA = '__none__';

const emptyItem = () => ({
  enunciado: '',
  tipo: 'single',
  opciones_json: '["Opción A","Opción B","Opción C","Opción D"]',
  indice_correcto: '0',
  explicacion: '',
  orden: '0',
});

function questionTypeBadge(tipo) {
  const t = tipo === 'true_false' ? 'true_false' : 'single';
  const label = t === 'true_false' ? 'TRUE / FALSE' : 'SINGLE CHOICE';
  return (
    <Badge
      variant="secondary"
      className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground"
    >
      {label}
    </Badge>
  );
}

const AdminLmsPanel = () => {
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actDialog, setActDialog] = useState(false);
  const [actMode, setActMode] = useState('create');
  const [editingActId, setEditingActId] = useState(null);
  const [actForm, setActForm] = useState(emptyActividad());
  const [savingAct, setSavingAct] = useState(false);
  const [deleteActOpen, setDeleteActOpen] = useState(false);
  const [deletingAct, setDeletingAct] = useState(null);

  const [builderOpen, setBuilderOpen] = useState(false);
  const [selectedActividad, setSelectedActividad] = useState(null);
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [reordering, setReordering] = useState(null);
  const [itemDialog, setItemDialog] = useState(false);
  const [itemMode, setItemMode] = useState('create');
  const [editingItemId, setEditingItemId] = useState(null);
  const [itemForm, setItemForm] = useState(emptyItem());
  const [savingItem, setSavingItem] = useState(false);
  const [deleteItemOpen, setDeleteItemOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);

  const [bancoOpen, setBancoOpen] = useState(false);
  const [bancoTab, setBancoTab] = useState('import');
  const [bancoItems, setBancoItems] = useState([]);
  const [bancoLoading, setBancoLoading] = useState(false);
  const [bancoQuery, setBancoQuery] = useState('');
  const [bancoPickIds, setBancoPickIds] = useState([]);
  const [bancoImporting, setBancoImporting] = useState(false);

  const [bankItemDialog, setBankItemDialog] = useState(false);
  const [bankItemMode, setBankItemMode] = useState('create');
  const [bankEditingId, setBankEditingId] = useState(null);
  const [bankItemForm, setBankItemForm] = useState(emptyItem());
  const [savingBankItem, setSavingBankItem] = useState(false);
  const [deleteBankOpen, setDeleteBankOpen] = useState(false);
  const [deletingBankRow, setDeletingBankRow] = useState(null);

  const [categorias, setCategorias] = useState([]);

  const tokenHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  });

  const fetchActividades = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiServerClient.fetch('/admin/lms/actividades', {
        headers: tokenHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'Error al cargar actividades LMS');
        setActividades([]);
        return;
      }
      setActividades(Array.isArray(data.items) ? data.items : []);
    } catch {
      toast.error('Error de red');
      setActividades([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActividades();
  }, [fetchActividades]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiServerClient.fetch('/admin/meta/categories', {
          headers: tokenHeaders(),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || cancelled) return;
        setCategorias(Array.isArray(data.items) ? data.items : []);
      } catch {
        if (!cancelled) setCategorias([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchItems = async (actividad) => {
    if (!actividad?.id) return 0;
    setLoadingItems(true);
    try {
      const res = await apiServerClient.fetch(`/admin/lms/actividades/${actividad.id}/items`, {
        headers: tokenHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'Error al cargar preguntas');
        setItems([]);
        return 0;
      }
      const list = Array.isArray(data.items) ? data.items : [];
      setItems(list);
      return list.length;
    } catch {
      toast.error('Error de red');
      setItems([]);
      return 0;
    } finally {
      setLoadingItems(false);
    }
  };

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const oa = Number(a.orden ?? 0);
      const ob = Number(b.orden ?? 0);
      if (oa !== ob) return oa - ob;
      return String(a.created || '').localeCompare(String(b.created || ''));
    });
  }, [items]);

  const openCreateAct = () => {
    setActMode('create');
    setEditingActId(null);
    setActForm(emptyActividad());
    setActDialog(true);
  };

  const openEditActQuick = (row) => {
    setActMode('edit');
    setEditingActId(row.id);
    setActForm({
      titulo: row.titulo || '',
      slug: row.slug || '',
      descripcion: row.descripcion || '',
      orden: String(row.orden ?? 0),
      activo: row.activo !== false,
      categoria_id: row.categoria_id || '',
    });
    setActDialog(true);
  };

  const syncFormFromActividad = (row) => {
    setActForm({
      titulo: row.titulo || '',
      slug: row.slug || '',
      descripcion: row.descripcion || '',
      orden: String(row.orden ?? 0),
      activo: row.activo !== false,
      categoria_id: row.categoria_id || '',
    });
    setEditingActId(row.id);
  };

  const openBuilder = (row) => {
    setSelectedActividad(row);
    syncFormFromActividad(row);
    setBuilderOpen(true);
    fetchItems(row);
  };

  const closeBuilder = async () => {
    setBuilderOpen(false);
    setSelectedActividad(null);
    setItems([]);
    await fetchActividades();
  };

  const saveActividad = async () => {
    setSavingAct(true);
    try {
      const body = {
        titulo: actForm.titulo.trim(),
        slug: actForm.slug.trim().toLowerCase(),
        descripcion: actForm.descripcion.trim(),
        orden: Number.parseInt(actForm.orden, 10) || 0,
        activo: actForm.activo,
        categoria_id: actForm.categoria_id?.trim() || null,
      };
      const url =
        actMode === 'create'
          ? '/admin/lms/actividades'
          : `/admin/lms/actividades/${editingActId}`;
      const res = await apiServerClient.fetch(url, {
        method: actMode === 'create' ? 'POST' : 'PUT',
        headers: { ...tokenHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'No se pudo guardar');
        return;
      }
      toast.success(actMode === 'create' ? 'Actividad creada' : 'Cuestionario guardado');
      setActDialog(false);

      if (actMode === 'create' && data.item?.id) {
        const row = {
          ...data.item,
          item_count: 0,
          activo: data.item.activo !== false,
          categoria_nombre: null,
        };
        setSelectedActividad(row);
        syncFormFromActividad(row);
        setBuilderOpen(true);
        await fetchItems(row);
      }
      await fetchActividades();
    } finally {
      setSavingAct(false);
    }
  };

  const saveQuizMetaFromBuilder = async () => {
    if (!selectedActividad?.id) return;
    setSavingAct(true);
    try {
      const body = {
        titulo: actForm.titulo.trim(),
        slug: actForm.slug.trim().toLowerCase(),
        descripcion: actForm.descripcion.trim(),
        orden: Number.parseInt(actForm.orden, 10) || 0,
        activo: actForm.activo,
        categoria_id: actForm.categoria_id?.trim() || null,
      };
      const res = await apiServerClient.fetch(`/admin/lms/actividades/${selectedActividad.id}`, {
        method: 'PUT',
        headers: { ...tokenHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'No se pudo guardar');
        return;
      }
      toast.success('Cuestionario guardado');
      const item = data.item;
      if (item) {
        const catNombre = item.categoria_id
          ? categorias.find((c) => c.id === item.categoria_id)?.nombre ?? null
          : null;
        setSelectedActividad((prev) =>
          prev ? { ...prev, ...item, item_count: prev.item_count, categoria_nombre: catNombre } : prev,
        );
      }
      await fetchActividades();
    } finally {
      setSavingAct(false);
    }
  };

  const confirmDeleteAct = async () => {
    if (!deletingAct?.id) return;
    try {
      const res = await apiServerClient.fetch(`/admin/lms/actividades/${deletingAct.id}`, {
        method: 'DELETE',
        headers: tokenHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'No se pudo eliminar');
        return;
      }
      toast.success('Actividad eliminada');
      setDeleteActOpen(false);
      setDeletingAct(null);
      if (selectedActividad?.id === deletingAct.id) {
        await closeBuilder();
      }
      await fetchActividades();
    } catch {
      toast.error('Error de red');
    }
  };

  const putItemPayload = (row) => ({
    enunciado: row.enunciado,
    tipo: row.tipo,
    opciones_json: row.opciones_json,
    indice_correcto: Number(row.indice_correcto),
    explicacion: row.explicacion || '',
    orden: Number(row.orden ?? 0),
  });

  const moveItem = async (itemId, direction) => {
    const list = sortedItems;
    const idx = list.findIndex((x) => x.id === itemId);
    const j = direction === 'up' ? idx - 1 : idx + 1;
    if (idx < 0 || j < 0 || j >= list.length) return;
    const cur = list[idx];
    const neighbor = list[j];
    const o1 = Number(cur.orden ?? idx);
    const o2 = Number(neighbor.orden ?? j);
    setReordering(itemId);
    try {
      const r1 = await apiServerClient.fetch(`/admin/lms/items/${cur.id}`, {
        method: 'PUT',
        headers: { ...tokenHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...putItemPayload(cur), orden: o2 }),
      });
      const r2 = await apiServerClient.fetch(`/admin/lms/items/${neighbor.id}`, {
        method: 'PUT',
        headers: { ...tokenHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...putItemPayload(neighbor), orden: o1 }),
      });
      if (!r1.ok || !r2.ok) {
        toast.error('No se pudo reordenar');
        return;
      }
      if (selectedActividad) await fetchItems(selectedActividad);
    } catch {
      toast.error('Error de red');
    } finally {
      setReordering(null);
    }
  };

  const nextOrden = () => {
    if (!sortedItems.length) return 0;
    return Math.max(...sortedItems.map((r) => Number(r.orden ?? 0))) + 1;
  };

  const openCreateItem = () => {
    if (!selectedActividad) return;
    setItemMode('create');
    setEditingItemId(null);
    setItemForm({ ...emptyItem(), orden: String(nextOrden()) });
    setItemDialog(true);
  };

  const openEditItem = (row) => {
    setItemMode('edit');
    setEditingItemId(row.id);
    let opts = row.opciones_json;
    try {
      const arr = JSON.parse(row.opciones_json);
      opts = JSON.stringify(arr, null, 0);
    } catch {
      /* keep */
    }
    setItemForm({
      enunciado: row.enunciado || '',
      tipo: row.tipo === 'true_false' ? 'true_false' : 'single',
      opciones_json: opts,
      indice_correcto: String(row.indice_correcto ?? 0),
      explicacion: row.explicacion || '',
      orden: String(row.orden ?? 0),
    });
    setItemDialog(true);
  };

  const saveItem = async () => {
    if (!selectedActividad) return;
    setSavingItem(true);
    try {
      const body = {
        ...(itemMode === 'create' ? { actividad_id: selectedActividad.id } : {}),
        enunciado: itemForm.enunciado.trim(),
        tipo: itemForm.tipo,
        opciones_json: itemForm.opciones_json.trim(),
        indice_correcto: Number.parseInt(itemForm.indice_correcto, 10),
        explicacion: itemForm.explicacion.trim(),
        orden: Number.parseInt(itemForm.orden, 10) || 0,
      };
      if (itemForm.tipo === 'true_false') {
        body.opciones_json = '["Verdadero","Falso"]';
      }
      const url =
        itemMode === 'create' ? '/admin/lms/items' : `/admin/lms/items/${editingItemId}`;
      const res = await apiServerClient.fetch(url, {
        method: itemMode === 'create' ? 'POST' : 'PUT',
        headers: { ...tokenHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'No se pudo guardar la pregunta');
        return;
      }
      toast.success(itemMode === 'create' ? 'Pregunta añadida' : 'Pregunta actualizada');
      setItemDialog(false);
      const n = await fetchItems(selectedActividad);
      setSelectedActividad((prev) => (prev ? { ...prev, item_count: n } : prev));
      await fetchActividades();
    } finally {
      setSavingItem(false);
    }
  };

  useEffect(() => {
    if (!bancoOpen) return;
    let cancelled = false;
    (async () => {
      setBancoLoading(true);
      try {
        const res = await apiServerClient.fetch('/admin/lms/banco/items', {
          headers: tokenHeaders(),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) toast.error(data.error || 'No se pudo cargar el banco');
          return;
        }
        if (!cancelled) setBancoItems(Array.isArray(data.items) ? data.items : []);
      } catch {
        if (!cancelled) toast.error('Error de red');
      } finally {
        if (!cancelled) setBancoLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bancoOpen]);

  const bancoFiltered = useMemo(() => {
    const q = bancoQuery.trim().toLowerCase();
    const list = [...bancoItems].sort((a, b) => {
      const oa = Number(a.orden ?? 0);
      const ob = Number(b.orden ?? 0);
      if (oa !== ob) return oa - ob;
      return String(a.enunciado || '').localeCompare(String(b.enunciado || ''), 'es', { sensitivity: 'base' });
    });
    if (!q) return list;
    return list.filter((it) => String(it.enunciado || '').toLowerCase().includes(q));
  }, [bancoItems, bancoQuery]);

  const nextBankOrden = () => {
    if (!bancoItems.length) return 0;
    return Math.max(...bancoItems.map((r) => Number(r.orden ?? 0))) + 1;
  };

  const toggleBancoPick = (id) => {
    setBancoPickIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const openBancoDialog = () => {
    setBancoTab('import');
    setBancoQuery('');
    setBancoPickIds([]);
    setBancoOpen(true);
  };

  const importFromBanco = async () => {
    if (!selectedActividad?.id || bancoPickIds.length === 0) return;
    setBancoImporting(true);
    try {
      const res = await apiServerClient.fetch(
        `/admin/lms/actividades/${selectedActividad.id}/import-banco`,
        {
          method: 'POST',
          headers: { ...tokenHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: bancoPickIds }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'No se pudo importar');
        return;
      }
      toast.success(
        data.imported === 1 ? '1 pregunta importada' : `${data.imported} preguntas importadas`,
      );
      setBancoPickIds([]);
      const n = await fetchItems(selectedActividad);
      setSelectedActividad((prev) => (prev ? { ...prev, item_count: n } : prev));
      await fetchActividades();
      setBancoOpen(false);
    } catch {
      toast.error('Error de red');
    } finally {
      setBancoImporting(false);
    }
  };

  const openBankCreate = () => {
    setBankItemMode('create');
    setBankEditingId(null);
    setBankItemForm({ ...emptyItem(), orden: String(nextBankOrden()) });
    setBankItemDialog(true);
  };

  const openBankEdit = (row) => {
    setBankItemMode('edit');
    setBankEditingId(row.id);
    let opts = row.opciones_json;
    try {
      const arr = JSON.parse(row.opciones_json);
      opts = JSON.stringify(arr, null, 0);
    } catch {
      /* keep */
    }
    setBankItemForm({
      enunciado: row.enunciado || '',
      tipo: row.tipo === 'true_false' ? 'true_false' : 'single',
      opciones_json: opts,
      indice_correcto: String(row.indice_correcto ?? 0),
      explicacion: row.explicacion || '',
      orden: String(row.orden ?? 0),
    });
    setBankItemDialog(true);
  };

  const saveBankItem = async () => {
    setSavingBankItem(true);
    try {
      const body = {
        enunciado: bankItemForm.enunciado.trim(),
        tipo: bankItemForm.tipo,
        opciones_json:
          bankItemForm.tipo === 'true_false'
            ? '["Verdadero","Falso"]'
            : bankItemForm.opciones_json.trim(),
        indice_correcto: Number.parseInt(bankItemForm.indice_correcto, 10),
        explicacion: bankItemForm.explicacion.trim(),
        orden: Number.parseInt(bankItemForm.orden, 10) || 0,
      };
      const url =
        bankItemMode === 'create'
          ? '/admin/lms/banco/items'
          : `/admin/lms/banco/items/${bankEditingId}`;
      const res = await apiServerClient.fetch(url, {
        method: bankItemMode === 'create' ? 'POST' : 'PUT',
        headers: { ...tokenHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'No se pudo guardar en el banco');
        return;
      }
      toast.success(bankItemMode === 'create' ? 'Pregunta añadida al banco' : 'Banco actualizado');
      setBankItemDialog(false);
      setBancoLoading(true);
      try {
        const r2 = await apiServerClient.fetch('/admin/lms/banco/items', {
          headers: tokenHeaders(),
        });
        const d2 = await r2.json().catch(() => ({}));
        if (r2.ok) setBancoItems(Array.isArray(d2.items) ? d2.items : []);
      } finally {
        setBancoLoading(false);
      }
    } finally {
      setSavingBankItem(false);
    }
  };

  const confirmDeleteBankItem = async () => {
    if (!deletingBankRow?.id) return;
    try {
      const res = await apiServerClient.fetch(`/admin/lms/banco/items/${deletingBankRow.id}`, {
        method: 'DELETE',
        headers: tokenHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'No se pudo eliminar');
        return;
      }
      toast.success('Eliminada del banco');
      const removedId = deletingBankRow.id;
      setDeleteBankOpen(false);
      setDeletingBankRow(null);
      setBancoPickIds((prev) => prev.filter((x) => x !== removedId));
      setBancoLoading(true);
      try {
        const r2 = await apiServerClient.fetch('/admin/lms/banco/items', {
          headers: tokenHeaders(),
        });
        const d2 = await r2.json().catch(() => ({}));
        if (r2.ok) setBancoItems(Array.isArray(d2.items) ? d2.items : []);
      } finally {
        setBancoLoading(false);
      }
    } catch {
      toast.error('Error de red');
    }
  };

  const confirmDeleteItem = async () => {
    if (!deletingItem?.id) return;
    try {
      const res = await apiServerClient.fetch(`/admin/lms/items/${deletingItem.id}`, {
        method: 'DELETE',
        headers: tokenHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'No se pudo eliminar');
        return;
      }
      toast.success('Pregunta eliminada');
      setDeleteItemOpen(false);
      setDeletingItem(null);
      if (selectedActividad) {
        const n = await fetchItems(selectedActividad);
        setSelectedActividad((prev) => (prev ? { ...prev, item_count: n } : prev));
        await fetchActividades();
      }
    } catch {
      toast.error('Error de red');
    }
  };

  return (
    <div className="space-y-8">
      {!builderOpen && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground max-w-xl">
              Cuestionarios para <strong className="text-foreground">Aprende</strong> (dashboard del usuario). Tipos
              disponibles: opción única y verdadero/falso. Más formatos en una futura versión.
            </p>
            <Button onClick={openCreateAct} className="shrink-0 gap-2">
              <Plus className="w-4 h-4" />
              Nuevo cuestionario
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="min-w-[140px]">Categoría</TableHead>
                  <TableHead className="w-24 text-center">Preguntas</TableHead>
                  <TableHead className="w-24 text-center">Activo</TableHead>
                  <TableHead className="w-56 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actividades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No hay cuestionarios. Creá uno y abrí el editor para añadir preguntas.
                    </TableCell>
                  </TableRow>
                ) : (
                  actividades.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.titulo}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{row.slug}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.categoria_nombre || '—'}
                      </TableCell>
                      <TableCell className="text-center tabular-nums">{row.item_count}</TableCell>
                      <TableCell className="text-center">{row.activo ? 'Sí' : 'No'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="default" size="sm" className="mr-1" onClick={() => openBuilder(row)}>
                          Editor
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditActQuick(row)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => {
                            setDeletingAct(row);
                            setDeleteActOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </>
      )}

      {builderOpen && selectedActividad && (
        <div className="rounded-xl border border-border/80 bg-card shadow-sm overflow-hidden">
          <div className="flex flex-col gap-3 border-b bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
            <Button variant="ghost" size="sm" className="w-fit gap-1 shrink-0" onClick={() => closeBuilder()}>
              <ArrowLeft className="w-4 h-4" />
              Lista
            </Button>
            <Input
              className="text-lg font-semibold border-transparent bg-transparent px-2 shadow-none focus-visible:ring-1 min-w-0 flex-1"
              value={actForm.titulo}
              onChange={(e) => setActForm((f) => ({ ...f, titulo: e.target.value }))}
              placeholder="Título del cuestionario"
              aria-label="Título del cuestionario"
            />
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" className="gap-1" onClick={openBancoDialog}>
                <Library className="w-4 h-4" />
                Banco
              </Button>
              <Button size="sm" className="gap-1" onClick={saveQuizMetaFromBuilder} disabled={savingAct}>
                {savingAct ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar
              </Button>
            </div>
          </div>

          <Tabs defaultValue="questions" className="w-full">
            <div className="border-b px-4">
              <TabsList className="h-12 bg-transparent p-0 gap-6 rounded-none w-full justify-start">
                <TabsTrigger
                  value="questions"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none px-1 py-3"
                >
                  Preguntas ({items.length})
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none px-1 py-3"
                >
                  Ajustes
                </TabsTrigger>
                <TabsTrigger
                  value="qa"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none px-1 py-3 gap-1.5"
                >
                  <MessageCircleQuestion className="w-4 h-4" />
                  Q&amp;A
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="questions" className="mt-0 focus-visible:outline-none p-4 sm:p-6 space-y-4">
              {loadingItems ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : sortedItems.length === 0 ? (
                <div className="rounded-lg border border-dashed bg-muted/20 py-12 text-center text-sm text-muted-foreground">
                  Todavía no hay preguntas. Usá «Añadir pregunta».
                </div>
              ) : (
                <ul className="space-y-2">
                  {sortedItems.map((it, i) => (
                    <li key={it.id}>
                      <div
                        className={cn(
                          'group flex flex-col gap-3 rounded-lg border bg-muted/40 px-4 py-3 sm:flex-row sm:items-center',
                          'transition-colors hover:bg-muted/60',
                        )}
                      >
                        <div
                          className="flex items-start gap-3 flex-1 min-w-0"
                          title={it.enunciado}
                        >
                          <GripVertical
                            className="w-4 h-4 shrink-0 text-muted-foreground/60 mt-0.5 cursor-grab hidden sm:block"
                            aria-hidden
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium leading-snug line-clamp-2">{it.enunciado}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {questionTypeBadge(it.tipo)}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-1 sm:shrink-0 sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={i === 0 || reordering}
                            onClick={() => moveItem(it.id, 'up')}
                            aria-label="Subir pregunta"
                          >
                            {reordering === it.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <ChevronUp className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={i >= sortedItems.length - 1 || reordering}
                            onClick={() => moveItem(it.id, 'down')}
                            aria-label="Bajar pregunta"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Más acciones">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditItem(it)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setDeletingItem(it);
                                  setDeleteItemOpen(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="flex justify-center py-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full border border-dashed text-muted-foreground hover:text-primary hover:border-primary"
                          onClick={openCreateItem}
                          aria-label="Añadir pregunta después"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <Button variant="default" className="w-full sm:w-auto gap-2" onClick={openCreateItem}>
                <Plus className="w-4 h-4" />
                Añadir pregunta
              </Button>
            </TabsContent>

            <TabsContent value="settings" className="mt-0 focus-visible:outline-none p-4 sm:p-6 max-w-lg space-y-4">
              <div>
                <Label>Slug (URL en /dashboard/aprende/…)</Label>
                <Input
                  className="mt-1"
                  value={actForm.slug}
                  onChange={(e) => setActForm((f) => ({ ...f, slug: e.target.value }))}
                />
              </div>
              <div>
                <Label>Categoría en Aprende</Label>
                <Select
                  value={actForm.categoria_id || LMS_SIN_CATEGORIA}
                  onValueChange={(v) =>
                    setActForm((f) => ({ ...f, categoria_id: v === LMS_SIN_CATEGORIA ? '' : v }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Elegir categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={LMS_SIN_CATEGORIA}>Sin categoría</SelectItem>
                    {categorias.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Misma lista que recursos biblioteca. Define el bloque donde aparece en el dashboard.
                </p>
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea
                  className="mt-1"
                  value={actForm.descripcion}
                  onChange={(e) => setActForm((f) => ({ ...f, descripcion: e.target.value }))}
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Orden en listados</Label>
                  <Input
                    type="number"
                    className="mt-1"
                    value={actForm.orden}
                    onChange={(e) => setActForm((f) => ({ ...f, orden: e.target.value }))}
                  />
                </div>
                <div className="flex items-end gap-2 pb-2">
                  <Switch
                    checked={actForm.activo}
                    onCheckedChange={(v) => setActForm((f) => ({ ...f, activo: v }))}
                  />
                  <Label>Publicado</Label>
                </div>
              </div>
              <Button className="gap-2" onClick={saveQuizMetaFromBuilder} disabled={savingAct}>
                {savingAct ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar ajustes
              </Button>
            </TabsContent>

            <TabsContent value="qa" className="mt-0 focus-visible:outline-none p-4 sm:p-6">
              <div className="rounded-lg border border-dashed bg-muted/20 p-8 text-center text-sm text-muted-foreground">
                <MessageCircleQuestion className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>
                  Aquí podrás centralizar dudas de los usuarios sobre este cuestionario.{' '}
                  <span className="font-medium text-foreground">Próximamente.</span>
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end border-t bg-muted/20 px-4 py-3">
            <Button variant="secondary" size="sm" className="gap-1" onClick={saveQuizMetaFromBuilder} disabled={savingAct}>
              <Save className="w-4 h-4" />
              Guardar
            </Button>
          </div>
        </div>
      )}

      <Dialog open={actDialog} onOpenChange={setActDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{actMode === 'create' ? 'Nuevo cuestionario' : 'Datos rápidos'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Título</Label>
              <Input
                className="mt-1"
                value={actForm.titulo}
                onChange={(e) => setActForm((f) => ({ ...f, titulo: e.target.value }))}
              />
            </div>
            <div>
              <Label>Slug (URL)</Label>
              <Input
                className="mt-1"
                placeholder="ej: seguridad-en-altura"
                value={actForm.slug}
                onChange={(e) => setActForm((f) => ({ ...f, slug: e.target.value }))}
              />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea
                className="mt-1"
                value={actForm.descripcion}
                onChange={(e) => setActForm((f) => ({ ...f, descripcion: e.target.value }))}
              />
            </div>
            <div>
              <Label>Categoría en Aprende</Label>
              <Select
                value={actForm.categoria_id || LMS_SIN_CATEGORIA}
                onValueChange={(v) =>
                  setActForm((f) => ({ ...f, categoria_id: v === LMS_SIN_CATEGORIA ? '' : v }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Elegir categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={LMS_SIN_CATEGORIA}>Sin categoría</SelectItem>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label>Orden</Label>
                <Input
                  type="number"
                  className="mt-1"
                  value={actForm.orden}
                  onChange={(e) => setActForm((f) => ({ ...f, orden: e.target.value }))}
                />
              </div>
              <div className="flex items-end gap-2 pb-2">
                <Switch
                  checked={actForm.activo}
                  onCheckedChange={(v) => setActForm((f) => ({ ...f, activo: v }))}
                />
                <Label>Publicada</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={saveActividad} disabled={savingAct}>
              {savingAct ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continuar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={itemDialog} onOpenChange={setItemDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{itemMode === 'create' ? 'Nueva pregunta' : 'Editar pregunta'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Enunciado</Label>
              <Textarea
                className="mt-1"
                value={itemForm.enunciado}
                onChange={(e) => setItemForm((f) => ({ ...f, enunciado: e.target.value }))}
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select
                value={itemForm.tipo}
                onValueChange={(v) =>
                  setItemForm((f) => ({
                    ...f,
                    tipo: v,
                    opciones_json:
                      v === 'true_false'
                        ? '["Verdadero","Falso"]'
                        : '["Opción A","Opción B","Opción C"]',
                  }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Opción única (single choice)</SelectItem>
                  <SelectItem value="true_false">Verdadero / Falso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {itemForm.tipo === 'single' && (
              <div>
                <Label>Opciones (JSON array de textos)</Label>
                <Textarea
                  className="mt-1 font-mono text-sm"
                  rows={3}
                  value={itemForm.opciones_json}
                  onChange={(e) => setItemForm((f) => ({ ...f, opciones_json: e.target.value }))}
                />
              </div>
            )}
            <div>
              <Label>Índice de la opción correcta (0 = primera)</Label>
              <Input
                type="number"
                min={0}
                className="mt-1"
                value={itemForm.indice_correcto}
                onChange={(e) => setItemForm((f) => ({ ...f, indice_correcto: e.target.value }))}
              />
            </div>
            <div>
              <Label>Explicación (opcional)</Label>
              <Textarea
                className="mt-1"
                value={itemForm.explicacion}
                onChange={(e) => setItemForm((f) => ({ ...f, explicacion: e.target.value }))}
              />
            </div>
            <div>
              <Label>Orden</Label>
              <Input
                type="number"
                className="mt-1"
                value={itemForm.orden}
                onChange={(e) => setItemForm((f) => ({ ...f, orden: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={saveItem} disabled={savingItem}>
              {savingItem ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={bancoOpen}
        onOpenChange={(open) => {
          setBancoOpen(open);
          if (!open) {
            setBancoPickIds([]);
            setBancoQuery('');
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>Banco de preguntas</DialogTitle>
            <p className="text-sm text-muted-foreground font-normal">
              Preguntas reutilizables. Importar copia al cuestionario actual sin vaciar el banco.
            </p>
          </DialogHeader>
          <Tabs value={bancoTab} onValueChange={setBancoTab} className="flex flex-col flex-1 min-h-0 px-6 pb-6">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="import">Importar aquí</TabsTrigger>
              <TabsTrigger value="manage">Gestionar banco</TabsTrigger>
            </TabsList>
            <TabsContent value="import" className="mt-4 flex flex-col gap-3 flex-1 min-h-0 data-[state=inactive]:hidden">
              <Input
                placeholder="Buscar en el banco…"
                value={bancoQuery}
                onChange={(e) => setBancoQuery(e.target.value)}
                className="max-w-md"
              />
              <div className="min-h-[200px] max-h-[min(360px,45vh)] overflow-y-auto rounded-md border border-border/80 bg-muted/20">
                {bancoLoading ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : bancoFiltered.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground text-center">
                    {bancoItems.length === 0
                      ? 'No hay preguntas en el banco. Andá a «Gestionar banco» para crearlas.'
                      : 'Ninguna coincide con la búsqueda.'}
                  </p>
                ) : (
                  <ul className="divide-y divide-border/60">
                    {bancoFiltered.map((it) => (
                      <li
                        key={it.id}
                        className="flex gap-3 p-3 items-start hover:bg-background/80 transition-colors"
                      >
                        <Checkbox
                          id={`banco-pick-${it.id}`}
                          checked={bancoPickIds.includes(it.id)}
                          onCheckedChange={() => toggleBancoPick(it.id)}
                          className="mt-1"
                        />
                        <label htmlFor={`banco-pick-${it.id}`} className="flex-1 min-w-0 cursor-pointer">
                          <p className="text-sm leading-snug line-clamp-3">{it.enunciado}</p>
                          <div className="mt-2 flex flex-wrap gap-2">{questionTypeBadge(it.tipo)}</div>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <DialogFooter className="flex-row justify-end gap-2 sm:gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setBancoOpen(false)}>
                  Cerrar
                </Button>
                <Button
                  type="button"
                  onClick={importFromBanco}
                  disabled={bancoPickIds.length === 0 || bancoImporting}
                  className="gap-2"
                >
                  {bancoImporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : null}
                  Importar {bancoPickIds.length > 0 ? `(${bancoPickIds.length})` : ''}
                </Button>
              </DialogFooter>
            </TabsContent>
            <TabsContent value="manage" className="mt-4 space-y-4 data-[state=inactive]:hidden">
              <div className="flex flex-wrap gap-2 items-center justify-between">
                <Input
                  placeholder="Buscar…"
                  value={bancoQuery}
                  onChange={(e) => setBancoQuery(e.target.value)}
                  className="max-w-xs"
                />
                <Button type="button" onClick={openBankCreate} className="gap-1 shrink-0">
                  <Plus className="w-4 h-4" />
                  Nueva en el banco
                </Button>
              </div>
              <div className="max-h-[min(400px,50vh)] overflow-auto rounded-md border">
                {bancoLoading ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Enunciado</TableHead>
                        <TableHead className="w-[120px]">Tipo</TableHead>
                        <TableHead className="w-[100px] text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bancoFiltered.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-10 text-sm">
                            {bancoItems.length === 0
                              ? 'Sin entradas. Creá la primera con «Nueva en el banco».'
                              : 'Sin resultados para la búsqueda.'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        bancoFiltered.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="max-w-md">
                              <span className="line-clamp-2 text-sm">{row.enunciado}</span>
                            </TableCell>
                            <TableCell>{questionTypeBadge(row.tipo)}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => openBankEdit(row)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => {
                                  setDeletingBankRow(row);
                                  setDeleteBankOpen(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>
              <div className="flex justify-end pt-1">
                <Button type="button" variant="outline" onClick={() => setBancoOpen(false)}>
                  Cerrar
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={bankItemDialog} onOpenChange={setBankItemDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {bankItemMode === 'create' ? 'Nueva pregunta en el banco' : 'Editar pregunta del banco'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Enunciado</Label>
              <Textarea
                className="mt-1"
                value={bankItemForm.enunciado}
                onChange={(e) => setBankItemForm((f) => ({ ...f, enunciado: e.target.value }))}
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select
                value={bankItemForm.tipo}
                onValueChange={(v) =>
                  setBankItemForm((f) => ({
                    ...f,
                    tipo: v,
                    opciones_json:
                      v === 'true_false'
                        ? '["Verdadero","Falso"]'
                        : '["Opción A","Opción B","Opción C"]',
                  }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Opción única (single choice)</SelectItem>
                  <SelectItem value="true_false">Verdadero / Falso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {bankItemForm.tipo === 'single' && (
              <div>
                <Label>Opciones (JSON array de textos)</Label>
                <Textarea
                  className="mt-1 font-mono text-sm"
                  rows={3}
                  value={bankItemForm.opciones_json}
                  onChange={(e) => setBankItemForm((f) => ({ ...f, opciones_json: e.target.value }))}
                />
              </div>
            )}
            <div>
              <Label>Índice de la opción correcta (0 = primera)</Label>
              <Input
                type="number"
                min={0}
                className="mt-1"
                value={bankItemForm.indice_correcto}
                onChange={(e) => setBankItemForm((f) => ({ ...f, indice_correcto: e.target.value }))}
              />
            </div>
            <div>
              <Label>Explicación (opcional)</Label>
              <Textarea
                className="mt-1"
                value={bankItemForm.explicacion}
                onChange={(e) => setBankItemForm((f) => ({ ...f, explicacion: e.target.value }))}
              />
            </div>
            <div>
              <Label>Orden en el banco</Label>
              <Input
                type="number"
                className="mt-1"
                value={bankItemForm.orden}
                onChange={(e) => setBankItemForm((f) => ({ ...f, orden: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBankItemDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={saveBankItem} disabled={savingBankItem}>
              {savingBankItem ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteActOpen} onOpenChange={setDeleteActOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cuestionario?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán también todas las preguntas asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAct}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteItemOpen} onOpenChange={setDeleteItemOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pregunta?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteItem}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteBankOpen} onOpenChange={setDeleteBankOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Quitar del banco?</AlertDialogTitle>
            <AlertDialogDescription>
              No afecta a los cuestionarios que ya copiaron esta pregunta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteBankItem}>Eliminar del banco</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminLmsPanel;
