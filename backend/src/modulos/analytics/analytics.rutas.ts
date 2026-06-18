import { Router } from 'express';
import { verificarToken, administradorOVeterinario, cualquierRol } from '../../compartido/middlewares/autenticacion';
import {
  controladorResumenDashboard,
  controladorEvolucionMensual,
  controladorDistribucionEdad,
} from './analytics.controlador';

const enrutador = Router();

enrutador.use(verificarToken);

// GET /api/v1/analytics/dashboard — resumen ejecutivo
enrutador.get('/dashboard', cualquierRol, controladorResumenDashboard);

// GET /api/v1/analytics/evolucion-mensual?anio=2026
enrutador.get('/evolucion-mensual', administradorOVeterinario, controladorEvolucionMensual);

// GET /api/v1/analytics/distribucion-edad
enrutador.get('/distribucion-edad', administradorOVeterinario, controladorDistribucionEdad);

export default enrutador;
