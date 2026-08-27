import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  listarRoles,
  obtenerRolPorId,
  crearRol,
  actualizarRol,
  reemplazarPrivilegiosRol,
  eliminarRol,
  listarPrivilegios,
  crearPrivilegio,
} from './roles.servicio';
import {
  respuestaExito,
  respuestaCreado,
  respuestaSinContenido,
} from '../../compartido/utilidades/respuestaHttp';

const esquemaCrearRol = z.object({
  nombre: z.string().min(2).max(100),
  descripcion: z.string().max(300).optional(),
  privilegioIds: z.array(z.string().min(1)).optional(),
});

const esquemaActualizarRol = z.object({
  nombre: z.string().min(2).max(100).optional(),
  descripcion: z.string().max(300).optional(),
});

const esquemaPrivilegiosRol = z.object({
  privilegioIds: z.array(z.string().min(1)),
});

const esquemaCrearPrivilegio = z.object({
  descripcion: z.string().min(2).max(150),
});

export async function controladorListarRoles(_req: Request, res: Response, next: NextFunction) {
  try {
    const roles = await listarRoles();
    return respuestaExito(res, roles);
  } catch (error) { return next(error); }
}

export async function controladorObtenerRol(req: Request, res: Response, next: NextFunction) {
  try {
    const rol = await obtenerRolPorId(req.params['id'] as string);
    return respuestaExito(res, rol);
  } catch (error) { return next(error); }
}

export async function controladorCrearRol(req: Request, res: Response, next: NextFunction) {
  try {
    const datos = esquemaCrearRol.parse(req.body);
    const rol = await crearRol(datos);
    return respuestaCreado(res, rol);
  } catch (error) { return next(error); }
}

export async function controladorActualizarRol(req: Request, res: Response, next: NextFunction) {
  try {
    const datos = esquemaActualizarRol.parse(req.body);
    const rol = await actualizarRol(req.params['id'] as string, datos);
    return respuestaExito(res, rol);
  } catch (error) { return next(error); }
}

export async function controladorAsignarPrivilegios(req: Request, res: Response, next: NextFunction) {
  try {
    const { privilegioIds } = esquemaPrivilegiosRol.parse(req.body);
    const rol = await reemplazarPrivilegiosRol(req.params['id'] as string, privilegioIds);
    return respuestaExito(res, rol, 'Privilegios actualizados correctamente');
  } catch (error) { return next(error); }
}

export async function controladorEliminarRol(req: Request, res: Response, next: NextFunction) {
  try {
    await eliminarRol(req.params['id'] as string);
    return respuestaSinContenido(res);
  } catch (error) { return next(error); }
}

export async function controladorListarPrivilegios(_req: Request, res: Response, next: NextFunction) {
  try {
    const privilegios = await listarPrivilegios();
    return respuestaExito(res, privilegios);
  } catch (error) { return next(error); }
}

export async function controladorCrearPrivilegio(req: Request, res: Response, next: NextFunction) {
  try {
    const { descripcion } = esquemaCrearPrivilegio.parse(req.body);
    const privilegio = await crearPrivilegio(descripcion);
    return respuestaCreado(res, privilegio);
  } catch (error) { return next(error); }
}
