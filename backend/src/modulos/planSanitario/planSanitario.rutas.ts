import { Router } from 'express';
import {
  verificarToken,
  requerirPrivilegio,
} from '../../compartido/middlewares/autenticacion';
import { registrarAuditoria } from '../../compartido/middlewares/auditoria';
import {
  controladorObtenerPlan,
  controladorCrearActividad,
  controladorActualizarActividad,
  controladorEliminarActividad,
  controladorMarcarMes,
  controladorResumen,
} from './planSanitario.controlador';

const enrutador = Router();

enrutador.use(verificarToken);

enrutador.get('/resumen', requerirPrivilegio('plan_sanitario.ver'), controladorResumen);
enrutador.get('/', requerirPrivilegio('plan_sanitario.ver'), controladorObtenerPlan);

enrutador.post(
  '/actividades',
  requerirPrivilegio('plan_sanitario.gestionar'),
  registrarAuditoria('Crear actividad de plan sanitario', 'ActividadPlanSanitario'),
  controladorCrearActividad,
);

enrutador.put(
  '/actividades/:id',
  requerirPrivilegio('plan_sanitario.gestionar'),
  registrarAuditoria('Editar actividad de plan sanitario', 'ActividadPlanSanitario'),
  controladorActualizarActividad,
);

enrutador.patch(
  '/actividades/:id/marcar-mes',
  requerirPrivilegio('plan_sanitario.gestionar'),
  controladorMarcarMes,
);

enrutador.delete(
  '/actividades/:id',
  requerirPrivilegio('plan_sanitario.gestionar'),
  registrarAuditoria('Eliminar actividad de plan sanitario', 'ActividadPlanSanitario'),
  controladorEliminarActividad,
);

export default enrutador;
