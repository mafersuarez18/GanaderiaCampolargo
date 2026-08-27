import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { entorno } from '../../config/entorno';
import { ErrorNoAutorizado, ErrorForbidden } from '../tipos/respuesta';

// Extiende el tipo Request de Express para incluir el usuario autenticado
declare global {
  namespace Express {
    interface Request {
      usuarioActual?: UsuarioToken;
    }
  }
}

export interface UsuarioToken {
  id: string;
  correo: string;
  rolId: string;
  rolNombre: string;
  privilegios: string[];
  nombre: string;
  apellido: string;
}

interface PayloadJWT {
  sub: string;
  correo: string;
  rolId: string;
  rolNombre: string;
  privilegios: string[];
  nombre: string;
  apellido: string;
  iat: number;
  exp: number;
}

// Verifica que el token JWT sea válido
export function verificarToken(req: Request, _res: Response, siguiente: NextFunction): void {
  const encabezadoAutorizacion = req.headers.authorization;

  if (!encabezadoAutorizacion?.startsWith('Bearer ')) {
    throw new ErrorNoAutorizado('Token de acceso no proporcionado');
  }

  const token = encabezadoAutorizacion.slice(7);

  try {
    const payload = jwt.verify(token, entorno.JWT_SECRETO) as PayloadJWT;

    req.usuarioActual = {
      id: payload.sub,
      correo: payload.correo,
      rolId: payload.rolId,
      rolNombre: payload.rolNombre,
      privilegios: payload.privilegios,
      nombre: payload.nombre,
      apellido: payload.apellido,
    };

    siguiente();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ErrorNoAutorizado('El token de acceso ha expirado');
    }
    throw new ErrorNoAutorizado('Token de acceso inválido');
  }
}

// Acceso para cualquier usuario autenticado, sin exigir un privilegio en particular
// (recursos de auto-servicio como el propio perfil, o listados con alcance por usuario)
export function autenticado(req: Request, _res: Response, siguiente: NextFunction): void {
  if (!req.usuarioActual) {
    throw new ErrorNoAutorizado();
  }
  siguiente();
}

// Verifica que el usuario tenga al menos uno de los privilegios requeridos,
// según los privilegios asignados a su rol (embebidos en el token de acceso)
export function requerirPrivilegio(...codigosPermitidos: string[]) {
  return (req: Request, _res: Response, siguiente: NextFunction): void => {
    if (!req.usuarioActual) {
      throw new ErrorNoAutorizado();
    }

    const tienePrivilegio = codigosPermitidos.some((codigo) =>
      req.usuarioActual!.privilegios.includes(codigo)
    );

    if (!tienePrivilegio) {
      throw new ErrorForbidden(
        `Acceso denegado. Se requiere el privilegio: ${codigosPermitidos.join(' o ')}`
      );
    }

    siguiente();
  };
}
