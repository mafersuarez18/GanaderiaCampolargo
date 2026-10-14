import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import type { AxiosResponse } from 'axios';
import { clienteHttp } from '../../servicios/clienteAxios';
import { useAutenticacion } from '../../hooks/useAutenticacion';
import Icono from '../../componentes/ui/Icono';
import Modal, { ModalConfirmacion } from '../../componentes/ui/Modal';
import { EsqueletoLinea } from '../../componentes/ui/EsqueletoTarjeta';

// Plan sanitario anual por finca: a diferencia del calendario de
// vacunación (por animal, basado en intervalos desde su última dosis),
// este es un calendario a nivel de hato que la veterinaria arma una vez al
// año -- higiene, vacunas, vitaminas, control de parásitos/plagas... -- y
// cuyo cumplimiento se va marcando mes a mes.

interface Finca { id: string; nombre: string }

interface Actividad {
  id: string;
  categoria: string;
  nombreControl: string;
  unidadReferencia?: string;
  prevencion?: string;
  tratamiento?: string;
  via?: string;
  mesesProgramados: number[];
  mesesCompletados: number[];
}

interface Plan {
  id: string;
  anio: number;
  fincaId: string;
  actividades: Actividad[];
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const ETIQUETA_CATEGORIA: Record<string, string> = {
  HIGIENE: 'Higiene',
  DESINFECCION: 'Desinfección',
  VACUNA: 'Vacuna',
  VITAMINA: 'Vitamina',
  CONTROL_ECTOPARASITO: 'Control ectoparásito',
  CONTROL_ENDOPARASITO: 'Control endoparásito',
  CONTROL_MOSCA: 'Control mosca',
  CONTROL_PLAGAS: 'Control de plagas',
  OTRO: 'Otro',
};

interface FormActividad {
  categoria: string;
  nombreControl: string;
  unidadReferencia: string;
  prevencion: string;
  tratamiento: string;
  via: string;
  mesesProgramados: number[];
}

const FORM_VACIO: FormActividad = {
  categoria: 'VACUNA', nombreControl: '', unidadReferencia: '',
  prevencion: '', tratamiento: '', via: '', mesesProgramados: [],
};

export default function PaginaPlanSanitario() {
  const queryClient = useQueryClient();
  const { tienePrivilegio } = useAutenticacion();
  const puedeGestionar = tienePrivilegio('plan_sanitario.gestionar');

  const hoy = new Date();
  const anioActual = hoy.getFullYear();
  const mesActual = hoy.getMonth() + 1;

  const [fincaId, setFincaId] = useState('');
  const [anio, setAnio] = useState(anioActual);
  const [modalActividad, setModalActividad] = useState<{ modo: 'crear' | 'editar'; actividad?: Actividad } | null>(null);
  const [form, setForm] = useState<FormActividad>(FORM_VACIO);
  const [actividadAEliminar, setActividadAEliminar] = useState<string | null>(null);
  const [actividadDetalle, setActividadDetalle] = useState<Actividad | null>(null);

  const { data: fincas = [] } = useQuery<Finca[]>({
    queryKey: ['fincas-catalogo'],
    queryFn: () => clienteHttp.get('/fincas', { params: { porPagina: 100 } }).then((r) => r.data.datos ?? []),
  });

  // Selecciona la primera finca automáticamente apenas cargan
  if (!fincaId && fincas.length > 0) setFincaId(fincas[0]!.id);

  const { data: plan, isLoading } = useQuery<Plan>({
    queryKey: ['plan-sanitario', fincaId, anio],
    queryFn: () => clienteHttp.get('/plan-sanitario', { params: { fincaId, anio } }).then((r) => r.data.datos),
    enabled: !!fincaId,
  });

  const { data: resumen } = useQuery<{ pendientesEsteMes: number; atrasadas: number }>({
    queryKey: ['plan-sanitario-resumen', fincaId],
    queryFn: () => clienteHttp.get('/plan-sanitario/resumen', { params: { fincaId } }).then((r) => r.data.datos),
    enabled: !!fincaId,
  });

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ['plan-sanitario'] });
    queryClient.invalidateQueries({ queryKey: ['plan-sanitario-resumen'] });
  };

  const guardarMutacion = useMutation({
    mutationFn: (datos: FormActividad & { id?: string }): Promise<AxiosResponse> => {
      const payload = {
        categoria: datos.categoria,
        nombreControl: datos.nombreControl,
        unidadReferencia: datos.unidadReferencia || undefined,
        prevencion: datos.prevencion || undefined,
        tratamiento: datos.tratamiento || undefined,
        via: datos.via || undefined,
        mesesProgramados: datos.mesesProgramados,
      };
      return datos.id
        ? clienteHttp.put(`/plan-sanitario/actividades/${datos.id}`, payload)
        : clienteHttp.post('/plan-sanitario/actividades', { ...payload, planId: plan?.id });
    },
    onSuccess: () => {
      invalidar();
      setModalActividad(null);
      setForm(FORM_VACIO);
      toast.success('Actividad guardada');
    },
  });

  const eliminarMutacion = useMutation({
    mutationFn: (id: string) => clienteHttp.delete(`/plan-sanitario/actividades/${id}`),
    onSuccess: () => { invalidar(); setActividadAEliminar(null); toast.success('Actividad eliminada'); },
  });

  const marcarMesMutacion = useMutation({
    mutationFn: ({ actividadId, mes, completado }: { actividadId: string; mes: number; completado: boolean }) =>
      clienteHttp.patch(`/plan-sanitario/actividades/${actividadId}/marcar-mes`, { mes, completado }, { sinCola: true }),
    onSuccess: invalidar,
  });

  const abrirEditar = (actividad: Actividad) => {
    setForm({
      categoria: actividad.categoria,
      nombreControl: actividad.nombreControl,
      unidadReferencia: actividad.unidadReferencia ?? '',
      prevencion: actividad.prevencion ?? '',
      tratamiento: actividad.tratamiento ?? '',
      via: actividad.via ?? '',
      mesesProgramados: actividad.mesesProgramados,
    });
    setModalActividad({ modo: 'editar', actividad });
  };

  const alternarMesProgramado = (mes: number) =>
    setForm((f) => ({
      ...f,
      mesesProgramados: f.mesesProgramados.includes(mes)
        ? f.mesesProgramados.filter((m) => m !== mes)
        : [...f.mesesProgramados, mes].sort((a, b) => a - b),
    }));

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-on-surface">Plan Sanitario</h1>
          <p className="text-sm text-on-surface-variant">Calendario anual de higiene, vacunas, vitaminas y control de parásitos/plagas por finca</p>
        </div>
        {puedeGestionar && (
          <button
            onClick={() => { setForm(FORM_VACIO); setModalActividad({ modo: 'crear' }); }}
            disabled={!plan}
            className="boton boton-primario flex items-center gap-2 justify-center"
          >
            <Icono nombre="add" clase="text-[18px]" /> Agregar actividad
          </button>
        )}
      </motion.div>

      {/* Selectores de finca/año + resumen */}
      <div className="tarjeta-vidrio rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
        <div className="flex items-center gap-2">
          <Icono nombre="home_work" clase="text-[16px] text-on-surface-variant" />
          <select value={fincaId} onChange={(e) => setFincaId(e.target.value)} className="campo-entrada text-sm">
            {fincas.map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setAnio((a) => a - 1)} className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors">
            <Icono nombre="chevron_left" clase="text-[18px]" />
          </button>
          <span className="text-sm font-semibold text-on-surface w-12 text-center">{anio}</span>
          <button onClick={() => setAnio((a) => a + 1)} className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors">
            <Icono nombre="chevron_right" clase="text-[18px]" />
          </button>
        </div>
        {resumen && (
          <div className="flex items-center gap-4 sm:ml-auto text-xs">
            <span className="flex items-center gap-1.5 text-on-surface-variant">
              <Icono nombre="pending_actions" clase="text-[14px]" /> {resumen.pendientesEsteMes} pendientes este mes
            </span>
            {resumen.atrasadas > 0 && (
              <span className="flex items-center gap-1.5 text-error font-semibold">
                <Icono nombre="warning" clase="text-[14px]" /> {resumen.atrasadas} atrasadas
              </span>
            )}
          </div>
        )}
      </div>

      {/* Grilla del plan */}
      <div className="tarjeta-vidrio rounded-2xl p-4">
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <EsqueletoLinea key={i} />)}</div>
        ) : !plan || plan.actividades.length === 0 ? (
          <div className="text-center py-10 text-on-surface-variant text-sm">
            <Icono nombre="event_available" clase="text-[32px] mb-2 opacity-40" />
            <p>No hay actividades registradas en el plan {anio} de esta finca.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[860px]">
              <div className="grid grid-cols-[200px_repeat(12,32px)_auto] gap-1 items-center pb-2 mb-2 border-b border-outline-variant/20">
                <span className="text-[10px] uppercase font-semibold text-on-surface-variant tracking-wider">Control</span>
                {MESES.map((m) => (
                  <span key={m} className="text-[10px] text-center text-on-surface-variant">{m}</span>
                ))}
                <span></span>
              </div>
              {plan.actividades.map((act) => (
                <div key={act.id} className="group grid grid-cols-[200px_repeat(12,32px)_auto] gap-1 items-center py-2 border-b border-outline-variant/10 last:border-0">
                  <button
                    type="button"
                    onClick={() => setActividadDetalle(act)}
                    className="min-w-0 text-left rounded-lg px-1 -mx-1 hover:bg-surface-container-high transition-colors"
                  >
                    <p className="text-sm font-medium text-on-surface truncate" title={act.nombreControl}>{act.nombreControl}</p>
                    <p className="text-[10px] text-on-surface-variant">{ETIQUETA_CATEGORIA[act.categoria] ?? act.categoria}</p>
                  </button>
                  {MESES.map((_, i) => {
                    const mes = i + 1;
                    const programado = act.mesesProgramados.includes(mes);
                    const completado = act.mesesCompletados.includes(mes);
                    if (!programado) return <span key={mes} className="text-center text-outline-variant">—</span>;
                    return (
                      <button
                        key={mes}
                        disabled={!puedeGestionar}
                        onClick={() => marcarMesMutacion.mutate({ actividadId: act.id, mes, completado: !completado })}
                        className={`mx-auto flex items-center justify-center w-6 h-6 rounded-md border transition-colors ${
                          completado
                            ? 'bg-primary border-primary text-on-primary'
                            : 'border-outline-variant text-transparent hover:border-primary/50'
                        } ${!puedeGestionar ? 'cursor-default' : 'cursor-pointer'}`}
                        title={completado ? 'Hecho' : 'Pendiente'}
                      >
                        <Icono nombre="check" clase="text-[14px]" />
                      </button>
                    );
                  })}
                  {puedeGestionar && (
                    <div className="flex items-center gap-1 justify-end opacity-100 md:opacity-0 md:group-hover:opacity-100">
                      <button onClick={() => abrirEditar(act)} className="p-1 text-outline hover:text-primary rounded-lg">
                        <Icono nombre="edit" clase="text-[16px]" />
                      </button>
                      <button onClick={() => setActividadAEliminar(act.id)} className="p-1 text-outline hover:text-error rounded-lg">
                        <Icono nombre="delete" clase="text-[16px]" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal crear/editar actividad */}
      <Modal
        abierto={!!modalActividad}
        alCerrar={() => setModalActividad(null)}
        titulo={modalActividad?.modo === 'editar' ? 'Editar actividad' : 'Agregar actividad al plan'}
        tamano="lg"
        pie={
          <>
            <button onClick={() => setModalActividad(null)} className="flex-1 boton boton-secundario">Cancelar</button>
            <button
              onClick={() => guardarMutacion.mutate({ ...form, id: modalActividad?.actividad?.id })}
              disabled={!form.nombreControl || guardarMutacion.isPending}
              className="flex-1 boton boton-primario"
            >
              {guardarMutacion.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Campo etiqueta="Categoría">
              <select value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))} className="campo-entrada text-sm">
                {Object.entries(ETIQUETA_CATEGORIA).map(([valor, etiqueta]) => (
                  <option key={valor} value={valor}>{etiqueta}</option>
                ))}
              </select>
            </Campo>
            <Campo etiqueta="Control / enfermedad *">
              <input type="text" value={form.nombreControl}
                onChange={(e) => setForm((f) => ({ ...f, nombreControl: e.target.value }))}
                placeholder="Ej: Rabia, Garrapata..." className="campo-entrada text-sm" />
            </Campo>
          </div>
          <Campo etiqueta="Unidad de referencia">
            <input type="text" value={form.unidadReferencia}
              onChange={(e) => setForm((f) => ({ ...f, unidadReferencia: e.target.value }))}
              placeholder="Ej: 20 vacas" className="campo-entrada text-sm" />
          </Campo>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Campo etiqueta="Prevención (producto/dosis)">
              <input type="text" value={form.prevencion}
                onChange={(e) => setForm((f) => ({ ...f, prevencion: e.target.value }))}
                placeholder="Ej: Vacuna anual (2ml)" className="campo-entrada text-sm" />
            </Campo>
            <Campo etiqueta="Tratamiento si se enferma">
              <input type="text" value={form.tratamiento}
                onChange={(e) => setForm((f) => ({ ...f, tratamiento: e.target.value }))}
                placeholder="Ej: Oxitetraciclina 10mg/kg" className="campo-entrada text-sm" />
            </Campo>
          </div>
          <Campo etiqueta="Vía">
            <input type="text" value={form.via}
              onChange={(e) => setForm((f) => ({ ...f, via: e.target.value }))}
              placeholder="I.M., tópica, oral..." className="campo-entrada text-sm" />
          </Campo>
          <Campo etiqueta="Meses programados">
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
              {MESES.map((m, i) => {
                const mes = i + 1;
                const activo = form.mesesProgramados.includes(mes);
                return (
                  <button key={mes} type="button" onClick={() => alternarMesProgramado(mes)}
                    className={`py-1.5 rounded-lg text-xs border transition-colors ${
                      activo ? 'bg-primary border-primary text-on-primary' : 'border-outline-variant text-on-surface-variant'
                    }`}>
                    {m}
                  </button>
                );
              })}
            </div>
          </Campo>
        </div>
      </Modal>

      {/* Modal de detalle (solo lectura) */}
      <Modal
        abierto={!!actividadDetalle}
        alCerrar={() => setActividadDetalle(null)}
        titulo={actividadDetalle?.nombreControl}
        descripcion={actividadDetalle ? ETIQUETA_CATEGORIA[actividadDetalle.categoria] ?? actividadDetalle.categoria : undefined}
        tamano="lg"
        pie={
          puedeGestionar && actividadDetalle ? (
            <>
              <button
                onClick={() => { setActividadAEliminar(actividadDetalle.id); setActividadDetalle(null); }}
                className="flex-1 boton boton-peligro"
              >
                Eliminar
              </button>
              <button
                onClick={() => { abrirEditar(actividadDetalle); setActividadDetalle(null); }}
                className="flex-1 boton boton-primario"
              >
                Editar
              </button>
            </>
          ) : undefined
        }
      >
        {actividadDetalle && (
          <div className="space-y-3">
            {actividadDetalle.unidadReferencia && (
              <DetalleCampo etiqueta="Unidad de referencia" valor={actividadDetalle.unidadReferencia} />
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DetalleCampo etiqueta="Prevención (producto/dosis)" valor={actividadDetalle.prevencion} />
              <DetalleCampo etiqueta="Tratamiento si se enferma" valor={actividadDetalle.tratamiento} />
            </div>
            <DetalleCampo etiqueta="Vía" valor={actividadDetalle.via} />
            <div>
              <span className="block text-xs font-medium text-on-surface-variant mb-1.5">Meses programados / completados</span>
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                {MESES.map((m, i) => {
                  const mes = i + 1;
                  const programado = actividadDetalle.mesesProgramados.includes(mes);
                  const completado = actividadDetalle.mesesCompletados.includes(mes);
                  const yaPaso = anio < anioActual || (anio === anioActual && mes <= mesActual);
                  const clase = !programado
                    ? 'border-outline-variant/30 text-outline-variant'
                    : completado
                      ? 'bg-primary border-primary text-on-primary'
                      : yaPaso
                        ? 'border-error text-error'
                        : 'border-primary/40 text-primary';
                  return (
                    <div key={mes} className={`py-1.5 rounded-lg text-xs text-center border ${clase}`}>
                      {m}
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1.5">
                Verde = hecho · Rojo = atrasado · Azul = programado a futuro · Gris = no programado ese mes
              </p>
            </div>
          </div>
        )}
      </Modal>

      <ModalConfirmacion
        abierto={!!actividadAEliminar}
        titulo="Eliminar actividad"
        descripcion="¿Eliminar esta actividad del plan sanitario? Esta acción no se puede deshacer."
        variante="peligro"
        cargando={eliminarMutacion.isPending}
        alConfirmar={() => actividadAEliminar && eliminarMutacion.mutate(actividadAEliminar)}
        alCerrar={() => setActividadAEliminar(null)}
      />
    </div>
  );
}

function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-on-surface-variant mb-1">{etiqueta}</span>
      {children}
    </label>
  );
}

function DetalleCampo({ etiqueta, valor }: { etiqueta: string; valor?: string }) {
  if (!valor) return null;
  return (
    <div>
      <span className="block text-xs font-medium text-on-surface-variant mb-1">{etiqueta}</span>
      <p className="text-sm text-on-surface bg-surface-container p-2.5 rounded-xl">{valor}</p>
    </div>
  );
}
