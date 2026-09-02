import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  obtenerResumenDashboard,
  obtenerEvolucionMensual,
  obtenerDistribucionPorEdad,
  obtenerPorcentajeAnimalesTratados,
  obtenerTasaRecurrenciaPatologias,
} from './analytics.servicio';
import { respuestaExito } from '../../compartido/utilidades/respuestaHttp';

// Controladores delgados: solo validan la entrada con Zod y delegan el
// cálculo real al servicio.

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

const esquemaPeriodo = z.object({
  desde:   z.coerce.date(),
  hasta:   z.coerce.date(),
  fincaId: z.string().min(1).optional(),
});

export async function controladorPorcentajeTratados(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { desde, hasta, fincaId } = esquemaPeriodo.parse(req.query);
    const datos = await obtenerPorcentajeAnimalesTratados(desde, hasta, fincaId);
    return respuestaExito(res, datos);
  } catch (error) {
    return next(error);
  }
}

export async function controladorRecurrenciaPatologias(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { fincaId } = z.object({ fincaId: z.string().min(1).optional() }).parse(req.query);
    const datos = await obtenerTasaRecurrenciaPatologias(fincaId);
    return respuestaExito(res, datos);
  } catch (error) {
    return next(error);
  }
}
