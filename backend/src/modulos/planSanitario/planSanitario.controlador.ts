import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { CategoriaActividadSanitaria } from '@prisma/client';
import {
  obtenerOCrearPlan,
  crearActividad,
  actualizarActividad,
  eliminarActividad,
  marcarMesActividad,
  obtenerResumenSanitario,
} from './planSanitario.servicio';
import {
  respuestaExito,
  respuestaCreado,
  respuestaSinContenido,
} from '../../compartido/utilidades/respuestaHttp';

const esquemaMes = z.number().int().min(1).max(12);

const esquemaActividad = z.object({
  categoria:         z.nativeEnum(CategoriaActividadSanitaria),
  nombreControl:     z.string().min(1, 'El nombre del control es requerido').max(200),
  unidadReferencia:  z.string().max(100).optional(),
  prevencion:        z.string().max(500).optional(),
  tratamiento:       z.string().max(500).optional(),
  via:               z.string().max(100).optional(),
  mesesProgramados:  z.array(esquemaMes).optional(),
});

const esquemaObtenerPlan = z.object({
  fincaId: z.string().min(1),
  anio:    z.coerce.number().int().min(2000).max(2100),
});

const esquemaMarcarMes = z.object({
  mes:        esquemaMes,
  completado: z.boolean(),
});

export async function controladorObtenerPlan(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const { fincaId, anio } = esquemaObtenerPlan.parse(req.query);
    const plan = await obtenerOCrearPlan(fincaId, anio);
    return respuestaExito(res, plan);
  } catch (error) { return next(error); }
}

export async function controladorCrearActividad(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const { planId, ...datos } = z.object({ planId: z.string().min(1) }).merge(esquemaActividad).parse(req.body);
    const actividad = await crearActividad(planId, datos);
    return respuestaCreado(res, actividad);
  } catch (error) { return next(error); }
}

export async function controladorActualizarActividad(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const datos = esquemaActividad.partial().parse(req.body);
    const actividad = await actualizarActividad(req.params['id'] as string, datos);
    return respuestaExito(res, actividad);
  } catch (error) { return next(error); }
}

export async function controladorEliminarActividad(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    await eliminarActividad(req.params['id'] as string);
    return respuestaSinContenido(res);
  } catch (error) { return next(error); }
}

export async function controladorMarcarMes(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const { mes, completado } = esquemaMarcarMes.parse(req.body);
    const actividad = await marcarMesActividad(req.params['id'] as string, mes, completado);
    return respuestaExito(res, actividad);
  } catch (error) { return next(error); }
}

export async function controladorResumen(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const { fincaId } = z.object({ fincaId: z.string().min(1).optional() }).parse(req.query);
    const resumen = await obtenerResumenSanitario(fincaId);
    return respuestaExito(res, resumen);
  } catch (error) { return next(error); }
}
