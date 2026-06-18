import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  verificarToken,
  soloAdministrador,
  cualquierRol,
} from '../../compartido/middlewares/autenticacion';
import { registrarAuditoria } from '../../compartido/middlewares/auditoria';
import {
  controladorListarUsuarios,
  controladorObtenerUsuario,
  controladorCrearUsuario,
  controladorActualizarUsuario,
  controladorCambiarContrasena,
  controladorDesbloquearUsuario,
  controladorEliminarUsuario,
} from './usuarios.controlador';
import { actualizarUsuario } from './usuarios.servicio';
import { respuestaExito } from '../../compartido/utilidades/respuestaHttp';

const enrutador = Router();

enrutador.use(verificarToken);

// ── Rutas de auto-servicio (deben ir ANTES de /:id para no ser capturadas) ──

// GET /api/v1/usuarios/mi-perfil — perfil del usuario autenticado
enrutador.get('/mi-perfil', cualquierRol, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prisma } = await import('../../compartido/prisma/clientePrisma');
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuarioActual!.id },
      select: { id: true, nombre: true, apellido: true, correo: true, rol: true, cargo: true, telefono: true },
    });
    return respuestaExito(res, usuario);
  } catch (error) { return next(error); }
});

// PATCH /api/v1/usuarios/mi-perfil — actualizar propio perfil
enrutador.patch('/mi-perfil', cualquierRol, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const datos = z.object({
      nombre:   z.string().min(2).max(100).optional(),
      apellido: z.string().min(2).max(100).optional(),
      cargo:    z.string().max(100).optional(),
      telefono: z.string().max(20).optional(),
    }).parse(req.body);

    const usuario = await actualizarUsuario(req.usuarioActual!.id, datos);
    return respuestaExito(res, usuario);
  } catch (error) { return next(error); }
});

// PATCH /api/v1/usuarios/cambiar-contrasena — cambiar propia contraseña
enrutador.patch('/cambiar-contrasena', cualquierRol, controladorCambiarContrasena);

// ── Rutas de administrador ──────────────────────────────────────────────────

enrutador.get('/', soloAdministrador, controladorListarUsuarios);
enrutador.get('/:id', soloAdministrador, controladorObtenerUsuario);

enrutador.post(
  '/',
  soloAdministrador,
  registrarAuditoria('Crear usuario', 'Usuario'),
  controladorCrearUsuario,
);

enrutador.patch(
  '/:id',
  soloAdministrador,
  registrarAuditoria('Actualizar usuario', 'Usuario'),
  controladorActualizarUsuario,
);

enrutador.patch(
  '/:id/desbloquear',
  soloAdministrador,
  registrarAuditoria('Desbloquear usuario', 'Usuario'),
  controladorDesbloquearUsuario,
);

enrutador.delete(
  '/:id',
  soloAdministrador,
  registrarAuditoria('Eliminar usuario', 'Usuario'),
  controladorEliminarUsuario,
);

export default enrutador;
