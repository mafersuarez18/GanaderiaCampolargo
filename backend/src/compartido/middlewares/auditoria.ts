import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma/clientePrisma';
import { TipoAccionAuditoria } from '@prisma/client';
import { logger } from '../../config/logger';

// Mapea el método HTTP al tipo de acción de auditoría
function obtenerTipoAccion(metodo: string): TipoAccionAuditoria {
  switch (metodo.toUpperCase()) {
    case 'POST':   return TipoAccionAuditoria.CREAR;
    case 'GET':    return TipoAccionAuditoria.LEER;
    case 'PUT':
    case 'PATCH':  return TipoAccionAuditoria.ACTUALIZAR;
    case 'DELETE': return TipoAccionAuditoria.ELIMINAR;
    default:       return TipoAccionAuditoria.LEER;
  }
}

// Extrae el nombre del módulo desde la URL
function extraerModulo(url: string): string {
  const segmentos = url.replace('/api/', '').split('/');
  return segmentos[0] ?? 'desconocido';
}

// Middleware para registrar acciones importantes en la auditoría
// Solo registra mutaciones (POST, PUT, PATCH, DELETE)
export function registrarAuditoria(
  descripcion: string,
  entidadTipo?: string
) {
  return async (req: Request, res: Response, siguiente: NextFunction): Promise<void> => {
    // Solo auditar mutaciones
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      siguiente();
      return;
    }

    const accion = obtenerTipoAccion(req.method);
    const modulo = extraerModulo(req.path);
    const usuarioId = req.usuarioActual?.id;

    // Capturar el body original antes de que sea procesado
    const datosEntrada = req.body ? { ...req.body } : undefined;

    // Eliminar contraseñas del log por seguridad
    if (datosEntrada?.contrasena) datosEntrada.contrasena = '[OCULTO]';
    if (datosEntrada?.tokenRefresh) datosEntrada.tokenRefresh = '[OCULTO]';

    // Continuar con la solicitud y capturar el resultado
    const respuestaOriginal = res.json.bind(res);
    let exitosa = true;
    let errorMensaje: string | undefined;

    res.json = function (cuerpo: unknown) {
      if (res.statusCode >= 400) {
        exitosa = false;
        if (cuerpo && typeof cuerpo === 'object' && 'mensaje' in cuerpo) {
          errorMensaje = (cuerpo as { mensaje: string }).mensaje;
        }
      }
      return respuestaOriginal(cuerpo);
    };

    siguiente();

    // Registrar después de que la respuesta sea enviada
    res.on('finish', () => {
      prisma.registroAuditoria.create({
        data: {
          accion,
          modulo,
          descripcion,
          entidadTipo,
          entidadId: req.params.id,
          datosNuevos: datosEntrada as object,
          direccionIP: req.ip ?? req.socket.remoteAddress,
          agenteUsuario: req.headers['user-agent'],
          exitosa,
          errorMensaje,
          usuarioId: usuarioId ?? null,
        },
      }).catch((err: Error) => {
        logger.warn('Error al registrar auditoría', { error: err.message });
      });
    });
  };
}
