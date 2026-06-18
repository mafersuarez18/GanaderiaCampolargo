import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  obtenerResumenDashboard,
  obtenerEvolucionMensual,
  obtenerDistribucionPorEdad,
} from './analytics.servicio';
import { respuestaExito } from '../../compartido/utilidades/respuestaHttp';

export async function controladorResumenDashboard(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const datos = await obtenerResumenDashboard();
    return respuestaExito(res, datos);
  } catch (error) {
    return next(error);
  }
}

const esquemaAnio = z.object({
  anio: z.coerce.number().int().min(2020).max(2100).default(new Date().getFullYear()),
});

export async function controladorEvolucionMensual(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { anio } = esquemaAnio.parse(req.query);
    const datos = await obtenerEvolucionMensual(anio);
    return respuestaExito(res, datos);
  } catch (error) {
    return next(error);
  }
}

export async function controladorDistribucionEdad(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const datos = await obtenerDistribucionPorEdad();
    return respuestaExito(res, datos);
  } catch (error) {
    return next(error);
  }
}
