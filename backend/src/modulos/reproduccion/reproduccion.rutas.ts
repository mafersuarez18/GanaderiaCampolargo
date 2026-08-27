import { Router } from 'express';
import {
  verificarToken,
  requerirPrivilegio,
} from '../../compartido/middlewares/autenticacion';
import { registrarAuditoria } from '../../compartido/middlewares/auditoria';
import {
  controladorPartosProximos,
  controladorListarEventos,
  controladorObtenerEvento,
  controladorCrearEvento,
  controladorGestacionesActivas,
  controladorCrearGestacion,
  controladorCerrarGestacion,
  controladorIndicadores,
} from './reproduccion.controlador';

const enrutador = Router();

enrutador.use(verificarToken);

// GET /api/v1/reproduccion/partos-proximos
enrutador.get('/partos-proximos', requerirPrivilegio('reproduccion.ver'), controladorPartosProximos);

// GET /api/v1/reproduccion/gestaciones
enrutador.get('/gestaciones', requerirPrivilegio('reproduccion.ver'), controladorGestacionesActivas);

// POST /api/v1/reproduccion/gestaciones
enrutador.post(
  '/gestaciones',
  requerirPrivilegio('reproduccion.crear'),
  registrarAuditoria('Registrar gestación', 'Gestacion'),
  controladorCrearGestacion,
);

// PATCH /api/v1/reproduccion/gestaciones/:id/cerrar
enrutador.patch(
  '/gestaciones/:id/cerrar',
  requerirPrivilegio('reproduccion.crear'),
  registrarAuditoria('Cerrar gestación', 'Gestacion'),
  controladorCerrarGestacion,
);

// GET /api/v1/reproduccion/indicadores
enrutador.get('/indicadores', requerirPrivilegio('reproduccion.ver'), controladorIndicadores);

// GET /api/v1/reproduccion
enrutador.get('/', requerirPrivilegio('reproduccion.ver'), controladorListarEventos);

// GET /api/v1/reproduccion/:id
enrutador.get('/:id', requerirPrivilegio('reproduccion.ver'), controladorObtenerEvento);

// POST /api/v1/reproduccion
enrutador.post(
  '/',
  requerirPrivilegio('reproduccion.crear'),
  registrarAuditoria('Registrar evento reproductivo', 'EventoReproductivo'),
  controladorCrearEvento,
);

export default enrutador;
