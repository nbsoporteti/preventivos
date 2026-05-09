import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import apiServerClient from '@/lib/apiServerClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  ChevronLeft,
  Loader2,
  Send,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  BookOpen,
  ListChecks,
  Sparkles,
} from 'lucide-react';

/**
 * Flujo: intro → una pregunta por paso → revisión → resultados (API).
 */
const LmsActivityPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actividad, setActividad] = useState(null);
  const [preguntas, setPreguntas] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [resultado, setResultado] = useState(null);
  /** intro | quiz | review */
  const [phase, setPhase] = useState('intro');
  const [step, setStep] = useState(0);

  const fetchActividad = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    setResultado(null);
    setPhase('intro');
    setStep(0);
    try {
      const res = await apiServerClient.fetch(
        `/catalog/lms/actividades/${encodeURIComponent(slug)}`,
      );
      const data = await res.json().catch(() => ({}));
      if (res.status === 404) {
        setError('Actividad no encontrada');
        setActividad(null);
        setPreguntas([]);
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Error al cargar');
      setActividad(data.actividad || null);
      setPreguntas(Array.isArray(data.preguntas) ? data.preguntas : []);
      setAnswers({});
    } catch (e) {
      setError(e.message || 'Error');
      setActividad(null);
      setPreguntas([]);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchActividad();
  }, [fetchActividad]);

  const total = preguntas.length;
  const answeredCount = preguntas.filter((p) => answers[p.id] !== undefined && answers[p.id] !== '').length;

  const allAnswered =
    total > 0 && preguntas.every((p) => answers[p.id] !== undefined && answers[p.id] !== '');

  const goNext = () => {
    const p = preguntas[step];
    if (!p) return;
    if (answers[p.id] === undefined || answers[p.id] === '') {
      toast.error('Seleccioná una opción para continuar');
      return;
    }
    if (step >= total - 1) {
      if (!preguntas.every((q) => answers[q.id] !== undefined && answers[q.id] !== '')) {
        toast.error('Completá todas las preguntas antes de revisar');
        return;
      }
      setPhase('review');
      return;
    }
    setStep((s) => s + 1);
  };

  const goPrev = () => {
    if (phase === 'review') {
      setPhase('quiz');
      setStep(Math.max(0, total - 1));
      return;
    }
    if (step > 0) setStep((s) => s - 1);
  };

  const startQuiz = () => {
    if (total === 0) return;
    setPhase('quiz');
    setStep(0);
  };

  const jumpToReview = () => {
    if (!allAnswered) {
      const firstMissing = preguntas.findIndex(
        (q) => answers[q.id] === undefined || answers[q.id] === '',
      );
      if (firstMissing >= 0) {
        setPhase('quiz');
        setStep(firstMissing);
        toast.error('Faltan respuestas. Te llevamos a la primera incompleta.');
      }
      return;
    }
    setPhase('review');
  };

  const onSubmit = async () => {
    if (!slug || !preguntas.length) return;
    for (const p of preguntas) {
      if (answers[p.id] === undefined || answers[p.id] === '') {
        toast.error('Respondé todas las preguntas antes de enviar');
        return;
      }
    }
    if (!isAuthenticated) {
      toast.error('Iniciá sesión de nuevo para guardar tu resultado');
      navigate('/login', {
        state: { from: { pathname: `/dashboard/aprende/${slug}` } },
        replace: true,
      });
      return;
    }
    setSubmitting(true);
    try {
      const body = { answers };
      const res = await apiServerClient.fetch(
        `/catalog/lms/actividades/${encodeURIComponent(slug)}/intentos`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(body),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'No se pudo enviar');
        return;
      }
      setResultado(data);
      setPhase('intro');
      toast.success('Resultado registrado');
    } catch {
      toast.error('Error de red');
    } finally {
      setSubmitting(false);
    }
  };

  const resetAttempt = () => {
    setResultado(null);
    setAnswers({});
    setPhase('intro');
    setStep(0);
    fetchActividad();
  };

  const current = preguntas[step];
  const answeredProgressPct = total ? Math.round((answeredCount / total) * 100) : 0;

  const title = actividad?.titulo ? `${actividad.titulo} | Aprende` : 'Actividad | Aprende';

  return (
    <>
      <Helmet>
        <title>{title}</title>
        {actividad?.descripcion ? (
          <meta name="description" content={actividad.descripcion.slice(0, 160)} />
        ) : null}
      </Helmet>
      <div>
        <Button variant="ghost" asChild className="mb-6 -ml-2 text-muted-foreground">
          <Link to="/dashboard/aprende">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Volver a actividades
          </Link>
        </Button>

        <div className="max-w-3xl">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <p className="text-center text-destructive py-12">{error}</p>
          ) : (
            <>
              <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">{actividad?.titulo}</h1>
                {actividad?.categoria?.nombre ? (
                  <p className="text-sm font-medium text-muted-foreground mt-1">{actividad.categoria.nombre}</p>
                ) : null}
                {actividad?.descripcion ? (
                  <p className="text-muted-foreground mt-2 leading-relaxed">{actividad.descripcion}</p>
                ) : null}
              </header>

              {resultado ? (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <Card className="border-primary/25 overflow-hidden shadow-sm">
                    <CardContent className="p-8 text-center space-y-4">
                      <div className="inline-flex rounded-full bg-primary/10 p-4 text-primary">
                        <Sparkles className="w-10 h-10" aria-hidden />
                      </div>
                      <h2 className="text-2xl font-semibold tracking-tight">Resultado del intento</h2>
                      <p className="text-4xl font-bold tabular-nums text-primary">
                        {resultado.puntaje}
                        <span className="text-lg font-normal text-muted-foreground">
                          {' '}
                          / {resultado.max_puntos}
                        </span>
                      </p>
                      {typeof resultado.porcentaje === 'number' ? (
                        <>
                          <Progress value={resultado.porcentaje} className="h-3 max-w-xs mx-auto" />
                          <p className="text-sm text-muted-foreground">
                            {resultado.porcentaje}% de respuestas correctas
                          </p>
                        </>
                      ) : null}
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <ListChecks className="w-5 h-5 text-primary" />
                      Retroalimentación por pregunta
                    </h3>
                    <ul className="space-y-4">
                      {(Array.isArray(resultado.detalle) ? resultado.detalle : []).map((d) => (
                        <li
                          key={d.item_id}
                          className={cn(
                            'rounded-xl border p-5 shadow-sm transition-colors',
                            d.correcto
                              ? 'border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/20 dark:border-emerald-900'
                              : 'border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-900',
                          )}
                        >
                          <div className="flex items-start gap-3">
                            {d.correcto ? (
                              <CheckCircle2
                                className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5"
                                aria-hidden
                              />
                            ) : (
                              <XCircle
                                className="w-6 h-6 text-amber-600 shrink-0 mt-0.5"
                                aria-hidden
                              />
                            )}
                            <div className="min-w-0 space-y-3 flex-1">
                              <p className="font-medium leading-snug">{d.enunciado || d.item_id}</p>
                              <div className="grid gap-2 text-sm sm:grid-cols-2">
                                <div
                                  className={cn(
                                    'rounded-md border px-3 py-2',
                                    d.correcto ? 'bg-white/60 dark:bg-background/40' : 'bg-white/80',
                                  )}
                                >
                                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Tu respuesta
                                  </p>
                                  <p className="mt-0.5 font-medium">{d.texto_seleccion}</p>
                                </div>
                                {!d.correcto ? (
                                  <div className="rounded-md border border-emerald-200 bg-emerald-50/90 px-3 py-2 dark:bg-emerald-950/40">
                                    <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200 uppercase tracking-wide">
                                      Respuesta correcta
                                    </p>
                                    <p className="mt-0.5 font-medium text-emerald-900 dark:text-emerald-100">
                                      {d.texto_correcto}
                                    </p>
                                  </div>
                                ) : null}
                              </div>
                              {d.explicacion ? (
                                <p className="text-sm text-muted-foreground border-l-2 border-primary/30 pl-3 italic">
                                  {d.explicacion}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <Button variant="outline" onClick={() => navigate('/dashboard/aprende')}>
                      Otra actividad
                    </Button>
                    <Button onClick={resetAttempt}>Reintentar este cuestionario</Button>
                  </div>
                </div>
              ) : phase === 'intro' && total > 0 ? (
                <Card className="border-primary/20 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <CardContent className="p-8 space-y-6">
                    <div className="flex items-center gap-3 text-primary">
                      <div className="rounded-lg bg-primary/10 p-3">
                        <BookOpen className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">Antes de empezar</p>
                        <p className="text-sm text-muted-foreground">
                          {total} pregunta{total !== 1 ? 's' : ''} · una por pantalla · podés volver atrás
                        </p>
                      </div>
                    </div>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Leé cada enunciado con calma; las opciones son excluyentes.</li>
                      <li>Al final vas a poder revisar todo antes de enviar.</li>
                      <li>Después del envío verás qué acertaste y una breve explicación cuando el admin la haya cargado.</li>
                    </ul>
                    <Button size="lg" className="gap-2" onClick={startQuiz}>
                      Comenzar el cuestionario
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ) : phase === 'review' && total > 0 ? (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div>
                    <h2 className="text-xl font-semibold mb-2">Revisá tus respuestas</h2>
                    <p className="text-sm text-muted-foreground">
                      Si querés cambiar algo, tocá «Editar» en esa pregunta. Cuando estés conforme, enviá para
                      guardar el puntaje.
                    </p>
                  </div>
                  <ul className="space-y-3">
                    {preguntas.map((p, idx) => {
                      const idxAns = answers[p.id];
                      const label =
                        typeof idxAns === 'number' && p.opciones[idxAns] !== undefined
                          ? p.opciones[idxAns]
                          : '—';
                      return (
                        <li
                          key={p.id}
                          className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border bg-card p-4"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground mb-1">Pregunta {idx + 1}</p>
                            <p className="font-medium text-sm leading-snug line-clamp-2">{p.enunciado}</p>
                            <p className="text-sm text-muted-foreground mt-2">
                              <span className="text-foreground font-medium">{label}</span>
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0"
                            onClick={() => {
                              setPhase('quiz');
                              setStep(idx);
                            }}
                          >
                            Editar
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="ghost" onClick={goPrev} className="gap-1">
                      <ArrowLeft className="w-4 h-4" />
                      Volver a la última pregunta
                    </Button>
                    <Button size="lg" className="gap-2 ml-auto" onClick={onSubmit} disabled={submitting}>
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      Enviar y ver resultado
                    </Button>
                  </div>
                  {!isAuthenticated ? (
                    <p className="text-sm text-muted-foreground">
                      <Link
                        to="/login"
                        state={{ from: { pathname: `/dashboard/aprende/${slug}` } }}
                        className="text-primary underline underline-offset-4"
                      >
                        Iniciá sesión
                      </Link>{' '}
                      para poder guardar el intento.
                    </p>
                  ) : null}
                </div>
              ) : phase === 'quiz' && current ? (
                <div className="space-y-6 animate-in fade-in duration-200" key={step}>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>
                        Pregunta {step + 1} de {total}
                      </span>
                      <span>{answeredCount}/{total} respondidas</span>
                    </div>
                    <Progress value={answeredProgressPct} className="h-2" />
                    <p className="text-xs text-muted-foreground text-right">{answeredProgressPct}% del cuestionario</p>
                  </div>

                  <Card className="shadow-md border-border/80">
                    <CardContent className="p-6 sm:p-8">
                      <p className="text-lg sm:text-xl font-medium leading-relaxed mb-6">
                        {current.enunciado}
                      </p>
                      <div className="space-y-2" role="radiogroup" aria-label="Opciones de respuesta">
                        {current.opciones.map((op, i) => {
                          const selected = answers[current.id] === i;
                          return (
                            <button
                              key={`${current.id}-${i}`}
                              type="button"
                              onClick={() =>
                                setAnswers((prev) => ({ ...prev, [current.id]: i }))
                              }
                              className={cn(
                                'w-full text-left rounded-xl border-2 px-4 py-3.5 text-sm sm:text-base transition-all',
                                'hover:border-primary/40 hover:bg-muted/50',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                                selected
                                  ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                                  : 'border-border bg-card',
                              )}
                            >
                              <span className="font-medium text-muted-foreground mr-2 tabular-nums">
                                {String.fromCharCode(65 + i)}.
                              </span>
                              {op}
                            </button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 sm:justify-between">
                    <Button
                      variant="outline"
                      onClick={goPrev}
                      disabled={step === 0}
                      className="gap-1 sm:min-w-[8rem]"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Anterior
                    </Button>
                    <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto">
                      {step < total - 1 ? (
                        <Button size="lg" className="gap-2" onClick={goNext}>
                          Siguiente
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button size="lg" className="gap-2" onClick={goNext}>
                          Revisar respuestas
                          <ListChecks className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <Button variant="link" className="text-muted-foreground px-0 h-auto" onClick={jumpToReview}>
                    Ir a revisión (solo si completaste todas)
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground">Esta actividad aún no tiene preguntas.</p>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default LmsActivityPage;
