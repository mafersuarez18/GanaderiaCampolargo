import { Router } from 'express';
import {
  verificarToken,
  administradorOVeterinario,
  cualquierRol,
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
enrutador.get('/partos-proximos', cualquierRol, controladorPartosProximos);

// GET /api/v1/reproduccion/gestaciones
enrutador.get('/gestaciones', cualquierRol, controladorGestacionesActivas);

// POST /api/v1/reproduccion/gestaciones
enrutador.post(
  '/gestaciones',
  administradorOVeterinario,
  registrarAuditoria('Registrar gestación', 'Gestacion'),
  controladorCrearGestacion,
);

// PATCH /api/v1/reproduccion/gestaciones/:id/cerrar
enrutador.patch(
  '/gestaciones/:id/cerrar',
  administradorOVeterinario,
  registrarAuditoria('Cerrar gestación', 'Gestacion'),
  controladorCerrarGestacion,
);

// GET /api/v1/reproduccion/indicadores
enrutador.get('/indicadores', cualquierRol, controladorIndicadores);

// GET /api/v1/reproduccion
enrutador.get('/', cualquierRol, controladorListarEventos);

// GET /api/v1/reproduccion/:id
enrutador.get('/:id', cualquierRol, controladorObtenerEvento);

// POST /api/v1/reproduccion
enrutador.post(
  '/',
  administradorOVeterinario,
  registrarAuditoria('Registrar evento reproductivo', 'EventoReproductivo'),
  controladorCrearEvento,
);

export default enrutador;
