import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { EstadoSanitario, EstadoReproductivo, TipoAyudaDiagnostica, TipoDesparasitante } from '@prisma/client';
import {
  listarHistorialMedico,
  obtenerHistorialPorId,
  crearHistorialMedico,
  eliminarHistorialMedico,
  obtenerPrefillConsulta,
} from './historialMedico.servicio';
import {
  respuestaExito,
  respuestaCreado,
  respuestaListado,
  respuestaSinContenido,
} from '../../compartido/utilidades/respuestaHttp';
import { calcularPaginacion, construirMeta } from '../../compartido/utilidades/paginacion';

const esquemaAyudaDiagnostica = z.object({
  tipo:        z.nativeEnum(TipoAyudaDiagnostica),
  descripcion: z.string().max(500).optional(),
  resultado:   z.string().max(1000).optional(),
  fecha:       z.coerce.date(),
});

const esquemaDesparasitacion = z.object({
  producto:        z.string().min(1).max(200),
  principioActivo: z.string().max(200).optional(),
  tipo:            z.nativeEnum(TipoDesparasitante),
  fecha:           z.coerce.date(),
  dosis:           z.string().max(100).optional(),
  via:             z.string().max(100).optional(),
  observaciones:   z.string().max(500).optional(),
});

const esquemaInformacionEpidemiologica = z.object({
  garrapatas:    z.boolean().optional(),
  mosquitos:     z.boolean().optional(),
  murcielagos:   z.boolean().optional(),
  moscas:        z.boolean().optional(),
  otrosVectores: z.string().max(200).optional(),
  descripcion:   z.string().max(500).optional(),
});

const esquemaTratamiento = z.object({
  medicamentoId:     z.string().min(1),
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
  animalId:                    z.string().min(1),
  fechaConsulta:               z.coerce.date(),
  motivoConsulta:              z.string().min(2).max(300),
  sintomasObservados:          z.string().max(1000).optional(),
  diagnostico:                 z.string().min(2).max(1000),
  pronostico:                  z.string().max(500).optional(),
  observaciones:               z.string().max(1000).optional(),
  actualizarEstadoSanitario:   z.nativeEnum(EstadoSanitario).optional(),
  enfermedades:                z.array(esquemaEnfermedad).optional(),
  tratamientos:                z.array(esquemaTratamiento).optional(),
  // Anamnesis
  tiempoEvolucion:             z.string().max(200).optional(),
  tratamientosPrevios:         z.string().max(1000).optional(),
  cirugias:                    z.string().max(1000).optional(),
  // Exploración física
  temperatura:                 z.number().optional(),
  frecuenciaCardiaca:          z.number().int().positive().optional(),
  frecuenciaRespiratoria:      z.number().int().positive().optional(),
  tiempoLlenadoCapilar:        z.number().optional(),
  movimientosRuminales:        z.number().int().optional(),
  condicionCorporal:           z.number().optional(),
  // Estado del animal
  estadoReproductivo:          z.nativeEnum(EstadoReproductivo).optional(),
  litrosLechesDiarios:         z.number().optional(),
  gananciaPeso:                z.number().optional(),
  // Diagnóstico y plan
  diagnosticoDefinitivo:       z.string().max(1000).optional(),
  planDiagnostico:             z.string().max(1000).optional(),
  // Pruebas obligatorias
  observacionesDiagnosticosOficiales: z.string().max(1000).optional(),
  // Relaciones hijas
  informacionEpidemiologica:   esquemaInformacionEpidemiologica.optional(),
  ayudasDiagnosticas:          z.array(esquemaAyudaDiagnostica).optional(),
  desparasitaciones:           z.array(esquemaDesparasitacion).optional(),
});

const esquemaFiltros = z.object({
  animalId:  z.string().min(1).optional(),
  fincaId:   z.string().min(1).optional(),
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
    const historial = await obtenerHistorialPorId(req.params['id'] as string);
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
    await eliminarHistorialMedico(req.params['id'] as string);
    return respuestaSinContenido(res);
  } catch (error) { return next(error); }
}

export async function controladorPrefillConsulta(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const { animalId } = z.object({ animalId: z.string().min(1) }).parse(req.query);
    const prefill = await obtenerPrefillConsulta(animalId);
    return respuestaExito(res, prefill);
  } catch (error) { return next(error); }
}
