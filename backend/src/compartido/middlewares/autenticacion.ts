import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { entorno } from '../../config/entorno';
import { ErrorNoAutorizado, ErrorForbidden } from '../tipos/respuesta';
import { RolUsuario } from '@prisma/client';

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
  rol: RolUsuario;
  nombre: string;
  apellido: string;
}

interface PayloadJWT {
  sub: string;
  correo: string;
  rol: RolUsuario;
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
      rol: payload.rol,
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

// Verifica que el usuario tenga al menos uno de los roles requeridos
export function requerirRol(...rolesPermitidos: RolUsuario[]) {
  return (req: Request, _res: Response, siguiente: NextFunction): void => {
    if (!req.usuarioActual) {
      throw new ErrorNoAutorizado();
    }

    if (!rolesPermitidos.includes(req.usuarioActual.rol)) {
      throw new ErrorForbidden(
        `Acceso denegado. Se requiere rol: ${rolesPermitidos.join(' o ')}`
      );
    }

    siguiente();
  };
}

// Acceso solo para administradores
export const soloAdministrador = requerirRol(RolUsuario.ADMINISTRADOR);

// Acceso para administradores y veterinarios
export const administradorOVeterinario = requerirRol(
  RolUsuario.ADMINISTRADOR,
  RolUsuario.VETERINARIO
);

// Acceso para cualquier usuario autenticado
export const cualquierRol = requerirRol(
  RolUsuario.ADMINISTRADOR,
  RolUsuario.VETERINARIO,
  RolUsuario.TECNICO
);
