import { Router } from 'express';
import { verificarToken, autenticado } from '../../compartido/middlewares/autenticacion';
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
enrutador.get('/', autenticado, controladorListarNotificaciones);

// GET /api/v1/notificaciones/no-leidas/conteo
enrutador.get('/no-leidas/conteo', autenticado, controladorContarNoLeidas);

// PATCH /api/v1/notificaciones/marcar-todas-leidas
enrutador.patch('/marcar-todas-leidas', autenticado, controladorMarcarTodasLeidas);

// PATCH /api/v1/notificaciones/:id/leer
enrutador.patch('/:id/leer', autenticado, controladorMarcarLeida);

// PATCH /api/v1/notificaciones/abordar-todas
enrutador.patch('/abordar-todas', autenticado, controladorAbordarTodasNotificaciones);

// PATCH /api/v1/notificaciones/:id/abordar
enrutador.patch('/:id/abordar', autenticado, controladorAbordarNotificacion);

// DELETE /api/v1/notificaciones/:id
enrutador.delete('/:id', autenticado, controladorEliminarNotificacion);

export default enrutador;
