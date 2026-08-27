import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { clienteHttp } from '../../servicios/clienteAxios';
import Badge from '../../componentes/ui/Badge';
import Paginacion from '../../componentes/ui/Paginacion';
import Icono from '../../componentes/ui/Icono';
import BuscadorAnimal from '../../componentes/ui/BuscadorAnimal';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface EventoReproductivo {
  id: string;
  tipo: string;
  fecha: string;
  observaciones?: string;
  animal: { id: string; numeroArete: string; nombre?: string; lote?: { finca?: { nombre: string } } };
  registradoPor: { nombre: string; apellido: string };
}

interface PartoProximo {
  id: string;
  madreId: string;
  madreNumeroArete: string;
  madreNombre?: string;
  finca: string;
  fechaPartoEsperado: string;
  diasRestantes: number;
}

interface RespuestaEventos {
  datos: EventoReproductivo[];
  meta: { total: number; pagina: number; porPagina: number; totalPaginas: number };
}

interface Indicadores {
  anio: number;
  totalHembras: number;
  gestacionesEnCurso: number;
  gestacionesAnio: number;
  gestacionesParto: number;
  abortos: number;
  tasaPreniez: number;
  tasaNatalidad: number;
  tasaAborto: number;
  totalCelos: number;
  totalInseminaciones: number;
  animalesConRepeticion: number;
  tasaRepeticionCelo: number;
}

// ── Mapeo de tipos — usa los valores del enum TipoEventoReproductivo ──────────

const TIPO_EVENTO: Record<string, { etiqueta: string; icono: string; colorVariante: any }> = {
  DETECCION_CELO:          { etiqueta: 'Detección de Celo',   icono: 'favorite',       colorVariante: 'tierra' },
  INSEMINACION_ARTIFICIAL: { etiqueta: 'Inseminación IA',     icono: 'science',        colorVariante: 'azul' },
  MONTA_NATURAL:           { etiqueta: 'Monta Natural',       icono: 'pets',           colorVariante: 'verde' },
  DIAGNOSTICO_GESTACION:   { etiqueta: 'Diagnóstico Gest.',   icono: 'fact_check',     colorVariante: 'morado' },
  PARTO:                   { etiqueta: 'Parto',               icono: 'child_care',     colorVariante: 'verde' },
  ABORTO:                  { etiqueta: 'Aborto',              icono: 'warning',        colorVariante: 'rojo' },
  DESTETE:                 { etiqueta: 'Destete',             icono: 'water_drop',     colorVariante: 'amarillo' },
  DESCARTE_REPRODUCTIVO:   { etiqueta: 'Descarte Reprod.',    icono: 'remove_circle',  colorVariante: 'rojo' },
  // Alias para gestación (usa endpoint separado)
  GESTACION:               { etiqueta: 'Gestación',           icono: 'pregnant_woman', colorVariante: 'morado' },
};

const TIPOS_PARA_FILTRO = [
  '', 'DETECCION_CELO', 'INSEMINACION_ARTIFICIAL', 'MONTA_NATURAL',
  'DIAGNOSTICO_GESTACION', 'PARTO', 'ABORTO',
];

// ── Componente principal ───────────────────────────────────────────────────────

export default function PaginaReproduccion() {
  const navegar = useNavigate();
  const queryClient = useQueryClient();
  const [pestana, setPestana]         = useState<'partos' | 'eventos' | 'indicadores'>('partos');
  const [tipoFiltro, setTipoFiltro]   = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [anioIndicadores, setAnioIndicadores] = useState(new Date().getFullYear());
  const [fincaIndicadores, setFincaIndicadores] = useState('');

  const { data: partosData, isLoading: cargandoPartos } = useQuery<PartoProximo[]>({
    queryKey: ['partos-proximos'],
    queryFn: () =>
      clienteHttp.get('/reproduccion/partos-proximos', { params: { dias: 60, limite: 50 } })
        .then((r) => r.data.datos ?? r.data),
    refetchInterval: 5 * 60_000,
  });

  const { data: eventosData, isLoading: cargandoEventos } = useQuery<RespuestaEventos>({
    queryKey: ['eventos-reproductivos', paginaActual, tipoFiltro],
    queryFn: () =>
      clienteHttp.get('/reproduccion', {
        params: { pagina: paginaActual, porPagina: 25, ...(tipoFiltro && { tipoEvento: tipoFiltro }) },
      }).then((r) => r.data),
    enabled: pestana === 'eventos',
  });

  const { data: fincasIndicadores } = useQuery<{ datos: { id: string; nombre: string }[] }>({
    queryKey: ['fincas-lista'],
    queryFn: () => clienteHttp.get('/fincas?porPagina=100').then((r) => r.data),
    enabled: pestana === 'indicadores',
  });

  const { data: indicadoresData, isLoading: cargandoIndicadores } = useQuery<Indicadores>({
    queryKey: ['indicadores-reproductivos', anioIndicadores, fincaIndicadores],
    queryFn: () =>
      clienteHttp.get('/reproduccion/indicadores', {
        params: { anio: anioIndicadores, ...(fincaIndicadores && { fincaId: fincaIndicadores }) },
      }).then((r) => r.data.datos),
    enabled: pestana === 'indicadores',
  });

  const partos   = partosData ?? [];
  const eventos  = eventosData?.datos ?? [];
  const meta     = eventosData?.meta;
  const urgentes = partos.filter((p) => p.diasRestantes <= 7);
  const proximos = partos.filter((p) => p.diasRestantes > 7 && p.diasRestantes <= 30);
  const futuros  = partos.filter((p) => p.diasRestantes > 30);

  return (
    <div className="space-y-5">
      {/* KPIs superiores */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { et: 'Gestaciones activas', val: partos.length,    ico: 'pregnant_woman', col: 'text-primary',   fondo: 'bg-primary/10' },
          { et: 'Partos en 7 días',    val: urgentes.length,  ico: 'warning',        col: 'text-error',     fondo: 'bg-error-container', borde: !!urgentes.length },
          { et: 'Partos en 30 días',   val: proximos.length,  ico: 'event_upcoming', col: 'text-secondary', fondo: 'bg-secondary/10' },
          { et: 'Partos en 60 días',   val: futuros.length,   ico: 'calendar_month', col: 'text-tertiary',  fondo: 'bg-tertiary/10' },
        ].map((kpi) => (
          <div key={kpi.et}
            className={`tarjeta-vidrio rounded-2xl p-4 ${kpi.borde ? 'border-l-4 border-l-error' : ''}`}
          >
            <div className={`p-2.5 ${kpi.fondo} rounded-xl w-fit mb-3`}>
              <Icono nombre={kpi.ico} relleno clase={`text-[20px] ${kpi.col}`} />
            </div>
            <p className={`text-3xl font-bold ${kpi.col}`}>{kpi.val}</p>
            <p className="text-xs text-on-surface-variant mt-0.5">{kpi.et}</p>
          </div>
        ))}
      </motion.div>

      {/* Cabecera con pestañas y botón */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex gap-1 p-1 bg-surface-container rounded-xl w-fit">
          {([
            { clave: 'partos',      et: 'Partos Próximos',  ico: 'child_care' },
            { clave: 'eventos',     et: 'Historial',         ico: 'history' },
            { clave: 'indicadores', et: 'Indicadores',       ico: 'bar_chart' },
          ] as const).map((p) => (
            <button
              key={p.clave}
              onClick={() => setPestana(p.clave)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all relative ${
                pestana === p.clave
                  ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Icono nombre={p.ico} clase="text-[16px]" />
              {p.et}
              {p.clave === 'partos' && urgentes.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-error text-on-primary text-[9px] font-bold flex items-center justify-center">
                  {urgentes.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={() => setMostrarForm(true)}
          className="boton boton-primario gap-2 text-sm"
        >
          <Icono nombre="add" clase="text-[18px]" />
          Nuevo evento
        </button>
      </div>

      <AnimatePresence mode="wait">

        {/* ── PESTAÑA: PARTOS PRÓXIMOS ──────────────────────────────────────── */}
        {pestana === 'partos' && (
          <motion.div key="partos" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {cargandoPartos ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-2xl bg-surface-container animate-pulse" />
                ))}
              </div>
            ) : !partos.length ? (
              <div className="tarjeta-vidrio rounded-2xl p-12 text-center">
                <Icono nombre="event_available" clase="text-[40px] text-outline mx-auto mb-3" />
                <p className="font-medium text-on-surface-variant">Sin partos programados</p>
                <p className="text-sm text-outline mt-1">No hay gestaciones activas en los próximos 60 días</p>
              </div>
            ) : (
              <div className="space-y-4">
                {urgentes.length > 0 && (
                  <GrupoPartos titulo="Urgentes (≤ 7 días)" urgencia="alta" partos={urgentes}
                    onVerAnimal={(id) => navegar(`/animales/${id}`)} />
                )}
                {proximos.length > 0 && (
                  <GrupoPartos titulo="Próximos (8–30 días)" urgencia="media" partos={proximos}
                    onVerAnimal={(id) => navegar(`/animales/${id}`)} />
                )}
                {futuros.length > 0 && (
                  <GrupoPartos titulo="Futuros (31–60 días)" urgencia="baja" partos={futuros}
                    onVerAnimal={(id) => navegar(`/animales/${id}`)} />
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* ── PESTAÑA: EVENTOS ─────────────────────────────────────────────── */}
        {pestana === 'eventos' && (
          <motion.div key="eventos" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <div className="flex flex-wrap gap-2 mb-4">
              {TIPOS_PARA_FILTRO.map((tipo) => {
                const cfg = TIPO_EVENTO[tipo];
                return (
                  <button
                    key={tipo}
                    onClick={() => { setTipoFiltro(tipo); setPaginaActual(1); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      tipoFiltro === tipo
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {cfg && <Icono nombre={cfg.icono} clase="text-[13px]" />}
                    {tipo === '' ? 'Todos' : cfg?.etiqueta ?? tipo}
                  </button>
                );
              })}
            </div>

            {cargandoEventos ? (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-surface-container animate-pulse" />
                ))}
              </div>
            ) : !eventos.length ? (
              <div className="tarjeta-vidrio rounded-2xl p-12 text-center">
                <Icono nombre="child_care" clase="text-[40px] text-outline mx-auto mb-3" />
                <p className="font-medium text-on-surface-variant">Sin eventos reproductivos</p>
              </div>
            ) : (
              <div className="tarjeta-vidrio rounded-2xl overflow-hidden">
                {eventos.map((ev, idx) => {
                  const cfg = TIPO_EVENTO[ev.tipo] ?? { etiqueta: ev.tipo, icono: 'event', colorVariante: 'gris' };
                  return (
                    <div
                      key={ev.id}
                      className={`p-4 hover:bg-surface-container-low cursor-pointer transition-colors
                                 ${idx < eventos.length - 1 ? 'border-b border-outline-variant/20' : ''}`}
                      onClick={() => navegar(`/animales/${ev.animal.id}`)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-surface-container mt-0.5 flex-shrink-0">
                          <Icono nombre={cfg.icono} clase="text-[16px] text-on-surface-variant" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variante={cfg.colorVariante} tamano="xs">{cfg.etiqueta}</Badge>
                              <span className="text-sm font-semibold text-on-surface">
                                #{ev.animal.numeroArete}
                                {ev.animal.nombre && ` · ${ev.animal.nombre}`}
                              </span>
                              <span className="text-xs text-on-surface-variant">{ev.animal.lote?.finca?.nombre}</span>
                            </div>
                            <span className="text-xs text-outline whitespace-nowrap flex-shrink-0">
                              {new Date(ev.fecha).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          {ev.observaciones && (
                            <p className="text-xs text-on-surface-variant mt-1 line-clamp-1">{ev.observaciones}</p>
                          )}
                        </div>
                        <Icono nombre="chevron_right" clase="text-[18px] text-outline flex-shrink-0" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {meta && meta.totalPaginas > 1 && (
              <div className="mt-4">
                <Paginacion
                  paginaActual={paginaActual}
                  totalPaginas={meta.totalPaginas}
                  totalRegistros={meta.total}
                  porPagina={meta.porPagina}
                  alCambiarPagina={setPaginaActual}
                />
              </div>
            )}
          </motion.div>
        )}

        {/* ── PESTAÑA: INDICADORES ─────────────────────────────────────────── */}
        {pestana === 'indicadores' && (
          <motion.div key="indicadores" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="space-y-5">

            {/* Filtros: año + finca */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-on-surface-variant">Año:</label>
                <select
                  value={anioIndicadores}
                  onChange={(e) => setAnioIndicadores(Number(e.target.value))}
                  className="campo-entrada w-28 text-sm"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              {(fincasIndicadores?.datos?.length ?? 0) > 1 && (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-on-surface-variant">Finca:</label>
                  <select
                    value={fincaIndicadores}
                    onChange={(e) => setFincaIndicadores(e.target.value)}
                    className="campo-entrada text-sm"
                  >
                    <option value="">Todas las fincas</option>
                    {fincasIndicadores?.datos?.map((f) => (
                      <option key={f.id} value={f.id}>{f.nombre}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {cargandoIndicadores ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-28 rounded-2xl bg-surface-container animate-pulse" />
                ))}
              </div>
            ) : !indicadoresData ? (
              <div className="tarjeta-vidrio rounded-2xl p-12 text-center">
                <Icono nombre="bar_chart" clase="text-[40px] text-outline mx-auto mb-3" />
                <p className="text-on-surface-variant">Sin datos para el año seleccionado</p>
              </div>
            ) : (
              <>
                {/* Tasas principales */}
                <div>
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-3">
                    Tasas reproductivas — {indicadoresData.anio}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      {
                        et: 'Tasa de Preñez',
                        val: `${indicadoresData.tasaPreniez}%`,
                        sub: `${indicadoresData.gestacionesEnCurso} de ${indicadoresData.totalHembras} hembras`,
                        ico: 'pregnant_woman', col: 'text-primary', fondo: 'bg-primary/10',
                        bueno: indicadoresData.tasaPreniez >= 60,
                      },
                      {
                        et: 'Tasa de Natalidad',
                        val: `${indicadoresData.tasaNatalidad}%`,
                        sub: `${indicadoresData.gestacionesParto} partos de ${indicadoresData.gestacionesAnio} gest.`,
                        ico: 'child_care', col: 'text-tertiary', fondo: 'bg-tertiary/10',
                        bueno: indicadoresData.tasaNatalidad >= 80,
                      },
                      {
                        et: 'Tasa de Aborto',
                        val: `${indicadoresData.tasaAborto}%`,
                        sub: `${indicadoresData.abortos} abortos registrados`,
                        ico: 'warning', col: 'text-error', fondo: 'bg-error-container',
                        bueno: indicadoresData.tasaAborto <= 5,
                      },
                      {
                        et: 'Repetición de Celo',
                        val: `${indicadoresData.tasaRepeticionCelo}%`,
                        sub: `${indicadoresData.animalesConRepeticion} animales con 2+ celos`,
                        ico: 'refresh', col: 'text-secondary', fondo: 'bg-secondary/10',
                        bueno: indicadoresData.tasaRepeticionCelo <= 15,
                      },
                    ].map((kpi) => (
                      <div key={kpi.et} className="tarjeta-vidrio rounded-2xl p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className={`p-2.5 ${kpi.fondo} rounded-xl`}>
                            <Icono nombre={kpi.ico} relleno clase={`text-[20px] ${kpi.col}`} />
                          </div>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            kpi.bueno
                              ? 'bg-primary/10 text-primary'
                              : 'bg-error-container text-on-error-container'
                          }`}>
                            {kpi.bueno ? 'ÓPTIMO' : 'REVISAR'}
                          </span>
                        </div>
                        <p className={`text-3xl font-bold ${kpi.col}`}>{kpi.val}</p>
                        <p className="text-xs font-semibold text-on-surface mt-0.5">{kpi.et}</p>
                        <p className="text-[11px] text-on-surface-variant mt-0.5">{kpi.sub}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Conteos de actividad */}
                <div>
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-3">
                    Actividad reproductiva — {indicadoresData.anio}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { et: 'Hembras activas',      val: indicadoresData.totalHembras,       ico: 'group',      col: 'text-on-surface' },
                      { et: 'Detecciones de celo',   val: indicadoresData.totalCelos,          ico: 'favorite',   col: 'text-tierra-700' },
                      { et: 'Inseminaciones / Montas', val: indicadoresData.totalInseminaciones, ico: 'science',   col: 'text-primary' },
                      { et: 'Gestaciones en el año', val: indicadoresData.gestacionesAnio,     ico: 'pregnant_woman', col: 'text-secondary' },
                      { et: 'Partos registrados',    val: indicadoresData.gestacionesParto,    ico: 'child_care', col: 'text-tertiary' },
                      { et: 'Gestaciones en curso',  val: indicadoresData.gestacionesEnCurso,  ico: 'hourglass_top', col: 'text-primary' },
                    ].map((item) => (
                      <div key={item.et} className="tarjeta-vidrio rounded-2xl p-4 flex items-center gap-3">
                        <div className="p-2.5 bg-surface-container rounded-xl flex-shrink-0">
                          <Icono nombre={item.ico} relleno clase={`text-[20px] ${item.col}`} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-on-surface">{item.val}</p>
                          <p className="text-xs text-on-surface-variant leading-tight">{item.et}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Nota metodológica */}
                <div className="flex items-start gap-3 px-4 py-3.5 bg-surface-container rounded-2xl border border-outline-variant/20">
                  <Icono nombre="info" clase="text-[18px] text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    <span className="font-semibold text-on-surface">Tasa de preñez</span> = gestaciones activas / hembras activas.
                    {' '}<span className="font-semibold text-on-surface">Repetición de celo</span> = animales con ≥2 detecciones
                    de celo sin gestación exitosa entre ellas, sobre el total de inseminaciones.
                    Referencia: preñez ≥ 60 %, natalidad ≥ 80 %, aborto ≤ 5 %, repetición ≤ 15 %.
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}

      </AnimatePresence>

      {/* FAB móvil */}
      <button
        onClick={() => setMostrarForm(true)}
        className="md:hidden fixed bottom-20 right-5 w-14 h-14 bg-primary text-on-primary rounded-full
                   shadow-[var(--shadow-primary)] flex items-center justify-center
                   hover:scale-110 active:scale-95 transition-transform z-20"
      >
        <Icono nombre="add" clase="text-[28px]" />
      </button>

      <AnimatePresence>
        {mostrarForm && (
          <FormularioEvento
            onCerrar={() => setMostrarForm(false)}
            onExito={() => {
              queryClient.invalidateQueries({ queryKey: ['eventos-reproductivos'] });
              queryClient.invalidateQueries({ queryKey: ['partos-proximos'] });
              queryClient.invalidateQueries({ queryKey: ['indicadores-reproductivos'] });
              setMostrarForm(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Grupo de partos ───────────────────────────────────────────────────────────

function GrupoPartos({ titulo, urgencia, partos, onVerAnimal }: {
  titulo: string;
  urgencia: 'alta' | 'media' | 'baja';
  partos: PartoProximo[];
  onVerAnimal: (id: string) => void;
}) {
  const cfg = {
    alta:  { dot: 'bg-error',     tit: 'text-error',     badge: 'rojo' as const,   card: 'border-error/20 bg-error-container/20' },
    media: { dot: 'bg-secondary', tit: 'text-secondary',  badge: 'tierra' as const, card: 'border-secondary/20 bg-secondary/5' },
    baja:  { dot: 'bg-primary',   tit: 'text-primary',   badge: 'verde' as const,  card: 'border-primary/15 bg-primary/5' },
  }[urgencia];

  return (
    <div>
      <div className="flex items-center gap-2 mb-2 px-1">
        <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
        <span className={`text-xs font-semibold uppercase tracking-wide ${cfg.tit}`}>{titulo}</span>
        <span className="text-xs text-outline">({partos.length})</span>
      </div>
      <div className={`rounded-2xl border overflow-hidden ${cfg.card}`}>
        {partos.map((p, idx) => (
          <div
            key={p.id}
            className={`flex items-center justify-between px-4 py-3 hover:bg-white/60 cursor-pointer transition-colors
                       ${idx < partos.length - 1 ? 'border-b border-outline-variant/20' : ''}`}
            onClick={() => onVerAnimal(p.madreId)}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/80 rounded-xl">
                <Icono nombre="pregnant_woman" relleno clase="text-[16px] text-secondary" />
              </div>
              <div>
                <span className="text-sm font-semibold text-on-surface">
                  #{p.madreNumeroArete}
                  {p.madreNombre && <span className="font-normal text-on-surface-variant"> · {p.madreNombre}</span>}
                </span>
                <p className="text-xs text-on-surface-variant">{p.finca}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-on-surface">
                {new Date(p.fechaPartoEsperado).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })}
              </p>
              <Badge variante={cfg.badge} tamano="xs">
                {p.diasRestantes === 0 ? 'Hoy' : p.diasRestantes === 1 ? 'Mañana' : `${p.diasRestantes} días`}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Formulario: Nuevo Evento ──────────────────────────────────────────────────

const TIPOS_FORM = [
  { valor: 'GESTACION',               etiqueta: 'Gestación (nueva)' },
  { valor: 'DETECCION_CELO',          etiqueta: 'Detección de Celo' },
  { valor: 'INSEMINACION_ARTIFICIAL', etiqueta: 'Inseminación Artificial' },
  { valor: 'MONTA_NATURAL',           etiqueta: 'Monta Natural' },
  { valor: 'DIAGNOSTICO_GESTACION',   etiqueta: 'Diagnóstico de Gestación' },
  { valor: 'PARTO',                   etiqueta: 'Parto' },
  { valor: 'ABORTO',                  etiqueta: 'Aborto' },
  { valor: 'DESTETE',                 etiqueta: 'Destete' },
  { valor: 'DESCARTE_REPRODUCTIVO',   etiqueta: 'Descarte Reproductivo' },
];

const DIAS_GESTACION_BOVINA = 283;
const TIPOS_INICIAN_GESTACION = new Set(['INSEMINACION_ARTIFICIAL', 'MONTA_NATURAL']);

function sumarDias(fechaStr: string, dias: number): string {
  if (!fechaStr) return '';
  const d = new Date(fechaStr + 'T12:00:00');
  d.setDate(d.getDate() + dias);
  return d.toISOString().split('T')[0];
}

function FormularioEvento({ onCerrar, onExito }: { onCerrar: () => void; onExito: () => void }) {
  const hoy = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    animalId: '',
    tipo: 'DETECCION_CELO',
    fecha: hoy,
    observaciones: '',
    fechaInicio: hoy,
    fechaPartoEsperado: '',
    crearGestacion: true,
    // Campos IA
    clasificacionIA: '',
    tecnicaDeposicion: '',
    patologiasVaca: '',
    tasaMetabolicaBasal: '',
    balanceEnergetico: '',
    temperaturaUterina: '',
    manejoHato: '',
  });
  const [error, setError] = useState('');

  const esGestacion      = form.tipo === 'GESTACION';
  const esIA             = form.tipo === 'INSEMINACION_ARTIFICIAL';
  const iniciaGestacion  = TIPOS_INICIAN_GESTACION.has(form.tipo);

  function handleTipo(nuevoTipo: string) {
    setForm((f) => {
      const fechaBase = nuevoTipo === 'GESTACION' ? f.fechaInicio : f.fecha;
      const autoCalc  = nuevoTipo === 'GESTACION' || TIPOS_INICIAN_GESTACION.has(nuevoTipo);
      return {
        ...f,
        tipo: nuevoTipo,
        fechaPartoEsperado: autoCalc ? sumarDias(fechaBase, DIAS_GESTACION_BOVINA) : '',
      };
    });
  }

  function handleFecha(nuevaFecha: string) {
    setForm((f) => ({
      ...f,
      fecha: nuevaFecha,
      ...(TIPOS_INICIAN_GESTACION.has(f.tipo) && {
        fechaPartoEsperado: sumarDias(nuevaFecha, DIAS_GESTACION_BOVINA),
      }),
    }));
  }

  function handleFechaInicio(nuevaFechaInicio: string) {
    setForm((f) => ({
      ...f,
      fechaInicio: nuevaFechaInicio,
      fechaPartoEsperado: sumarDias(nuevaFechaInicio, DIAS_GESTACION_BOVINA),
    }));
  }

  const mutacion = useMutation({
    mutationFn: async (datos: typeof form) => {
      if (datos.tipo === 'GESTACION') {
        return clienteHttp.post('/reproduccion/gestaciones', {
          madreId:            datos.animalId,
          fechaInicio:        new Date(datos.fechaInicio).toISOString(),
          fechaPartoEsperado: new Date(datos.fechaPartoEsperado).toISOString(),
          observaciones:      datos.observaciones || undefined,
        });
      }
      // Registrar el evento reproductivo
      const payloadEvento: Record<string, any> = {
        animalId:      datos.animalId,
        tipo:          datos.tipo,
        fecha:         new Date(datos.fecha).toISOString(),
        observaciones: datos.observaciones || undefined,
      };
      if (datos.tipo === 'INSEMINACION_ARTIFICIAL') {
        if (datos.clasificacionIA)    payloadEvento.clasificacionIA    = datos.clasificacionIA;
        if (datos.tecnicaDeposicion)  payloadEvento.tecnicaDeposicion  = datos.tecnicaDeposicion;
        if (datos.patologiasVaca)     payloadEvento.patologiasVaca     = datos.patologiasVaca;
        if (datos.tasaMetabolicaBasal) payloadEvento.tasaMetabolicaBasal = parseInt(datos.tasaMetabolicaBasal);
        if (datos.balanceEnergetico)  payloadEvento.balanceEnergetico  = datos.balanceEnergetico;
        if (datos.temperaturaUterina) payloadEvento.temperaturaUterina = parseFloat(datos.temperaturaUterina);
        if (datos.manejoHato)         payloadEvento.manejoHato         = datos.manejoHato;
      }
      await clienteHttp.post('/reproduccion', payloadEvento);
      // Si es IA o Monta y se optó por registrar gestación, crearla también
      if (TIPOS_INICIAN_GESTACION.has(datos.tipo) && datos.crearGestacion && datos.fechaPartoEsperado) {
        await clienteHttp.post('/reproduccion/gestaciones', {
          madreId:            datos.animalId,
          fechaInicio:        new Date(datos.fecha).toISOString(),
          fechaPartoEsperado: new Date(datos.fechaPartoEsperado).toISOString(),
          observaciones:      datos.observaciones || undefined,
        });
      }
    },
    onSuccess: () => onExito(),
    onError: (err: any) => setError(err?.response?.data?.mensaje ?? 'Error al registrar el evento'),
  });

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-inverse-surface/40 z-40" onClick={onCerrar}
      />
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
            <h2 className="font-bold text-on-surface flex items-center gap-2">
              <Icono nombre="child_care" clase="text-[20px] text-primary" />
              Nuevo Evento Reproductivo
            </h2>
            <button onClick={onCerrar} className="p-2 hover:bg-surface-container rounded-xl transition-colors">
              <Icono nombre="close" clase="text-[20px] text-on-surface-variant" />
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.animalId) { setError('Debe seleccionar un animal'); return; }
              if ((esGestacion || (iniciaGestacion && form.crearGestacion)) && !form.fechaPartoEsperado) {
                setError('La fecha de parto esperado es requerida');
                return;
              }
              setError('');
              mutacion.mutate(form);
            }}
            className="p-6 space-y-4"
          >
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-error-container border border-error/20 rounded-xl text-sm text-on-error-container">
                <Icono nombre="error" clase="text-[18px] flex-shrink-0 text-error" />
                {error}
              </div>
            )}

            <div>
              <BuscadorAnimal
                etiqueta="Animal"
                requerido
                valor={form.animalId}
                alSeleccionar={(id) => setForm((f) => ({ ...f, animalId: id }))}
                placeholder="Buscar por arete o nombre..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  Tipo <span className="text-error">*</span>
                </label>
                <select
                  value={form.tipo}
                  onChange={(e) => handleTipo(e.target.value)}
                  className="campo-entrada"
                >
                  {TIPOS_FORM.map((t) => (
                    <option key={t.valor} value={t.valor}>{t.etiqueta}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  Fecha <span className="text-error">*</span>
                </label>
                <input
                  type="date"
                  value={form.fecha}
                  onChange={(e) => handleFecha(e.target.value)}
                  className="campo-entrada"
                />
              </div>
            </div>

            {/* Campos adicionales para Gestación */}
            {esGestacion && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="overflow-hidden grid grid-cols-2 gap-3"
              >
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Inicio Gestación</label>
                  <input
                    type="date"
                    value={form.fechaInicio}
                    onChange={(e) => handleFechaInicio(e.target.value)}
                    className="campo-entrada"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                    Parto Esperado <span className="text-error">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.fechaPartoEsperado}
                    onChange={(e) => setForm((f) => ({ ...f, fechaPartoEsperado: e.target.value }))}
                    className="campo-entrada"
                  />
                </div>
              </motion.div>
            )}

            {/* Parto esperado para IA / Monta Natural */}
            {iniciaGestacion && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="overflow-hidden space-y-3"
              >
                <div className="flex items-start gap-3 px-3.5 py-3 bg-primary/5 border border-primary/20 rounded-xl">
                  <Icono nombre="pregnant_woman" relleno clase="text-[18px] text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    La fecha de parto se estima a <strong className="text-on-surface">{DIAS_GESTACION_BOVINA} días</strong> de la fecha del evento.
                    Puede ajustarla manualmente.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                    Parto Esperado <span className="text-error">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.fechaPartoEsperado}
                    onChange={(e) => setForm((f) => ({ ...f, fechaPartoEsperado: e.target.value }))}
                    className="campo-entrada"
                  />
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.crearGestacion}
                    onChange={(e) => setForm((f) => ({ ...f, crearGestacion: e.target.checked }))}
                    className="w-4 h-4 rounded accent-primary"
                  />
                  <span className="text-xs text-on-surface">
                    Registrar gestación activa (aparecerá en Partos Próximos)
                  </span>
                </label>
              </motion.div>
            )}

            {/* ── Campos específicos de IA ── */}
            {esIA && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="overflow-hidden space-y-3 p-4 bg-surface-container rounded-xl border border-outline-variant/30"
              >
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                  Datos de Inseminación Artificial
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Clasificación</label>
                    <select value={form.clasificacionIA}
                      onChange={(e) => setForm((f) => ({ ...f, clasificacionIA: e.target.value }))}
                      className="campo-entrada text-sm">
                      <option value="">No especificado</option>
                      <option value="CELO_DETECTADO">Celo detectado</option>
                      <option value="TIEMPO_FIJO">Tiempo fijo (IATF)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Técnica de deposición</label>
                    <select value={form.tecnicaDeposicion}
                      onChange={(e) => setForm((f) => ({ ...f, tecnicaDeposicion: e.target.value }))}
                      className="campo-entrada text-sm">
                      <option value="">No especificado</option>
                      <option value="INTRAUTERINA_RECTOVAGINAL">Intrauterina rectovaginal</option>
                      <option value="INTRAUTERINA_PROFUNDA">Intrauterina profunda</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Tasa metabólica basal (1–5)</label>
                    <input type="number" min="1" max="5" step="1"
                      value={form.tasaMetabolicaBasal}
                      onChange={(e) => setForm((f) => ({ ...f, tasaMetabolicaBasal: e.target.value }))}
                      placeholder="1=bajo, 5=alto" className="campo-entrada text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Temperatura uterina (°C)</label>
                    <input type="number" step="0.1"
                      value={form.temperaturaUterina}
                      onChange={(e) => setForm((f) => ({ ...f, temperaturaUterina: e.target.value }))}
                      placeholder="Ej: 38.8" className="campo-entrada text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Balance energético</label>
                    <input type="text"
                      value={form.balanceEnergetico}
                      onChange={(e) => setForm((f) => ({ ...f, balanceEnergetico: e.target.value }))}
                      placeholder="Positivo, negativo..." className="campo-entrada text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Manejo del hato (estrés)</label>
                    <select value={form.manejoHato}
                      onChange={(e) => setForm((f) => ({ ...f, manejoHato: e.target.value }))}
                      className="campo-entrada text-sm">
                      <option value="">No especificado</option>
                      <option value="BAJO">Bajo</option>
                      <option value="MEDIO">Medio</option>
                      <option value="ALTO">Alto</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Patologías de la vaca</label>
                  <textarea rows={2}
                    value={form.patologiasVaca}
                    onChange={(e) => setForm((f) => ({ ...f, patologiasVaca: e.target.value }))}
                    placeholder="Describa patologías relevantes que puedan afectar la IA..."
                    className="campo-entrada resize-none text-sm" />
                </div>
              </motion.div>
            )}

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Observaciones</label>
              <textarea
                value={form.observaciones}
                onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))}
                rows={3}
                placeholder="Notas adicionales del evento..."
                className="campo-entrada resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onCerrar} className="flex-1 boton boton-secundario">Cancelar</button>
              <button type="submit" disabled={mutacion.isPending} className="flex-1 boton boton-primario">
                {mutacion.isPending ? 'Guardando...' : 'Registrar evento'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  );
}
