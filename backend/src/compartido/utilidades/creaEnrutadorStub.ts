import { Router, Request, Response } from 'express';

// Placeholder para un módulo que todavía no tiene rutas propias: cualquier
// petición a él responde 501 en vez de un 404 genérico, dejando claro que
// el módulo existe pero está pendiente.
export function crearEnrutadorStub(nombreModulo: string): Router {
  const enrutador = Router();
  enrutador.all('*', (_req: Request, res: Response) => {
    res.status(501).json({
      exito: false,
      mensaje: `Módulo "${nombreModulo}" en desarrollo. Disponible en próxima iteración.`,
    });
  });
  return enrutador;
}
