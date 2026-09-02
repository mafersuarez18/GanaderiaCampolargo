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

// "abordar" (estado DESCARTADA) es distinto de "leer": una notificación
// leída sigue contando como pendiente hasta que el usuario la resuelve o
// el sistema la resuelve automáticamente (ver resolverNotificacionesDeEntidad).

// GET /api/notificaciones
enrutador.get('/', autenticado, controladorListarNotificaciones);

// GET /api/notificaciones/no-leidas/conteo
enrutador.get('/no-leidas/conteo', autenticado, controladorContarNoLeidas);

// PATCH /api/notificaciones/marcar-todas-leidas
enrutador.patch('/marcar-todas-leidas', autenticado, controladorMarcarTodasLeidas);

// PATCH /api/notificaciones/:id/leer
enrutador.patch('/:id/leer', autenticado, controladorMarcarLeida);

// PATCH /api/notificaciones/abordar-todas
enrutador.patch('/abordar-todas', autenticado, controladorAbordarTodasNotificaciones);

// PATCH /api/notificaciones/:id/abordar
enrutador.patch('/:id/abordar', autenticado, controladorAbordarNotificacion);

// DELETE /api/notificaciones/:id
enrutador.delete('/:id', autenticado, controladorEliminarNotificacion);

export default enrutador;
