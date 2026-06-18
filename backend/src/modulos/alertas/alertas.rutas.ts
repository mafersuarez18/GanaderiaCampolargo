import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { TipoAlertaRegla } from '@prisma/client';
import {
  verificarToken,
  soloAdministrador,
  cualquierRol,
} from '../../compartido/middlewares/autenticacion';
import { prisma } from '../../compartido/prisma/clientePrisma';
import {
  respuestaExito,
  respuestaCreado,
} from '../../compartido/utilidades/respuestaHttp';

const enrutador = Router();

enrutador.use(verificarToken);

// GET /api/v1/alertas — listar reglas de alerta
enrutador.get('/', cualquierRol, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reglas = await prisma.reglaAlerta.findMany({
      orderBy: [{ activa: 'desc' }, { tipoAlerta: 'asc' }],
    });
    return respuestaExito(res, reglas);
  } catch (error) { return next(error); }
});

const esquemaRegla = z.object({
  nombre:                    z.string().min(2).max(200),
  descripcion:               z.string().max(500).optional(),
  tipoAlerta:                z.nativeEnum(TipoAlertaRegla),
  umbralValor:               z.number().optional(),
  umbralUnidad:              z.string().max(50).optional(),
  activa:                    z.boolean().default(true),
  notificarAdministrador:    z.boolean().default(true),
  notificarVeterinario:      z.boolean().default(true),
  notificarTecnico:          z.boolean().default(false),
});

// POST /api/v1/alertas — crear regla de alerta
enrutador.post('/', soloAdministrador, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const datos = esquemaRegla.parse(req.body);
    const regla = await prisma.reglaAlerta.create({
      data: { ...datos, creadoPorId: req.usuarioActual!.id },
    });
    return respuestaCreado(res, regla);
  } catch (error) { return next(error); }
});

// PATCH /api/v1/alertas/:id — actualizar regla
enrutador.patch('/:id', soloAdministrador, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const datos = esquemaRegla.partial().parse(req.body);
    const regla = await prisma.reglaAlerta.update({
      where: { id: req.params.id },
      data: datos,
    });
    return respuestaExito(res, regla);
  } catch (error) { return next(error); }
});

export default enrutador;
