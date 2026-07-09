import { Router } from 'express';
import {
  verificarToken,
  soloAdministrador,
  administradorOVeterinario,
  cualquierRol,
} from '../../compartido/middlewares/autenticacion';
import { registrarAuditoria } from '../../compartido/middlewares/auditoria';
import {
  controladorListarCalendarios,
  controladorObtenerCalendario,
  controladorCrearCalendario,
  controladorActualizarCalendario,
  controladorListarRegistros,
  controladorRegistrarVacunacion,
  controladorActualizarRegistro,
  controladorEliminarRegistro,
  controladorListarMedicamentos,
} from './vacunacion.controlador';

const enrutador = Router();

enrutador.use(verificarToken);

// Medicamentos (catálogo)
enrutador.get('/medicamentos', cualquierRol, controladorListarMedicamentos);

// Calendarios de vacunación
enrutador.get('/calendarios', cualquierRol, controladorListarCalendarios);
enrutador.get('/calendarios/:id', cualquierRol, controladorObtenerCalendario);
enrutador.post('/calendarios', soloAdministrador, registrarAuditoria('Crear calendario vacunación', 'CalendarioVacunacion'), controladorCrearCalendario);
enrutador.patch('/calendarios/:id', soloAdministrador, registrarAuditoria('Actualizar calendario vacunación', 'CalendarioVacunacion'), controladorActualizarCalendario);

// Registros de vacunación aplicada
enrutador.get('/', cualquierRol, controladorListarRegistros);
enrutador.post('/', administradorOVeterinario, registrarAuditoria('Registrar vacunación', 'RegistroVacunacion'), controladorRegistrarVacunacion);
enrutador.patch('/:id', administradorOVeterinario, registrarAuditoria('Actualizar registro vacunación', 'RegistroVacunacion'), controladorActualizarRegistro);
enrutador.delete('/:id', administradorOVeterinario, registrarAuditoria('Eliminar registro vacunación', 'RegistroVacunacion'), controladorEliminarRegistro);

export default enrutador;
