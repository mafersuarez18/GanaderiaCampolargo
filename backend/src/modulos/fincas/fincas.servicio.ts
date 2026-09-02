import {
  listarFincas,
  obtenerFincaPorId,
  crearFinca,
  actualizarFinca,
  eliminarFinca,
  existeFincaConNombre,
  listarAnimalesDeFinca,
  FiltrosFinca,
  FiltrosAnimalesFinca,
} from './fincas.repositorio';
import {
  ErrorNoEncontrado,
  ErrorConflicto,
  ErrorValidacionDatos,
} from '../../compartido/tipos/respuesta';

// Reglas de negocio del módulo de fincas: nombre único y protección contra
// el borrado de una finca que todavía tiene animales en alguno de sus lotes.

export async function servicioListarFincas(filtros: FiltrosFinca) {
  return listarFincas(filtros);
}

export async function servicioObtenerFinca(id: string) {
  const finca = await obtenerFincaPorId(id);
  if (!finca) throw new ErrorNoEncontrado(`Finca con id '${id}' no encontrada`);
  return finca;
}

export interface DatosCrearFinca {
  nombre: string;
  municipio: string;
  estado: string;
  hectareas?: number;
  latitudCentro?: number;
  longitudCentro?: number;
  descripcion?: string;
  direccion?: string;
}

export async function servicioCrearFinca(datos: DatosCrearFinca) {
  if (await existeFincaConNombre(datos.nombre)) {
    throw new ErrorConflicto(`Ya existe una finca con el nombre '${datos.nombre}'`);
  }
  return crearFinca(datos);
}

export interface DatosActualizarFinca extends Partial<DatosCrearFinca> {}

export async function servicioActualizarFinca(id: string, datos: DatosActualizarFinca) {
  const finca = await obtenerFincaPorId(id);
  if (!finca) throw new ErrorNoEncontrado(`Finca con id '${id}' no encontrada`);

  if (datos.nombre && datos.nombre !== finca.nombre) {
    if (await existeFincaConNombre(datos.nombre, id)) {
      throw new ErrorConflicto(`Ya existe una finca con el nombre '${datos.nombre}'`);
    }
  }

  return actualizarFinca(id, datos);
}

export async function servicioEliminarFinca(id: string) {
  const finca = await obtenerFincaPorId(id);
  if (!finca) throw new ErrorNoEncontrado(`Finca con id '${id}' no encontrada`);

  if (finca._count.animales > 0) {
    throw new ErrorValidacionDatos(
      `No se puede eliminar la finca '${finca.nombre}' porque tiene ${finca._count.animales} animal(es) asociado(s)`,
    );
  }

  return eliminarFinca(id);
}

export async function servicioListarAnimalesFinca(fincaId: string, filtros: FiltrosAnimalesFinca) {
  const finca = await obtenerFincaPorId(fincaId);
  if (!finca) throw new ErrorNoEncontrado(`Finca con id '${fincaId}' no encontrada`);
  return listarAnimalesDeFinca(fincaId, filtros);
}
