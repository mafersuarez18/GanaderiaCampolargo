import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { TipoAccionAuditoria } from '@prisma/client';
import { verificarToken, soloAdministrador } from '../../compartido/middlewares/autenticacion';
import { prisma } from '../../compartido/prisma/clientePrisma';
import { respuestaListado } from '../../compartido/utilidades/respuestaHttp';
import { calcularPaginacion, construirMeta } from '../../compartido/utilidades/paginacion';

const enrutador = Router();

enrutador.use(verificarToken, soloAdministrador);

enrutador.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filtros = z.object({
      usuarioId:  z.string().min(1).optional(),
      accion:     z.nativeEnum(TipoAccionAuditoria).optional(),
      modulo:     z.string().optional(),
      desde:      z.coerce.date().optional(),
      hasta:      z.coerce.date().optional(),
      pagina:     z.coerce.number().int().positive().default(1),
      porPagina:  z.coerce.number().int().positive().max(100).default(25),
    }).parse(req.query);

    const donde = {
      ...(filtros.usuarioId && { usuarioId: filtros.usuarioId }),
      ...(filtros.accion    && { accion: filtros.accion }),
      ...(filtros.modulo    && { modulo: { contains: filtros.modulo, mode: 'insensitive' as const } }),
      ...((filtros.desde || filtros.hasta) && {
        creadoEn: {
          ...(filtros.desde && { gte: filtros.desde }),
          ...(filtros.hasta && { lte: filtros.hasta }),
        },
      }),
    };

    const [registros, total] = await prisma.$transaction([
      prisma.registroAuditoria.findMany({
        where: donde,
        include: { usuario: { select: { nombre: true, apellido: true, correo: true } } },
        orderBy: { creadoEn: 'desc' },
        skip: (filtros.pagina - 1) * filtros.porPagina,
        take: filtros.porPagina,
      }),
      prisma.registroAuditoria.count({ where: donde }),
    ]);

    const { pagina, porPagina } = calcularPaginacion(filtros.pagina, filtros.porPagina);
    return respuestaListado(res, registros, construirMeta(total, pagina, porPagina));
  } catch (error) { return next(error); }
});

export default enrutador;
