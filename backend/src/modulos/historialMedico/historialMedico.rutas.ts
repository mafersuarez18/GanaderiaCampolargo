import { Router } from 'express';
import {
  verificarToken,
  soloAdministrador,
  administradorOVeterinario,
  cualquierRol,
} from '../../compartido/middlewares/autenticacion';
import { registrarAuditoria } from '../../compartido/middlewares/auditoria';
import {
  controladorListarHistorial,
  controladorObtenerHistorial,
  controladorCrearHistorial,
  controladorEliminarHistorial,
} from './historialMedico.controlador';

const enrutador = Router();

enrutador.use(verificarToken);

enrutador.get('/', cualquierRol, controladorListarHistorial);
enrutador.get('/:id', cualquierRol, controladorObtenerHistorial);

enrutador.post(
  '/',
  administradorOVeterinario,
  registrarAuditoria('Crear historial médico', 'HistorialMedico'),
  controladorCrearHistorial,
);

enrutador.delete(
  '/:id',
  soloAdministrador,
  registrarAuditoria('Eliminar historial médico', 'HistorialMedico'),
  controladorEliminarHistorial,
);

export default enrutador;
