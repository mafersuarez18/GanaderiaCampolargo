import { Sexo, EstadoAnimal, TipoPropositoAnimal, EstadoSanitario } from '@prisma/client';
import {
  listarAnimales,
  obtenerAnimalPorId,
  obtenerAnimalPorArete,
  crearAnimal,
  actualizarAnimal,
  eliminarAnimal,
  existeAreteRegistrado,
  listarRazas,
  existeRazaRegistrada,
  crearRaza,
  contarVacunacionesPorAnimal,
  FiltrosAnimal,
} from './animales.repositorio';
import {
  ErrorNoEncontrado,
  ErrorConflicto,
  ErrorValidacionDatos,
} from '../../compartido/tipos/respuesta';

// Reglas de negocio del módulo de animales: unicidad de arete, coherencia
// de sexo entre padre/madre y cría, y protección contra el borrado de
// animales que ya tienen historial médico o reproductivo asociado.

export async function servicioListarAnimales(filtros: FiltrosAnimal) {
  return listarAnimales(filtros);
}

export async function servicioObtenerAnimal(id: string) {
  const animal = await obtenerAnimalPorId(id);
  if (!animal) throw new ErrorNoEncontrado(`Animal con id '${id}' no encontrado`);
  const registrosVacunacion = await contarVacunacionesPorAnimal(id);
  return {
    ...animal,
    _count: { ...animal._count, registrosVacunacion },
  };
}

export async function servicioObtenerAnimalPorArete(numeroArete: string) {
  const animal = await obtenerAnimalPorArete(numeroArete);
  if (!animal) throw new ErrorNoEncontrado(`Animal con arete '${numeroArete}' no encontrado`);
  return animal;
}

export interface DatosCrearAnimal {
  numeroArete:    string;
  nombre?:        string;
  sexo:           Sexo;
  proposito:      TipoPropositoAnimal;
  estado?:        EstadoAnimal;
  estadoSanitario?: EstadoSanitario;
  fechaNacimiento?: Date;
  pesoActual?:    number;
  color?:         string;
  marcas?:        string;
  observaciones?: string;
  procedencia?:   string;
  loteId:         string;
  razaId:         string;
  padreId?:       string;
  madreId?:       string;
}

export async function servicioCrearAnimal(datos: DatosCrearAnimal) {
  if (await existeAreteRegistrado(datos.numeroArete)) {
    throw new ErrorConflicto(`Ya existe un animal registrado con el arete '${datos.numeroArete}'`);
  }

  if (datos.padreId) {
    const padre = await obtenerAnimalPorId(datos.padreId);
    if (!padre) throw new ErrorValidacionDatos('El padre especificado no existe');
    if (padre.sexo !== 'MACHO') throw new ErrorValidacionDatos('El padre debe ser de sexo MACHO');
  }

  if (datos.madreId) {
    const madre = await obtenerAnimalPorId(datos.madreId);
    if (!madre) throw new ErrorValidacionDatos('La madre especificada no existe');
    if (madre.sexo !== 'HEMBRA') throw new ErrorValidacionDatos('La madre debe ser de sexo HEMBRA');
  }

  const { loteId, razaId, padreId, madreId, ...resto } = datos;

  return crearAnimal({
    ...resto,
    lote:  { connect: { id: loteId } },
    raza:  { connect: { id: razaId } },
    ...(padreId && { padre: { connect: { id: padreId } } }),
    ...(madreId && { madre: { connect: { id: madreId } } }),
  });
}

export type DatosActualizarAnimal = Partial<Omit<DatosCrearAnimal, 'numeroArete'>> & {
  estado?: EstadoAnimal;
  motivoEgreso?: string;
  fechaEgreso?: Date;
};

export async function servicioActualizarAnimal(
  id: string,
  datos: DatosActualizarAnimal & { numeroArete?: string },
) {
  const animal = await obtenerAnimalPorId(id);
  if (!animal) throw new ErrorNoEncontrado(`Animal con id '${id}' no encontrado`);

  if (datos.numeroArete && datos.numeroArete !== animal.numeroArete) {
    if (await existeAreteRegistrado(datos.numeroArete, id)) {
      throw new ErrorConflicto(`Ya existe un animal con el arete '${datos.numeroArete}'`);
    }
  }

  const { loteId, razaId, padreId, madreId, ...resto } = datos;

  return actualizarAnimal(id, {
    ...resto,
    ...(razaId  !== undefined && { raza: razaId ? { connect: { id: razaId } } : undefined }),
    ...(loteId  !== undefined && loteId && { lote: { connect: { id: loteId } } }),
    ...(padreId !== undefined && { padre: padreId ? { connect: { id: padreId } } : { disconnect: true } }),
    ...(madreId !== undefined && { madre: madreId ? { connect: { id: madreId } } : { disconnect: true } }),
  });
}

export async function servicioEliminarAnimal(id: string) {
  const animal = await obtenerAnimalPorId(id);
  if (!animal) throw new ErrorNoEncontrado(`Animal con id '${id}' no encontrado`);

  const tieneHistorial =
    animal._count.historialesMedicos > 0 ||
    animal._count.eventosReproductivos > 0;

  if (tieneHistorial) {
    throw new ErrorValidacionDatos(
      `No se puede eliminar el animal '${animal.numeroArete}' porque tiene registros médicos o reproductivos. ` +
      `Cambie su estado a VENDIDO o MUERTO en su lugar.`,
    );
  }

  return eliminarAnimal(id);
}

export async function servicioListarRazas() {
  return listarRazas();
}

export interface DatosCrearRaza {
  nombre:    string;
  tipoCruce: string;
  origen?:   string;
}

export async function servicioCrearRaza(datos: DatosCrearRaza) {
  if (await existeRazaRegistrada(datos.nombre)) {
    throw new ErrorConflicto(`Ya existe una raza llamada '${datos.nombre}'`);
  }
  return crearRaza(datos);
}
