
import React, { forwardRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronDown } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const TIPOS = [
  { value: '__all__', label: 'Todos los tipos' },
  { value: 'PDF', label: 'PDF' },
  { value: 'DOCX', label: 'DOCX' },
  { value: 'XLSX', label: 'XLSX' },
  { value: 'PPT', label: 'PPT' },
];

const SearchBar = forwardRef(function SearchBar(
  {
    searchTerm,
    onSearchChange,
    quickFilters,
    onQuickFilterClick,
    fileType = '',
    onFileTypeChange,
    categoryId = '',
    onCategoryIdChange,
    categoryOptions = [],
    selectedQuickFilters = [],
  },
  ref,
) {
  const [advOpen, setAdvOpen] = useState(false);
  const qLen = searchTerm.trim().length;
  const showMinHint = qLen === 1;

  const toggleQuick = (name) => {
    onQuickFilterClick(name);
  };

  const onBadgeKeyDown = (e, name) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleQuick(name);
    }
  };

  const hasAdvanced = Boolean(onFileTypeChange || onCategoryIdChange);

  return (
    <div className="w-full space-y-5">
      <div className="space-y-2">
        <Label htmlFor="home-search-q" className="text-base font-semibold text-foreground sr-only">
          Buscar en la biblioteca
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" aria-hidden />
          <Input
            ref={ref}
            id="home-search-q"
            type="search"
            autoComplete="off"
            placeholder="Buscar por título o descripción…"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-12 text-base"
            aria-describedby={showMinHint ? 'search-min-chars' : undefined}
          />
        </div>
        {showMinHint && (
          <p id="search-min-chars" className="text-sm text-muted-foreground">
            Escribí al menos <strong>2 caracteres</strong> para buscar.
          </p>
        )}
      </div>

      {hasAdvanced && (
        <Collapsible open={advOpen} onOpenChange={setAdvOpen} className="rounded-lg border border-border/60 bg-muted/20">
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="flex w-full items-center justify-between px-4 py-3 h-auto font-medium text-foreground hover:bg-muted/50"
            >
              <span>Filtros avanzados (tipo y categoría)</span>
              <ChevronDown
                className={cn('h-4 w-4 shrink-0 transition-transform duration-200', advOpen && 'rotate-180')}
                aria-hidden
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="border-t border-border/50 px-4 pb-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {onFileTypeChange && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Tipo de archivo</Label>
                  <Select
                    value={fileType ? fileType : '__all__'}
                    onValueChange={(v) => onFileTypeChange(v === '__all__' ? '' : v)}
                  >
                    <SelectTrigger className="h-11 bg-background">
                      <SelectValue placeholder="Todos" />
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
              )}
              {onCategoryIdChange && categoryOptions.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Limitar a categoría</Label>
                  <Select
                    value={categoryId || '__all__'}
                    onValueChange={(v) => onCategoryIdChange(v === '__all__' ? '' : v)}
                  >
                    <SelectTrigger className="h-11 bg-background">
                      <SelectValue placeholder="Todas las categorías" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Todas las categorías</SelectItem>
                      {categoryOptions.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-muted-foreground font-medium">Filtros rápidos:</span>
        {quickFilters.map((filter) => {
          const active = selectedQuickFilters.includes(filter);
          return (
            <Badge
              key={filter}
              variant={active ? 'default' : 'outline'}
              role="button"
              tabIndex={0}
              className={cn(
                'cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                active && 'bg-primary text-primary-foreground hover:bg-primary/90',
                !active && 'hover:bg-primary hover:text-primary-foreground',
              )}
              onClick={() => toggleQuick(filter)}
              onKeyDown={(e) => onBadgeKeyDown(e, filter)}
              aria-pressed={active}
            >
              {filter}
            </Badge>
          );
        })}
      </div>
    </div>
  );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;
