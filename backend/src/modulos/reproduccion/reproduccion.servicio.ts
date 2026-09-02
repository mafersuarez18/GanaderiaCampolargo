import { Prisma, TipoEventoReproductivo, EstadoGestacion, EstadoAnimal, Sexo, ClasificacionIA, TecnicaDeposicionSemen, NivelEstres, TipoParto, EstadoCria } from '@prisma/client';
import { prisma } from '../../compartido/prisma/clientePrisma';
import { ErrorNoEncontrado, ErrorValidacionDatos } from '../../compartido/tipos/respuesta';
import { resolverNotificacionesDeEntidad } from '../notificaciones/notificaciones.servicio';

// Ciclo reproductivo completo: eventos (celo, monta, inseminación,
// diagnóstico), gestaciones abiertas/cerradas y los indicadores que se
// calculan a partir de ese historial (tasas de preñez, natalidad, aborto,
// repetición de celo, efectividad de IA por semental, etc.).

// ─── Partos próximos ────────────────────────────────────────────────────────

export async function listarPartosProximos(diasHorizonte: number = 30, limite: number = 20) {
  const hoy = new Date();
  const horizonte = new Date(hoy.getTime() + diasHorizonte * 24 * 60 * 60 * 1000);

  const gestaciones = await prisma.gestacion.findMany({
    where: {
      estadoGestacion: EstadoGestacion.EN_CURSO,
      fechaPartoEsperado: { gte: hoy, lte: horizonte },
    },
    include: {
      madre: {
        select: {
          id: true,
          numeroArete: true,
          nombre: true,
          lote: { select: { finca: { select: { id: true, nombre: true } } } },
        },
      },
    },
    orderBy: { fechaPartoEsperado: 'asc' },
    take: limite,
  });

  return gestaciones.map((g) => {
    const diasRestantes = Math.max(
      0,
      Math.ceil((g.fechaPartoEsperado.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)),
    );
    const clasificacion: 'urgente' | 'proximo' | 'futuro' =
      diasRestantes <= 7 ? 'urgente' : diasRestantes <= 30 ? 'proximo' : 'futuro';

    return {
      id: g.id,
      madreId: g.madreId,
      madreNumeroArete: g.madre.numeroArete,
      madreNombre: g.madre.nombre,
      finca: g.madre.lote.finca.nombre,
      fechaPartoEsperado: g.fechaPartoEsperado,
      diasRestantes,
      clasificacion,
    };
  });
}

// ─── Eventos reproductivos ───────────────────────────────────────────────────

export interface FiltrosEventoReproductivo {
  animalId?: string;
  fincaId?: string;
  tipoEvento?: TipoEventoReproductivo;
  desde?: Date;
  hasta?: Date;
  pagina?: number;
  porPagina?: number;
}

export async function listarEventosReproductivos(filtros: FiltrosEventoReproductivo = {}) {
  const { animalId, fincaId, tipoEvento, desde, hasta, pagina = 1, porPagina = 20 } = filtros;

  const donde: Prisma.EventoReproductivoWhereInput = {
    ...(animalId   && { animalId }),
    ...(tipoEvento && { tipo: tipoEvento }),
    ...((desde || hasta) && {
      fecha: {
        ...(desde && { gte: desde }),
        ...(hasta && { lte: hasta }),
      },
    }),
    ...(fincaId && { animal: { lote: { fincaId } } }),
  };

  const [registros, total] = await prisma.$transaction([
    prisma.eventoReproductivo.findMany({
      where: donde,
      include: {
        animal: {
          select: {
            id: true,
            numeroArete: true,
            nombre: true,
            lote: { select: { finca: { select: { nombre: true } } } },
          },
        },
        registradoPor: { select: { nombre: true, apellido: true } },
      },
      orderBy: { fecha: 'desc' },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    }),
    prisma.eventoReproductivo.count({ where: donde }),
  ]);

  return { registros, total };
}

export async function obtenerEventoReproductivo(id: string) {
  const evento = await prisma.eventoReproductivo.findUnique({
    where: { id },
    include: {
      animal: { select: { id: true, numeroArete: true, nombre: true } },
      registradoPor: { select: { nombre: true, apellido: true } },
      inseminacion: true,
      diagnosticoGestacion: true,
    },
  });
  if (!evento) throw new ErrorNoEncontrado(`Evento reproductivo con id '${id}' no encontrado`);
  return evento;
}

export interface DatosCrearEvento {
  animalId:       string;
  tipo:           TipoEventoReproductivo;
  fecha:          Date;
  descripcion?:   string;
  observaciones?: string;
  registradoPorId: string;
  // Campos específicos de Inseminación Artificial
  clasificacionIA?:     ClasificacionIA;
  tecnicaDeposicion?:   TecnicaDeposicionSemen;
  patologiasVaca?:      string;
  tasaMetabolicaBasal?: number;
  balanceEnergetico?:   string;
  temperaturaUterina?:  number;
  manejoHato?:          NivelEstres;
}

export async function crearEventoReproductivo(datos: DatosCrearEvento) {
  const animal = await prisma.animal.findUnique({
    where: { id: datos.animalId },
    select: { id: true, sexo: true, numeroArete: true },
  });
  if (!animal) throw new ErrorNoEncontrado('Animal no encontrado');

  // Validar que el evento aplica al sexo del animal
  const eventosHembra: TipoEventoReproductivo[] = [
    'INSEMINACION_ARTIFICIAL', 'MONTA_NATURAL', 'DIAGNOSTICO_GESTACION',
    'PARTO', 'ABORTO', 'DETECCION_CELO',
  ];
  if (eventosHembra.includes(datos.tipo) && animal.sexo !== 'HEMBRA') {
    throw new ErrorValidacionDatos(
      `El evento '${datos.tipo}' solo aplica a hembras. El animal ${animal.numeroArete} es macho.`,
    );
  }

  const {
    registradoPorId, animalId,
    clasificacionIA, tecnicaDeposicion, patologiasVaca,
    tasaMetabolicaBasal, balanceEnergetico, temperaturaUterina, manejoHato,
    ...resto
  } = datos;
  // Solo campos válidos de EventoReproductivo van en resto: tipo, fecha, descripcion, observaciones
  const { tipo, fecha, descripcion, observaciones } = resto;

  const esInseminacion = datos.tipo === TipoEventoReproductivo.INSEMINACION_ARTIFICIAL;

  return prisma.eventoReproductivo.create({
    data: {
      tipo, fecha, descripcion, observaciones,
      animal:        { connect: { id: animalId } },
      registradoPor: { connect: { id: registradoPorId } },
      ...(esInseminacion && {
        inseminacion: {
          create: {
            fechaInseminacion: datos.fecha,
            numeroIntento:     1,
            clasificacionIA,
            tecnicaDeposicion,
            patologiasVaca,
            tasaMetabolicaBasal,
            balanceEnergetico,
            temperaturaUterina,
            manejoHato,
          },
        },
      }),
    },
  });
}

// ─── Gestaciones ─────────────────────────────────────────────────────────────

export async function listarGestacionesActivas(fincaId?: string) {
  return prisma.gestacion.findMany({
    where: {
      estadoGestacion: EstadoGestacion.EN_CURSO,
      ...(fincaId && { madre: { lote: { fincaId } } }),
    },
    include: {
      madre: {
        select: {
          id: true,
          numeroArete: true,
          nombre: true,
          lote: { select: { nombre: true, finca: { select: { nombre: true } } } },
        },
      },
    },
    orderBy: { fechaPartoEsperado: 'asc' },
  });
}

export interface DatosCrearGestacion {
  madreId:              string;
  fechaInicio:          Date;
  fechaPartoEsperado:   Date;
  observaciones?:       string;
  // Evento de monta natural o inseminación que originó esta gestación,
  // cuando el celo/servicio quedó registrado formalmente (opcional).
  eventoReproductivoId?: string;
}

export async function crearGestacion(datos: DatosCrearGestacion) {
  const madre = await prisma.animal.findUnique({
    where: { id: datos.madreId },
    select: { sexo: true },
  });
  if (!madre) throw new ErrorNoEncontrado('Animal madre no encontrada');
  if (madre.sexo !== 'HEMBRA') throw new ErrorValidacionDatos('Solo las hembras pueden tener gestaciones');

  const gestacionActiva = await prisma.gestacion.findFirst({
    where: { madreId: datos.madreId, estadoGestacion: EstadoGestacion.EN_CURSO },
    select: { id: true },
  });
  if (gestacionActiva) {
    throw new ErrorValidacionDatos('La hembra ya tiene una gestación activa registrada');
  }

  if (datos.eventoReproductivoId) {
    const evento = await prisma.eventoReproductivo.findUnique({
      where: { id: datos.eventoReproductivoId },
      select: { animalId: true, tipo: true, gestacion: { select: { id: true } } },
    });
    if (!evento) throw new ErrorNoEncontrado('Evento reproductivo no encontrado');
    if (evento.animalId !== datos.madreId) {
      throw new ErrorValidacionDatos('El evento reproductivo no corresponde a esta hembra');
    }
    if (!['INSEMINACION_ARTIFICIAL', 'MONTA_NATURAL'].includes(evento.tipo)) {
      throw new ErrorValidacionDatos('El evento debe ser una inseminación artificial o monta natural');
    }
    if (evento.gestacion) {
      throw new ErrorValidacionDatos('Ese evento ya tiene una gestación vinculada');
    }
  }

  return prisma.gestacion.create({
    data: {
      ...datos,
      estadoGestacion: EstadoGestacion.EN_CURSO,
    },
  });
}

// ─── Indicadores reproductivos ────────────────────────────────────────────────

export async function obtenerIndicadoresReproductivos(anio: number, fincaId?: string) {
  const inicioAnio = new Date(anio, 0, 1);
  const finAnio    = new Date(anio, 11, 31, 23, 59, 59);

  const [
    totalHembras,
    gestacionesEnCurso,
    gestacionesAnio,
    gestacionesParto,
    abortos,
    totalCelos,
    totalInseminaciones,
    nacimientosAnio,
  ] = await Promise.all([
    prisma.animal.count({
      where: { sexo: Sexo.HEMBRA, estado: EstadoAnimal.ACTIVO, ...(fincaId && { lote: { fincaId } }) },
    }),
    prisma.gestacion.count({
      where: { estadoGestacion: EstadoGestacion.EN_CURSO, ...(fincaId && { madre: { lote: { fincaId } } }) },
    }),
    prisma.gestacion.count({
      where: { fechaInicio: { gte: inicioAnio, lte: finAnio }, ...(fincaId && { madre: { lote: { fincaId } } }) },
    }),
    prisma.gestacion.count({
      where: {
        estadoGestacion: EstadoGestacion.FINALIZADA_PARTO,
        fechaPartoReal: { gte: inicioAnio, lte: finAnio },
        ...(fincaId && { madre: { lote: { fincaId } } }),
      },
    }),
    prisma.gestacion.count({
      where: {
        estadoGestacion: EstadoGestacion.FINALIZADA_ABORTO,
        fechaInicio: { gte: inicioAnio, lte: finAnio },
        ...(fincaId && { madre: { lote: { fincaId } } }),
      },
    }),
    prisma.eventoReproductivo.count({
      where: {
        tipo: TipoEventoReproductivo.DETECCION_CELO,
        fecha: { gte: inicioAnio, lte: finAnio },
        ...(fincaId && { animal: { lote: { fincaId } } }),
      },
    }),
    prisma.eventoReproductivo.count({
      where: {
        tipo: { in: [TipoEventoReproductivo.INSEMINACION_ARTIFICIAL, TipoEventoReproductivo.MONTA_NATURAL] },
        fecha: { gte: inicioAnio, lte: finAnio },
        ...(fincaId && { animal: { lote: { fincaId } } }),
      },
    }),
    prisma.nacimiento.count({
      where: {
        fechaNacimiento: { gte: inicioAnio, lte: finAnio },
        ...(fincaId && { gestacion: { madre: { lote: { fincaId } } } }),
      },
    }),
  ]);

  // Tasa de repetición de celo: animales con 2+ detecciones en el período
  const celosEnPeriodo = await prisma.eventoReproductivo.findMany({
    where: {
      tipo: TipoEventoReproductivo.DETECCION_CELO,
      fecha: { gte: inicioAnio, lte: finAnio },
      ...(fincaId && { animal: { lote: { fincaId } } }),
    },
    select: { animalId: true },
  });

  const conteoCelosPorAnimal: Record<string, number> = {};
  for (const ev of celosEnPeriodo) {
    conteoCelosPorAnimal[ev.animalId] = (conteoCelosPorAnimal[ev.animalId] ?? 0) + 1;
  }
  const animalesConRepeticion = Object.values(conteoCelosPorAnimal).filter((c) => c >= 2).length;

  // Tasa de mortalidad de crías: animales fallecidos antes de cumplir su primer
  // año de vida, dentro del período, sobre el total de nacimientos del período.
  // No existe un campo "fechaMuerte" dedicado; se usa actualizadoEn como la
  // fecha del último cambio de estado del animal (igual que en el dashboard).
  const animalesFallecidos = await prisma.animal.findMany({
    where: {
      estado: EstadoAnimal.MUERTO,
      fechaNacimiento: { not: null },
      actualizadoEn: { gte: inicioAnio, lte: finAnio },
      ...(fincaId && { lote: { fincaId } }),
    },
    select: { fechaNacimiento: true, actualizadoEn: true },
  });
  const criasFallecidas = animalesFallecidos.filter((a) => {
    const edadDias = (a.actualizadoEn.getTime() - a.fechaNacimiento!.getTime()) / (1000 * 60 * 60 * 24);
    return edadDias <= 365;
  }).length;

  const intervaloPartosPromedioDias = await calcularIntervaloPartosPromedio(fincaId);

  return {
    anio,
    totalHembras,
    gestacionesEnCurso,
    gestacionesAnio,
    gestacionesParto,
    abortos,
    nacimientosAnio,
    criasFallecidas,
    tasaPreniez:        totalHembras > 0 ? +((gestacionesEnCurso / totalHembras) * 100).toFixed(1) : 0,
    tasaNatalidad:      gestacionesAnio > 0 ? +((gestacionesParto / gestacionesAnio) * 100).toFixed(1) : 0,
    tasaAborto:         gestacionesAnio > 0 ? +((abortos / gestacionesAnio) * 100).toFixed(1) : 0,
    tasaMortalidadCrias: nacimientosAnio > 0 ? +((criasFallecidas / nacimientosAnio) * 100).toFixed(1) : 0,
    totalCelos,
    totalInseminaciones,
    animalesConRepeticion,
    tasaRepeticionCelo: totalInseminaciones > 0 ? +((animalesConRepeticion / totalInseminaciones) * 100).toFixed(1) : 0,
    intervaloPartosPromedioDias,
  };
}

// Intervalo entre partos: promedio de días transcurridos entre partos
// consecutivos de una misma hembra, sobre la totalidad de su historial
// (no se acota al año consultado, ya que es un indicador de ciclo de vida).
async function calcularIntervaloPartosPromedio(fincaId?: string): Promise<number | null> {
  const partos = await prisma.gestacion.findMany({
    where: {
      estadoGestacion: EstadoGestacion.FINALIZADA_PARTO,
      fechaPartoReal: { not: null },
      ...(fincaId && { madre: { lote: { fincaId } } }),
    },
    select: { madreId: true, fechaPartoReal: true },
    orderBy: { fechaPartoReal: 'asc' },
  });

  const fechasPorMadre = new Map<string, Date[]>();
  for (const p of partos) {
    if (!p.fechaPartoReal) continue;
    const lista = fechasPorMadre.get(p.madreId) ?? [];
    lista.push(p.fechaPartoReal);
    fechasPorMadre.set(p.madreId, lista);
  }

  const intervalos: number[] = [];
  for (const fechas of fechasPorMadre.values()) {
    for (let i = 1; i < fechas.length; i++) {
      intervalos.push((fechas[i]!.getTime() - fechas[i - 1]!.getTime()) / (1000 * 60 * 60 * 24));
    }
  }

  if (!intervalos.length) return null;
  return +(intervalos.reduce((a, b) => a + b, 0) / intervalos.length).toFixed(1);
}

// ─── Efectividad de la inseminación artificial por semental ──────────────────
// Efectiva = la inseminación derivó en una gestación que no terminó en aborto
// ni en pérdida (sigue en curso o finalizó en parto).

export async function obtenerEfectividadInseminacion(fincaId?: string) {
  const inseminaciones = await prisma.inseminacionArtificial.findMany({
    where: {
      inventarioSemen: { isNot: null },
      ...(fincaId && { eventoReproductivo: { animal: { lote: { fincaId } } } }),
    },
    select: {
      inventarioSemen: {
        select: { sementalId: true, semental: { select: { nombre: true } } },
      },
      eventoReproductivo: {
        select: { gestacion: { select: { estadoGestacion: true } } },
      },
    },
  });

  const porSemental = new Map<string, { nombre: string; total: number; efectivas: number }>();
  for (const ins of inseminaciones) {
    const sementalId = ins.inventarioSemen?.sementalId;
    if (!sementalId) continue;
    const entrada = porSemental.get(sementalId) ?? {
      nombre: ins.inventarioSemen!.semental.nombre,
      total: 0,
      efectivas: 0,
    };
    entrada.total += 1;
    const estadoGestacion = ins.eventoReproductivo.gestacion?.estadoGestacion;
    if (estadoGestacion && estadoGestacion !== 'FINALIZADA_ABORTO' && estadoGestacion !== 'PERDIDA') {
      entrada.efectivas += 1;
    }
    porSemental.set(sementalId, entrada);
  }

  return Array.from(porSemental.entries())
    .map(([sementalId, v]) => ({
      sementalId,
      sementalNombre: v.nombre,
      totalInseminaciones: v.total,
      inseminacionesEfectivas: v.efectivas,
      tasaEfectividad: v.total > 0 ? +((v.efectivas / v.total) * 100).toFixed(1) : 0,
    }))
    .sort((a, b) => b.totalInseminaciones - a.totalInseminaciones);
}

export interface DatosNacimiento {
  tipoParto?:      TipoParto;
  pesoAlNacer?:    number;
  sexoCria?:       Sexo;
  estadoCria?:     EstadoCria;
  observaciones?:  string;
  complicaciones?: string;
}

export async function cerrarGestacion(
  id: string,
  resultado: 'PARTO' | 'ABORTO' | 'PERDIDA',
  fechaPartoReal?: Date,
  datosNacimiento?: DatosNacimiento,
) {
  const gestacion = await prisma.gestacion.findUnique({
    where: { id },
    select: { id: true, estadoGestacion: true },
  });
  if (!gestacion) throw new ErrorNoEncontrado('Gestación no encontrada');
  if (gestacion.estadoGestacion !== EstadoGestacion.EN_CURSO) {
    throw new ErrorValidacionDatos('La gestación ya está cerrada');
  }

  const estadoFinal: Record<string, EstadoGestacion> = {
    PARTO:  EstadoGestacion.FINALIZADA_PARTO,
    ABORTO: EstadoGestacion.FINALIZADA_ABORTO,
    PERDIDA: EstadoGestacion.PERDIDA,
  };

  // Un parto deja, además del cambio de estado de la gestación, el registro
  // de Nacimiento del que dependen los indicadores de días abiertos e
  // intervalo entre partos — ambas escrituras van en una sola transacción
  // para no dejar una gestación "parida" sin su nacimiento asociado.
  const [gestacionActualizada] = await prisma.$transaction([
    prisma.gestacion.update({
      where: { id },
      data: {
        estadoGestacion: estadoFinal[resultado],
        ...(fechaPartoReal && { fechaPartoReal }),
      },
    }),
    ...(resultado === 'PARTO'
      ? [prisma.nacimiento.create({
          data: {
            gestacionId: id,
            fechaNacimiento: fechaPartoReal ?? new Date(),
            tipoParto: datosNacimiento?.tipoParto,
            pesoAlNacer: datosNacimiento?.pesoAlNacer,
            sexoCria: datosNacimiento?.sexoCria,
            estadoCria: datosNacimiento?.estadoCria,
            observaciones: datosNacimiento?.observaciones,
            complicaciones: datosNacimiento?.complicaciones,
          },
        })]
      : []),
  ]);

  // Auto-resolver alertas de parto próximo asociadas a esta gestación
  await resolverNotificacionesDeEntidad('Gestacion', id).catch(() => {});

  return gestacionActualizada;
}
