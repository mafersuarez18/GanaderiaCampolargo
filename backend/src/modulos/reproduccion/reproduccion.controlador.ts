import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { TipoEventoReproductivo } from '@prisma/client';
import {
  listarPartosProximos,
  listarEventosReproductivos,
  obtenerEventoReproductivo,
  crearEventoReproductivo,
  listarGestacionesActivas,
  crearGestacion,
  cerrarGestacion,
  obtenerIndicadoresReproductivos,
} from './reproduccion.servicio';
import {
  respuestaExito,
  respuestaCreado,
  respuestaListado,
} from '../../compartido/utilidades/respuestaHttp';
import { calcularPaginacion, construirMeta } from '../../compartido/utilidades/paginacion';

const esquemaFiltros = z.object({
  animalId:   z.string().uuid().optional(),
  fincaId:    z.string().uuid().optional(),
  tipoEvento: z.nativeEnum(TipoEventoReproductivo).optional(),
  desde:      z.coerce.date().optional(),
  hasta:      z.coerce.date().optional(),
  pagina:     z.coerce.number().int().positive().default(1),
  porPagina:  z.coerce.number().int().positive().max(100).default(20),
});

const esquemaEvento = z.object({
  animalId:     z.string().uuid(),
  tipo:         z.nativeEnum(TipoEventoReproductivo),
  fecha:        z.coerce.date(),
  descripcion:  z.string().max(500).optional(),
  exitoso:      z.boolean().optional(),
  observaciones: z.string().max(1000).optional(),
});

const esquemaGestacion = z.object({
  madreId:             z.string().uuid(),
  fechaInicio:         z.coerce.date(),
  fechaPartoEsperado:  z.coerce.date(),
  observaciones:       z.string().max(500).optional(),
});

export async function controladorPartosProximos(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const { dias, limite } = z.object({
      dias:   z.coerce.number().int().positive().max(180).default(30),
      limite: z.coerce.number().int().positive().max(50).default(20),
    }).parse(req.query);
    const partos = await listarPartosProximos(dias, limite);
    return respuestaExito(res, partos);
  } catch (error) { return next(error); }
}

export async function controladorListarEventos(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const filtros = esquemaFiltros.parse(req.query);
    const { registros, total } = await listarEventosReproductivos(filtros);
    const { pagina, porPagina } = calcularPaginacion(filtros.pagina, filtros.porPagina);
    return respuestaListado(res, registros, construirMeta(total, pagina, porPagina));
  } catch (error) { return next(error); }
}

export async function controladorObtenerEvento(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const evento = await obtenerEventoReproductivo(req.params.id);
    return respuestaExito(res, evento);
  } catch (error) { return next(error); }
}

export async function controladorCrearEvento(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const datos = esquemaEvento.parse(req.body);
    const evento = await crearEventoReproductivo({
      ...datos,
      registradoPorId: req.usuarioActual!.id,
    });
    return respuestaCreado(res, evento);
  } catch (error) { return next(error); }
}

export async function controladorGestacionesActivas(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const { fincaId } = z.object({ fincaId: z.string().uuid().optional() }).parse(req.query);
    const gestaciones = await listarGestacionesActivas(fincaId);
    return respuestaExito(res, gestaciones);
  } catch (error) { return next(error); }
}

export async function controladorCrearGestacion(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const datos = esquemaGestacion.parse(req.body);
    const gestacion = await crearGestacion(datos);
    return respuestaCreado(res, gestacion);
  } catch (error) { return next(error); }
}

export async function controladorIndicadores(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const { anio, fincaId } = z.object({
      anio:    z.coerce.number().int().min(2000).max(2100).default(() => new Date().getFullYear()),
      fincaId: z.string().uuid().optional(),
    }).parse(req.query);
    const indicadores = await obtenerIndicadoresReproductivos(anio, fincaId);
    return respuestaExito(res, indicadores);
  } catch (error) { return next(error); }
}

export async function controladorCerrarGestacion(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const { resultado, fechaPartoReal } = z.object({
      resultado:     z.enum(['PARTO', 'ABORTO', 'PERDIDA']),
      fechaPartoReal: z.coerce.date().optional(),
    }).parse(req.body);
    const gestacion = await cerrarGestacion(req.params.id, resultado, fechaPartoReal);
    return respuestaExito(res, gestacion);
  } catch (error) { return next(error); }
}
