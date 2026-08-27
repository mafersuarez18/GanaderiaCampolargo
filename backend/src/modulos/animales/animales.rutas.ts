import { Router } from 'express';
import {
  verificarToken,
  requerirPrivilegio,
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
enrutador.get('/razas', requerirPrivilegio('animales.ver'), controladorListarRazas);

// GET /api/v1/animales/arete/:arete
enrutador.get('/arete/:arete', requerirPrivilegio('animales.ver'), controladorBuscarPorArete);

// GET /api/v1/animales
enrutador.get('/', requerirPrivilegio('animales.ver'), controladorListarAnimales);

// GET /api/v1/animales/:id
enrutador.get('/:id', requerirPrivilegio('animales.ver'), controladorObtenerAnimal);

// POST /api/v1/animales
enrutador.post(
  '/',
  requerirPrivilegio('animales.crear'),
  registrarAuditoria('Registrar animal', 'Animal'),
  controladorCrearAnimal,
);

// PATCH /api/v1/animales/:id
enrutador.patch(
  '/:id',
  requerirPrivilegio('animales.editar'),
  registrarAuditoria('Actualizar animal', 'Animal'),
  controladorActualizarAnimal,
);

// DELETE /api/v1/animales/:id
enrutador.delete(
  '/:id',
  requerirPrivilegio('animales.eliminar'),
  registrarAuditoria('Eliminar animal', 'Animal'),
  controladorEliminarAnimal,
);

export default enrutador;
