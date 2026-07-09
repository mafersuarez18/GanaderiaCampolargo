import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Sexo, EstadoAnimal, TipoPropositoAnimal, EstadoSanitario } from '@prisma/client';
import {
  servicioListarAnimales,
  servicioObtenerAnimal,
  servicioObtenerAnimalPorArete,
  servicioCrearAnimal,
  servicioActualizarAnimal,
  servicioEliminarAnimal,
  servicioListarRazas,
} from './animales.servicio';
import {
  respuestaExito,
  respuestaCreado,
  respuestaListado,
  respuestaSinContenido,
} from '../../compartido/utilidades/respuestaHttp';
import { construirMeta } from '../../compartido/utilidades/paginacion';

const esquemaCrearAnimal = z.object({
  numeroArete:     z.string().min(1, 'El arete es requerido').max(50),
  nombre:          z.string().max(100).optional(),
  sexo:            z.nativeEnum(Sexo),
  proposito:       z.nativeEnum(TipoPropositoAnimal),
  estado:          z.nativeEnum(EstadoAnimal).default('ACTIVO'),
  estadoSanitario: z.nativeEnum(EstadoSanitario).default('SANO'),
  fechaNacimiento: z.coerce.date().optional(),
  pesoActual:      z.number().positive().optional(),
  color:           z.string().max(100).optional(),
  marcas:          z.string().max(300).optional(),
  observaciones:   z.string().max(1000).optional(),
  tipoCruce:       z.string().max(100).optional(),
  procedencia:     z.string().max(300).optional(),
  fincaId:         z.string().min(1),
  loteId:          z.string().min(1).optional(),
  razaId:          z.string().min(1),
  padreId:         z.string().min(1).optional(),
  madreId:         z.string().min(1).optional(),
});

const esquemaFiltros = z.object({
  busqueda:       z.string().optional(),
  fincaId:        z.string().min(1).optional(),
  loteId:         z.string().min(1).optional(),
  razaId:         z.string().min(1).optional(),
  sexo:           z.nativeEnum(Sexo).optional(),
  estado:         z.nativeEnum(EstadoAnimal).optional(),
  pagina:         z.coerce.number().int().positive().default(1),
  porPagina:      z.coerce.number().int().positive().max(500).default(20),
  ordenPor:       z.enum(['numeroArete', 'nombre', 'fechaNacimiento', 'creadoEn']).default('creadoEn'),
  direccionOrden: z.enum(['asc', 'desc']).default('desc'),
});

export async function controladorListarAnimales(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const filtros = esquemaFiltros.parse(req.query);
    const { registros, total } = await servicioListarAnimales(filtros);
    return respuestaListado(res, registros, construirMeta(total, filtros));
  } catch (error) { return next(error); }
}

export async function controladorObtenerAnimal(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const animal = await servicioObtenerAnimal(req.params['id'] as string);
    return respuestaExito(res, animal);
  } catch (error) { return next(error); }
}

export async function controladorBuscarPorArete(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const animal = await servicioObtenerAnimalPorArete(req.params['arete'] as string);
    return respuestaExito(res, animal);
  } catch (error) { return next(error); }
}

export async function controladorCrearAnimal(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const datos = esquemaCrearAnimal.parse(req.body);
    const animal = await servicioCrearAnimal(datos);
    return respuestaCreado(res, animal);
  } catch (error) { return next(error); }
}

export async function controladorActualizarAnimal(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const datos = esquemaCrearAnimal.partial().parse(req.body);
    const animal = await servicioActualizarAnimal(req.params['id'] as string, datos);
    return respuestaExito(res, animal);
  } catch (error) { return next(error); }
}

export async function controladorEliminarAnimal(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    await servicioEliminarAnimal(req.params['id'] as string);
    return respuestaSinContenido(res);
  } catch (error) { return next(error); }
}

export async function controladorListarRazas(
  _req: Request, res: Response, next: NextFunction,
) {
  try {
    const razas = await servicioListarRazas();
    return respuestaExito(res, razas);
  } catch (error) { return next(error); }
}
