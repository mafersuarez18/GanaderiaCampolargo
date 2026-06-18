import { Router } from 'express';
import {
  verificarToken,
  soloAdministrador,
  administradorOVeterinario,
  cualquierRol,
} from '../../compartido/middlewares/autenticacion';
import { registrarAuditoria } from '../../compartido/middlewares/auditoria';
import {
  controladorListarAnimales,
  controladorObtenerAnimal,
  controladorBuscarPorArete,
  controladorCrearAnimal,
  controladorActualizarAnimal,
  controladorEliminarAnimal,
  controladorListarRazas,
} from './animales.controlador';

const enrutador = Router();

enrutador.use(verificarToken);

// GET /api/v1/animales/razas — debe ir antes que /:id para no confundirse con el param
enrutador.get('/razas', cualquierRol, controladorListarRazas);

// GET /api/v1/animales/arete/:arete
enrutador.get('/arete/:arete', cualquierRol, controladorBuscarPorArete);

// GET /api/v1/animales
enrutador.get('/', cualquierRol, controladorListarAnimales);

// GET /api/v1/animales/:id
enrutador.get('/:id', cualquierRol, controladorObtenerAnimal);

// POST /api/v1/animales
enrutador.post(
  '/',
  administradorOVeterinario,
  registrarAuditoria('Registrar animal', 'Animal'),
  controladorCrearAnimal,
);

// PATCH /api/v1/animales/:id
enrutador.patch(
  '/:id',
  administradorOVeterinario,
  registrarAuditoria('Actualizar animal', 'Animal'),
  controladorActualizarAnimal,
);

// DELETE /api/v1/animales/:id
enrutador.delete(
  '/:id',
  soloAdministrador,
  registrarAuditoria('Eliminar animal', 'Animal'),
  controladorEliminarAnimal,
);

export default enrutador;
