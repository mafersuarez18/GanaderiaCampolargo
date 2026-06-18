import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Icono from '../../componentes/ui/Icono';
import { clienteHttp } from '../../servicios/clienteAxios';
import toast from 'react-hot-toast';

const esquemaAnimal = z.object({
  numeroArete:      z.string().min(1, 'El arete es requerido').max(50),
  nombre:           z.string().max(100).optional().or(z.literal('')),
  sexo:             z.enum(['MACHO', 'HEMBRA'], { required_error: 'Seleccione el sexo' }),
  estado:           z.enum(['ACTIVO', 'VENDIDO', 'MUERTO', 'ROBADO', 'TRANSFERIDO']).default('ACTIVO'),
  estadoSanitario:  z.enum(['SANO', 'ENFERMO', 'EN_CUARENTENA', 'FALLECIDO']).default('SANO'),
  proposito:        z.enum(['CARNE', 'LECHE', 'CARNE_LECHE', 'REPRODUCCION', 'TAUROMAQUIA']).optional().or(z.literal('')),
  fechaNacimiento:  z.string().optional().or(z.literal('')),
  peso:             z.coerce.number().positive().optional().or(z.literal('')),
  color:            z.string().max(100).optional().or(z.literal('')),
  descripcion:      z.string().max(1000).optional().or(z.literal('')),
  microchip:        z.string().max(100).optional().or(z.literal('')),
  procedencia:      z.string().max(200).optional().or(z.literal('')),
  fincaId:          z.string().min(1, 'Seleccione una finca válida'),
  loteId:           z.string().min(1).optional().or(z.literal('')),
  razaId:           z.string().min(1).optional().or(z.literal('')),
  padreId:          z.string().min(1).optional().or(z.literal('')),
  madreId:          z.string().min(1).optional().or(z.literal('')),
});

type FormularioAnimal = z.infer<typeof esquemaAnimal>;

async function obtenerAnimal(id: string) {
  const { data } = await clienteHttp.get(`/animales/${id}`);
  return data.datos;
}
async function obtenerFincas() {
  const { data } = await clienteHttp.get('/fincas?porPagina=100');
  return data.datos ?? [];
}
async function obtenerLotesPorFinca(fincaId: string) {
  const { data } = await clienteHttp.get(`/lotes?fincaId=${fincaId}&porPagina=100`);
  return data.datos ?? [];
}
async function obtenerRazas() {
  const { data } = await clienteHttp.get('/animales/razas');
  return data.datos ?? [];
}
async function obtenerAnimalesPorSexo(sexo: 'MACHO' | 'HEMBRA') {
  const { data } = await clienteHttp.get('/animales', {
    params: { sexo, estado: 'ACTIVO', porPagina: 200, ordenPor: 'numeroArete', direccionOrden: 'asc' },
  });
  return data.datos ?? [];
}

export default function PaginaFormAnimal() {
  const { id } = useParams<{ id?: string }>();
  const navegar = useNavigate();
  const cliente = useQueryClient();
  const esEdicion = !!id;

  const { data: animalExistente, isLoading: cargandoAnimal } = useQuery({
    queryKey: ['animal', id],
    queryFn: () => obtenerAnimal(id!),
    enabled: esEdicion,
  });

  const { data: fincas = [] } = useQuery({ queryKey: ['fincas-select'], queryFn: obtenerFincas });
  const { data: razas = [] }  = useQuery({ queryKey: ['razas-select'],  queryFn: obtenerRazas });
  const { data: machos = [] } = useQuery({ queryKey: ['machos-select'], queryFn: () => obtenerAnimalesPorSexo('MACHO') });
  const { data: hembras = [] } = useQuery({ queryKey: ['hembras-select'], queryFn: () => obtenerAnimalesPorSexo('HEMBRA') });

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormularioAnimal>({
    resolver: zodResolver(esquemaAnimal),
    defaultValues: {
      estado: 'ACTIVO',
      estadoSanitario: 'SANO',
    },
  });

  const fincaSeleccionada = watch('fincaId');

  const { data: lotes = [] } = useQuery({
    queryKey: ['lotes-finca', fincaSeleccionada],
    queryFn: () => obtenerLotesPorFinca(fincaSeleccionada),
    enabled: !!fincaSeleccionada,
  });

  // Pre-rellenar formulario en modo edición
  useEffect(() => {
    if (animalExistente) {
      reset({
        numeroArete:     animalExistente.numeroArete,
        nombre:          animalExistente.nombre ?? '',
        sexo:            animalExistente.sexo,
        estado:          animalExistente.estado,
        estadoSanitario: animalExistente.estadoSanitario,
        proposito:       animalExistente.proposito ?? '',
        fechaNacimiento: animalExistente.fechaNacimiento?.split('T')[0] ?? '',
        peso:            animalExistente.peso ?? '',
        color:           animalExistente.color ?? '',
        descripcion:     animalExistente.descripcion ?? '',
        microchip:       animalExistente.microchip ?? '',
        procedencia:     animalExistente.procedencia ?? '',
        fincaId:         animalExistente.finca?.id ?? '',
        loteId:          animalExistente.lote?.id ?? '',
        razaId:          animalExistente.raza?.id ?? '',
        padreId:         animalExistente.padre?.id ?? '',
        madreId:         animalExistente.madre?.id ?? '',
      });
    }
  }, [animalExistente, reset]);

  const mutacion = useMutation({
    mutationFn: async (datos: FormularioAnimal) => {
      // Limpiar campos vacíos
      const payload = Object.fromEntries(
        Object.entries(datos).filter(([, v]) => v !== '' && v !== undefined && v !== null)
      );
      if (esEdicion) {
        const { data } = await clienteHttp.patch(`/animales/${id}`, payload);
        return data.datos;
      }
      const { data } = await clienteHttp.post('/animales', payload);
      return data.datos;
    },
    onSuccess: (animal) => {
      cliente.invalidateQueries({ queryKey: ['animales'] });
      cliente.invalidateQueries({ queryKey: ['animal', id] });
      toast.success(esEdicion ? 'Animal actualizado correctamente' : 'Animal registrado correctamente');
      navegar(`/animales/${animal.id}`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.mensaje ?? 'Error al guardar el animal');
    },
  });

  if (esEdicion && cargandoAnimal) {
    return (
      <div className="flex items-center justify-center py-20">
        <Icono nombre="progress_activity" clase="text-[24px] animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl space-y-5"
    >
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <button onClick={() => navegar(-1)} className="p-2 hover:bg-surface-container rounded-xl transition-colors">
          <Icono nombre="arrow_back" clase="text-[20px] text-on-surface-variant" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-[var(--color-piedra-900)]">
            {esEdicion ? 'Editar animal' : 'Registrar nuevo animal'}
          </h1>
          <p className="text-xs text-[var(--color-piedra-500)]">
            {esEdicion ? `Editando: ${animalExistente?.nombre ?? `#${animalExistente?.numeroArete}`}` : 'Complete los datos del animal'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit((datos) => mutacion.mutate(datos))} className="space-y-5">

        {/* Datos básicos */}
        <SeccionFormulario titulo="Identificación">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CampoForm etiqueta="Número de arete *" error={errors.numeroArete?.message}>
              <input
                {...register('numeroArete')}
                placeholder="Ej: A-2025-001"
                className="campo-entrada"
                disabled={esEdicion}
              />
            </CampoForm>
            <CampoForm etiqueta="Nombre" error={errors.nombre?.message}>
              <input
                {...register('nombre')}
                placeholder="Nombre opcional"
                className="campo-entrada"
              />
            </CampoForm>
            <CampoForm etiqueta="Sexo *" error={errors.sexo?.message}>
              <select {...register('sexo')} className="campo-entrada">
                <option value="">Seleccionar...</option>
                <option value="MACHO">Macho</option>
                <option value="HEMBRA">Hembra</option>
              </select>
            </CampoForm>
            <CampoForm etiqueta="Raza" error={errors.razaId?.message}>
              <select {...register('razaId')} className="campo-entrada">
                <option value="">Sin raza específica</option>
                {razas.map((r: any) => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
              </select>
            </CampoForm>
            <CampoForm etiqueta="Color / Pelaje">
              <input {...register('color')} placeholder="Ej: Pardo oscuro" className="campo-entrada" />
            </CampoForm>
            <CampoForm etiqueta="Microchip">
              <input {...register('microchip')} placeholder="Código del microchip" className="campo-entrada" />
            </CampoForm>
          </div>
        </SeccionFormulario>

        {/* Estado */}
        <SeccionFormulario titulo="Estado">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <CampoForm etiqueta="Estado del animal" error={errors.estado?.message}>
              <select {...register('estado')} className="campo-entrada">
                <option value="ACTIVO">Activo</option>
                <option value="VENDIDO">Vendido</option>
                <option value="MUERTO">Muerto</option>
                <option value="ROBADO">Robado</option>
                <option value="TRANSFERIDO">Transferido</option>
              </select>
            </CampoForm>
            <CampoForm etiqueta="Estado sanitario" error={errors.estadoSanitario?.message}>
              <select {...register('estadoSanitario')} className="campo-entrada">
                <option value="SANO">Sano</option>
                <option value="ENFERMO">Enfermo</option>
                <option value="EN_CUARENTENA">En cuarentena</option>
                <option value="FALLECIDO">Fallecido</option>
              </select>
            </CampoForm>
            <CampoForm etiqueta="Propósito">
              <select {...register('proposito')} className="campo-entrada">
                <option value="">No definido</option>
                <option value="CARNE">Carne</option>
                <option value="LECHE">Leche</option>
                <option value="CARNE_LECHE">Carne y Leche</option>
                <option value="REPRODUCCION">Reproducción</option>
                <option value="TAUROMAQUIA">Tauromaquia</option>
              </select>
            </CampoForm>
          </div>
        </SeccionFormulario>

        {/* Datos físicos */}
        <SeccionFormulario titulo="Datos físicos">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CampoForm etiqueta="Fecha de nacimiento">
              <input type="date" {...register('fechaNacimiento')} className="campo-entrada" />
            </CampoForm>
            <CampoForm etiqueta="Peso (kg)">
              <input
                type="number"
                step="0.1"
                {...register('peso')}
                placeholder="Ej: 350.5"
                className="campo-entrada"
              />
            </CampoForm>
            <CampoForm etiqueta="Procedencia">
              <input {...register('procedencia')} placeholder="Ej: Finca La Esperanza" className="campo-entrada" />
            </CampoForm>
          </div>
        </SeccionFormulario>

        {/* Ubicación */}
        <SeccionFormulario titulo="Ubicación">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CampoForm etiqueta="Finca *" error={errors.fincaId?.message}>
              <select {...register('fincaId')} className="campo-entrada">
                <option value="">Seleccionar finca...</option>
                {fincas.map((f: any) => (
                  <option key={f.id} value={f.id}>{f.nombre}</option>
                ))}
              </select>
            </CampoForm>
            <CampoForm etiqueta="Lote" error={errors.loteId?.message}>
              <select {...register('loteId')} className="campo-entrada" disabled={!fincaSeleccionada}>
                <option value="">Sin lote asignado</option>
                {lotes.map((l: any) => (
                  <option key={l.id} value={l.id}>{l.nombre}</option>
                ))}
              </select>
            </CampoForm>
          </div>
        </SeccionFormulario>

        {/* Genealogía */}
        <SeccionFormulario titulo="Genealogía">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CampoForm etiqueta="Padre (macho)" error={errors.padreId?.message}>
              <select {...register('padreId')} className="campo-entrada">
                <option value="">Sin padre registrado</option>
                {(machos as any[])
                  .filter((m: any) => m.id !== id)
                  .map((m: any) => (
                    <option key={m.id} value={m.id}>
                      #{m.numeroArete}{m.nombre ? ` — ${m.nombre}` : ''}
                    </option>
                  ))}
              </select>
            </CampoForm>
            <CampoForm etiqueta="Madre (hembra)" error={errors.madreId?.message}>
              <select {...register('madreId')} className="campo-entrada">
                <option value="">Sin madre registrada</option>
                {(hembras as any[])
                  .filter((h: any) => h.id !== id)
                  .map((h: any) => (
                    <option key={h.id} value={h.id}>
                      #{h.numeroArete}{h.nombre ? ` — ${h.nombre}` : ''}
                    </option>
                  ))}
              </select>
            </CampoForm>
          </div>
          <p className="text-xs text-outline mt-2 flex items-center gap-1.5">
            <Icono nombre="info" clase="text-[13px]" />
            Solo aparecen animales activos. Si los padres no están en el sistema, déjelo en blanco.
          </p>
        </SeccionFormulario>

        {/* Observaciones */}
        <SeccionFormulario titulo="Observaciones">
          <CampoForm etiqueta="Notas adicionales">
            <textarea
              {...register('descripcion')}
              rows={3}
              placeholder="Observaciones, características especiales..."
              className="campo-entrada resize-none"
            />
          </CampoForm>
        </SeccionFormulario>

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link to="/animales" className="boton boton-secundario">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || mutacion.isPending}
            className="boton boton-primario gap-2"
          >
            {(isSubmitting || mutacion.isPending) ? (
              <>
                <Icono nombre="progress_activity" clase="text-[16px] animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Icono nombre="save" clase="text-[16px]" />
                {esEdicion ? 'Guardar cambios' : 'Registrar animal'}
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

function SeccionFormulario({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="tarjeta p-5">
      <h2 className="text-sm font-semibold text-[var(--color-piedra-700)] mb-4 pb-2 border-b border-[var(--color-piedra-100)]">
        {titulo}
      </h2>
      {children}
    </div>
  );
}

function CampoForm({ etiqueta, error, children }: { etiqueta: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--color-piedra-600)] mb-1.5">
        {etiqueta}
      </label>
      {children}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 text-xs mt-1"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
