import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { TipoAlertaRegla, PrioridadAlerta } from '@prisma/client';
import {
  verificarToken,
  soloAdministrador,
  administradorOVeterinario,
  cualquierRol,
} from '../../compartido/middlewares/autenticacion';
import { prisma } from '../../compartido/prisma/clientePrisma';
import {
  respuestaExito,
  respuestaCreado,
} from '../../compartido/utilidades/respuestaHttp';
import {
  evaluarTodasLasReglas,
} from './alertas.scheduler';

const enrutador = Router();

enrutador.use(verificarToken);

// ── GET /api/v1/alertas — listar reglas de alerta ────────────────────────────
enrutador.get('/', cualquierRol, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reglas = await prisma.reglaAlerta.findMany({
      orderBy: [{ activa: 'desc' }, { tipoAlerta: 'asc' }],
    });
    return respuestaExito(res, reglas);
  } catch (error) { return next(error); }
});

// ── GET /api/v1/alertas/resumen — resumen de notificaciones por categoría ─────
enrutador.get('/resumen', cualquierRol, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usuarioId = req.usuarioActual!.id;

    // Conteos por prioridad (solo no leídas)
    const noAbordada = { usuarioId, estado: { not: 'DESCARTADA' } } as const;

    const [critica, alta, media, baja, totalNoLeidas] = await prisma.$transaction([
      prisma.notificacion.count({ where: { ...noAbordada, prioridad: 'CRITICA' } }),
      prisma.notificacion.count({ where: { ...noAbordada, prioridad: 'ALTA' } }),
      prisma.notificacion.count({ where: { ...noAbordada, prioridad: 'MEDIA' } }),
      prisma.notificacion.count({ where: { ...noAbordada, prioridad: 'BAJA' } }),
      prisma.notificacion.count({ where: noAbordada }),
    ]);

    // Conteos por tipo de entidad (no abordadas)
    const porTipoEntidad = await prisma.notificacion.groupBy({
      by: ['entidadTipo'],
      where: noAbordada,
      _count: { id: true },
    });

    // Últimas 5 notificaciones críticas o de alta prioridad no abordadas
    const urgentes = await prisma.notificacion.findMany({
      where: {
        ...noAbordada,
        prioridad: { in: ['CRITICA', 'ALTA'] },
      },
      orderBy: { creadoEn: 'desc' },
      take: 5,
    });

    return respuestaExito(res, {
      totalNoLeidas,
      porPrioridad: { critica, alta, media, baja },
      porTipoEntidad: porTipoEntidad.map((g) => ({
        tipo: g.entidadTipo,
        cantidad: g._count.id,
      })),
      urgentes,
    });
  } catch (error) { return next(error); }
});

// ── POST /api/v1/alertas/evaluar — disparo manual del motor ──────────────────
enrutador.post('/evaluar', administradorOVeterinario, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const resultado = await evaluarTodasLasReglas(true); // skipThrottle = true en disparo manual
    return respuestaExito(res, {
      mensaje: `Motor ejecutado: ${resultado.evaluadas} regla(s) evaluada(s)`,
      ...resultado,
    });
  } catch (error) { return next(error); }
});

const esquemaRegla = z.object({
  nombre:                 z.string().min(2).max(200),
  descripcion:            z.string().max(500).optional(),
  tipoAlerta:             z.nativeEnum(TipoAlertaRegla),
  prioridad:              z.nativeEnum(PrioridadAlerta).optional(),
  umbralValor:            z.number().optional(),
  umbralUnidad:           z.string().max(50).optional(),
  mensajeAlerta:          z.string().max(500).optional(),
  evaluarCadaHoras:       z.number().int().min(1).max(720).optional(),
  activa:                 z.boolean().default(true),
  notificarAdministrador: z.boolean().default(true),
  notificarVeterinario:   z.boolean().default(true),
  notificarTecnico:       z.boolean().default(false),
  enviarCorreo:           z.boolean().default(true),
});

// ── POST /api/v1/alertas — crear regla de alerta ─────────────────────────────
enrutador.post('/', soloAdministrador, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const datos = esquemaRegla.parse(req.body);
    const regla = await prisma.reglaAlerta.create({
      data: { ...datos, creadoPorId: req.usuarioActual!.id },
    });
    return respuestaCreado(res, regla);
  } catch (error) { return next(error); }
});

// ── PATCH /api/v1/alertas/:id — actualizar regla ─────────────────────────────
enrutador.patch('/:id', soloAdministrador, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const datos = esquemaRegla.partial().parse(req.body);
    const regla = await prisma.reglaAlerta.update({
      where: { id: req.params['id'] as string },
      data: datos,
    });
    return respuestaExito(res, regla);
  } catch (error) { return next(error); }
});

// ── DELETE /api/v1/alertas/:id — eliminar regla ───────────────────────────────
enrutador.delete('/:id', soloAdministrador, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.reglaAlerta.delete({
      where: { id: req.params['id'] as string },
    });
    return respuestaExito(res, { eliminado: true });
  } catch (error) { return next(error); }
});

export default enrutador;
