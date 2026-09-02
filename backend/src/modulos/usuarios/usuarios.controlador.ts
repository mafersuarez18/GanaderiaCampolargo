import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { EstadoUsuario } from '@prisma/client';
import {
  listarUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  cambiarContrasena,
  desbloquearUsuario,
  eliminarUsuario,
} from './usuarios.servicio';
import {
  respuestaExito,
  respuestaCreado,
  respuestaSinContenido,
} from '../../compartido/utilidades/respuestaHttp';

// Gestión de cuentas de usuario. El cambio de contraseña vive en su propio
// endpoint (exige la contraseña actual) en vez de pasar por
// controladorActualizarUsuario, que es de uso administrativo.

const esquemaCrear = z.object({
  nombre:     z.string().min(2).max(100),
  apellido:   z.string().min(2).max(100),
  correo:     z.string().email(),
  contrasena: z.string().min(8).max(128),
  rolId:      z.string().min(1),
});

const esquemaActualizar = z.object({
  nombre:   z.string().min(2).max(100).optional(),
  apellido: z.string().min(2).max(100).optional(),
  rolId:    z.string().min(1).optional(),
  estado:   z.nativeEnum(EstadoUsuario).optional(),
  cargo:    z.string().max(100).optional(),
  telefono: z.string().max(20).optional(),
});

const esquemaCambiarContrasena = z.object({
  contrasenaActual: z.string().min(1),
  nuevaContrasena:  z.string().min(8).max(128),
});

export async function controladorListarUsuarios(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const { busqueda, rolId } = z.object({
      busqueda: z.string().optional(),
      rolId: z.string().optional(),
    }).parse(req.query);
    const usuarios = await listarUsuarios(busqueda, rolId);
    return respuestaExito(res, usuarios);
  } catch (error) { return next(error); }
}

export async function controladorObtenerUsuario(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const usuario = await obtenerUsuarioPorId(req.params['id'] as string);
    return respuestaExito(res, usuario);
  } catch (error) { return next(error); }
}

export async function controladorCrearUsuario(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const datos = esquemaCrear.parse(req.body);
    const usuario = await crearUsuario(datos);
    return respuestaCreado(res, usuario);
  } catch (error) { return next(error); }
}

export async function controladorActualizarUsuario(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const datos = esquemaActualizar.parse(req.body);
    const usuario = await actualizarUsuario(req.params['id'] as string, datos);
    return respuestaExito(res, usuario);
  } catch (error) { return next(error); }
}

export async function controladorCambiarContrasena(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const { contrasenaActual, nuevaContrasena } = esquemaCambiarContrasena.parse(req.body);
    await cambiarContrasena(req.usuarioActual!.id, contrasenaActual, nuevaContrasena);
    return respuestaExito(res, { mensaje: 'Contraseña actualizada correctamente' });
  } catch (error) { return next(error); }
}

export async function controladorDesbloquearUsuario(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    const usuario = await desbloquearUsuario(req.params['id'] as string);
    return respuestaExito(res, usuario);
  } catch (error) { return next(error); }
}

export async function controladorEliminarUsuario(
  req: Request, res: Response, next: NextFunction,
) {
  try {
    await eliminarUsuario(req.params['id'] as string, req.usuarioActual!.id);
    return respuestaSinContenido(res);
  } catch (error) { return next(error); }
}
