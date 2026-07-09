import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { clienteHttp } from '../../servicios/clienteAxios';
import { useAutenticacion } from '../../hooks/useAutenticacion';
import { BadgePrioridad } from '../../componentes/ui/Badge';
import Paginacion from '../../componentes/ui/Paginacion';
import Icono from '../../componentes/ui/Icono';
import { ModalConfirmacion } from '../../componentes/ui/Modal';
import toast from 'react-hot-toast';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Notificacion {
  id: string;
  titulo: string;
  mensaje: string;
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  entidadTipo?: string;
  entidadId?: string;
  leida: boolean;
  fechaLeida?: string;
  creadoEn: string;
}

interface ResumenAlertas {
  totalNoLeidas: number;
  porPrioridad: { critica: number; alta: number; media: number; baja: number };
  porTipoEntidad: { tipo: string; cantidad: number }[];
  urgentes: Notificacion[];
}

interface ReglaAlerta {
  id: string;
  nombre: string;
  descripcion?: string;
  tipoAlerta: string;
  umbralValor?: number;
  umbralUnidad?: string;
  activa: boolean;
  notificarAdministrador: boolean;
  notificarVeterinario: boolean;
  notificarTecnico: boolean;
  ultimaEvaluacion?: string;
}

interface RespuestaNotificaciones {
  datos: Notificacion[];
  meta: { total: number; pagina: number; porPagina: number; totalPaginas: number };
}

// ── Configuración visual por prioridad ────────────────────────────────────────

const CFG_PRIORIDAD: Record<string, {
  icono: string; colorIcono: string; fondoIcono: string; fondoCard: string; bordeCard: string;
}> = {
  CRITICA: { icono: 'gpp_bad',       colorIcono: 'text-error',       fondoIcono: 'bg-error-container',  fondoCard: 'bg-error-container/30',  bordeCard: 'border-error/20' },
  ALTA:    { icono: 'warning',        colorIcono: 'text-[#795548]',   fondoIcono: 'bg-[#efebe9]',        fondoCard: 'bg-[#efebe9]/50',         bordeCard: 'border-[#bcaaa4]/40' },
  MEDIA:   { icono: 'info',           colorIcono: 'text-tertiary',    fondoIcono: 'bg-tertiary/10',      fondoCard: 'bg-tertiary/5',           bordeCard: 'border-tertiary/15' },
  BAJA:    { icono: 'notifications',  colorIcono: 'text-secondary',   fondoIcono: 'bg-secondary/10',     fondoCard: 'bg-surface-container-low', bordeCard: 'border-outline-variant/30' },
};

// ── Etiquetas de tipos de entidad ─────────────────────────────────────────────
const ETIQUETA_TIPO: Record<string, string> = {
  RegistroVacunacion:      'Vacunación',
  ProgramaDesparasitacion: 'Desparasitación',
  Gestacion:               'Gestación / Parto',
  Animal:                  'Animal',
  EnfermedadDiagnosticada: 'Enfermedad',
  InventarioSemen:         'Inventario semen',
};

const ETIQUETA_TIPO_ALERTA: Record<string, string> = {
  VACUNA_VENCIDA:                       'Vacuna vencida',
  VACUNA_PROXIMA:                       'Vacuna próxima',
  PARTO_PROXIMO:                        'Parto próximo',
  DIAS_ABIERTOS_EXCEDIDOS:              'Días abiertos',
  INTERVALO_REPRODUCTIVO_PROLONGADO:    'Intervalo reproductivo',
  AUSENCIA_CONTROL_VETERINARIO:         'Control veterinario',
  ENFERMEDAD_ACTIVA_SIN_RESOLUCION:     'Enfermedad activa',
  INVENTARIO_SEMEN_BAJO:                'Inventario semen',
  CONTROL_PESO_PENDIENTE:               'Control de peso',
  PERSONALIZADA:                        'Personalizada',
};

// ── Componente principal ──────────────────────────────────────────────────────

export default function PaginaAlertas() {
  const { esAdministrador, esVeterinario } = useAutenticacion();
  const puedeAdministrar = esAdministrador || esVeterinario;
  const queryClient = useQueryClient();
  const [pestaña, setPestaña]             = useState<'notificaciones' | 'reglas'>('notificaciones');
  const [soloNoLeidas, setSoloNoLeidas]   = useState(false);
  const [paginaActual, setPaginaActual]   = useState(1);
  const [prioridadFiltro, setPrioridadFiltro] = useState<string>('');
  const [tipoFiltro, setTipoFiltro]       = useState<string>('');
  const [reglaEliminar, setReglaEliminar] = useState<ReglaAlerta | null>(null);
  const [modalRegla, setModalRegla]       = useState<ReglaAlerta | null | 'nueva'>(null);
  const [evaluando, setEvaluando]         = useState(false);

  // ── Consultas ───────────────────────────────────────────────────────────────

  const { data: resumen } = useQuery<ResumenAlertas>({
    queryKey: ['alertas-resumen'],
    queryFn:  () => clienteHttp.get('/alertas/resumen').then((r) => r.data.datos),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const { data, isLoading } = useQuery<RespuestaNotificaciones>({
    queryKey: ['notificaciones', paginaActual, soloNoLeidas, prioridadFiltro, tipoFiltro],
    queryFn: () =>
      clienteHttp.get('/notificaciones', {
        params: {
          pagina: paginaActual,
          porPagina: 20,
          ...(soloNoLeidas         && { noLeidas:  true }),
          ...(prioridadFiltro      && { prioridad: prioridadFiltro }),
        },
      }).then((r) => r.data),
    staleTime: 20_000,
    refetchInterval: 60_000,
    placeholderData: (prev) => prev,
  });

  const { data: reglas = [], isLoading: cargandoReglas } = useQuery<ReglaAlerta[]>({
    queryKey: ['alertas-reglas'],
    queryFn:  () => clienteHttp.get('/alertas').then((r) => r.data.datos),
    staleTime: 60_000,
    enabled: pestaña === 'reglas',
  });

  // ── Mutaciones ──────────────────────────────────────────────────────────────

  const mutMarcarLeida = useMutation({
    mutationFn: (id: string) => clienteHttp.patch(`/notificaciones/${id}/leer`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
      queryClient.invalidateQueries({ queryKey: ['alertas-resumen'] });
      queryClient.invalidateQueries({ queryKey: ['notificaciones-no-leidas'] });
    },
  });

  const mutMarcarTodas = useMutation({
    mutationFn: () => clienteHttp.patch('/notificaciones/marcar-todas-leidas'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
      queryClient.invalidateQueries({ queryKey: ['alertas-resumen'] });
      queryClient.invalidateQueries({ queryKey: ['notificaciones-no-leidas'] });
      toast.success('Todas las alertas marcadas como leídas');
    },
  });

  const mutEliminar = useMutation({
    mutationFn: (id: string) => clienteHttp.delete(`/notificaciones/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
      queryClient.invalidateQueries({ queryKey: ['alertas-resumen'] });
    },
  });

  const mutToggleRegla = useMutation({
    mutationFn: ({ id, activa }: { id: string; activa: boolean }) =>
      clienteHttp.patch(`/alertas/${id}`, { activa }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alertas-reglas'] }),
    onError: () => toast.error('Error al actualizar la regla'),
  });

  const mutEliminarRegla = useMutation({
    mutationFn: (id: string) => clienteHttp.delete(`/alertas/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas-reglas'] });
      toast.success('Regla eliminada');
      setReglaEliminar(null);
    },
    onError: () => toast.error('Error al eliminar la regla'),
  });

  const dispararMotor = async () => {
    setEvaluando(true);
    try {
      const resp = await clienteHttp.post('/alertas/evaluar');
      toast.success(resp.data.datos?.mensaje ?? 'Motor ejecutado correctamente');
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
      queryClient.invalidateQueries({ queryKey: ['alertas-resumen'] });
      queryClient.invalidateQueries({ queryKey: ['notificaciones-no-leidas'] });
    } catch {
      toast.error('Error al ejecutar el motor de alertas');
    } finally {
      setEvaluando(false);
    }
  };

  // ── Datos derivados ─────────────────────────────────────────────────────────

  const notificaciones  = data?.datos ?? [];
  const meta            = data?.meta;

  // Filtro local por tipo de entidad (no viene del backend para no multiplicar endpoints)
  const notificacionesFiltradas = tipoFiltro
    ? notificaciones.filter((n) => n.entidadTipo === tipoFiltro)
    : notificaciones;

  const tiempoRelativo = (fecha: string) => {
    const diff = Date.now() - new Date(fecha).getTime();
    const min  = Math.floor(diff / 60_000);
    const hrs  = Math.floor(min / 60);
    const dias = Math.floor(hrs / 24);
    if (min < 1)  return 'Ahora';
    if (min < 60) return `Hace ${min}m`;
    if (hrs < 24) return `Hace ${hrs}h`;
    if (dias < 7) return `Hace ${dias}d`;
    return new Date(fecha).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="space-y-5">

      {/* ── Encabezado ─────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between flex-wrap gap-3"
      >
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <Icono nombre="notifications_active" relleno clase="text-[22px] text-error" />
            Alertas del sistema
            {(resumen?.totalNoLeidas ?? 0) > 0 && (
              <span className="px-2 py-0.5 bg-error text-on-primary text-xs font-bold rounded-full animate-pulse">
                {resumen!.totalNoLeidas}
              </span>
            )}
          </h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Vacunas, desparasitaciones, partos, enfermedades, control veterinario
          </p>
        </div>
        <div className="flex items-center gap-2">
          {puedeAdministrar && (
            <button
              onClick={dispararMotor}
              disabled={evaluando}
              className="boton boton-secundario gap-2 text-sm"
              title="Evalúa todas las reglas activas ahora"
            >
              <Icono nombre={evaluando ? 'progress_activity' : 'refresh'} clase={`text-[18px] ${evaluando ? 'animate-spin' : ''}`} />
              {evaluando ? 'Evaluando...' : 'Evaluar ahora'}
            </button>
          )}
          {(resumen?.totalNoLeidas ?? 0) > 0 && (
            <button
              onClick={() => mutMarcarTodas.mutate()}
              disabled={mutMarcarTodas.isPending}
              className="boton boton-secundario gap-2 text-sm"
            >
              <Icono nombre="done_all" clase="text-[18px]" />
              Marcar todas leídas
            </button>
          )}
        </div>
      </motion.div>

      {/* ── Tarjetas de resumen ─────────────────────────────────────────────── */}
      {resumen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {[
            { label: 'Críticas',  val: resumen.porPrioridad.critica, color: 'text-error',     fondo: 'bg-error-container',  icono: 'gpp_bad' },
            { label: 'Altas',     val: resumen.porPrioridad.alta,    color: 'text-[#795548]', fondo: 'bg-[#efebe9]',        icono: 'warning' },
            { label: 'Medias',    val: resumen.porPrioridad.media,   color: 'text-tertiary',  fondo: 'bg-tertiary/10',      icono: 'info' },
            { label: 'Bajas',     val: resumen.porPrioridad.baja,    color: 'text-secondary', fondo: 'bg-secondary/10',     icono: 'notifications' },
          ].map(({ label, val, color, fondo, icono }) => (
            <button
              key={label}
              onClick={() => {
                const mapa: Record<string, string> = { Críticas: 'CRITICA', Altas: 'ALTA', Medias: 'MEDIA', Bajas: 'BAJA' };
                const p = mapa[label];
                setPrioridadFiltro((prev) => prev === p ? '' : p);
                setPestaña('notificaciones');
                setPaginaActual(1);
              }}
              className={`tarjeta-vidrio rounded-2xl p-4 flex items-center gap-3 text-left transition-all
                ${prioridadFiltro === { Críticas: 'CRITICA', Altas: 'ALTA', Medias: 'MEDIA', Bajas: 'BAJA' }[label]
                  ? 'ring-2 ring-primary'
                  : 'hover:shadow-md'
                }`}
            >
              <div className={`p-2.5 ${fondo} rounded-xl flex-shrink-0`}>
                <Icono nombre={icono} relleno clase={`text-[20px] ${color}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${val > 0 ? color : 'text-on-surface'}`}>{val}</p>
                <p className="text-xs text-on-surface-variant">{label}</p>
              </div>
            </button>
          ))}
        </motion.div>
      )}

      {/* ── Alertas urgentes (solo si hay críticas/altas no leídas) ────────── */}
      {(resumen?.urgentes?.length ?? 0) > 0 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}
          className="rounded-2xl border border-error/20 bg-error-container/20 p-4 space-y-2"
        >
          <div className="flex items-center gap-2 mb-3">
            <Icono nombre="priority_high" relleno clase="text-[18px] text-error" />
            <p className="text-sm font-bold text-error">Atención urgente requerida</p>
          </div>
          {resumen!.urgentes.map((n) => (
            <div key={n.id} className="flex items-start gap-3 bg-surface/80 rounded-xl p-3">
              <Icono nombre="gpp_bad" relleno clase="text-[16px] text-error flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-on-surface">{n.titulo}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">{n.mensaje}</p>
              </div>
              <span className="text-[10px] text-outline whitespace-nowrap">{tiempoRelativo(n.creadoEn)}</span>
            </div>
          ))}
        </motion.div>
      )}

      {/* ── Pestañas ────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-surface-container rounded-xl w-fit">
        {([
          { clave: 'notificaciones', et: 'Notificaciones', ico: 'inbox' },
          { clave: 'reglas',         et: 'Reglas de alerta', ico: 'rule_settings' },
        ] as const).map((p) => (
          <button
            key={p.clave}
            onClick={() => setPestaña(p.clave)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              pestaña === p.clave
                ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Icono nombre={p.ico} clase="text-[16px]" />
            {p.et}
            {p.clave === 'notificaciones' && (resumen?.totalNoLeidas ?? 0) > 0 && (
              <span className="px-1.5 py-0.5 bg-error text-on-primary text-[10px] font-bold rounded-full">
                {resumen!.totalNoLeidas}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* PESTAÑA: NOTIFICACIONES                                               */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {pestaña === 'notificaciones' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

          {/* Filtros */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* Solo no leídas */}
            <button
              onClick={() => { setSoloNoLeidas(!soloNoLeidas); setPaginaActual(1); }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                soloNoLeidas
                  ? 'bg-primary-container text-on-primary-container ring-1 ring-primary/30'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <Icono nombre="mark_email_unread" clase="text-[14px]" />
              Solo no leídas
            </button>

            {/* Filtro prioridad */}
            <div className="flex gap-1 p-1 bg-surface-container rounded-xl">
              {(['', 'CRITICA', 'ALTA', 'MEDIA', 'BAJA'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => { setPrioridadFiltro(p); setPaginaActual(1); }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    prioridadFiltro === p
                      ? 'bg-primary text-on-primary'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {p === '' ? 'Todas' : p === 'CRITICA' ? 'Crítica' : p === 'ALTA' ? 'Alta' : p === 'MEDIA' ? 'Media' : 'Baja'}
                </button>
              ))}
            </div>

            {/* Filtro por tipo */}
            {(resumen?.porTipoEntidad?.length ?? 0) > 0 && (
              <select
                value={tipoFiltro}
                onChange={(e) => setTipoFiltro(e.target.value)}
                className="campo-entrada text-xs h-9 w-48"
              >
                <option value="">Todos los tipos</option>
                {resumen!.porTipoEntidad.map((t) => (
                  <option key={t.tipo} value={t.tipo}>
                    {ETIQUETA_TIPO[t.tipo] ?? t.tipo} ({t.cantidad})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Lista de notificaciones */}
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-20 rounded-2xl bg-surface-container animate-pulse" />
              ))}
            </div>
          ) : !notificacionesFiltradas.length ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="tarjeta-vidrio rounded-2xl p-12 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-surface-container mx-auto mb-4 flex items-center justify-center">
                <Icono nombre="notifications_off" clase="text-[32px] text-outline" />
              </div>
              <p className="font-medium text-on-surface-variant text-lg">Sin alertas pendientes</p>
              <p className="text-sm text-outline mt-1">
                {soloNoLeidas ? 'No hay notificaciones sin leer' : 'El motor aún no ha generado alertas'}
              </p>
              {puedeAdministrar && (
                <button
                  onClick={dispararMotor}
                  disabled={evaluando}
                  className="boton boton-primario mt-4 gap-2 text-sm"
                >
                  <Icono nombre="refresh" clase="text-[16px]" />
                  Evaluar ahora
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
              {notificacionesFiltradas.map((notif, idx) => {
                const cfg = CFG_PRIORIDAD[notif.prioridad] ?? CFG_PRIORIDAD.BAJA;
                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`flex items-start gap-4 p-4 rounded-2xl border transition-all
                      ${!notif.leida ? `${cfg.fondoCard} ${cfg.bordeCard}` : 'bg-surface border-outline-variant/15'}
                      ${notif.leida ? 'opacity-70' : ''}`}
                  >
                    {/* Icono */}
                    <div className={`p-2 rounded-xl flex-shrink-0 ${notif.leida ? 'bg-surface-container' : cfg.fondoIcono}`}>
                      <Icono nombre={cfg.icono} relleno={!notif.leida} clase={`text-[18px] ${cfg.colorIcono}`} />
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-semibold text-sm ${notif.leida ? 'text-on-surface-variant' : 'text-on-surface'}`}>
                              {notif.titulo}
                            </span>
                            {!notif.leida && (
                              <span className="w-2 h-2 rounded-full bg-error flex-shrink-0" />
                            )}
                            <BadgePrioridad prioridad={notif.prioridad} />
                          </div>
                          <p className={`text-xs mt-1 ${notif.leida ? 'text-outline' : 'text-on-surface-variant'}`}>
                            {notif.mensaje}
                          </p>
                          {notif.entidadTipo && (
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <span className="px-2 py-0.5 bg-surface-container rounded-full text-[10px] text-on-surface-variant">
                                {ETIQUETA_TIPO[notif.entidadTipo] ?? notif.entidadTipo}
                              </span>
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-outline whitespace-nowrap flex-shrink-0">
                          {tiempoRelativo(notif.creadoEn)}
                        </span>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!notif.leida && (
                        <button
                          onClick={() => mutMarcarLeida.mutate(notif.id)}
                          disabled={mutMarcarLeida.isPending}
                          title="Marcar como leída"
                          className="p-1.5 text-outline hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        >
                          <Icono nombre="check" clase="text-[16px]" />
                        </button>
                      )}
                      <button
                        onClick={() => mutEliminar.mutate(notif.id)}
                        disabled={mutEliminar.isPending}
                        title="Descartar"
                        className="p-1.5 text-outline hover:text-error hover:bg-error-container rounded-lg transition-colors"
                      >
                        <Icono nombre="delete" clase="text-[16px]" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
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

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* PESTAÑA: REGLAS DE ALERTA                                             */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {pestaña === 'reglas' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

          {/* Encabezado de sección */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              {reglas.length} regla(s) configurada(s)
            </p>
            {esAdministrador && (
              <button
                onClick={() => setModalRegla('nueva')}
                className="boton boton-primario gap-2 text-sm"
              >
                <Icono nombre="add" clase="text-[18px]" />
                Nueva regla
              </button>
            )}
          </div>

          {/* Información del motor */}
          <div className="flex items-start gap-3 px-4 py-3.5 bg-primary/5 border border-primary/15 rounded-2xl">
            <Icono nombre="info" clase="text-[16px] text-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-on-surface-variant">
              El motor de alertas evalúa todas las reglas activas <strong className="text-on-surface">automáticamente cada hora</strong>.
              Las desparasitaciones y vacunas se revisan cada 12 horas.
              Los partos próximos cada 6 horas.
              Puedes ejecutar una evaluación inmediata con el botón <strong className="text-on-surface">"Evaluar ahora"</strong>.
            </p>
          </div>

          {/* Lista de reglas */}
          {cargandoReglas ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-20 rounded-2xl bg-surface-container animate-pulse" />
              ))}
            </div>
          ) : !reglas.length ? (
            <div className="tarjeta-vidrio rounded-2xl p-10 text-center">
              <Icono nombre="rule_settings" clase="text-[40px] text-outline mx-auto mb-3" />
              <p className="text-on-surface-variant">No hay reglas de alerta configuradas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {reglas.map((regla) => (
                <TarjetaRegla
                  key={regla.id}
                  regla={regla}
                  puedeEditar={esAdministrador}
                  alToggle={() => mutToggleRegla.mutate({ id: regla.id, activa: !regla.activa })}
                  alEditar={() => setModalRegla(regla)}
                  alEliminar={() => setReglaEliminar(regla)}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ── Modal: crear / editar regla ──────────────────────────────────────── */}
      <AnimatePresence>
        {modalRegla !== null && (
          <ModalRegla
            regla={modalRegla === 'nueva' ? null : modalRegla}
            onCerrar={() => setModalRegla(null)}
            onExito={() => {
              queryClient.invalidateQueries({ queryKey: ['alertas-reglas'] });
              setModalRegla(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Modal: confirmar eliminar regla ──────────────────────────────────── */}
      <ModalConfirmacion
        abierto={!!reglaEliminar}
        alCerrar={() => setReglaEliminar(null)}
        alConfirmar={() => reglaEliminar && mutEliminarRegla.mutate(reglaEliminar.id)}
        titulo={`¿Eliminar regla "${reglaEliminar?.nombre}"?`}
        descripcion="Esta acción eliminará la regla permanentemente. Las notificaciones ya generadas no se verán afectadas."
        textoConfirmar="Sí, eliminar"
        variante="peligro"
        cargando={mutEliminarRegla.isPending}
      />
    </div>
  );
}

// ── Tarjeta de regla ──────────────────────────────────────────────────────────

function TarjetaRegla({
  regla, puedeEditar, alToggle, alEditar, alEliminar,
}: {
  regla: ReglaAlerta;
  puedeEditar: boolean;
  alToggle: () => void;
  alEditar: () => void;
  alEliminar: () => void;
}) {
  return (
    <div className={`tarjeta-vidrio rounded-2xl p-4 flex items-start gap-4 transition-all
      ${!regla.activa ? 'opacity-60' : ''}`}
    >
      {/* Icono estado */}
      <div className={`p-2.5 rounded-xl flex-shrink-0 ${regla.activa ? 'bg-primary/10' : 'bg-surface-container'}`}>
        <Icono
          nombre={regla.activa ? 'rule_settings' : 'rule'}
          relleno={regla.activa}
          clase={`text-[20px] ${regla.activa ? 'text-primary' : 'text-outline'}`}
        />
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-sm text-on-surface">{regla.nombre}</p>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold
            ${regla.activa ? 'bg-primary/10 text-primary' : 'bg-surface-container text-outline'}`}>
            {regla.activa ? 'Activa' : 'Desactivada'}
          </span>
          <span className="px-2 py-0.5 bg-surface-container rounded-full text-[10px] text-on-surface-variant">
            {ETIQUETA_TIPO_ALERTA[regla.tipoAlerta] ?? regla.tipoAlerta}
          </span>
        </div>
        {regla.descripcion && (
          <p className="text-xs text-on-surface-variant mt-1">{regla.descripcion}</p>
        )}
        <div className="flex items-center gap-3 mt-2 text-[11px] text-outline">
          {regla.umbralValor != null && (
            <span className="flex items-center gap-1">
              <Icono nombre="schedule" clase="text-[12px]" />
              Umbral: {regla.umbralValor} {regla.umbralUnidad ?? 'días'}
            </span>
          )}
          {regla.ultimaEvaluacion && (
            <span className="flex items-center gap-1">
              <Icono nombre="history" clase="text-[12px]" />
              Evaluada: {new Date(regla.ultimaEvaluacion).toLocaleString('es-VE', {
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
              })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2 text-[11px] text-outline">
          {regla.notificarAdministrador && <span className="px-1.5 py-0.5 bg-surface-container rounded text-[10px]">Admin</span>}
          {regla.notificarVeterinario   && <span className="px-1.5 py-0.5 bg-surface-container rounded text-[10px]">Veterinario</span>}
          {regla.notificarTecnico       && <span className="px-1.5 py-0.5 bg-surface-container rounded text-[10px]">Técnico</span>}
        </div>
      </div>

      {/* Acciones */}
      {puedeEditar && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={alToggle}
            title={regla.activa ? 'Desactivar regla' : 'Activar regla'}
            className={`p-2 rounded-xl transition-colors ${
              regla.activa
                ? 'hover:bg-error-container text-primary hover:text-error'
                : 'hover:bg-primary/10 text-outline hover:text-primary'
            }`}
          >
            <Icono nombre={regla.activa ? 'toggle_on' : 'toggle_off'} relleno clase="text-[22px]" />
          </button>
          <button onClick={alEditar} className="p-2 hover:bg-surface-container rounded-xl transition-colors">
            <Icono nombre="edit" clase="text-[18px] text-on-surface-variant" />
          </button>
          <button onClick={alEliminar} className="p-2 hover:bg-error-container rounded-xl transition-colors">
            <Icono nombre="delete" clase="text-[18px] text-on-surface-variant hover:text-error" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Modal: crear / editar regla ───────────────────────────────────────────────

interface FormRegla {
  nombre: string;
  descripcion: string;
  tipoAlerta: string;
  umbralValor: string;
  umbralUnidad: string;
  activa: boolean;
  notificarAdministrador: boolean;
  notificarVeterinario: boolean;
  notificarTecnico: boolean;
}

const TIPOS_ALERTA = [
  { val: 'VACUNA_VENCIDA',                    et: 'Vacuna vencida' },
  { val: 'VACUNA_PROXIMA',                    et: 'Vacuna próxima' },
  { val: 'PARTO_PROXIMO',                     et: 'Parto próximo' },
  { val: 'DIAS_ABIERTOS_EXCEDIDOS',           et: 'Días abiertos excedidos' },
  { val: 'INTERVALO_REPRODUCTIVO_PROLONGADO', et: 'Intervalo reproductivo prolongado' },
  { val: 'AUSENCIA_CONTROL_VETERINARIO',      et: 'Ausencia de control veterinario' },
  { val: 'ENFERMEDAD_ACTIVA_SIN_RESOLUCION',  et: 'Enfermedad activa sin resolución' },
  { val: 'INVENTARIO_SEMEN_BAJO',             et: 'Inventario de semen bajo' },
  { val: 'CONTROL_PESO_PENDIENTE',            et: 'Control de peso pendiente' },
  { val: 'PERSONALIZADA',                     et: 'Personalizada' },
];

function ModalRegla({
  regla, onCerrar, onExito,
}: {
  regla: ReglaAlerta | null;
  onCerrar: () => void;
  onExito: () => void;
}) {
  const [form, setForm] = useState<FormRegla>({
    nombre:                 regla?.nombre         ?? '',
    descripcion:            regla?.descripcion    ?? '',
    tipoAlerta:             regla?.tipoAlerta     ?? 'VACUNA_PROXIMA',
    umbralValor:            regla?.umbralValor != null ? String(regla.umbralValor) : '',
    umbralUnidad:           regla?.umbralUnidad   ?? 'días',
    activa:                 regla?.activa         ?? true,
    notificarAdministrador: regla?.notificarAdministrador ?? true,
    notificarVeterinario:   regla?.notificarVeterinario   ?? true,
    notificarTecnico:       regla?.notificarTecnico       ?? false,
  });
  const [error, setError] = useState('');

  const mutacion = useMutation({
    mutationFn: (datos: FormRegla) => {
      const payload = {
        nombre:                 datos.nombre.trim(),
        descripcion:            datos.descripcion.trim() || undefined,
        tipoAlerta:             datos.tipoAlerta,
        umbralValor:            datos.umbralValor ? Number(datos.umbralValor) : undefined,
        umbralUnidad:           datos.umbralUnidad.trim() || undefined,
        activa:                 datos.activa,
        notificarAdministrador: datos.notificarAdministrador,
        notificarVeterinario:   datos.notificarVeterinario,
        notificarTecnico:       datos.notificarTecnico,
      };
      return regla
        ? clienteHttp.patch(`/alertas/${regla.id}`, payload)
        : clienteHttp.post('/alertas', payload);
    },
    onSuccess: () => {
      toast.success(regla ? 'Regla actualizada' : 'Regla creada correctamente');
      onExito();
    },
    onError: (err: any) => {
      setError(err?.response?.data?.mensaje ?? 'Error al guardar la regla');
    },
  });

  const campo = (
    label: string,
    name: keyof FormRegla,
    required = false,
    placeholder = '',
    type: 'text' | 'number' = 'text',
  ) => (
    <div>
      <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
        {label} {required && <span className="text-error">*</span>}
      </label>
      <input
        type={type}
        value={form[name] as string}
        onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
        placeholder={placeholder}
        className="campo-entrada"
      />
    </div>
  );

  const check = (label: string, name: keyof FormRegla) => (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={form[name] as boolean}
        onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.checked }))}
        className="w-4 h-4 accent-primary rounded"
      />
      <span className="text-sm text-on-surface">{label}</span>
    </label>
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-inverse-surface/40 z-40"
        onClick={onCerrar}
      />
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
            <h2 className="font-bold text-on-surface flex items-center gap-2">
              <Icono nombre="rule_settings" relleno clase="text-[20px] text-primary" />
              {regla ? `Editar: ${regla.nombre}` : 'Nueva regla de alerta'}
            </h2>
            <button onClick={onCerrar} className="p-2 hover:bg-surface-container rounded-xl transition-colors">
              <Icono nombre="close" clase="text-[20px] text-on-surface-variant" />
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.nombre.trim()) { setError('El nombre es requerido'); return; }
              if (!form.tipoAlerta)    { setError('Selecciona un tipo de alerta'); return; }
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

            {campo('Nombre de la regla', 'nombre', true, 'Ej: Vacuna próxima — Fiebre Aftosa')}

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                Tipo de alerta <span className="text-error">*</span>
              </label>
              <select
                value={form.tipoAlerta}
                onChange={(e) => setForm((f) => ({ ...f, tipoAlerta: e.target.value }))}
                className="campo-entrada"
              >
                {TIPOS_ALERTA.map((t) => (
                  <option key={t.val} value={t.val}>{t.et}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {campo('Umbral (valor)', 'umbralValor', false, 'Ej: 7', 'number')}
              {campo('Unidad', 'umbralUnidad', false, 'Ej: días')}
            </div>

            {campo('Descripción', 'descripcion', false, 'Descripción opcional de la regla')}

            <div>
              <p className="text-xs font-semibold text-on-surface-variant mb-2">Notificar a</p>
              <div className="space-y-2">
                {check('Administrador', 'notificarAdministrador')}
                {check('Veterinario',   'notificarVeterinario')}
                {check('Técnico',       'notificarTecnico')}
              </div>
            </div>

            {check('Regla activa', 'activa')}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onCerrar} className="flex-1 boton boton-secundario">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={mutacion.isPending}
                className="flex-1 boton boton-primario gap-2"
              >
                {mutacion.isPending ? (
                  <><Icono nombre="progress_activity" clase="text-[16px] animate-spin" />Guardando...</>
                ) : (
                  <><Icono nombre="save" clase="text-[16px]" />{regla ? 'Guardar cambios' : 'Crear regla'}</>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  );
}
