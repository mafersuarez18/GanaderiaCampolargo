import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { EstadoAnimal } from '@prisma/client';
import {
  servicioListarFincas,
  servicioObtenerFinca,
  servicioCrearFinca,
  servicioActualizarFinca,
  servicioEliminarFinca,
  servicioListarAnimalesFinca,
} from './fincas.servicio';
import {
  respuestaExito,
  respuestaCreado,
  respuestaListado,
  respuestaSinContenido,
} from '../../compartido/utilidades/respuestaHttp';
import { calcularPaginacion, construirMeta } from '../../compartido/utilidades/paginacion';

// Valida la entrada HTTP con Zod y delega en el servicio.

const esquemaFinca = z.object({
  nombre:         z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  municipio:      z.string().min(2).max(100),
  estado:         z.string().min(2).max(100),
  hectareas:      z.number().positive('Las hectáreas deben ser positivas').optional(),
  latitudCentro:  z.number().min(-90).max(90).optional(),
  longitudCentro: z.number().min(-180).max(180).optional(),
  descripcion:    z.string().max(500).optional(),
  direccion:      z.string().max(300).optional(),
});

const esquemaFiltros = z.object({
  busqueda:  z.string().optional(),
  pagina:    z.coerce.number().int().positive().default(1),
  porPagina: z.coerce.number().int().positive().max(100).default(20),
});

export async function controladorListarFincas(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const filtros = esquemaFiltros.parse(req.query);
    const { registros, total } = await servicioListarFincas(filtros);
    const { pagina, porPagina } = calcularPaginacion(filtros.pagina, filtros.porPagina);
    return respuestaListado(res, registros, construirMeta(total, pagina, porPagina));
  } catch (error) { return next(error); }
}

export async function controladorObtenerFinca(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const finca = await servicioObtenerFinca(req.params['id'] as string);
    return respuestaExito(res, finca);
  } catch (error) { return next(error); }
}

export async function controladorCrearFinca(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const datos = esquemaFinca.parse(req.body);
    const finca = await servicioCrearFinca(datos);
    return respuestaCreado(res, finca);
  } catch (error) { return next(error); }
}

export async function controladorActualizarFinca(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const datos = esquemaFinca.partial().parse(req.body);
    const finca = await servicioActualizarFinca(req.params['id'] as string, datos);
    return respuestaExito(res, finca);
  } catch (error) { return next(error); }
}

export async function controladorEliminarFinca(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    await servicioEliminarFinca(req.params['id'] as string);
    return respuestaSinContenido(res);
  } catch (error) { return next(error); }
}

const esquemaFiltrosAnimalesFinca = z.object({
  busqueda:  z.string().optional(),
  loteId:    z.string().optional(),
  estado:    z.nativeEnum(EstadoAnimal).optional(),
  pagina:    z.coerce.number().int().positive().default(1),
  porPagina: z.coerce.number().int().positive().max(200).default(50),
});

export async function controladorAnimalesDeFinca(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const fincaId = req.params['id'] as string;
    const filtros = esquemaFiltrosAnimalesFinca.parse(req.query);
    const { registros, total } = await servicioListarAnimalesFinca(fincaId, filtros);
    const { pagina, porPagina } = calcularPaginacion(filtros.pagina, filtros.porPagina);
    return respuestaListado(res, registros, construirMeta(total, pagina, porPagina));
  } catch (error) { return next(error); }
}
