import { Router } from 'express';
import { verificarToken, requerirPrivilegio } from '../../compartido/middlewares/autenticacion';
import {
  controladorResumenDashboard,
  controladorEvolucionMensual,
  controladorDistribucionEdad,
} from './analytics.controlador';

const enrutador = Router();

enrutador.use(verificarToken);

// GET /api/v1/analytics/dashboard — resumen ejecutivo
enrutador.get('/dashboard', requerirPrivilegio('analytics.ver'), controladorResumenDashboard);

// GET /api/v1/analytics/evolucion-mensual?anio=2026
enrutador.get('/evolucion-mensual', requerirPrivilegio('analytics.ver_avanzado'), controladorEvolucionMensual);

// GET /api/v1/analytics/distribucion-edad
enrutador.get('/distribucion-edad', requerirPrivilegio('analytics.ver_avanzado'), controladorDistribucionEdad);

export default enrutador;
