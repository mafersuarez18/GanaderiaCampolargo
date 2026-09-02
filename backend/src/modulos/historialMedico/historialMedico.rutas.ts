import { Router } from 'express';
import {
  verificarToken,
  requerirPrivilegio,
} from '../../compartido/middlewares/autenticacion';
import { registrarAuditoria } from '../../compartido/middlewares/auditoria';
import {
  controladorListarHistorial,
  controladorObtenerHistorial,
  controladorCrearHistorial,
  controladorEliminarHistorial,
  controladorPrefillConsulta,
} from './historialMedico.controlador';

const enrutador = Router();

enrutador.use(verificarToken);

// Datos para pre-rellenar el formulario de nueva consulta (última
// desparasitación, calendarios disponibles, enfermedades activas del
// animal) — se consulta antes de mostrar el formulario al veterinario.
enrutador.get('/prefill', requerirPrivilegio('historial_medico.ver'), controladorPrefillConsulta);

enrutador.get('/', requerirPrivilegio('historial_medico.ver'), controladorListarHistorial);
enrutador.get('/:id', requerirPrivilegio('historial_medico.ver'), controladorObtenerHistorial);

enrutador.post(
  '/',
  requerirPrivilegio('historial_medico.crear'),
  registrarAuditoria('Crear historial médico', 'HistorialMedico'),
  controladorCrearHistorial,
);

enrutador.delete(
  '/:id',
  requerirPrivilegio('historial_medico.eliminar'),
  registrarAuditoria('Eliminar historial médico', 'HistorialMedico'),
  controladorEliminarHistorial,
);

export default enrutador;
