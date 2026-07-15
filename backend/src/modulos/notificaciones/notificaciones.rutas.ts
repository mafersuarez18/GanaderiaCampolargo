import { Router } from 'express';
import { verificarToken, cualquierRol } from '../../compartido/middlewares/autenticacion';
import {
  controladorListarNotificaciones,
  controladorContarNoLeidas,
  controladorMarcarLeida,
  controladorMarcarTodasLeidas,
  controladorEliminarNotificacion,
  controladorAbordarNotificacion,
  controladorAbordarTodasNotificaciones,
} from './notificaciones.controlador';

const enrutador = Router();

enrutador.use(verificarToken);

// GET /api/v1/notificaciones
enrutador.get('/', cualquierRol, controladorListarNotificaciones);

// GET /api/v1/notificaciones/no-leidas/conteo
enrutador.get('/no-leidas/conteo', cualquierRol, controladorContarNoLeidas);

// PATCH /api/v1/notificaciones/marcar-todas-leidas
enrutador.patch('/marcar-todas-leidas', cualquierRol, controladorMarcarTodasLeidas);

// PATCH /api/v1/notificaciones/:id/leer
enrutador.patch('/:id/leer', cualquierRol, controladorMarcarLeida);

// PATCH /api/v1/notificaciones/abordar-todas
enrutador.patch('/abordar-todas', cualquierRol, controladorAbordarTodasNotificaciones);

// PATCH /api/v1/notificaciones/:id/abordar
enrutador.patch('/:id/abordar', cualquierRol, controladorAbordarNotificacion);

// DELETE /api/v1/notificaciones/:id
enrutador.delete('/:id', cualquierRol, controladorEliminarNotificacion);

export default enrutador;
