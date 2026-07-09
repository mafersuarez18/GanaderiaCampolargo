import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrioridadAlerta } from '@prisma/client';
import {
  listarNotificaciones,
  contarNoLeidas,
  marcarLeida,
  marcarTodasLeidas,
  eliminarNotificacion,
} from './notificaciones.servicio';
import {
  respuestaExito,
  respuestaListado,
  respuestaSinContenido,
} from '../../compartido/utilidades/respuestaHttp';
import { calcularPaginacion, construirMeta } from '../../compartido/utilidades/paginacion';

const esquemaFiltros = z.object({
  noLeidas:  z.coerce.boolean().optional(),
  prioridad: z.nativeEnum(PrioridadAlerta).optional(),
  pagina:    z.coerce.number().int().positive().default(1),
  porPagina: z.coerce.number().int().positive().max(100).default(20),
  limite:    z.coerce.number().int().positive().max(50).optional(),
});

export async function controladorListarNotificaciones(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const filtros = esquemaFiltros.parse(req.query);
    const usuarioId = req.usuarioActual!.id;
    const { registros, total } = await listarNotificaciones(filtros, usuarioId);
    const { pagina, porPagina } = calcularPaginacion(filtros.pagina, filtros.porPagina);
    return respuestaListado(res, registros, construirMeta(total, pagina, porPagina));
  } catch (error) { return next(error); }
}

export async function controladorContarNoLeidas(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const total = await contarNoLeidas(req.usuarioActual!.id);
    return respuestaExito(res, { total });
  } catch (error) { return next(error); }
}

export async function controladorMarcarLeida(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const notificacion = await marcarLeida(req.params['id'] as string, req.usuarioActual!.id);
    return respuestaExito(res, notificacion);
  } catch (error) { return next(error); }
}

export async function controladorMarcarTodasLeidas(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const resultado = await marcarTodasLeidas(req.usuarioActual!.id);
    return respuestaExito(res, resultado);
  } catch (error) { return next(error); }
}

export async function controladorEliminarNotificacion(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    await eliminarNotificacion(req.params['id'] as string, req.usuarioActual!.id);
    return respuestaSinContenido(res);
  } catch (error) { return next(error); }
}
