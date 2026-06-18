import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { EstadoSanitario } from '@prisma/client';
import {
  listarHistorialMedico,
  obtenerHistorialPorId,
  crearHistorialMedico,
  eliminarHistorialMedico,
} from './historialMedico.servicio';
import {
  respuestaExito,
  respuestaCreado,
  respuestaListado,
  respuestaSinContenido,
} from '../../compartido/utilidades/respuestaHttp';
import { calcularPaginacion, construirMeta } from '../../compartido/utilidades/paginacion';

const esquemaTratamiento = z.object({
  medicamentoId:     z.string().uuid(),
  fechaInicio:       z.coerce.date(),
  dosis:             z.string().min(1).max(200),
  viaAdministracion: z.string().min(1).max(100),
  frecuencia:        z.string().min(1).max(100),
  duracionDias:      z.number().int().positive().optional(),
  observaciones:     z.string().max(500).optional(),
});

const esquemaEnfermedad = z.object({
  nombreEnfermedad:   z.string().min(2).max(200),
  fechaInicio:        z.coerce.date(),
  descripcionClinica: z.string().max(500).optional(),
  observaciones:      z.string().max(500).optional(),
});

const esquemaHistorial = z.object({
  animalId:                    z.string().uuid(),
  fechaConsulta:               z.coerce.date(),
  motivoConsulta:              z.string().min(2).max(300),
  sintomasObservados:          z.string().max(1000).optional(),
  diagnostico:                 z.string().min(2).max(1000),
  pronostico:                  z.string().max(500).optional(),
  observaciones:               z.string().max(1000).optional(),
  actualizarEstadoSanitario:   z.nativeEnum(EstadoSanitario).optional(),
  enfermedades:                z.array(esquemaEnfermedad).optional(),
  tratamientos:                z.array(esquemaTratamiento).optional(),
});

const esquemaFiltros = z.object({
  animalId:  z.string().uuid().optional(),
  fincaId:   z.string().uuid().optional(),
  desde:     z.coerce.date().optional(),
  hasta:     z.coerce.date().optional(),
  pagina:    z.coerce.number().int().positive().default(1),
  porPagina: z.coerce.number().int().positive().max(100).default(20),
});

export async function controladorListarHistorial(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const filtros = esquemaFiltros.parse(req.query);
    const { registros, total } = await listarHistorialMedico(filtros);
    const { pagina, porPagina } = calcularPaginacion(filtros.pagina, filtros.porPagina);
    return respuestaListado(res, registros, construirMeta(total, pagina, porPagina));
  } catch (error) { return next(error); }
}

export async function controladorObtenerHistorial(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const historial = await obtenerHistorialPorId(req.params.id);
    return respuestaExito(res, historial);
  } catch (error) { return next(error); }
}

export async function controladorCrearHistorial(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const datos = esquemaHistorial.parse(req.body);
    const historial = await crearHistorialMedico({
      ...datos,
      veterinarioId: req.usuarioActual!.id,
    });
    return respuestaCreado(res, historial);
  } catch (error) { return next(error); }
}

export async function controladorEliminarHistorial(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    await eliminarHistorialMedico(req.params.id);
    return respuestaSinContenido(res);
  } catch (error) { return next(error); }
}
