import { Response } from 'express';
import { RespuestaApi, MetaPaginacion } from '../tipos/respuesta';

// Atajos para responder siempre con la misma forma (RespuestaApi), en vez
// de armar el objeto { exito, mensaje, datos, ... } a mano en cada controlador.

export function respuestaExito<T>(
  res: Response,
  datos: T,
  mensaje = 'Operación exitosa',
  codigoHttp = 200
): Response {
  const cuerpo: RespuestaApi<T> = { exito: true, mensaje, datos };
  return res.status(codigoHttp).json(cuerpo);
}

export function respuestaCreado<T>(
  res: Response,
  datos: T,
  mensaje = 'Registro creado exitosamente'
): Response {
  return respuestaExito(res, datos, mensaje, 201);
}

export function respuestaListado<T>(
  res: Response,
  datos: T[],
  meta: MetaPaginacion,
  mensaje = 'Listado obtenido exitosamente'
): Response {
  const cuerpo: RespuestaApi<T[]> = { exito: true, mensaje, datos, meta };
  return res.status(200).json(cuerpo);
}

export function respuestaError(
  res: Response,
  mensaje: string,
  codigoHttp = 500,
  errores?: { campo: string; mensaje: string }[]
): Response {
  const cuerpo: RespuestaApi = { exito: false, mensaje, errores };
  return res.status(codigoHttp).json(cuerpo);
}

export function respuestaSinContenido(res: Response): Response {
  return res.status(204).send();
}
