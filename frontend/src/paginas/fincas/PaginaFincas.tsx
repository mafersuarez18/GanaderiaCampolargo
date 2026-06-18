import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { clienteHttp } from '../../servicios/clienteAxios';
import { useAutenticacion } from '../../hooks/useAutenticacion';
import { ModalConfirmacion } from '../../componentes/ui/Modal';
import Icono from '../../componentes/ui/Icono';
import toast from 'react-hot-toast';

interface Finca {
  id: string;
  nombre: string;
  municipio: string;
  estado: string;
  hectareas?: number;
  latitudCentro?: number;
  longitudCentro?: number;
  _count: { lotes: number; potreros: number; animales: number };
}

interface FormFinca {
  nombre: string;
  municipio: string;
  estado: string;
  hectareas: string;
  latitudCentro: string;
  longitudCentro: string;
}

const ESTADOS_VENEZUELA = [
  'Amazonas','Anzoátegui','Apure','Aragua','Barinas','Bolívar','Carabobo',
  'Cojedes','Delta Amacuro','Falcón','Guárico','Lara','Mérida','Miranda',
  'Monagas','Nueva Esparta','Portuguesa','Sucre','Táchira','Trujillo',
  'Vargas','Yaracuy','Zulia','Distrito Capital',
];

async function obtenerFincas(): Promise<{ datos: Finca[] }> {
  const { data } = await clienteHttp.get('/fincas?porPagina=100');
  return data;
}

export default function PaginaFincas() {
  const { esAdministrador } = useAutenticacion();
  const cliente = useQueryClient();
  const [fincaEliminar, setFincaEliminar] = useState<Finca | null>(null);
  const [fincaEditar,   setFincaEditar]   = useState<Finca | null>(null);
  const [modalCrear,    setModalCrear]    = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ['fincas'], queryFn: obtenerFincas });
  const fincas = data?.datos ?? [];

  const totalAnimales = fincas.reduce((s, f) => s + f._count.animales, 0);
  const totalHa = fincas.reduce((s, f) => s + (f.hectareas ?? 0), 0);

  const mutacionEliminar = useMutation({
    mutationFn: (id: string) => clienteHttp.delete(`/fincas/${id}`),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: ['fincas'] });
      toast.success('Finca eliminada correctamente');
      setFincaEliminar(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.mensaje ?? 'No se pudo eliminar la finca');
    },
  });

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="tarjeta-vidrio rounded-2xl p-5">
          <div className="p-3 bg-primary/10 rounded-xl w-fit mb-4">
            <Icono nombre="home_work" relleno clase="text-[22px] text-primary" />
          </div>
          <p className="text-3xl font-bold text-on-surface">{isLoading ? '—' : fincas.length}</p>
          <p className="text-sm text-on-surface-variant mt-1">Fincas registradas</p>
        </div>
        <div className="tarjeta-vidrio rounded-2xl p-5">
          <div className="p-3 bg-tertiary/10 rounded-xl w-fit mb-4">
            <Icono nombre="pets" relleno clase="text-[22px] text-tertiary" />
          </div>
          <p className="text-3xl font-bold text-on-surface">{isLoading ? '—' : totalAnimales.toLocaleString('es-VE')}</p>
          <p className="text-sm text-on-surface-variant mt-1">Total de animales</p>
        </div>
        <div className="tarjeta-vidrio rounded-2xl p-5">
          <div className="p-3 bg-secondary/10 rounded-xl w-fit mb-4">
            <Icono nombre="landscape" relleno clase="text-[22px] text-secondary" />
          </div>
          <p className="text-3xl font-bold text-on-surface">
            {isLoading ? '—' : totalHa ? totalHa.toLocaleString('es-VE') : '—'}
          </p>
          <p className="text-sm text-on-surface-variant mt-1">Hectáreas totales</p>
        </div>
      </div>

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
          Todas las fincas
        </p>
        {esAdministrador && (
          <button
            onClick={() => setModalCrear(true)}
            className="boton boton-primario gap-2 text-sm"
          >
            <Icono nombre="add" clase="text-[18px]" />
            Nueva finca
          </button>
        )}
      </div>

      {/* Grid de fincas */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-52 rounded-2xl bg-surface-container animate-pulse" />
          ))}
        </div>
      ) : !fincas.length ? (
        <div className="tarjeta-vidrio rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-container mx-auto mb-4 flex items-center justify-center">
            <Icono nombre="home_work" clase="text-[32px] text-outline" />
          </div>
          <p className="font-medium text-on-surface-variant">Sin fincas registradas</p>
          {esAdministrador && (
            <button
              onClick={() => setModalCrear(true)}
              className="boton boton-primario mt-4 text-sm gap-2"
            >
              <Icono nombre="add" clase="text-[18px]" />
              Nueva finca
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fincas.map((finca, idx) => (
            <motion.div
              key={finca.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.07 }}
            >
              <TarjetaFinca
                finca={finca}
                puedeEditar={esAdministrador}
                alEditar={() => setFincaEditar(finca)}
                alEliminar={() => setFincaEliminar(finca)}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal: Crear finca */}
      <AnimatePresence>
        {modalCrear && (
          <ModalFinca
            modo="crear"
            onCerrar={() => setModalCrear(false)}
            onExito={() => {
              cliente.invalidateQueries({ queryKey: ['fincas'] });
              setModalCrear(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Modal: Editar finca */}
      <AnimatePresence>
        {fincaEditar && (
          <ModalFinca
            modo="editar"
            finca={fincaEditar}
            onCerrar={() => setFincaEditar(null)}
            onExito={() => {
              cliente.invalidateQueries({ queryKey: ['fincas'] });
              setFincaEditar(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Modal: Confirmación eliminar */}
      <ModalConfirmacion
        abierto={!!fincaEliminar}
        alCerrar={() => setFincaEliminar(null)}
        alConfirmar={() => fincaEliminar && mutacionEliminar.mutate(fincaEliminar.id)}
        titulo={`¿Eliminar finca "${fincaEliminar?.nombre}"?`}
        descripcion="Esta acción es irreversible y eliminará todos los lotes y potreros asociados."
        textoConfirmar="Sí, eliminar"
        variante="peligro"
        cargando={mutacionEliminar.isPending}
      />
    </motion.div>
  );
}

// ── Tarjeta de finca ──────────────────────────────────────────────────────────

function TarjetaFinca({ finca, puedeEditar, alEditar, alEliminar }: {
  finca: Finca;
  puedeEditar: boolean;
  alEditar: () => void;
  alEliminar: () => void;
}) {
  return (
    <div className="tarjeta-vidrio rounded-2xl p-5 flex flex-col gap-4 group hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl flex-shrink-0">
            <Icono nombre="home_work" relleno clase="text-[20px] text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-on-surface">{finca.nombre}</h3>
            <div className="flex items-center gap-1 mt-1 text-xs text-on-surface-variant">
              <Icono nombre="location_on" clase="text-[14px] text-outline" />
              {finca.municipio}, {finca.estado}
            </div>
          </div>
        </div>
        {puedeEditar && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={alEditar}
              className="p-1.5 hover:bg-surface-container rounded-lg transition-colors"
              title="Editar"
            >
              <Icono nombre="edit" clase="text-[16px] text-on-surface-variant hover:text-primary" />
            </button>
            <button
              onClick={alEliminar}
              className="p-1.5 hover:bg-error-container rounded-lg transition-colors"
              title="Eliminar"
            >
              <Icono nombre="delete" clase="text-[16px] text-on-surface-variant hover:text-error" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { ico: 'pets',     val: finca._count.animales, et: 'Animales', col: 'text-primary',   bg: 'bg-primary/8' },
          { ico: 'grid_view',val: finca._count.lotes,    et: 'Lotes',    col: 'text-secondary', bg: 'bg-secondary/8' },
          { ico: 'map',      val: finca._count.potreros, et: 'Potreros', col: 'text-tertiary',  bg: 'bg-tertiary/8' },
        ].map(({ ico, val, et, col, bg }) => (
          <div key={et} className={`${bg} rounded-xl p-2.5 text-center`}>
            <Icono nombre={ico} clase={`text-[16px] ${col} mx-auto mb-1`} />
            <p className="text-base font-bold text-on-surface">{val}</p>
            <p className="text-[10px] text-on-surface-variant">{et}</p>
          </div>
        ))}
      </div>

      {finca.hectareas && (
        <div className="pt-3 border-t border-outline-variant/20 flex items-center gap-2">
          <Icono nombre="straighten" clase="text-[14px] text-outline" />
          <p className="text-xs text-on-surface-variant">
            <strong className="text-on-surface font-semibold">
              {finca.hectareas.toLocaleString('es-VE')}
            </strong>{' '}
            hectáreas
          </p>
          {finca.latitudCentro && (
            <span className="ml-auto text-[10px] text-primary flex items-center gap-0.5">
              <Icono nombre="my_location" clase="text-[12px]" />
              GPS
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Modal crear / editar finca ────────────────────────────────────────────────

function ModalFinca({
  modo, finca, onCerrar, onExito,
}: {
  modo: 'crear' | 'editar';
  finca?: Finca;
  onCerrar: () => void;
  onExito: () => void;
}) {
  const [form, setForm] = useState<FormFinca>({
    nombre:         finca?.nombre         ?? '',
    municipio:      finca?.municipio      ?? '',
    estado:         finca?.estado         ?? 'Yaracuy',
    hectareas:      finca?.hectareas != null ? String(finca.hectareas) : '',
    latitudCentro:  finca?.latitudCentro  != null ? String(finca.latitudCentro)  : '',
    longitudCentro: finca?.longitudCentro != null ? String(finca.longitudCentro) : '',
  });
  const [error, setError] = useState('');

  const mutacion = useMutation({
    mutationFn: (datos: FormFinca) => {
      const payload: Record<string, unknown> = {
        nombre:    datos.nombre.trim(),
        municipio: datos.municipio.trim(),
        estado:    datos.estado,
        ...(datos.hectareas      && { hectareas:      Number(datos.hectareas) }),
        ...(datos.latitudCentro  && { latitudCentro:  Number(datos.latitudCentro) }),
        ...(datos.longitudCentro && { longitudCentro: Number(datos.longitudCentro) }),
      };
      if (modo === 'crear') {
        return clienteHttp.post('/fincas', payload);
      }
      return clienteHttp.patch(`/fincas/${finca!.id}`, payload);
    },
    onSuccess: () => {
      toast.success(modo === 'crear' ? 'Finca creada correctamente' : 'Finca actualizada correctamente');
      onExito();
    },
    onError: (err: any) => {
      setError(err?.response?.data?.mensaje ?? 'Error al guardar la finca');
    },
  });

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
              <Icono nombre="home_work" relleno clase="text-[20px] text-primary" />
              {modo === 'crear' ? 'Registrar nueva finca' : `Editar: ${finca?.nombre}`}
            </h2>
            <button onClick={onCerrar} className="p-2 hover:bg-surface-container rounded-xl transition-colors">
              <Icono nombre="close" clase="text-[20px] text-on-surface-variant" />
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.nombre.trim())    { setError('El nombre es requerido'); return; }
              if (!form.municipio.trim()) { setError('El municipio es requerido'); return; }
              if (!form.estado)           { setError('El estado es requerido'); return; }
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
                Nombre de la finca <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej: Finca La Esperanza"
                className="campo-entrada"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  Municipio <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={form.municipio}
                  onChange={(e) => setForm((f) => ({ ...f, municipio: e.target.value }))}
                  placeholder="Ej: Bruzual"
                  className="campo-entrada"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  Estado <span className="text-error">*</span>
                </label>
                <select
                  value={form.estado}
                  onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value }))}
                  className="campo-entrada"
                >
                  <option value="">Seleccionar...</option>
                  {ESTADOS_VENEZUELA.map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                Superficie (hectáreas)
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.hectareas}
                onChange={(e) => setForm((f) => ({ ...f, hectareas: e.target.value }))}
                placeholder="Ej: 1500"
                className="campo-entrada"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  Latitud (GPS)
                </label>
                <input
                  type="number"
                  step="any"
                  value={form.latitudCentro}
                  onChange={(e) => setForm((f) => ({ ...f, latitudCentro: e.target.value }))}
                  placeholder="Ej: 9.4167"
                  className="campo-entrada"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  Longitud (GPS)
                </label>
                <input
                  type="number"
                  step="any"
                  value={form.longitudCentro}
                  onChange={(e) => setForm((f) => ({ ...f, longitudCentro: e.target.value }))}
                  placeholder="Ej: -68.5833"
                  className="campo-entrada"
                />
              </div>
            </div>

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
                  <>
                    <Icono nombre="progress_activity" clase="text-[16px] animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Icono nombre="save" clase="text-[16px]" />
                    {modo === 'crear' ? 'Registrar finca' : 'Guardar cambios'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  );
}
