
import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getCategoryCardAccent } from '@/lib/categoryVisual.js';
import { CategoryIcon } from '@/lib/categoryIcons.jsx';
import { ArrowRight, Layers } from 'lucide-react';

const CategoryCard = ({ category }) => {
  const accent = getCategoryCardAccent(category.id, category.nombre);
  const count = Number.isFinite(category.recursos_count) ? category.recursos_count : 0;

  const description = (category.descripcion || '').trim()
    ? category.descripcion
    : 'Documentos y herramientas listas para tu gestión de prevención y seguridad.';

  return (
    <Link
      to={`/category/${category.id}`}
      className="group block h-full min-h-[320px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl"
      aria-label={`Abrir categoría ${category.nombre} — ${count} recursos disponibles`}
    >
      <article
        className={cn(
          'relative flex h-full min-h-[inherit] flex-col overflow-hidden rounded-2xl',
          'border border-sky-300/55 bg-white dark:border-slate-600/70 dark:bg-slate-900',
          'shadow-[0_2px_6px_-1px_rgba(15,23,42,0.06),0_8px_24px_-6px_rgba(37,99,235,0.14)] dark:shadow-[0_4px_24px_-8px_rgba(0,0,0,0.45)]',
          'ring-1 ring-inset ring-white/70 dark:ring-inset dark:ring-white/[0.06]',
          'transition-all duration-300 ease-out',
          'group-hover:-translate-y-1 group-hover:border-primary/35 group-hover:shadow-[0_12px_40px_-12px_rgba(37,99,235,0.22)] dark:group-hover:border-primary/40',
          accent.stripe,
        )}
      >
        {/* Capas de fondo: más contraste y lectura clara */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white from-[18%] via-sky-50/98 to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-sky-100/35 via-transparent to-white/90 dark:from-slate-950/50 dark:via-transparent dark:to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent dark:via-primary/35"
          aria-hidden
        />
        <div className="relative z-[1] flex flex-1 flex-col p-6 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div
              className={cn(
                'flex shrink-0 items-center justify-center rounded-2xl p-[14px]',
                accent.iconWrap,
              )}
            >
              <CategoryIcon name={category.icono} className="h-7 w-7" />
            </div>
            <Badge
              variant="secondary"
              className={cn(
                'inline-flex shrink-0 items-center gap-1 whitespace-nowrap px-2.5 py-0.5 text-xs font-semibold shadow-none',
                accent.badge,
              )}
            >
              <Layers className="h-3.5 w-3.5 opacity-80" aria-hidden />
              <span>
                <span className="tabular-nums font-bold">{count}</span>
                <span className="ml-1 font-medium opacity-90">recursos</span>
              </span>
            </Badge>
          </div>

          <h3 className="mt-5 text-[1.15rem] font-bold leading-snug tracking-tight text-slate-900 dark:text-slate-50 sm:text-xl line-clamp-2">
            {category.nombre}
          </h3>
          <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-3">
            {description}
          </p>
        </div>

        <div
          className={cn(
            'relative z-[1] mt-auto flex items-center justify-between gap-3 border-t border-sky-200/60 px-6 py-4',
            'bg-gradient-to-r from-sky-100/85 via-white/90 to-sky-50/90 backdrop-blur-[1px]',
            'dark:border-slate-600/70 dark:from-slate-800/95 dark:via-slate-800/90 dark:to-slate-900/95',
          )}
        >
          <span className="text-sm font-semibold text-primary">
            Explorar categoría
          </span>
          <span
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
              'bg-primary/10 text-primary ring-1 ring-primary/15',
              'transition-all duration-300',
              'group-hover:bg-primary group-hover:text-primary-foreground group-hover:ring-primary',
            )}
          >
            <ArrowRight
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
              aria-hidden
            />
          </span>
        </div>
      </article>
    </Link>
  );
};

export default CategoryCard;
