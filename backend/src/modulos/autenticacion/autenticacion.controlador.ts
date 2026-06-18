import { Request, Response } from 'express';
import { z } from 'zod';
import * as servicioAuth from './autenticacion.servicio';
import { respuestaExito } from '../../compartido/utilidades/respuestaHttp';

const esquemaInicioSesion = z.object({
  correo: z.string().email('Correo electrónico inválido'),
  contrasena: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const esquemaRenovarToken = z.object({
  tokenRefresh: z.string().min(1, 'Token de renovación requerido'),
});

export async function iniciarSesion(req: Request, res: Response): Promise<void> {
  const datos = esquemaInicioSesion.parse(req.body);
  const resultado = await servicioAuth.iniciarSesion(datos);
  respuestaExito(res, resultado, 'Sesión iniciada correctamente');
}

export async function renovarToken(req: Request, res: Response): Promise<void> {
  const { tokenRefresh } = esquemaRenovarToken.parse(req.body);
  const resultado = await servicioAuth.renovarToken(tokenRefresh);
  respuestaExito(res, resultado, 'Token renovado correctamente');
}

export async function cerrarSesion(req: Request, res: Response): Promise<void> {
  await servicioAuth.cerrarSesion(req.usuarioActual!.id);
  respuestaExito(res, null, 'Sesión cerrada correctamente');
}

export async function obtenerPerfil(req: Request, res: Response): Promise<void> {
  respuestaExito(res, req.usuarioActual, 'Perfil obtenido correctamente');
}
