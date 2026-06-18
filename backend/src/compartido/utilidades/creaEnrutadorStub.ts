import { Router, Request, Response } from 'express';

// Crea un enrutador temporal para módulos aún no implementados
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
