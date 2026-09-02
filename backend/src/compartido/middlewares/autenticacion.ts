import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { entorno } from '../../config/entorno';
import { ErrorNoAutorizado, ErrorForbidden } from '../tipos/respuesta';

// Se amplía el Request de Express para poder colgar del objeto `req` los
// datos del usuario autenticado, una vez verificado el token.
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

/**
 * Exige un token JWT válido en el header Authorization (Bearer) y, si lo es,
 * deja los datos del usuario disponibles en `req.usuarioActual` para el
 * resto de la cadena de middlewares/controladores.
 */
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

// Solo exige que exista una sesión válida, sin pedir un privilegio en
// concreto — para recursos de autoservicio (por ejemplo, el propio perfil)
// donde basta con estar identificado.
export function autenticado(req: Request, _res: Response, siguiente: NextFunction): void {
  if (!req.usuarioActual) {
    throw new ErrorNoAutorizado();
  }
  siguiente();
}

/**
 * Exige que el usuario tenga al menos uno de los privilegios indicados.
 * Los privilegios del usuario ya vienen embebidos en el token de acceso
 * (se resolvieron a partir de su rol al iniciar sesión), así que esta
 * verificación no necesita consultar la base de datos.
 */
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
