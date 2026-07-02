import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ClasificacionIA, TecnicaDeposicionSemen, NivelEstres } from '@prisma/client';
import { verificarToken, administradorOVeterinario, cualquierRol } from '../../compartido/middlewares/autenticacion';
import { registrarAuditoria } from '../../compartido/middlewares/auditoria';
import { prisma } from '../../compartido/prisma/clientePrisma';
import { respuestaExito, respuestaCreado, respuestaListado } from '../../compartido/utilidades/respuestaHttp';
import { calcularPaginacion, construirMeta } from '../../compartido/utilidades/paginacion';
import { ErrorNoEncontrado, ErrorConflicto } from '../../compartido/tipos/respuesta';

const enrutador = Router();

enrutador.use(verificarToken);

// GET /api/v1/inseminacion/sementales — listado de sementales
enrutador.get('/sementales', cualquierRol, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const sementales = await prisma.semental.findMany({
      include: {
        raza: { select: { nombre: true } },
        _count: { select: { inventariosSemen: true } },
      },
      orderBy: { nombre: 'asc' },
    });
    return respuestaExito(res, sementales);
  } catch (error) { return next(error); }
});

// POST /api/v1/inseminacion/sementales — registrar semental
enrutador.post('/sementales', administradorOVeterinario, registrarAuditoria('Registrar semental', 'Semental'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const datos = z.object({
      nombre:        z.string().min(1).max(200),
      registro:      z.string().max(100).optional(),
      origen:        z.string().max(200).optional(),
      razaId:        z.string().min(1),
      activo:        z.boolean().default(true),
      observaciones: z.string().max(500).optional(),
    }).parse(req.body);

    const semental = await prisma.semental.create({
      data: datos,
      include: {
        raza: { select: { nombre: true } },
        _count: { select: { inventariosSemen: true } },
      },
    });
    return respuestaCreado(res, semental);
  } catch (error) { return next(error); }
});

// GET /api/v1/inseminacion/inventario — inventario de semen
enrutador.get('/inventario', cualquierRol, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pagina, porPagina } = z.object({
      pagina: z.coerce.number().int().positive().default(1),
      porPagina: z.coerce.number().int().positive().max(100).default(20),
    }).parse(req.query);

    const [registros, total] = await prisma.$transaction([
      prisma.inventarioSemen.findMany({
        include: { semental: { select: { nombre: true } } },
        orderBy: { creadoEn: 'desc' },
        skip: (pagina - 1) * porPagina,
        take: porPagina,
      }),
      prisma.inventarioSemen.count(),
    ]);

    const { pagina: p, porPagina: pp } = calcularPaginacion(pagina, porPagina);
    return respuestaListado(res, registros, construirMeta(total, p, pp));
  } catch (error) { return next(error); }
});

// POST /api/v1/inseminacion/inventario — registrar lote de semen
enrutador.post('/inventario', administradorOVeterinario, registrarAuditoria('Registrar lote de semen', 'InventarioSemen'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const datos = z.object({
      sementalId:       z.string().min(1),
      codigoDosis:      z.string().min(1).max(100),
      cantidadDosis:    z.number().int().positive(),
      motivilidad:      z.number().min(0).max(100).optional(),
      concentracion:    z.number().positive().optional(),
      volumen:          z.number().positive().optional(),
      coloracion:       z.string().max(100).optional(),
      temperatura:      z.number().optional(),
      fechaColeccion:   z.coerce.date().optional(),
      fechaVencimiento: z.coerce.date().optional(),
      observaciones:    z.string().max(500).optional(),
    }).parse(req.body);

    // Verificar que el semental existe
    const semental = await prisma.semental.findUnique({
      where: { id: datos.sementalId },
      select: { id: true, nombre: true },
    });
    if (!semental) throw new ErrorNoEncontrado('Semental');

    const lote = await prisma.inventarioSemen.create({
      data: datos,
      include: { semental: { select: { nombre: true } } },
    });
    return respuestaCreado(res, lote);
  } catch (error) { return next(error); }
});

// GET /api/v1/inseminacion — listado de inseminaciones (via eventos reproductivos)
enrutador.get('/', cualquierRol, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filtros = z.object({
      animalId:  z.string().min(1).optional(),
      fincaId:   z.string().min(1).optional(),
      pagina:    z.coerce.number().int().positive().default(1),
      porPagina: z.coerce.number().int().positive().max(100).default(20),
    }).parse(req.query);

    const donde = {
      tipo: 'INSEMINACION_ARTIFICIAL' as const,
      ...(filtros.animalId && { animalId: filtros.animalId }),
      ...(filtros.fincaId  && { animal: { fincaId: filtros.fincaId } }),
    };

    const [registros, total] = await prisma.$transaction([
      prisma.eventoReproductivo.findMany({
        where: donde,
        select: {
          id: true, tipo: true, fecha: true, observaciones: true,
          animal: { select: { id: true, numeroArete: true, nombre: true } },
          registradoPor: { select: { nombre: true, apellido: true } },
          inseminacion: {
            select: {
              id: true,
              fechaInseminacion: true,
              numeroIntento: true,
              clasificacionIA: true,
              tecnicaDeposicion: true,
              patologiasVaca: true,
              tasaMetabolicaBasal: true,
              balanceEnergetico: true,
              temperaturaUterina: true,
              manejoHato: true,
              observaciones: true,
              inventarioSemen: {
                select: {
                  id: true,
                  codigoDosis: true,
                  temperatura: true,
                  semental: { select: { nombre: true } },
                },
              },
            },
          },
        },
        orderBy: { fecha: 'desc' },
        skip: (filtros.pagina - 1) * filtros.porPagina,
        take: filtros.porPagina,
      }),
      prisma.eventoReproductivo.count({ where: donde }),
    ]);

    const { pagina, porPagina } = calcularPaginacion(filtros.pagina, filtros.porPagina);
    return respuestaListado(res, registros, construirMeta(total, pagina, porPagina));
  } catch (error) { return next(error); }
});

// POST /api/v1/inseminacion — registrar inseminación
enrutador.post('/', administradorOVeterinario, registrarAuditoria('Registrar inseminación', 'InseminacionArtificial'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const datos = z.object({
      receptoraId:         z.string().min(1),
      inventarioSemenId:   z.string().min(1),
      fecha:               z.coerce.date(),
      numeroIntento:       z.number().int().positive().default(1),
      observaciones:       z.string().max(500).optional(),
      // Clasificación
      clasificacionIA:     z.nativeEnum(ClasificacionIA).optional(),
      tecnicaDeposicion:   z.nativeEnum(TecnicaDeposicionSemen).optional(),
      // Factores biológicos
      patologiasVaca:      z.string().max(1000).optional(),
      tasaMetabolicaBasal: z.number().int().min(1).max(5).optional(),
      balanceEnergetico:   z.string().max(200).optional(),
      // Estrés térmico
      temperaturaUterina:  z.number().optional(),
      // Manejo del hato
      manejoHato:          z.nativeEnum(NivelEstres).optional(),
    }).parse(req.body);

    // Validar inventario disponible
    const inventario = await prisma.inventarioSemen.findUnique({
      where: { id: datos.inventarioSemenId },
      select: { cantidadDosis: true, cantidadUsada: true, codigoDosis: true },
    });
    if (!inventario) throw new ErrorNoEncontrado('Lote de semen');
    if (inventario.cantidadDosis - inventario.cantidadUsada < 1) {
      throw new ErrorConflicto(`No hay dosis disponibles del lote ${inventario.codigoDosis}`);
    }

    const {
      receptoraId, inventarioSemenId, fecha, numeroIntento, observaciones,
      clasificacionIA, tecnicaDeposicion, patologiasVaca,
      tasaMetabolicaBasal, balanceEnergetico, temperaturaUterina, manejoHato,
    } = datos;

    const [evento] = await prisma.$transaction([
      prisma.eventoReproductivo.create({
        data: {
          tipo:          'INSEMINACION_ARTIFICIAL',
          fecha,
          observaciones,
          animal:        { connect: { id: receptoraId } },
          registradoPor: { connect: { id: req.usuarioActual!.id } },
          inseminacion: {
            create: {
              fechaInseminacion:  fecha,
              numeroIntento,
              observaciones,
              inventarioSemen:    { connect: { id: inventarioSemenId } },
              clasificacionIA,
              tecnicaDeposicion,
              patologiasVaca,
              tasaMetabolicaBasal,
              balanceEnergetico,
              temperaturaUterina,
              manejoHato,
            },
          },
        },
      }),
      prisma.inventarioSemen.update({
        where: { id: inventarioSemenId },
        data: { cantidadUsada: { increment: 1 } },
      }),
    ]);

    return respuestaCreado(res, evento);
  } catch (error) { return next(error); }
});

export default enrutador;
