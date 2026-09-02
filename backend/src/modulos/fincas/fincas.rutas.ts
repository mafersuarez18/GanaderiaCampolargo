import { Router } from 'express';
import {
  verificarToken,
  requerirPrivilegio,
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

// GET /api/fincas
enrutador.get('/', requerirPrivilegio('fincas.ver'), controladorListarFincas);

// GET /api/fincas/:id
enrutador.get('/:id', requerirPrivilegio('fincas.ver'), controladorObtenerFinca);

// GET /api/fincas/:id/animales
enrutador.get('/:id/animales', requerirPrivilegio('fincas.ver'), controladorAnimalesDeFinca);

// POST /api/fincas
enrutador.post(
  '/',
  requerirPrivilegio('fincas.crear'),
  registrarAuditoria('Crear finca', 'Finca'),
  controladorCrearFinca,
);

// PATCH /api/fincas/:id
enrutador.patch(
  '/:id',
  requerirPrivilegio('fincas.editar'),
  registrarAuditoria('Actualizar finca', 'Finca'),
  controladorActualizarFinca,
);

// DELETE /api/fincas/:id
enrutador.delete(
  '/:id',
  requerirPrivilegio('fincas.eliminar'),
  registrarAuditoria('Eliminar finca', 'Finca'),
  controladorEliminarFinca,
);

export default enrutador;
