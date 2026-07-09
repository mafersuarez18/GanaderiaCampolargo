import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  verificarToken,
  soloAdministrador,
  administradorOVeterinario,
  cualquierRol,
} from '../../compartido/middlewares/autenticacion';
import { registrarAuditoria } from '../../compartido/middlewares/auditoria';
import { prisma } from '../../compartido/prisma/clientePrisma';
import {
  respuestaExito,
  respuestaCreado,
  respuestaSinContenido,
} from '../../compartido/utilidades/respuestaHttp';
import { ErrorNoEncontrado, ErrorConflicto } from '../../compartido/tipos/respuesta';

const enrutador = Router();

enrutador.use(verificarToken);

const esquemaLote = z.object({
  nombre:      z.string().min(2).max(100),
  descripcion: z.string().max(500).optional(),
  capacidad:   z.number().int().positive().optional(),
  fincaId:     z.string().cuid(),
});

// GET /api/v1/lotes?fincaId=xxx — listar lotes (opcionalmente filtrados por finca)
enrutador.get('/', cualquierRol, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fincaId } = z.object({ fincaId: z.string().cuid().optional() }).parse(req.query);

    const lotes = await prisma.lote.findMany({
      where: {
        activo: true,
        ...(fincaId ? { fincaId } : {}),
      },
      include: {
        finca: { select: { nombre: true } },
        _count: { select: { animales: true } },
      },
      orderBy: [{ finca: { nombre: 'asc' } }, { nombre: 'asc' }],
    });

    return respuestaExito(res, lotes);
  } catch (error) { return next(error); }
});

// GET /api/v1/lotes/:id — obtener lote
enrutador.get('/:id', cualquierRol, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lote = await prisma.lote.findUnique({
      where: { id: req.params['id'] as string },
      include: {
        finca: { select: { nombre: true } },
        _count: { select: { animales: true, potreros: true } },
        animales: {
          where: { estado: 'ACTIVO' },
          select: {
            id: true,
            numeroArete: true,
            nombre: true,
            sexo: true,
            raza: { select: { nombre: true } },
            estadoSanitario: true,
          },
          orderBy: { numeroArete: 'asc' },
          take: 50,
        },
      },
    });

    if (!lote) throw new ErrorNoEncontrado('Lote no encontrado');
    return respuestaExito(res, lote);
  } catch (error) { return next(error); }
});

// POST /api/v1/lotes — crear lote
enrutador.post(
  '/',
  administradorOVeterinario,
  registrarAuditoria('Crear lote', 'Lote'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const datos = esquemaLote.parse(req.body);

      // Verificar que la finca existe
      const finca = await prisma.finca.findUnique({
        where: { id: datos.fincaId },
        select: { id: true },
      });
      if (!finca) throw new ErrorNoEncontrado('Finca no encontrada');

      // Verificar nombre único dentro de la finca
      const existente = await prisma.lote.findFirst({
        where: { fincaId: datos.fincaId, nombre: datos.nombre, activo: true },
        select: { id: true },
      });
      if (existente) throw new ErrorConflicto(`Ya existe un lote llamado "${datos.nombre}" en esta finca`);

      const lote = await prisma.lote.create({
        data: datos,
        include: {
          finca: { select: { nombre: true } },
          _count: { select: { animales: true } },
        },
      });

      return respuestaCreado(res, lote);
    } catch (error) { return next(error); }
  }
);

// PATCH /api/v1/lotes/:id — actualizar lote
enrutador.patch(
  '/:id',
  administradorOVeterinario,
  registrarAuditoria('Actualizar lote', 'Lote'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const datos = esquemaLote.partial().omit({ fincaId: true }).parse(req.body);

      const lote = await prisma.lote.findUnique({ where: { id: req.params['id'] as string }, select: { id: true, fincaId: true } });
      if (!lote) throw new ErrorNoEncontrado('Lote no encontrado');

      // Verificar nombre único dentro de la misma finca
      if (datos.nombre) {
        const duplicado = await prisma.lote.findFirst({
          where: { fincaId: lote.fincaId, nombre: datos.nombre, activo: true, id: { not: req.params['id'] as string } },
          select: { id: true },
        });
        if (duplicado) throw new ErrorConflicto(`Ya existe un lote llamado "${datos.nombre}" en esta finca`);
      }

      const actualizado = await prisma.lote.update({
        where: { id: req.params['id'] as string },
        data: datos,
        include: {
          finca: { select: { nombre: true } },
          _count: { select: { animales: true } },
        },
      });

      return respuestaExito(res, actualizado);
    } catch (error) { return next(error); }
  }
);

// DELETE /api/v1/lotes/:id — eliminar lote (soft delete)
enrutador.delete(
  '/:id',
  soloAdministrador,
  registrarAuditoria('Eliminar lote', 'Lote'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const lote = await prisma.lote.findUnique({
        where: { id: req.params['id'] as string },
        include: { _count: { select: { animales: true } } },
      });
      if (!lote) throw new ErrorNoEncontrado('Lote no encontrado');

      if (lote._count.animales > 0) {
        throw new ErrorConflicto(`No se puede eliminar el lote porque tiene ${lote._count.animales} animal(es) asignado(s)`);
      }

      await prisma.lote.update({ where: { id: req.params['id'] as string }, data: { activo: false } });
      return respuestaSinContenido(res);
    } catch (error) { return next(error); }
  }
);

export default enrutador;
