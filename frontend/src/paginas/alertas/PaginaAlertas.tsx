import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { clienteHttp } from '../../servicios/clienteAxios';
import Badge, { BadgePrioridad } from '../../componentes/ui/Badge';
import Paginacion from '../../componentes/ui/Paginacion';
import Icono from '../../componentes/ui/Icono';

interface Notificacion {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: string;
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  leida: boolean;
  fechaLeida?: string;
  creadoEn: string;
  animal?: { id: string; numeroArete: string; nombre?: string };
  finca?: { id: string; nombre: string };
}

interface RespuestaNotificaciones {
  datos: Notificacion[];
  meta: { total: number; pagina: number; porPagina: number; totalPaginas: number };
}

const CONFIG_PRIORIDAD: Record<string, {
  icono: string; colorIcono: string; fondoIcono: string; fondoCard: string; bordeCard: string;
}> = {
  CRITICA: {
    icono:      'gpp_bad',
    colorIcono: 'text-error',
    fondoIcono: 'bg-error-container',
    fondoCard:  'bg-error-container/30',
    bordeCard:  'border-error/20',
  },
  ALTA: {
    icono:      'warning',
    colorIcono: 'text-[#795548]',
    fondoIcono: 'bg-[#efebe9]',
    fondoCard:  'bg-[#efebe9]/50',
    bordeCard:  'border-[#bcaaa4]/40',
  },
  MEDIA: {
    icono:      'info',
    colorIcono: 'text-tertiary',
    fondoIcono: 'bg-tertiary/10',
    fondoCard:  'bg-tertiary/5',
    bordeCard:  'border-tertiary/15',
  },
  BAJA: {
    icono:      'notifications',
    colorIcono: 'text-secondary',
    fondoIcono: 'bg-secondary/10',
    fondoCard:  'bg-surface-container-low',
    bordeCard:  'border-outline-variant/30',
  },
};

export default function PaginaAlertas() {
  const queryClient = useQueryClient();
  const [soloNoLeidas, setSoloNoLeidas] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const [prioridadFiltro, setPrioridadFiltro] = useState<string>('');

  const { data, isLoading } = useQuery<RespuestaNotificaciones>({
    queryKey: ['notificaciones', paginaActual, soloNoLeidas, prioridadFiltro],
    queryFn: () =>
      clienteHttp
        .get('/notificaciones', {
          params: {
            pagina: paginaActual,
            porPagina: 20,
            ...(soloNoLeidas && { noLeidas: true }),
            ...(prioridadFiltro && { prioridad: prioridadFiltro }),
          },
        })
        .then((r) => r.data),
    refetchInterval: 60_000,
  });

  const marcarLeidaMutacion = useMutation({
    mutationFn: (id: string) => clienteHttp.patch(`/notificaciones/${id}/leer`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notificaciones'] }),
  });

  const marcarTodasLeidaMutacion = useMutation({
    mutationFn: () => clienteHttp.patch('/notificaciones/marcar-todas-leidas'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notificaciones'] }),
  });

  const eliminarMutacion = useMutation({
    mutationFn: (id: string) => clienteHttp.delete(`/notificaciones/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notificaciones'] }),
  });

  const notificaciones = data?.datos ?? [];
  const meta = data?.meta;
  const noLeidasCount = notificaciones.filter((n) => !n.leida).length;

  const tiempoRelativo = (fecha: string) => {
    const diff = Date.now() - new Date(fecha).getTime();
    const min = Math.floor(diff / 60000);
    const hrs = Math.floor(min / 60);
    const dias = Math.floor(hrs / 24);
    if (min < 1) return 'Ahora';
    if (min < 60) return `Hace ${min}m`;
    if (hrs < 24) return `Hace ${hrs}h`;
    if (dias < 7) return `Hace ${dias}d`;
    return new Date(fecha).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="space-y-5">
      {/* Encabezado */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <Icono nombre="notifications_active" relleno clase="text-[22px] text-error" />
            Alertas y Notificaciones
            {noLeidasCount > 0 && (
              <span className="px-2 py-0.5 bg-error text-on-primary text-xs font-bold rounded-full">
                {noLeidasCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Vacunas vencidas, partos próximos, enfermedades activas
            {meta && (
              <span className="ml-2 font-medium text-on-surface">
                · {meta.total.toLocaleString('es-VE')} alertas
              </span>
            )}
          </p>
        </div>

        {noLeidasCount > 0 && (
          <button
            onClick={() => marcarTodasLeidaMutacion.mutate()}
            disabled={marcarTodasLeidaMutacion.isPending}
            className="boton boton-secundario gap-2 text-sm"
          >
            <Icono nombre="done_all" clase="text-[18px]" />
            Marcar todas leídas
          </button>
        )}
      </motion.div>

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-wrap gap-2"
      >
        <button
          onClick={() => { setSoloNoLeidas(!soloNoLeidas); setPaginaActual(1); }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            soloNoLeidas
              ? 'bg-primary-container text-on-primary-container ring-1 ring-primary/30'
              : 'text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          <Icono nombre="notifications_off" clase="text-[14px]" />
          Solo no leídas
        </button>

        <div className="flex gap-1 p-1 bg-surface-container rounded-xl">
          {['', 'CRITICA', 'ALTA', 'MEDIA', 'BAJA'].map((p) => (
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
      </motion.div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-surface-container animate-pulse" />
          ))}
        </div>
      ) : !notificaciones.length ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="tarjeta-vidrio rounded-2xl p-12 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-surface-container mx-auto mb-4 flex items-center justify-center">
            <Icono nombre="notifications_off" clase="text-[32px] text-outline" />
          </div>
          <p className="font-medium text-on-surface-variant text-lg">Sin alertas pendientes</p>
          <p className="text-sm text-outline mt-1">
            {soloNoLeidas ? 'No hay notificaciones sin leer' : 'El sistema no ha generado alertas'}
          </p>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
          {notificaciones.map((notif, idx) => {
            const cfg = CONFIG_PRIORIDAD[notif.prioridad] ?? CONFIG_PRIORIDAD.BAJA;
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
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
                      <p className={`text-xs mt-1 line-clamp-2 ${notif.leida ? 'text-outline' : 'text-on-surface-variant'}`}>
                        {notif.mensaje}
                      </p>
                      {(notif.animal || notif.finca) && (
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-outline">
                          {notif.animal && (
                            <span className="flex items-center gap-0.5">
                              <Icono nombre="pets" clase="text-[11px]" />
                              #{notif.animal.numeroArete}{notif.animal.nombre && ` · ${notif.animal.nombre}`}
                            </span>
                          )}
                          {notif.finca && (
                            <span className="flex items-center gap-0.5">
                              <Icono nombre="home_work" clase="text-[11px]" />
                              {notif.finca.nombre}
                            </span>
                          )}
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
                      onClick={() => marcarLeidaMutacion.mutate(notif.id)}
                      disabled={marcarLeidaMutacion.isPending}
                      title="Marcar como leída"
                      className="p-1.5 text-outline hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    >
                      <Icono nombre="check" clase="text-[16px]" />
                    </button>
                  )}
                  <button
                    onClick={() => eliminarMutacion.mutate(notif.id)}
                    disabled={eliminarMutacion.isPending}
                    title="Eliminar"
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
    </div>
  );
}
