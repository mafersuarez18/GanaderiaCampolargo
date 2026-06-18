import { Prisma, PrioridadAlerta } from '@prisma/client';
import { prisma } from '../../compartido/prisma/clientePrisma';
import { ErrorNoEncontrado } from '../../compartido/tipos/respuesta';

export interface FiltrosNotificacion {
  noLeidas?: boolean;
  prioridad?: PrioridadAlerta;
  pagina?: number;
  porPagina?: number;
  limite?: number;
  usuarioId?: string;
}

export async function listarNotificaciones(filtros: FiltrosNotificacion, usuarioIdActual: string) {
  const { noLeidas, prioridad, pagina = 1, porPagina = 20, limite } = filtros;

  const donde: Prisma.NotificacionWhereInput = {
    usuarioId: usuarioIdActual,
    ...(noLeidas !== undefined && { leida: !noLeidas }),
    ...(prioridad && { prioridad }),
  };

  const tomar = limite ? Math.min(limite, 50) : porPagina;

  const [registros, total] = await prisma.$transaction([
    prisma.notificacion.findMany({
      where: donde,
      orderBy: [{ leida: 'asc' }, { creadoEn: 'desc' }],
      skip: limite ? 0 : (pagina - 1) * porPagina,
      take: tomar,
    }),
    prisma.notificacion.count({ where: donde }),
  ]);

  return { registros, total };
}

export async function contarNoLeidas(usuarioId: string): Promise<number> {
  return prisma.notificacion.count({ where: { usuarioId, leida: false } });
}

export async function marcarLeida(id: string, usuarioId: string) {
  const notificacion = await prisma.notificacion.findFirst({
    where: { id, usuarioId },
    select: { id: true },
  });
  if (!notificacion) throw new ErrorNoEncontrado('Notificación no encontrada');

  return prisma.notificacion.update({
    where: { id },
    data: { leida: true, fechaLeida: new Date() },
  });
}

export async function marcarTodasLeidas(usuarioId: string) {
  const resultado = await prisma.notificacion.updateMany({
    where: { usuarioId, leida: false },
    data: { leida: true, fechaLeida: new Date() },
  });
  return { actualizadas: resultado.count };
}

export async function eliminarNotificacion(id: string, usuarioId: string) {
  const notificacion = await prisma.notificacion.findFirst({
    where: { id, usuarioId },
    select: { id: true },
  });
  if (!notificacion) throw new ErrorNoEncontrado('Notificación no encontrada');
  return prisma.notificacion.delete({ where: { id } });
}
