import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { EstadoAnimal } from '@prisma/client';
import { verificarToken, administradorOVeterinario } from '../../compartido/middlewares/autenticacion';
import { prisma } from '../../compartido/prisma/clientePrisma';
import { respuestaExito } from '../../compartido/utilidades/respuestaHttp';
import {
  generarInventario,
  generarSanitario,
  generarVacunacion,
  generarReproductivo,
} from './reportes.servicio';

const enrutador = Router();

enrutador.use(verificarToken, administradorOVeterinario);

const esquemaFiltros = z.object({
  formato:  z.enum(['pdf', 'excel']).default('pdf'),
  anio:     z.coerce.number().int().min(2000).max(2100).default(() => new Date().getFullYear()),
  fincaId:  z.string().min(1).optional(),
  estado:   z.nativeEnum(EstadoAnimal).optional(),
});

// ── Endpoints de archivo (PDF / Excel) ────────────────────────────────────────

// GET /api/v1/reportes/inventario?formato=pdf&anio=2025&fincaId=...&estado=...
enrutador.get('/inventario', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filtros = esquemaFiltros.parse(req.query);
    await generarInventario(res, filtros.formato, filtros);
  } catch (error) { return next(error); }
});

// GET /api/v1/reportes/sanitario?formato=pdf&anio=2025&fincaId=...
enrutador.get('/sanitario', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filtros = esquemaFiltros.parse(req.query);
    await generarSanitario(res, filtros.formato, filtros);
  } catch (error) { return next(error); }
});

// GET /api/v1/reportes/vacunacion?formato=pdf&anio=2025&fincaId=...
enrutador.get('/vacunacion', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filtros = esquemaFiltros.parse(req.query);
    await generarVacunacion(res, filtros.formato, filtros);
  } catch (error) { return next(error); }
});

// GET /api/v1/reportes/reproductivo?formato=pdf&anio=2025&fincaId=...
enrutador.get('/reproductivo', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filtros = esquemaFiltros.parse(req.query);
    await generarReproductivo(res, filtros.formato, filtros);
  } catch (error) { return next(error); }
});

// ── Endpoints JSON de resumen (usados por el dashboard) ───────────────────────

// GET /api/v1/reportes/inventario-animales
enrutador.get('/inventario-animales', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fincaId } = z.object({ fincaId: z.string().min(1).optional() }).parse(req.query);

    const [porEstado, porRaza, porFinca, porSexo] = await Promise.all([
      prisma.animal.groupBy({
        by: ['estado'],
        _count: { id: true },
        where: fincaId ? { fincaId } : {},
      }),
      prisma.animal.groupBy({
        by: ['razaId'],
        _count: { id: true },
        where: { estado: EstadoAnimal.ACTIVO, ...(fincaId ? { fincaId } : {}) },
      }),
      prisma.finca.findMany({
        select: {
          nombre: true,
          _count: { select: { animales: { where: { estado: EstadoAnimal.ACTIVO } } } },
        },
      }),
      prisma.animal.groupBy({
        by: ['sexo'],
        _count: { id: true },
        where: { estado: EstadoAnimal.ACTIVO, ...(fincaId ? { fincaId } : {}) },
      }),
    ]);

    return respuestaExito(res, { porEstado, porRaza, porFinca, porSexo });
  } catch (error) { return next(error); }
});

export default enrutador;
