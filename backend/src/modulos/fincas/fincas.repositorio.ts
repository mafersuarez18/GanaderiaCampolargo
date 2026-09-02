import { Prisma, EstadoAnimal } from '@prisma/client';
import { prisma } from '../../compartido/prisma/clientePrisma';

// Acceso a datos puro (consultas Prisma); las reglas de negocio viven en
// fincas.servicio.ts.

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
        _count: { select: { lotes: true } },
      },
      orderBy: { nombre: 'asc' },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    }),
    prisma.finca.count({ where: donde }),
  ]);

  // El conteo de animales ya no es una relación directa de Finca (se alcanza
  // vía Lote), así que se suma aparte por finca.
  const animalesPorFinca = await contarAnimalesPorFinca(registros.map((f) => f.id));
  const registrosConAnimales = registros.map((f) => ({
    ...f,
    _count: { ...f._count, animales: animalesPorFinca.get(f.id) ?? 0 },
  }));

  return { registros: registrosConAnimales, total };
}

async function contarAnimalesPorFinca(fincaIds: string[]): Promise<Map<string, number>> {
  const lotesConConteo = await prisma.lote.findMany({
    where: { fincaId: { in: fincaIds } },
    select: { fincaId: true, _count: { select: { animales: true } } },
  });
  const animalesPorFinca = new Map<string, number>();
  for (const lote of lotesConConteo) {
    animalesPorFinca.set(lote.fincaId, (animalesPorFinca.get(lote.fincaId) ?? 0) + lote._count.animales);
  }
  return animalesPorFinca;
}

export async function obtenerFincaPorId(id: string) {
  const finca = await prisma.finca.findUnique({
    where: { id },
    include: {
      lotes: {
        include: {
          _count: { select: { animales: true } },
        },
        orderBy: { nombre: 'asc' },
      },
      _count: { select: { lotes: true } },
    },
  });
  if (!finca) return null;

  const totalAnimales = finca.lotes.reduce((suma, lote) => suma + lote._count.animales, 0);
  return { ...finca, _count: { ...finca._count, animales: totalAnimales } };
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

export interface FiltrosAnimalesFinca {
  busqueda?: string;
  loteId?: string;
  estado?: EstadoAnimal;
  pagina?: number;
  porPagina?: number;
}

export async function listarAnimalesDeFinca(fincaId: string, filtros: FiltrosAnimalesFinca = {}) {
  const { busqueda, loteId, estado, pagina = 1, porPagina = 50 } = filtros;

  const donde: Prisma.AnimalWhereInput = {
    lote: { fincaId },
    ...(estado ? { estado } : {}),
    ...(loteId ? { loteId } : {}),
    ...(busqueda
      ? {
          OR: [
            { numeroArete: { contains: busqueda, mode: 'insensitive' } },
            { nombre:      { contains: busqueda, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [registros, total] = await prisma.$transaction([
    prisma.animal.findMany({
      where: donde,
      select: {
        id:              true,
        numeroArete:     true,
        nombre:          true,
        sexo:            true,
        estado:          true,
        estadoSanitario: true,
        fechaNacimiento: true,
        pesoActual:      true,
        proposito:       true,
        raza:  { select: { id: true, nombre: true } },
        lote:  { select: { id: true, nombre: true } },
      },
      orderBy: [{ estado: 'asc' }, { numeroArete: 'asc' }],
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    }),
    prisma.animal.count({ where: donde }),
  ]);

  return { registros, total };
}
