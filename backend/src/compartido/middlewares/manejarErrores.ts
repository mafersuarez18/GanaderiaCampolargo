import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '../../config/logger';
import { ErrorAplicacion, ErrorValidacionDatos, ErrorNoEncontrado, ErrorConflicto } from '../tipos/respuesta';

// Manejador global de errores de Express 5
export function manejarErrores(
  error: Error,
  req: Request,
  res: Response,
  _siguiente: NextFunction
): void {
  // Error de validación con Zod
  if (error instanceof ZodError) {
    const erroresFormateados = error.errors.map((e) => ({
      campo: e.path.join('.'),
      mensaje: e.message,
    }));
    res.status(422).json({
      exito: false,
      mensaje: 'Datos de entrada inválidos',
      errores: erroresFormateados,
    });
    return;
  }

  // Error de validación personalizado
  if (error instanceof ErrorValidacionDatos) {
    res.status(422).json({
      exito: false,
      mensaje: error.message,
      errores: error.errores,
    });
    return;
  }

  // Errores de aplicación (operacionales)
  if (error instanceof ErrorAplicacion) {
    if (error.codigoHttp >= 500) {
      logger.error('Error de aplicación', { mensaje: error.message, ruta: req.path });
    }
    res.status(error.codigoHttp).json({
      exito: false,
      mensaje: error.message,
    });
    return;
  }

  // Errores de Prisma
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      // Violación de restricción única
      const campo = (error.meta?.target as string[])?.join(', ') ?? 'campo';
      res.status(409).json({
        exito: false,
        mensaje: `Ya existe un registro con ese ${campo}`,
      });
      return;
    }

    if (error.code === 'P2025') {
      // Registro no encontrado para actualizar/eliminar
      res.status(404).json({
        exito: false,
        mensaje: 'Registro no encontrado',
      });
      return;
    }

    if (error.code === 'P2003') {
      // Violación de clave foránea
      res.status(409).json({
        exito: false,
        mensaje: 'No se puede realizar la operación: existe una referencia a este registro',
      });
      return;
    }
  }

  // Error desconocido (no operacional)
  logger.error('Error no controlado', {
    mensaje: error.message,
    pila: error.stack,
    ruta: req.path,
    metodo: req.method,
  });

  res.status(500).json({
    exito: false,
    mensaje: 'Ocurrió un error interno. Por favor, contacte al administrador del sistema.',
  });
}

// Manejador de rutas no encontradas
export function rutaNoEncontrada(req: Request, res: Response): void {
  res.status(404).json({
    exito: false,
    mensaje: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
}
