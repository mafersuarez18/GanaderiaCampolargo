import { Prisma } from '@prisma/client';
import { prisma } from '../../compartido/prisma/clientePrisma';

export interface FiltrosFinca {
  busqueda?: string;
  pagina?: number;
  porPagina?: number;
}

export async function listarFincas(filtros: FiltrosFinca = {}) {
  const { busqueda, pagina = 1, porPagina = 20 } = filtros;

  const donde: Prisma.FincaWhereInput = busqueda
    ? {
        OR: [
          { nombre:    { contains: busqueda, mode: 'insensitive' } },
          { municipio: { contains: busqueda, mode: 'insensitive' } },
          { estado:    { contains: busqueda, mode: 'insensitive' } },
        ],
      }
    : {};

  const [registros, total] = await prisma.$transaction([
    prisma.finca.findMany({
      where: donde,
      include: {
        _count: {
          select: {
            lotes:    true,
            animales: true,
          },
        },
      },
      orderBy: { nombre: 'asc' },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    }),
    prisma.finca.count({ where: donde }),
  ]);

  return { registros, total };
}

export async function obtenerFincaPorId(id: string) {
  return prisma.finca.findUnique({
    where: { id },
    include: {
      lotes: {
        include: {
          _count: { select: { animales: true } },
        },
        orderBy: { nombre: 'asc' },
      },
      _count: {
        select: { lotes: true, animales: true },
      },
    },
  });
}

export async function crearFinca(datos: Prisma.FincaCreateInput) {
  return prisma.finca.create({ data: datos });
}

export async function actualizarFinca(id: string, datos: Prisma.FincaUpdateInput) {
  return prisma.finca.update({ where: { id }, data: datos });
}

export async function eliminarFinca(id: string) {
  return prisma.finca.delete({ where: { id } });
}

export async function existeFincaConNombre(nombre: string, excluirId?: string) {
  const finca = await prisma.finca.findFirst({
    where: {
      nombre: { equals: nombre, mode: 'insensitive' },
      ...(excluirId ? { id: { not: excluirId } } : {}),
    },
    select: { id: true },
  });
  return !!finca;
}
