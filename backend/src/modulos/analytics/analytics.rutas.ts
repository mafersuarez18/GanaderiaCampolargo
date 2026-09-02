import { Router } from 'express';
import { verificarToken, requerirPrivilegio } from '../../compartido/middlewares/autenticacion';
import {
  controladorResumenDashboard,
  controladorEvolucionMensual,
  controladorDistribucionEdad,
  controladorPorcentajeTratados,
  controladorRecurrenciaPatologias,
} from './analytics.controlador';

const enrutador = Router();

enrutador.use(verificarToken);

// GET /api/analytics/dashboard — resumen ejecutivo
enrutador.get('/dashboard', requerirPrivilegio('analytics.ver'), controladorResumenDashboard);

// GET /api/analytics/evolucion-mensual?anio=2026
enrutador.get('/evolucion-mensual', requerirPrivilegio('analytics.ver_avanzado'), controladorEvolucionMensual);

// GET /api/analytics/distribucion-edad
enrutador.get('/distribucion-edad', requerirPrivilegio('analytics.ver_avanzado'), controladorDistribucionEdad);

// GET /api/analytics/porcentaje-tratados?desde=&hasta=&fincaId=
enrutador.get('/porcentaje-tratados', requerirPrivilegio('analytics.ver_avanzado'), controladorPorcentajeTratados);

// GET /api/analytics/recurrencia-patologias?fincaId=
enrutador.get('/recurrencia-patologias', requerirPrivilegio('analytics.ver_avanzado'), controladorRecurrenciaPatologias);

export default enrutador;
