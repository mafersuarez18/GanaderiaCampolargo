import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { verificarToken, cualquierRol, administradorOVeterinario } from '../../compartido/middlewares/autenticacion';
import { prisma } from '../../compartido/prisma/clientePrisma';
import { respuestaExito, respuestaCreado } from '../../compartido/utilidades/respuestaHttp';
import { ErrorNoAutorizado } from '../../compartido/tipos/respuesta';

const enrutador = Router();

// GET /api/v1/geolocalizacion/animales — posiciones actuales de todos los animales activos
enrutador.get('/animales', verificarToken, cualquierRol, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fincaId } = z.object({ fincaId: z.string().min(1).optional() }).parse(req.query);

    const animales = await prisma.animal.findMany({
      where: {
        estado: 'ACTIVO',
        latitudActual: { not: null },
        longitudActual: { not: null },
        ...(fincaId ? { fincaId } : {}),
      },
      select: {
        id: true,
        numeroArete: true,
        nombre: true,
        latitudActual: true,
        longitudActual: true,
        finca: { select: { nombre: true } },
        lote:  { select: { nombre: true } },
        raza:  { select: { nombre: true } },
        sexo: true,
        estadoSanitario: true,
      },
    });

    return respuestaExito(res, animales);
  } catch (error) { return next(error); }
});

// GET /api/v1/geolocalizacion/historial/:animalId — historial de ubicaciones
enrutador.get('/historial/:animalId', verificarToken, cualquierRol, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limite } = z.object({ limite: z.coerce.number().int().positive().max(500).default(100) }).parse(req.query);

    const registros = await prisma.registroUbicacion.findMany({
      where: { animalId: req.params.animalId },
      orderBy: { fechaRegistro: 'desc' },
      take: limite,
    });

    return respuestaExito(res, registros);
  } catch (error) { return next(error); }
});

// POST /api/v1/geolocalizacion/dispositivos/:apiKey/ubicacion — endpoint para dispositivos GPS
enrutador.post('/dispositivos/:apiKey/ubicacion', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { latitud, longitud, precision, velocidad } = z.object({
      latitud:   z.number().min(-90).max(90),
      longitud:  z.number().min(-180).max(180),
      precision: z.number().optional(),
      velocidad: z.number().optional(),
    }).parse(req.body);

    // Autenticar dispositivo por apiKey (comparación directa — el apiKey es un secreto único)
    const dispositivo = await prisma.dispositivoGPS.findUnique({
      where: { apiKey: req.params.apiKey, activo: true },
      select: { id: true, animalId: true },
    });

    if (!dispositivo) throw new ErrorNoAutorizado('API key del dispositivo no válida');

    // Registrar ubicación
    const registro = await prisma.registroUbicacion.create({
      data: {
        animalId:      dispositivo.animalId,
        dispositivoGPSId: dispositivo.id,
        latitud,
        longitud,
        precision,
        velocidad,
        esDatoSimulado: false,
      },
    });

    // Actualizar posición actual del animal
    await prisma.animal.update({
      where: { id: dispositivo.animalId },
      data: { latitudActual: latitud, longitudActual: longitud },
    });

    return respuestaCreado(res, registro);
  } catch (error) { return next(error); }
});

// GET /api/v1/geolocalizacion/dispositivos — listar dispositivos
enrutador.get('/dispositivos', verificarToken, administradorOVeterinario, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const dispositivos = await prisma.dispositivoGPS.findMany({
      include: {
        animal: { select: { numeroArete: true, nombre: true } },
      },
      orderBy: { codigoDispositivo: 'asc' },
    });
    return respuestaExito(res, dispositivos);
  } catch (error) { return next(error); }
});

export default enrutador;
