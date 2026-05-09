import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import apiServerClient from '@/lib/apiServerClient.js';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, ChevronRight, Loader2 } from 'lucide-react';
import { mergeAprendeCms } from '@/lib/cms/aprendeCmsModel.js';

function groupActividadesByCategoria(actividades) {
  const map = new Map();
  for (const a of actividades) {
    const key = a.categoria?.id || '__sin__';
    const label = a.categoria?.nombre || 'Sin categoría';
    if (!map.has(key)) {
      map.set(key, { key, label, items: [] });
    }
    map.get(key).items.push(a);
  }
  const sections = [...map.values()];
  sections.sort((A, B) => {
    if (A.key === '__sin__') return 1;
    if (B.key === '__sin__') return -1;
    return A.label.localeCompare(B.label, 'es', { sensitivity: 'base' });
  });
  for (const s of sections) {
    s.items.sort((a, b) => {
      const oa = Number(a.orden ?? 0);
      const ob = Number(b.orden ?? 0);
      if (oa !== ob) return oa - ob;
      return String(a.titulo || '').localeCompare(String(b.titulo || ''), 'es', { sensitivity: 'base' });
    });
  }
  return sections;
}

const LmsCatalogPage = () => {
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [cms, setCms] = useState(() => mergeAprendeCms({}));
  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const r = await apiServerClient.fetch('/catalog/cms/pages/aprende');
        if (!r.ok || c) return;
        const data = await r.json();
        if (!c) setCms(mergeAprendeCms(data));
      } catch {
        /* */
      }
    })();
    return () => { c = true; };
  }, []);

  const ap = cms.bloques;

  const sections = useMemo(() => groupActividadesByCategoria(actividades), [actividades]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiServerClient.fetch('/catalog/lms/actividades');
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || ap.errGeneric);
        if (!cancelled) setActividades(Array.isArray(data.actividades) ? data.actividades : []);
      } catch (e) {
        if (!cancelled) {
          setError(e.message || 'Error');
          setActividades([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>{cms.meta_title}</title>
        <meta name="description" content={cms.meta_description} />
      </Helmet>
      <div>
        <section className="rounded-xl bg-gradient-to-r from-primary to-primary/85 text-primary-foreground px-6 py-10 mb-8">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">{ap.heroTitle}</h2>
          <p className="text-primary-foreground/90 max-w-2xl text-sm md:text-base">
            {ap.heroSubtitle}
          </p>
        </section>
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <p className="text-center text-destructive">{error}</p>
        ) : actividades.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            {ap.emptyMsg}
          </p>
        ) : (
          <div className="space-y-10">
            {sections.map((section) => (
              <section key={section.key} aria-labelledby={`cat-${section.key}`}>
                <h3
                  id={`cat-${section.key}`}
                  className="text-lg font-semibold tracking-tight border-b border-border/60 pb-2 mb-4"
                >
                  {section.label}
                </h3>
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {section.items.map((a) => (
                    <li key={a.id}>
                      <Card className="h-full border-border/60 hover:border-primary/30 transition-colors">
                        <CardContent className="p-6 flex flex-col h-full">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="rounded-lg bg-primary/10 p-2 text-primary">
                              <BookOpen className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-lg leading-snug">{a.titulo}</h3>
                              <p className="text-xs text-muted-foreground mt-1">
                                {a.item_count} pregunta{a.item_count !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          {a.descripcion ? (
                            <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                              {a.descripcion}
                            </p>
                          ) : (
                            <div className="flex-1" />
                          )}
                          <Button asChild className="w-full mt-2">
                            <Link to={`/dashboard/aprende/${encodeURIComponent(a.slug)}`}>
                              {ap.btnComenzar}
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default LmsCatalogPage;
