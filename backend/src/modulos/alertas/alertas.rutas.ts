import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { TipoAlertaRegla, PrioridadAlerta } from '@prisma/client';
import {
  verificarToken,
  requerirPrivilegio,
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
enrutador.get('/', requerirPrivilegio('alertas.ver'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reglas = await prisma.reglaAlerta.findMany({
      orderBy: [{ estado: 'asc' }, { tipoAlerta: 'asc' }, { nombre: 'asc' }],
      include: {
        usuariosNotificados: {
          select: { usuario: { select: { id: true, nombre: true, apellido: true } } },
        },
      },
    });
    const reglasConUsuarios = reglas.map(({ usuariosNotificados, ...regla }) => ({
      ...regla,
      usuarios: usuariosNotificados.map((ru) => ru.usuario),
    }));
    return respuestaExito(res, reglasConUsuarios);
  } catch (error) { return next(error); }
});

// ── GET /api/v1/alertas/resumen — resumen de notificaciones por categoría ─────
enrutador.get('/resumen', requerirPrivilegio('alertas.ver'), async (req: Request, res: Response, next: NextFunction) => {
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
enrutador.post('/evaluar', requerirPrivilegio('alertas.evaluar'), async (req: Request, res: Response, next: NextFunction) => {
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
  evaluarCadaHoras:       z.number().int().min(1).max(720).optional(),
  estado:                 z.enum(['ACTIVA', 'PAUSADA']).default('ACTIVA'),
  enviarCorreo:           z.boolean().default(true),
  // IDs de los usuarios específicos que deben recibir esta alerta
  usuarioIds:             z.array(z.string().min(1)).default([]),
});

// ── POST /api/v1/alertas — crear regla de alerta ─────────────────────────────
enrutador.post('/', requerirPrivilegio('alertas.gestionar_reglas'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { usuarioIds, ...datos } = esquemaRegla.parse(req.body);
    const regla = await prisma.reglaAlerta.create({
      data: {
        ...datos,
        creadoPorId: req.usuarioActual!.id,
        usuariosNotificados: { create: usuarioIds.map((usuarioId) => ({ usuarioId })) },
      },
      include: {
        usuariosNotificados: {
          select: { usuario: { select: { id: true, nombre: true, apellido: true } } },
        },
      },
    });
    return respuestaCreado(res, regla);
  } catch (error) { return next(error); }
});

// ── PATCH /api/v1/alertas/:id — actualizar regla ─────────────────────────────
enrutador.patch('/:id', requerirPrivilegio('alertas.gestionar_reglas'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { usuarioIds, ...datos } = esquemaRegla.partial().parse(req.body);
    if (usuarioIds) {
      await prisma.reglaAlertaUsuario.deleteMany({ where: { reglaAlertaId: req.params['id'] as string } });
    }
    const regla = await prisma.reglaAlerta.update({
      where: { id: req.params['id'] as string },
      data: {
        ...datos,
        ...(usuarioIds && { usuariosNotificados: { create: usuarioIds.map((usuarioId) => ({ usuarioId })) } }),
      },
      include: {
        usuariosNotificados: {
          select: { usuario: { select: { id: true, nombre: true, apellido: true } } },
        },
      },
    });
    return respuestaExito(res, regla);
  } catch (error) { return next(error); }
});

// ── DELETE /api/v1/alertas/:id — eliminar regla ───────────────────────────────
enrutador.delete('/:id', requerirPrivilegio('alertas.gestionar_reglas'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.reglaAlerta.delete({
      where: { id: req.params['id'] as string },
    });
    return respuestaExito(res, { eliminado: true });
  } catch (error) { return next(error); }
});

export default enrutador;
