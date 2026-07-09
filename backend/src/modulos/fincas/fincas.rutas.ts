import { Router } from 'express';
import {
  verificarToken,
  soloAdministrador,
  administradorOVeterinario,
  cualquierRol,
} from '../../compartido/middlewares/autenticacion';
import { registrarAuditoria } from '../../compartido/middlewares/auditoria';
import {
  controladorListarFincas,
  controladorObtenerFinca,
  controladorCrearFinca,
  controladorActualizarFinca,
  controladorEliminarFinca,
  controladorAnimalesDeFinca,
} from './fincas.controlador';

const enrutador = Router();

enrutador.use(verificarToken);

// GET /api/v1/fincas
enrutador.get('/', cualquierRol, controladorListarFincas);

// GET /api/v1/fincas/:id
enrutador.get('/:id', cualquierRol, controladorObtenerFinca);

// GET /api/v1/fincas/:id/animales
enrutador.get('/:id/animales', cualquierRol, controladorAnimalesDeFinca);

// POST /api/v1/fincas
enrutador.post(
  '/',
  soloAdministrador,
  registrarAuditoria('Crear finca', 'Finca'),
  controladorCrearFinca,
);

// PATCH /api/v1/fincas/:id
enrutador.patch(
  '/:id',
  administradorOVeterinario,
  registrarAuditoria('Actualizar finca', 'Finca'),
  controladorActualizarFinca,
);

// DELETE /api/v1/fincas/:id
enrutador.delete(
  '/:id',
  soloAdministrador,
  registrarAuditoria('Eliminar finca', 'Finca'),
  controladorEliminarFinca,
);

export default enrutador;
