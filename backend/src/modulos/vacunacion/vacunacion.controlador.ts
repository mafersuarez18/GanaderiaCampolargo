import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Sexo } from '@prisma/client';
import {
  listarCalendarios,
  obtenerCalendario,
  crearCalendario,
  actualizarCalendario,
  listarRegistrosVacunacion,
  registrarVacunacion,
  actualizarRegistroVacunacion,
  eliminarRegistroVacunacion,
  listarMedicamentos,
  crearMedicamento,
  obtenerCumplimientoVacunacionPorLote,
} from './vacunacion.servicio';
import {
  respuestaExito,
  respuestaCreado,
  respuestaListado,
  respuestaSinContenido,
} from '../../compartido/utilidades/respuestaHttp';
import { calcularPaginacion, construirMeta } from '../../compartido/utilidades/paginacion';
import { prisma } from '../../compartido/prisma/clientePrisma';

// El registro de vacunación normalmente cuelga de una consulta médica
// (historialMedicoId), pero también se puede aplicar sin pasar por una
// consulta formal (solo animalId) — en ese caso se busca el historial más
// reciente del animal para vincularlo automáticamente.

const esquemaCalendario = z.object({
  nombreVacuna:    z.string().min(2).max(200),
  descripcion:     z.string().max(500).optional(),
  fabricante:      z.string().max(200).optional(),
  medicamentoId:   z.string().min(1).optional(),
  intervaloDias:   z.number().int().positive(),
  edadMinimasDias: z.number().int().min(0).optional(),
  aplicaASexo:     z.nativeEnum(Sexo).nullable().optional(),
});

const esquemaRegistro = z.object({
  animalId:               z.string().min(1, 'El animal es requerido'),
  calendarioVacunacionId: z.string().min(1),
  historialMedicoId:      z.string().min(1).optional(),
  medicamentoId:          z.string().min(1).optional(),
  fechaAplicacion:        z.coerce.date(),
  dosis:                  z.string().max(100).optional(),
  viaAdministracion:      z.string().max(100).optional(),
  lote:                   z.string().max(100).optional(),
  observaciones:          z.string().max(500).optional(),
});

const esquemaFiltrosRegistro = z.object({
  animalId:               z.string().min(1).optional(),
  calendarioVacunacionId: z.string().min(1).optional(),
  historialMedicoId:      z.string().min(1).optional(),
  fincaId:                z.string().min(1).optional(),
  desde:                  z.coerce.date().optional(),
  hasta:                  z.coerce.date().optional(),
  pagina:                 z.coerce.number().int().positive().default(1),
  porPagina:              z.coerce.number().int().positive().max(100).default(20),
});

export async function controladorListarCalendarios(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const calendarios = await listarCalendarios();
    return respuestaExito(res, calendarios);
  } catch (error) { return next(error); }
}

export async function controladorObtenerCalendario(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const calendario = await obtenerCalendario(req.params['id'] as string);
    return respuestaExito(res, calendario);
  } catch (error) { return next(error); }
}

export async function controladorCrearCalendario(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const datos = esquemaCalendario.parse(req.body);
    const calendario = await crearCalendario(datos);
    return respuestaCreado(res, calendario);
  } catch (error) { return next(error); }
}

export async function controladorActualizarCalendario(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const datos = esquemaCalendario.partial().parse(req.body);
    const calendario = await actualizarCalendario(req.params['id'] as string, datos);
    return respuestaExito(res, calendario);
  } catch (error) { return next(error); }
}

export async function controladorListarRegistros(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const filtros = esquemaFiltrosRegistro.parse(req.query);
    const { registros, total } = await listarRegistrosVacunacion(filtros);
    const { pagina, porPagina } = calcularPaginacion(filtros.pagina, filtros.porPagina);
    return respuestaListado(res, registros, construirMeta(total, pagina, porPagina));
  } catch (error) { return next(error); }
}

export async function controladorRegistrarVacunacion(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const datos = esquemaRegistro.parse(req.body);

    let historialMedicoId = datos.historialMedicoId;

    // Si no se indicó una consulta explícita, se enlaza como contexto la más
    // reciente del animal (si existe) — es solo informativo: el vínculo real
    // con el animal ya no depende de esto, viaja en animalId.
    if (!historialMedicoId) {
      const historial = await prisma.historialMedico.findFirst({
        where:   { animalId: datos.animalId },
        orderBy: { fechaConsulta: 'desc' },
        select:  { id: true },
      });
      if (historial) {
        historialMedicoId = historial.id;
      }
    }

    const registro = await registrarVacunacion({
      animalId: datos.animalId,
      calendarioVacunacionId: datos.calendarioVacunacionId,
      historialMedicoId,
      medicamentoId:    datos.medicamentoId,
      fechaAplicacion:  datos.fechaAplicacion,
      dosis:            datos.dosis,
      viaAdministracion: datos.viaAdministracion,
      lote:             datos.lote,
      observaciones:    datos.observaciones,
      aplicadoPorId: req.usuarioActual!.id,
    });
    return respuestaCreado(res, registro);
  } catch (error) { return next(error); }
}

export async function controladorActualizarRegistro(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const id = req.params['id'] as string;
    const datos = z.object({
      fechaAplicacion:  z.coerce.date().optional(),
      dosis:            z.string().max(100).optional(),
      viaAdministracion: z.string().max(100).optional(),
      lote:             z.string().max(100).optional(),
      observaciones:    z.string().max(500).optional(),
    }).parse(req.body);
    const registro = await actualizarRegistroVacunacion(id, datos);
    return respuestaExito(res, registro);
  } catch (error) { return next(error); }
}

export async function controladorEliminarRegistro(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const id = req.params['id'] as string;
    await eliminarRegistroVacunacion(id);
    return respuestaSinContenido(res);
  } catch (error) { return next(error); }
}

export async function controladorListarMedicamentos(
  _req: Request, res: Response, next: NextFunction,
) {
  try {
    const medicamentos = await listarMedicamentos();
    return respuestaExito(res, medicamentos);
  } catch (error) { return next(error); }
}

const esquemaCrearMedicamento = z.object({
  nombre:          z.string().min(1, 'El nombre es requerido').max(200),
  principioActivo: z.string().max(200).optional(),
});

export async function controladorCrearMedicamento(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const datos = esquemaCrearMedicamento.parse(req.body);
    const medicamento = await crearMedicamento(datos);
    return respuestaCreado(res, medicamento);
  } catch (error) { return next(error); }
}

export async function controladorCumplimientoPorLote(
  _req: Request, res: Response, next: NextFunction,
) {
  try {
    const cumplimiento = await obtenerCumplimientoVacunacionPorLote();
    return respuestaExito(res, cumplimiento);
  } catch (error) { return next(error); }
}
