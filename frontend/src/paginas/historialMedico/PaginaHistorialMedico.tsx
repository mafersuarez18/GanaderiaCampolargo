import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { clienteHttp } from '../../servicios/clienteAxios';
import Paginacion from '../../componentes/ui/Paginacion';
import Badge from '../../componentes/ui/Badge';
import { ModalConfirmacion } from '../../componentes/ui/Modal';
import useDebounce from '../../hooks/useDebounce';
import Icono from '../../componentes/ui/Icono';

interface HistorialMedico {
  id: string;
  fechaConsulta: string;
  motivoConsulta: string;
  sintomasObservados?: string;
  diagnostico: string;
  pronostico?: string;
  observaciones?: string;
  animal: {
    id: string;
    numeroArete: string;
    nombre?: string;
    finca: { nombre: string };
  };
  veterinario: { id: string; nombre: string; apellido: string };
  enfermedades: Array<{
    id: string;
    nombreEnfermedad: string;
    fechaInicio: string;
    activa: boolean;
    descripcionClinica?: string;
  }>;
  tratamientos: Array<{
    id: string;
    dosis: string;
    viaAdministracion: string;
    frecuencia: string;
    duracionDias?: number;
    estado: string;
    medicamento: { nombre: string };
  }>;
  creadoEn: string;
}

interface RespuestaHistorial {
  datos: HistorialMedico[];
  meta: { total: number; pagina: number; porPagina: number; totalPaginas: number };
}

interface FormHistorial {
  animalId: string;
  fechaConsulta: string;
  motivoConsulta: string;
  sintomasObservados?: string;
  diagnostico: string;
  pronostico?: string;
  observaciones?: string;
}

export default function PaginaHistorialMedico() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [busqueda, setBusqueda]                             = useState(searchParams.get('animal') ?? '');
  const [paginaActual, setPaginaActual]                     = useState(1);
  const [mostrarFiltros, setMostrarFiltros]                 = useState(false);
  const [historialSeleccionado, setHistorialSeleccionado]   = useState<HistorialMedico | null>(null);
  const [mostrarEliminar, setMostrarEliminar]               = useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario]           = useState(false);

  const animalIdFiltro = searchParams.get('animalId') ?? undefined;
  const desdeFiltro    = searchParams.get('desde')    ?? undefined;
  const hastaFiltro    = searchParams.get('hasta')    ?? undefined;

  useDebounce(busqueda, 400);

  const { data, isLoading } = useQuery<RespuestaHistorial>({
    queryKey: ['historialMedico', paginaActual, animalIdFiltro, desdeFiltro, hastaFiltro],
    queryFn: () =>
      clienteHttp
        .get('/historial-medico', {
          params: {
            pagina: paginaActual,
            porPagina: 20,
            ...(animalIdFiltro && { animalId: animalIdFiltro }),
            ...(desdeFiltro    && { desde: desdeFiltro }),
            ...(hastaFiltro    && { hasta: hastaFiltro }),
          },
        })
        .then((r) => r.data),
  });

  const eliminarMutacion = useMutation({
    mutationFn: (id: string) => clienteHttp.delete(`/historial-medico/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['historialMedico'] });
      setMostrarEliminar(null);
      setHistorialSeleccionado(null);
    },
  });

  const registros = data?.datos ?? [];
  const meta = data?.meta;

  const contarActivos   = registros.filter((r) => r.tratamientos.some((t) => t.estado === 'EN_CURSO')).length;
  const contarEnfermedades = registros.filter((r) => r.enfermedades.some((e) => e.activa)).length;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="tarjeta-vidrio rounded-2xl p-5">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Icono nombre="prescriptions" relleno clase="text-[22px] text-primary" />
            </div>
            <span className="text-xs text-on-surface-variant bg-surface-container-high px-2 py-1 rounded-full">Activo</span>
          </div>
          <p className="text-3xl font-bold text-primary">{isLoading ? '—' : contarActivos}</p>
          <p className="text-sm text-on-surface-variant mt-1">Tratamientos en curso</p>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-primary">
            <Icono nombre="trending_up" clase="text-[14px]" />
            <span>En el período mostrado</span>
          </div>
        </div>

        <div className="tarjeta-vidrio rounded-2xl p-5 border-l-4 border-l-error">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-error-container rounded-xl">
              <Icono nombre="warning" relleno clase="text-[22px] text-error" />
            </div>
            <span className="text-xs text-error font-bold">Activas</span>
          </div>
          <p className="text-3xl font-bold text-error">{isLoading ? '—' : String(contarEnfermedades).padStart(2, '0')}</p>
          <p className="text-sm text-on-surface-variant mt-1">Enfermedades activas</p>
          {contarEnfermedades > 0 && (
            <p className="mt-3 text-xs text-error">Requiere seguimiento</p>
          )}
        </div>

        <div className="tarjeta-vidrio rounded-2xl p-5">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-tertiary/10 rounded-xl">
              <Icono nombre="monitoring" clase="text-[22px] text-tertiary" />
            </div>
          </div>
          <p className="text-3xl font-bold text-tertiary">{isLoading ? '—' : meta?.total ?? 0}</p>
          <p className="text-sm text-on-surface-variant mt-1">Consultas registradas</p>
          <div className="mt-3 w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
            <div className="bg-tertiary h-full" style={{ width: '70%' }} />
          </div>
        </div>
      </motion.div>

      {/* Cabecera con acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="font-bold text-xl text-on-surface">Línea de Tiempo Médica</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className={`boton boton-secundario gap-2 text-sm ${mostrarFiltros ? 'ring-2 ring-primary/40' : ''}`}
          >
            <Icono nombre="filter_list" clase="text-[18px]" />
            Filtros
          </button>
          <button
            onClick={() => setMostrarFormulario(true)}
            className="boton boton-primario gap-2 text-sm"
          >
            <Icono nombre="add" clase="text-[18px]" />
            Nueva consulta
          </button>
        </div>
      </div>

      {/* Panel filtros */}
      <AnimatePresence>
        {mostrarFiltros && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="tarjeta-vidrio rounded-2xl p-4">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Icono nombre="search" clase="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]" />
                  <input
                    type="text"
                    placeholder="Buscar por animal (arete o nombre)..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="campo-entrada pl-10"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Desde</label>
                  <input
                    type="date"
                    value={desdeFiltro ?? ''}
                    onChange={(e) => {
                      const p = new URLSearchParams(searchParams);
                      if (e.target.value) p.set('desde', e.target.value); else p.delete('desde');
                      setSearchParams(p); setPaginaActual(1);
                    }}
                    className="campo-entrada text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Hasta</label>
                  <input
                    type="date"
                    value={hastaFiltro ?? ''}
                    onChange={(e) => {
                      const p = new URLSearchParams(searchParams);
                      if (e.target.value) p.set('hasta', e.target.value); else p.delete('hasta');
                      setSearchParams(p); setPaginaActual(1);
                    }}
                    className="campo-entrada text-sm"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline de registros */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-surface-container animate-pulse" />
          ))}
        </div>
      ) : registros.length === 0 ? (
        <div className="tarjeta-vidrio rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-container mx-auto mb-4 flex items-center justify-center">
            <Icono nombre="medical_services" clase="text-[32px] text-outline" />
          </div>
          <p className="font-medium text-on-surface-variant">Sin registros médicos</p>
          <p className="text-xs text-outline mt-1">Registre la primera consulta clínica</p>
          <button
            onClick={() => setMostrarFormulario(true)}
            className="boton boton-primario mt-4 text-sm gap-2"
          >
            <Icono nombre="add" clase="text-[18px]" />
            Nueva consulta
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {registros.map((reg) => {
            const tieneEnfermedadActiva = reg.enfermedades.some((e) => e.activa);
            const tieneTratamientoEnCurso = reg.tratamientos.some((t) => t.estado === 'EN_CURSO');

            return (
              <motion.div
                key={reg.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="tarjeta-vidrio rounded-2xl p-5 flex gap-4 items-start
                           cursor-pointer hover:border-primary/30 transition-all group"
                onClick={() => setHistorialSeleccionado(reg)}
              >
                {/* Ícono de tipo + línea vertical */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-transform duration-300
                    ${tieneEnfermedadActiva
                      ? 'bg-error-container text-error'
                      : tieneTratamientoEnCurso
                      ? 'bg-surface-container-high text-primary'
                      : 'bg-tertiary/15 text-tertiary'
                    } group-hover:scale-110`}
                  >
                    <Icono
                      nombre={tieneEnfermedadActiva ? 'warning' : tieneTratamientoEnCurso ? 'medication' : 'task_alt'}
                      relleno={tieneEnfermedadActiva}
                      clase="text-[20px]"
                    />
                  </div>
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 mb-2">
                    <div>
                      <h4 className="font-bold text-base text-on-surface line-clamp-1">
                        {reg.diagnostico}
                      </h4>
                      <p className="text-xs text-on-surface-variant">
                        #{reg.animal.numeroArete}
                        {reg.animal.nombre && ` · ${reg.animal.nombre}`}
                        {` · ${reg.animal.finca.nombre}`}
                      </p>
                    </div>
                    <span className="text-xs text-on-surface-variant whitespace-nowrap flex-shrink-0">
                      {new Date(reg.fechaConsulta).toLocaleDateString('es-VE', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </span>
                  </div>

                  <p className="text-sm text-on-surface-variant line-clamp-2 mb-3">
                    {reg.motivoConsulta}
                  </p>

                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    {/* Veterinario */}
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center
                                      text-on-primary-container text-[10px] font-bold flex-shrink-0">
                        {reg.veterinario.nombre.charAt(0)}{reg.veterinario.apellido.charAt(0)}
                      </div>
                      <span className="text-xs font-medium text-on-surface-variant">
                        {reg.veterinario.nombre} {reg.veterinario.apellido}
                      </span>
                    </div>

                    {/* Badges de estado */}
                    <div className="flex items-center gap-1.5">
                      {tieneEnfermedadActiva && (
                        <span className="px-2.5 py-1 bg-error-container/30 text-error text-xs rounded-full font-semibold border border-error/10">
                          Urgente
                        </span>
                      )}
                      {tieneTratamientoEnCurso && (
                        <span className="px-2.5 py-1 bg-surface-container-high text-on-surface-variant text-xs rounded-full">
                          En Curso
                        </span>
                      )}
                      {!tieneEnfermedadActiva && !tieneTratamientoEnCurso && (
                        <span className="px-2.5 py-1 bg-tertiary/10 text-tertiary text-xs rounded-full font-semibold">
                          Completado
                        </span>
                      )}
                      {/* Acciones */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setMostrarEliminar(reg.id); }}
                        className="p-1.5 text-outline hover:text-error hover:bg-error-container/30 rounded-lg transition-colors"
                      >
                        <Icono nombre="delete" clase="text-[16px]" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Paginación */}
      {meta && meta.totalPaginas > 1 && (
        <Paginacion
          paginaActual={paginaActual}
          totalPaginas={meta.totalPaginas}
          totalRegistros={meta.total}
          porPagina={meta.porPagina}
          alCambiarPagina={setPaginaActual}
        />
      )}

      {/* FAB */}
      <button
        onClick={() => setMostrarFormulario(true)}
        className="fixed bottom-20 md:bottom-8 right-5 md:right-8 w-14 h-14 bg-primary text-on-primary rounded-full
                   shadow-[var(--shadow-primary)] flex items-center justify-center
                   hover:scale-110 active:scale-95 transition-transform z-20"
        aria-label="Nueva consulta"
      >
        <Icono nombre="add" clase="text-[28px]" />
      </button>

      {/* Panel de detalle lateral */}
      <AnimatePresence>
        {historialSeleccionado && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-inverse-surface/30 z-40"
              onClick={() => setHistorialSeleccionado(null)}
            />
            <motion.aside
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-[480px] max-w-[95vw] bg-surface-container-lowest shadow-2xl z-50 overflow-y-auto"
            >
              <div className="sticky top-0 bg-surface-container-lowest border-b border-outline-variant/20 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-on-surface">Detalle de Consulta</h2>
                  <p className="text-xs text-on-surface-variant">
                    {new Date(historialSeleccionado.fechaConsulta).toLocaleDateString('es-VE', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </p>
                </div>
                <button
                  onClick={() => setHistorialSeleccionado(null)}
                  className="p-2 hover:bg-surface-container rounded-xl transition-colors"
                >
                  <Icono nombre="close" clase="text-[20px] text-on-surface-variant" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Animal */}
                <section>
                  <p className="text-[10px] uppercase font-semibold text-on-surface-variant tracking-wider mb-2">Animal</p>
                  <button
                    onClick={() => navigate(`/animales/${historialSeleccionado.animal.id}`)}
                    className="text-primary hover:underline font-semibold text-sm"
                  >
                    #{historialSeleccionado.animal.numeroArete}
                    {historialSeleccionado.animal.nombre && ` · ${historialSeleccionado.animal.nombre}`}
                  </button>
                  <p className="text-xs text-on-surface-variant">{historialSeleccionado.animal.finca.nombre}</p>
                </section>

                <section>
                  <p className="text-[10px] uppercase font-semibold text-on-surface-variant tracking-wider mb-1">Motivo</p>
                  <p className="text-sm text-on-surface">{historialSeleccionado.motivoConsulta}</p>
                </section>

                {historialSeleccionado.sintomasObservados && (
                  <section>
                    <p className="text-[10px] uppercase font-semibold text-on-surface-variant tracking-wider mb-1">Síntomas</p>
                    <p className="text-sm text-on-surface-variant">{historialSeleccionado.sintomasObservados}</p>
                  </section>
                )}

                <section>
                  <p className="text-[10px] uppercase font-semibold text-on-surface-variant tracking-wider mb-1">Diagnóstico</p>
                  <p className="text-sm font-medium text-on-surface">{historialSeleccionado.diagnostico}</p>
                </section>

                {historialSeleccionado.pronostico && (
                  <section>
                    <p className="text-[10px] uppercase font-semibold text-on-surface-variant tracking-wider mb-1">Pronóstico</p>
                    <p className="text-sm text-on-surface-variant">{historialSeleccionado.pronostico}</p>
                  </section>
                )}

                {/* Enfermedades */}
                {historialSeleccionado.enfermedades.length > 0 && (
                  <section>
                    <p className="text-[10px] uppercase font-semibold text-on-surface-variant tracking-wider mb-3 flex items-center gap-1.5">
                      <Icono nombre="bug_report" clase="text-[14px]" /> Enfermedades
                    </p>
                    <div className="space-y-2">
                      {historialSeleccionado.enfermedades.map((e) => (
                        <div key={e.id} className="p-3 rounded-xl bg-surface-container border border-outline-variant/20">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-on-surface">{e.nombreEnfermedad}</span>
                            <Badge variante={e.activa ? 'rojo' : 'gris'} tamano="xs" punto={e.activa}>
                              {e.activa ? 'Activa' : 'Resuelta'}
                            </Badge>
                          </div>
                          <p className="text-xs text-on-surface-variant">
                            Inicio: {new Date(e.fechaInicio).toLocaleDateString('es-VE')}
                          </p>
                          {e.descripcionClinica && (
                            <p className="text-xs text-on-surface-variant mt-1">{e.descripcionClinica}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Tratamientos */}
                {historialSeleccionado.tratamientos.length > 0 && (
                  <section>
                    <p className="text-[10px] uppercase font-semibold text-on-surface-variant tracking-wider mb-3 flex items-center gap-1.5">
                      <Icono nombre="medication" clase="text-[14px]" /> Tratamientos
                    </p>
                    <div className="space-y-2">
                      {historialSeleccionado.tratamientos.map((t) => (
                        <div key={t.id} className="p-3 rounded-xl bg-surface-container border border-outline-variant/20">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-on-surface">{t.medicamento.nombre}</span>
                            <Badge
                              variante={t.estado === 'COMPLETADO' ? 'verde' : t.estado === 'EN_CURSO' ? 'azul' : 'gris'}
                              tamano="xs"
                            >
                              {t.estado === 'EN_CURSO' ? 'En curso' : t.estado === 'COMPLETADO' ? 'Completado' : t.estado}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 text-xs text-on-surface-variant">
                            <span>Dosis: <strong className="text-on-surface">{t.dosis}</strong></span>
                            <span>Vía: <strong className="text-on-surface">{t.viaAdministracion}</strong></span>
                            <span>Frecuencia: <strong className="text-on-surface">{t.frecuencia}</strong></span>
                            {t.duracionDias && <span>Duración: <strong className="text-on-surface">{t.duracionDias}d</strong></span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {historialSeleccionado.observaciones && (
                  <section>
                    <p className="text-[10px] uppercase font-semibold text-on-surface-variant tracking-wider mb-1">Observaciones</p>
                    <p className="text-sm text-on-surface-variant bg-surface-container p-3 rounded-xl">
                      {historialSeleccionado.observaciones}
                    </p>
                  </section>
                )}

                <section className="pt-4 border-t border-outline-variant/20">
                  <p className="text-[10px] uppercase font-semibold text-on-surface-variant tracking-wider mb-1">Registrado por</p>
                  <p className="text-sm text-on-surface-variant">
                    {historialSeleccionado.veterinario.nombre} {historialSeleccionado.veterinario.apellido}
                  </p>
                </section>

                <button
                  onClick={() => setMostrarEliminar(historialSeleccionado.id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                             border border-error/30 text-error hover:bg-error-container/30 transition-colors text-sm font-medium"
                >
                  <Icono nombre="delete" clase="text-[18px]" />
                  Eliminar registro
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Modal nueva consulta */}
      <AnimatePresence>
        {mostrarFormulario && (
          <FormularioConsulta
            onCerrar={() => setMostrarFormulario(false)}
            onExito={() => {
              queryClient.invalidateQueries({ queryKey: ['historialMedico'] });
              setMostrarFormulario(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Modal eliminar */}
      <ModalConfirmacion
        abierto={!!mostrarEliminar}
        titulo="Eliminar registro médico"
        descripcion="¿Está seguro de eliminar este registro? Esta acción no se puede deshacer."
        textoConfirmar="Eliminar"
        variante="peligro"
        cargando={eliminarMutacion.isPending}
        alConfirmar={() => mostrarEliminar && eliminarMutacion.mutate(mostrarEliminar)}
        alCerrar={() => setMostrarEliminar(null)}
      />
    </div>
  );
}

// ── Formulario nueva consulta ─────────────────────────────────────────────────

interface PropiedadesFormulario {
  onCerrar: () => void;
  onExito: () => void;
  animalIdPredeterminado?: string;
}

function FormularioConsulta({ onCerrar, onExito, animalIdPredeterminado }: PropiedadesFormulario) {
  const [form, setForm] = useState<FormHistorial>({
    animalId: animalIdPredeterminado ?? '',
    fechaConsulta: new Date().toISOString().split('T')[0],
    motivoConsulta: '',
    diagnostico: '',
    sintomasObservados: '',
    pronostico: '',
    observaciones: '',
  });
  const [error, setError] = useState('');

  const mutacion = useMutation({
    mutationFn: (datos: FormHistorial) => clienteHttp.post('/historial-medico', datos),
    onSuccess: () => onExito(),
    onError: (err: any) => setError(err?.response?.data?.mensaje ?? 'Error al guardar la consulta'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.animalId)       { setError('Debe ingresar el ID del animal'); return; }
    if (!form.motivoConsulta) { setError('El motivo de consulta es requerido'); return; }
    if (!form.diagnostico)    { setError('El diagnóstico es requerido'); return; }
    setError('');
    mutacion.mutate({ ...form, fechaConsulta: new Date(form.fechaConsulta).toISOString() });
  };

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
        exit={{ scale: 0.96, opacity: 0, y: 16 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
            <h2 className="font-bold text-on-surface flex items-center gap-2">
              <Icono nombre="medical_services" clase="text-[20px] text-primary" />
              Nueva Consulta Médica
            </h2>
            <button onClick={onCerrar} className="p-2 hover:bg-surface-container rounded-xl transition-colors">
              <Icono nombre="close" clase="text-[20px] text-on-surface-variant" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-error-container border border-error/20 rounded-xl text-sm text-on-error-container">
                <Icono nombre="error" clase="text-[18px] flex-shrink-0 text-error" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  ID del Animal <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={form.animalId}
                  onChange={(e) => setForm((f) => ({ ...f, animalId: e.target.value }))}
                  placeholder="ID único del animal"
                  className="campo-entrada"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  Fecha <span className="text-error">*</span>
                </label>
                <input
                  type="date"
                  value={form.fechaConsulta}
                  onChange={(e) => setForm((f) => ({ ...f, fechaConsulta: e.target.value }))}
                  className="campo-entrada"
                />
              </div>
            </div>

            {[
              { campo: 'motivoConsulta', etiqueta: 'Motivo de Consulta', req: true, tipo: 'input', ph: 'Ej: Fiebre, cojera, control...' },
              { campo: 'sintomasObservados', etiqueta: 'Síntomas Observados', req: false, tipo: 'textarea', ph: 'Describa los síntomas...' },
              { campo: 'diagnostico', etiqueta: 'Diagnóstico', req: true, tipo: 'textarea', ph: 'Diagnóstico clínico...' },
              { campo: 'pronostico', etiqueta: 'Pronóstico', req: false, tipo: 'input', ph: 'Ej: Favorable, reservado...' },
              { campo: 'observaciones', etiqueta: 'Observaciones', req: false, tipo: 'textarea', ph: 'Notas adicionales...' },
            ].map(({ campo, etiqueta, req, tipo, ph }) => (
              <div key={campo}>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  {etiqueta} {req && <span className="text-error">*</span>}
                </label>
                {tipo === 'input' ? (
                  <input
                    type="text"
                    value={(form as any)[campo] ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, [campo]: e.target.value }))}
                    placeholder={ph}
                    className="campo-entrada"
                  />
                ) : (
                  <textarea
                    rows={2}
                    value={(form as any)[campo] ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, [campo]: e.target.value }))}
                    placeholder={ph}
                    className="campo-entrada resize-none"
                  />
                )}
              </div>
            ))}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onCerrar} className="flex-1 boton boton-secundario">
                Cancelar
              </button>
              <button type="submit" disabled={mutacion.isPending} className="flex-1 boton boton-primario">
                {mutacion.isPending ? 'Guardando...' : 'Guardar consulta'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  );
}
