import { Router } from 'express';
import { verificarToken } from '../../compartido/middlewares/autenticacion';
import * as controlador from './autenticacion.controlador';

const enrutador = Router();

/**
 * @swagger
 * /auth/iniciar-sesion:
 *   post:
 *     summary: Iniciar sesión en el sistema
 *     tags: [Autenticación]
 */
enrutador.post('/iniciar-sesion', controlador.iniciarSesion);

/**
 * @swagger
 * /auth/renovar-token:
 *   post:
 *     summary: Renovar token de acceso usando refresh token
 *     tags: [Autenticación]
 */
enrutador.post('/renovar-token', controlador.renovarToken);

/**
 * @swagger
 * /auth/cerrar-sesion:
 *   post:
 *     summary: Cerrar sesión e invalidar tokens
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 */
enrutador.post('/cerrar-sesion', verificarToken, controlador.cerrarSesion);

/**
 * @swagger
 * /auth/perfil:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 */
enrutador.get('/perfil', verificarToken, controlador.obtenerPerfil);

export default enrutador;
