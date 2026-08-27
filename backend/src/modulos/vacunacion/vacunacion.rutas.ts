import { Router } from 'express';
import {
  verificarToken,
  requerirPrivilegio,
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
enrutador.get('/medicamentos', requerirPrivilegio('vacunacion.ver'), controladorListarMedicamentos);

// Calendarios de vacunación
enrutador.get('/calendarios', requerirPrivilegio('vacunacion.ver'), controladorListarCalendarios);
enrutador.get('/calendarios/:id', requerirPrivilegio('vacunacion.ver'), controladorObtenerCalendario);
enrutador.post('/calendarios', requerirPrivilegio('vacunacion.gestionar_calendario'), registrarAuditoria('Crear calendario vacunación', 'CalendarioVacunacion'), controladorCrearCalendario);
enrutador.patch('/calendarios/:id', requerirPrivilegio('vacunacion.gestionar_calendario'), registrarAuditoria('Actualizar calendario vacunación', 'CalendarioVacunacion'), controladorActualizarCalendario);

// Registros de vacunación aplicada
enrutador.get('/', requerirPrivilegio('vacunacion.ver'), controladorListarRegistros);
enrutador.post('/', requerirPrivilegio('vacunacion.registrar'), registrarAuditoria('Registrar vacunación', 'RegistroVacunacion'), controladorRegistrarVacunacion);
enrutador.patch('/:id', requerirPrivilegio('vacunacion.registrar'), registrarAuditoria('Actualizar registro vacunación', 'RegistroVacunacion'), controladorActualizarRegistro);
enrutador.delete('/:id', requerirPrivilegio('vacunacion.registrar'), registrarAuditoria('Eliminar registro vacunación', 'RegistroVacunacion'), controladorEliminarRegistro);

export default enrutador;
