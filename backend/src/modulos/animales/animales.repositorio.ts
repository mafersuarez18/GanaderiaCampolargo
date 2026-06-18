import { Prisma, EstadoAnimal, Sexo } from '@prisma/client';
import { prisma } from '../../compartido/prisma/clientePrisma';

export interface FiltrosAnimal {
  busqueda?: string;
  fincaId?: string;
  loteId?: string;
  razaId?: string;
  sexo?: Sexo;
  estado?: EstadoAnimal;
  pagina?: number;
  porPagina?: number;
  ordenPor?: 'numeroArete' | 'nombre' | 'fechaNacimiento' | 'creadoEn';
  direccionOrden?: 'asc' | 'desc';
}

const seleccionListado = {
  id: true,
  numeroArete: true,
  nombre: true,
  sexo: true,
  estado: true,
  estadoSanitario: true,
  fechaNacimiento: true,
  proposito: true,
  pesoActual: true,
  color: true,
  raza: { select: { id: true, nombre: true } },
  finca: { select: { id: true, nombre: true } },
  lote:  { select: { id: true, nombre: true } },
  creadoEn: true,
} satisfies Prisma.AnimalSelect;

const seleccionDetalle = {
  ...seleccionListado,
  marcas: true,
  observaciones: true,
  fechaIngreso: true,
  fechaEgreso: true,
  motivoEgreso: true,
  padre: { select: { id: true, numeroArete: true, nombre: true } },
  madre: { select: { id: true, numeroArete: true, nombre: true } },
  _count: {
    select: {
      historialesMedicos: true,
      eventosReproductivos: true,
    },
  },
  actualizadoEn: true,
} satisfies Prisma.AnimalSelect;

export async function listarAnimales(filtros: FiltrosAnimal = {}) {
  const {
    busqueda,
    fincaId,
    loteId,
    razaId,
    sexo,
    estado,
    pagina = 1,
    porPagina = 20,
    ordenPor = 'creadoEn',
    direccionOrden = 'desc',
  } = filtros;

  const donde: Prisma.AnimalWhereInput = {
    ...(busqueda && {
      OR: [
        { numeroArete: { contains: busqueda, mode: 'insensitive' } },
        { nombre:      { contains: busqueda, mode: 'insensitive' } },
        { color:       { contains: busqueda, mode: 'insensitive' } },
      ],
    }),
    ...(fincaId  && { fincaId }),
    ...(loteId   && { loteId }),
    ...(razaId   && { razaId }),
    ...(sexo     && { sexo }),
    ...(estado   && { estado }),
  };

  const [registros, total] = await prisma.$transaction([
    prisma.animal.findMany({
      where: donde,
      select: seleccionListado,
      orderBy: { [ordenPor]: direccionOrden },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    }),
    prisma.animal.count({ where: donde }),
  ]);

  return { registros, total };
}

export async function obtenerAnimalPorId(id: string) {
  return prisma.animal.findUnique({
    where: { id },
    select: seleccionDetalle,
  });
}

export async function obtenerAnimalPorArete(numeroArete: string) {
  return prisma.animal.findUnique({
    where: { numeroArete },
    select: seleccionDetalle,
  });
}

export async function crearAnimal(datos: Prisma.AnimalCreateInput) {
  return prisma.animal.create({ data: datos, select: seleccionDetalle });
}

export async function actualizarAnimal(id: string, datos: Prisma.AnimalUpdateInput) {
  return prisma.animal.update({ where: { id }, data: datos, select: seleccionDetalle });
}

export async function eliminarAnimal(id: string) {
  return prisma.animal.delete({ where: { id } });
}

export async function existeAreteRegistrado(numeroArete: string, excluirId?: string) {
  const animal = await prisma.animal.findFirst({
    where: {
      numeroArete: { equals: numeroArete, mode: 'insensitive' },
      ...(excluirId ? { id: { not: excluirId } } : {}),
    },
    select: { id: true },
  });
  return !!animal;
}

export async function listarRazas() {
  return prisma.raza.findMany({ orderBy: { nombre: 'asc' } });
}
