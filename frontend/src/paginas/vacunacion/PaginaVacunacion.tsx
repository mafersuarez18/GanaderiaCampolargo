import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { clienteHttp } from '../../servicios/clienteAxios';
import Badge from '../../componentes/ui/Badge';
import BuscadorAnimal from '../../componentes/ui/BuscadorAnimal';
import Icono from '../../componentes/ui/Icono';

interface CalendarioVacunacion {
  id: string;
  nombreVacuna: string;
  descripcion?: string;
  fabricante?: string;
  intervaloDias: number;
  edadMinimasDias?: number;
  aplicaASexo?: 'MACHO' | 'HEMBRA' | null;
  activo: boolean;
  medicamento?: { id: string; nombre: string; principioActivo?: string };
  _count: { registrosVacunacion: number };
}

interface RegistroVacunacion {
  id: string;
  fechaAplicacion: string;
  dosis?: string;
  viaAdministracion?: string;
  lote?: string;
  proximaFecha?: string;
  observaciones?: string;
  historialMedico?: {
    animal: { id: string; numeroArete: string; nombre?: string };
  };
  calendarioVacunacion: { id: string; nombreVacuna: string; intervaloDias: number };
  medicamento?: { id: string; nombre: string };
  aplicadoPor: { id: string; nombre: string; apellido: string };
}

interface FormCalendario {
  nombreVacuna: string;
  descripcion: string;
  fabricante: string;
  intervaloDias: number;
  edadMinimasDias?: number;
  aplicaASexo: '' | 'MACHO' | 'HEMBRA';
  activo: boolean;
}

interface FormRegistro {
  calendarioVacunacionId: string;
  animalId: string;
  fechaAplicacion: string;
  dosis: string;
  viaAdministracion: string;
  lote: string;
  observaciones: string;
}

const formatearIntervalo = (dias: number) => {
  if (dias === 365) return 'Anual';
  if (dias === 180) return 'Semestral';
  if (dias === 90)  return 'Trimestral';
  if (dias === 30)  return 'Mensual';
  return `Cada ${dias} días`;
};

export default function PaginaVacunacion() {
  const queryClient = useQueryClient();
  const [pestanaActiva, setPestanaActiva]           = useState<'calendarios' | 'registros'>('calendarios');
  const [calendarioActivo, setCalendarioActivo]     = useState<CalendarioVacunacion | null>(null);
  const [mostrarFormCalendario, setMostrarFormCalendario] = useState(false);
  const [mostrarFormRegistro, setMostrarFormRegistro]     = useState(false);
  const [filtroActivos, setFiltroActivos]           = useState<boolean | undefined>(true);

  const { data: calendarios, isLoading: cargandoCalendarios } = useQuery<CalendarioVacunacion[]>({
    queryKey: ['calendarios-vacunacion', filtroActivos],
    queryFn: () =>
      clienteHttp
        .get('/vacunacion/calendarios', {
          params: filtroActivos !== undefined ? { activos: filtroActivos } : {},
        })
        .then((r) => r.data.datos ?? r.data),
  });

  const { data: respuestaRegistros, isLoading: cargandoRegistros } = useQuery({
    queryKey: ['registros-vacunacion', calendarioActivo?.id],
    queryFn: () =>
      clienteHttp
        .get('/vacunacion', {
          params: {
            porPagina: 50,
            ...(calendarioActivo && { calendarioVacunacionId: calendarioActivo.id }),
          },
        })
        .then((r) => r.data),
    enabled: pestanaActiva === 'registros',
  });

  const registros: RegistroVacunacion[] = respuestaRegistros?.datos ?? [];

  const totalCalendarios = calendarios?.length ?? 0;
  const totalAplicaciones = calendarios?.reduce((s, c) => s + c._count.registrosVacunacion, 0) ?? 0;
  const calendariosActivos = calendarios?.filter((c) => c.activo).length ?? 0;

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
            <div className="p-3 bg-error-container rounded-xl">
              <Icono nombre="pending_actions" clase="text-[22px] text-on-error-container" />
            </div>
            <span className="text-xs text-error font-semibold">
              {filtroActivos === true ? calendariosActivos : totalCalendarios} activos
            </span>
          </div>
          <p className="text-3xl font-bold text-on-surface">{cargandoCalendarios ? '—' : totalCalendarios}</p>
          <p className="text-sm text-on-surface-variant mt-1">Calendarios de vacunación</p>
          <div className="mt-3 h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
            <div
              className="bg-error h-full transition-all"
              style={{ width: `${totalCalendarios ? (calendariosActivos / totalCalendarios) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="tarjeta-vidrio rounded-2xl p-5">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Icono nombre="task_alt" clase="text-[22px] text-primary" />
            </div>
            <span className="text-xs text-primary font-semibold">Total acumulado</span>
          </div>
          <p className="text-3xl font-bold text-on-surface">{cargandoCalendarios ? '—' : totalAplicaciones}</p>
          <p className="text-sm text-on-surface-variant mt-1">Aplicaciones registradas</p>
          <div className="mt-3 h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
            <div className="bg-primary h-full w-4/5" />
          </div>
        </div>

        <div className="tarjeta-vidrio rounded-2xl p-5">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-tertiary/10 rounded-xl">
              <Icono nombre="vaccines" relleno clase="text-[22px] text-tertiary" />
            </div>
          </div>
          <p className="text-3xl font-bold text-on-surface">{cargandoCalendarios ? '—' : calendariosActivos}</p>
          <p className="text-sm text-on-surface-variant mt-1">Protocolos activos</p>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-tertiary">
            <Icono nombre="check_circle" relleno clase="text-[14px]" />
            <span>Esquema al día</span>
          </div>
        </div>
      </motion.div>

      {/* Cabecera + pestañas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex gap-1 p-1 bg-surface-container rounded-xl w-fit">
          {[
            { clave: 'calendarios', et: 'Calendarios',        ico: 'event_note' },
            { clave: 'registros',   et: 'Historial de Aplicaciones', ico: 'history' },
          ].map((p) => (
            <button
              key={p.clave}
              onClick={() => setPestanaActiva(p.clave as 'calendarios' | 'registros')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                pestanaActiva === p.clave
                  ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Icono nombre={p.ico} clase="text-[16px]" />
              {p.et}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {pestanaActiva === 'calendarios' ? (
            <>
              {/* Filtros activos */}
              <div className="flex gap-1 p-1 bg-surface-container rounded-xl">
                {[
                  { val: true,      et: 'Activos' },
                  { val: false,     et: 'Inactivos' },
                  { val: undefined, et: 'Todos' },
                ].map((op) => (
                  <button
                    key={String(op.val)}
                    onClick={() => setFiltroActivos(op.val)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      filtroActivos === op.val
                        ? 'bg-primary text-on-primary'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {op.et}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setMostrarFormCalendario(true)}
                className="boton boton-primario gap-2 text-sm"
              >
                <Icono nombre="add" clase="text-[18px]" />
                Nuevo calendario
              </button>
            </>
          ) : (
            <>
              {calendarioActivo && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20
                               rounded-full text-sm text-primary">
                  <Icono nombre="vaccines" clase="text-[16px]" />
                  <span className="max-w-32 truncate">{calendarioActivo.nombreVacuna}</span>
                  <button onClick={() => setCalendarioActivo(null)} className="hover:text-error transition-colors">
                    <Icono nombre="close" clase="text-[14px]" />
                  </button>
                </div>
              )}
              <button
                onClick={() => setMostrarFormRegistro(true)}
                className="boton boton-primario gap-2 text-sm"
              >
                <Icono nombre="add_task" clase="text-[18px]" />
                Registrar aplicación
              </button>
            </>
          )}
        </div>
      </div>

      {/* Contenido por pestaña */}
      <AnimatePresence mode="wait">
        {pestanaActiva === 'calendarios' ? (
          <motion.div
            key="calendarios"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {cargandoCalendarios ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-44 rounded-2xl bg-surface-container animate-pulse" />
                ))}
              </div>
            ) : !calendarios?.length ? (
              <div className="tarjeta-vidrio rounded-2xl p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-surface-container mx-auto mb-4 flex items-center justify-center">
                  <Icono nombre="vaccines" clase="text-[32px] text-outline" />
                </div>
                <p className="font-medium text-on-surface-variant">Sin calendarios de vacunación</p>
                <p className="text-xs text-outline mt-1">Cree el primer protocolo</p>
                <button onClick={() => setMostrarFormCalendario(true)} className="boton boton-primario mt-4 text-sm gap-2">
                  <Icono nombre="add" clase="text-[18px]" />
                  Nuevo calendario
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {calendarios.map((cal) => (
                  <motion.div
                    key={cal.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => { setCalendarioActivo(cal); setPestanaActiva('registros'); }}
                    className={`tarjeta-vidrio rounded-2xl p-5 flex flex-col gap-3 cursor-pointer group
                               ${!cal.activo ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2.5 rounded-xl ${cal.activo ? 'bg-primary/10' : 'bg-surface-container'}`}>
                          <Icono
                            nombre="vaccines"
                            relleno={cal.activo}
                            clase={`text-[20px] ${cal.activo ? 'text-primary' : 'text-on-surface-variant'}`}
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-on-surface text-sm leading-tight">{cal.nombreVacuna}</h3>
                          {cal.fabricante && <p className="text-xs text-on-surface-variant">{cal.fabricante}</p>}
                        </div>
                      </div>
                      <Badge variante={cal.activo ? 'verde' : 'gris'} tamano="xs" punto={cal.activo}>
                        {cal.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>

                    {cal.descripcion && (
                      <p className="text-xs text-on-surface-variant line-clamp-2">{cal.descripcion}</p>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs text-on-surface-variant">
                      <div className="flex items-center gap-1.5">
                        <Icono nombre="schedule" clase="text-[14px] text-primary" />
                        <span>{formatearIntervalo(cal.intervaloDias)}</span>
                      </div>
                      {cal.aplicaASexo && (
                        <div className="flex items-center gap-1.5">
                          <Icono nombre="person" clase="text-[14px] text-secondary" />
                          <span>Solo {cal.aplicaASexo === 'MACHO' ? 'machos' : 'hembras'}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Icono nombre="check_circle" relleno clase="text-[14px] text-primary" />
                        <span>{cal._count.registrosVacunacion} aplicaciones</span>
                      </div>
                    </div>

                    <div className="mt-auto pt-3 border-t border-outline-variant/20 flex items-center justify-between">
                      <span className="text-xs text-on-surface-variant truncate">
                        {cal.medicamento?.nombre ?? 'Sin medicamento asignado'}
                      </span>
                      <Icono nombre="chevron_right" clase="text-[18px] text-outline group-hover:text-primary transition-colors" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="registros"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {cargandoRegistros ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-surface-container animate-pulse" />
                ))}
              </div>
            ) : !registros.length ? (
              <div className="tarjeta-vidrio rounded-2xl p-12 text-center">
                <Icono nombre="task_alt" clase="text-[40px] text-outline mx-auto mb-3" />
                <p className="font-medium text-on-surface-variant">Sin registros de vacunación</p>
                <button onClick={() => setMostrarFormRegistro(true)} className="boton boton-primario mt-4 text-sm gap-2">
                  <Icono nombre="add_task" clase="text-[18px]" />
                  Registrar aplicación
                </button>
              </div>
            ) : (
              <div className="tarjeta-vidrio rounded-2xl overflow-hidden">
                {registros.map((reg, idx) => (
                  <div
                    key={reg.id}
                    className={`p-4 hover:bg-surface-container-low transition-colors ${
                      idx < registros.length - 1 ? 'border-b border-outline-variant/20' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-primary/10 flex-shrink-0">
                          <Icono nombre="task_alt" relleno clase="text-[18px] text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-on-surface">
                              {reg.calendarioVacunacion.nombreVacuna}
                            </span>
                            {reg.historialMedico?.animal && (
                              <span className="text-xs text-on-surface-variant">
                                — #{reg.historialMedico.animal.numeroArete}
                                {reg.historialMedico.animal.nombre && ` (${reg.historialMedico.animal.nombre})`}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-3 mt-1 text-xs text-on-surface-variant">
                            <span>
                              {new Date(reg.fechaAplicacion).toLocaleDateString('es-VE', {
                                day: '2-digit', month: 'short', year: 'numeric',
                              })}
                            </span>
                            {reg.dosis && <span>Dosis: {reg.dosis}</span>}
                            {reg.viaAdministracion && <span>Vía: {reg.viaAdministracion}</span>}
                            {reg.lote && <span className="font-mono">Lote: {reg.lote}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-on-surface-variant">
                          {reg.aplicadoPor.nombre} {reg.aplicadoPor.apellido}
                        </p>
                        {reg.proximaFecha && (
                          <p className="text-xs text-tertiary flex items-center gap-1 justify-end mt-1">
                            <Icono nombre="event_upcoming" clase="text-[12px]" />
                            Próx: {new Date(reg.proximaFecha).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })}
                          </p>
                        )}
                      </div>
                    </div>
                    {reg.observaciones && (
                      <p className="mt-2 text-xs text-on-surface-variant pl-11">{reg.observaciones}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <button
        onClick={() => pestanaActiva === 'calendarios' ? setMostrarFormCalendario(true) : setMostrarFormRegistro(true)}
        className="md:hidden fixed bottom-20 right-5 w-14 h-14 bg-primary text-on-primary rounded-full
                   shadow-[var(--shadow-primary)] flex items-center justify-center
                   hover:scale-110 active:scale-95 transition-transform z-20"
      >
        <Icono nombre={pestanaActiva === 'calendarios' ? 'add' : 'add_task'} clase="text-[28px]" />
      </button>

      {/* Formulario: Nuevo Calendario */}
      <AnimatePresence>
        {mostrarFormCalendario && (
          <FormularioCalendario
            onCerrar={() => setMostrarFormCalendario(false)}
            onExito={() => {
              queryClient.invalidateQueries({ queryKey: ['calendarios-vacunacion'] });
              setMostrarFormCalendario(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Formulario: Registrar Vacunación */}
      <AnimatePresence>
        {mostrarFormRegistro && (
          <FormularioRegistro
            calendarioPredeterminado={calendarioActivo ?? undefined}
            todosCalendarios={calendarios ?? []}
            onCerrar={() => setMostrarFormRegistro(false)}
            onExito={() => {
              queryClient.invalidateQueries({ queryKey: ['registros-vacunacion'] });
              queryClient.invalidateQueries({ queryKey: ['calendarios-vacunacion'] });
              setMostrarFormRegistro(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Formulario: Nuevo Calendario ──────────────────────────────────────────────

function FormularioCalendario({ onCerrar, onExito }: { onCerrar: () => void; onExito: () => void }) {
  const [form, setForm] = useState<FormCalendario>({
    nombreVacuna: '', descripcion: '', fabricante: '', intervaloDias: 365, aplicaASexo: '', activo: true,
  });
  const [error, setError] = useState('');

  const mutacion = useMutation({
    mutationFn: (datos: FormCalendario) =>
      clienteHttp.post('/vacunacion/calendarios', {
        ...datos,
        aplicaASexo: datos.aplicaASexo || null,
        descripcion: datos.descripcion || undefined,
        fabricante:  datos.fabricante  || undefined,
      }),
    onSuccess: () => onExito(),
    onError: (err: any) => setError(err?.response?.data?.mensaje ?? 'Error al crear el calendario'),
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
        <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
            <h2 className="font-bold text-on-surface flex items-center gap-2">
              <Icono nombre="vaccines" relleno clase="text-[20px] text-primary" />
              Nuevo Calendario de Vacunación
            </h2>
            <button onClick={onCerrar} className="p-2 hover:bg-surface-container rounded-xl transition-colors">
              <Icono nombre="close" clase="text-[20px] text-on-surface-variant" />
            </button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.nombreVacuna.trim()) { setError('El nombre de la vacuna es requerido'); return; }
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
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                Nombre de la Vacuna <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={form.nombreVacuna}
                onChange={(e) => setForm((f) => ({ ...f, nombreVacuna: e.target.value }))}
                placeholder="Ej: Brucelosis, Aftosa, Rabia..."
                className="campo-entrada"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Fabricante</label>
                <input
                  type="text"
                  value={form.fabricante}
                  onChange={(e) => setForm((f) => ({ ...f, fabricante: e.target.value }))}
                  placeholder="Laboratorio"
                  className="campo-entrada"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  Intervalo (días) <span className="text-error">*</span>
                </label>
                <input
                  type="number" min={1}
                  value={form.intervaloDias}
                  onChange={(e) => setForm((f) => ({ ...f, intervaloDias: Number(e.target.value) }))}
                  className="campo-entrada"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Edad mínima (días)</label>
                <input
                  type="number" min={0}
                  value={form.edadMinimasDias ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, edadMinimasDias: e.target.value ? Number(e.target.value) : undefined }))}
                  placeholder="Sin restricción"
                  className="campo-entrada"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Aplica a Sexo</label>
                <select
                  value={form.aplicaASexo}
                  onChange={(e) => setForm((f) => ({ ...f, aplicaASexo: e.target.value as '' | 'MACHO' | 'HEMBRA' }))}
                  className="campo-entrada"
                >
                  <option value="">Ambos sexos</option>
                  <option value="MACHO">Solo machos</option>
                  <option value="HEMBRA">Solo hembras</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Descripción</label>
              <textarea
                rows={2}
                value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                placeholder="Indicaciones, notas..."
                className="campo-entrada resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onCerrar} className="flex-1 boton boton-secundario">Cancelar</button>
              <button type="submit" disabled={mutacion.isPending} className="flex-1 boton boton-primario">
                {mutacion.isPending ? 'Guardando...' : 'Crear calendario'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  );
}

// ── Formulario: Registrar Vacunación ──────────────────────────────────────────

function FormularioRegistro({
  calendarioPredeterminado, todosCalendarios, onCerrar, onExito,
}: {
  calendarioPredeterminado?: CalendarioVacunacion;
  todosCalendarios: CalendarioVacunacion[];
  onCerrar: () => void;
  onExito: () => void;
}) {
  const [form, setForm] = useState<FormRegistro>({
    calendarioVacunacionId: calendarioPredeterminado?.id ?? '',
    animalId:        '',
    fechaAplicacion: new Date().toISOString().split('T')[0],
    dosis: '', viaAdministracion: '', lote: '', observaciones: '',
  });
  const [error, setError] = useState('');

  const mutacion = useMutation({
    mutationFn: (datos: FormRegistro) =>
      clienteHttp.post('/vacunacion', {
        calendarioVacunacionId: datos.calendarioVacunacionId,
        ...(datos.animalId        && { animalId: datos.animalId }),
        fechaAplicacion:  new Date(datos.fechaAplicacion).toISOString(),
        ...(datos.dosis            && { dosis: datos.dosis }),
        ...(datos.viaAdministracion && { viaAdministracion: datos.viaAdministracion }),
        ...(datos.lote             && { lote: datos.lote }),
        ...(datos.observaciones    && { observaciones: datos.observaciones }),
      }),
    onSuccess: () => onExito(),
    onError: (err: any) => setError(err?.response?.data?.mensaje ?? 'Error al registrar la vacunación'),
  });

  const calendariosActivos = todosCalendarios.filter((c) => c.activo);

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
        <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
            <h2 className="font-bold text-on-surface flex items-center gap-2">
              <Icono nombre="add_task" clase="text-[20px] text-primary" />
              Registrar Vacunación
            </h2>
            <button onClick={onCerrar} className="p-2 hover:bg-surface-container rounded-xl transition-colors">
              <Icono nombre="close" clase="text-[20px] text-on-surface-variant" />
            </button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.calendarioVacunacionId) { setError('Seleccione el protocolo de vacunación'); return; }
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
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                Protocolo de vacunación <span className="text-error">*</span>
              </label>
              <select
                value={form.calendarioVacunacionId}
                onChange={(e) => setForm((f) => ({ ...f, calendarioVacunacionId: e.target.value }))}
                className="campo-entrada"
              >
                <option value="">Seleccionar protocolo...</option>
                {calendariosActivos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombreVacuna}{c.fabricante ? ` — ${c.fabricante}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <BuscadorAnimal
              etiqueta="Animal vacunado"
              valor={form.animalId}
              alSeleccionar={(id) => setForm((f) => ({ ...f, animalId: id }))}
              placeholder="Buscar por arete o nombre (opcional)..."
            />

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                Fecha de Aplicación <span className="text-error">*</span>
              </label>
              <input
                type="date"
                value={form.fechaAplicacion}
                onChange={(e) => setForm((f) => ({ ...f, fechaAplicacion: e.target.value }))}
                className="campo-entrada"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { campo: 'dosis',             et: 'Dosis',  ph: '2 ml' },
                { campo: 'viaAdministracion', et: 'Vía',    ph: 'IM, SC...' },
                { campo: 'lote',              et: 'Lote',   ph: 'N° lote' },
              ].map(({ campo, et, ph }) => (
                <div key={campo}>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">{et}</label>
                  <input
                    type="text"
                    value={(form as any)[campo]}
                    onChange={(e) => setForm((f) => ({ ...f, [campo]: e.target.value }))}
                    placeholder={ph}
                    className="campo-entrada"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Observaciones</label>
              <textarea
                rows={2}
                value={form.observaciones}
                onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))}
                placeholder="Reacciones, notas..."
                className="campo-entrada resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onCerrar} className="flex-1 boton boton-secundario">Cancelar</button>
              <button type="submit" disabled={mutacion.isPending} className="flex-1 boton boton-primario">
                {mutacion.isPending ? 'Guardando...' : 'Registrar'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  );
}
