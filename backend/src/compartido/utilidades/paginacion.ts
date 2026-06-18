import { ParametrosPaginacion, MetaPaginacion } from '../tipos/respuesta';

export interface OpcionesPrisma {
  skip: number;
  take: number;
  orderBy?: Record<string, 'asc' | 'desc'>;
}

export interface ResultadoPaginacion extends OpcionesPrisma {
  pagina: number;
  porPagina: number;
}

// Acepta un objeto ParametrosPaginacion O dos números (pagina, porPagina)
export function calcularPaginacion(
  paramsOPagina: ParametrosPaginacion | number,
  porPaginaNum?: number,
): ResultadoPaginacion {
  let pagina: number;
  let porPagina: number;
  let campo: string;
  let direccion: 'asc' | 'desc';

  if (typeof paramsOPagina === 'object') {
    pagina = Math.max(1, paramsOPagina.pagina ?? 1);
    porPagina = Math.min(100, Math.max(1, paramsOPagina.porPagina ?? 20));
    campo = paramsOPagina.ordenarPor ?? 'creadoEn';
    direccion = paramsOPagina.direccion ?? 'desc';
  } else {
    pagina = Math.max(1, paramsOPagina ?? 1);
    porPagina = Math.min(100, Math.max(1, porPaginaNum ?? 20));
    campo = 'creadoEn';
    direccion = 'desc';
  }

  return {
    pagina,
    porPagina,
    skip: (pagina - 1) * porPagina,
    take: porPagina,
    orderBy: { [campo]: direccion },
  };
}

// Acepta (total, params) O (total, pagina, porPagina)
export function construirMeta(
  total: number,
  paramsOPagina: ParametrosPaginacion | number,
  porPaginaNum?: number,
): MetaPaginacion {
  let pagina: number;
  let porPagina: number;

  if (typeof paramsOPagina === 'object') {
    pagina = Math.max(1, paramsOPagina.pagina ?? 1);
    porPagina = Math.min(100, Math.max(1, paramsOPagina.porPagina ?? 20));
  } else {
    pagina = Math.max(1, paramsOPagina ?? 1);
    porPagina = Math.min(100, Math.max(1, porPaginaNum ?? 20));
  }

  return {
    total,
    pagina,
    porPagina,
    totalPaginas: Math.ceil(total / porPagina),
  };
}
