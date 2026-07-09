// Tipos estándar para las respuestas de la API

export interface RespuestaApi<T = unknown> {
  exito: boolean;
  mensaje: string;
  datos?: T;
  errores?: ErrorValidacion[];
  meta?: MetaPaginacion;
}

export interface ErrorValidacion {
  campo: string;
  mensaje: string;
}

export interface MetaPaginacion {
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
}

export interface ParametrosPaginacion {
  pagina?: number;
  porPagina?: number;
  busqueda?: string;
  ordenarPor?: string;
  direccion?: 'asc' | 'desc';
}

// Tipos de error para el manejador global
export class ErrorAplicacion extends Error {
  public readonly codigoHttp: number;
  public readonly esOperacional: boolean;

  constructor(mensaje: string, codigoHttp: number, esOperacional = true) {
    super(mensaje);
    this.codigoHttp = codigoHttp;
    this.esOperacional = esOperacional;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ErrorNoEncontrado extends ErrorAplicacion {
  constructor(recurso: string) {
    super(`${recurso} no encontrado`, 404);
  }
}

export class ErrorNoAutorizado extends ErrorAplicacion {
  constructor(mensaje = 'No autorizado') {
    super(mensaje, 401);
  }
}

export class ErrorForbidden extends ErrorAplicacion {
  constructor(mensaje = 'No tiene permisos para realizar esta acción') {
    super(mensaje, 403);
  }
}

export class ErrorValidacionDatos extends ErrorAplicacion {
  public readonly errores: ErrorValidacion[];

  constructor(errores: ErrorValidacion[] | string) {
    super('Error de validación', 422);
    this.errores = typeof errores === 'string'
      ? [{ campo: 'general', mensaje: errores }]
      : errores;
  }
}

export class ErrorConflicto extends ErrorAplicacion {
  constructor(mensaje: string) {
    super(mensaje, 409);
  }
}
