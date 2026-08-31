import { Prisma, Sexo } from '@prisma/client';
import { prisma } from '../../compartido/prisma/clientePrisma';
import { ErrorNoEncontrado, ErrorConflicto } from '../../compartido/tipos/respuesta';
import { resolverNotificacionesDeEntidad } from '../notificaciones/notificaciones.servicio';

// ─── Calendarios ─────────────────────────────────────────────────────────────

export async function listarCalendarios() {
  return prisma.calendarioVacunacion.findMany({
    include: {
      medicamento: { select: { id: true, nombre: true, principioActivo: true } },
      _count: { select: { registrosVacunacion: true } },
    },
    orderBy: { nombreVacuna: 'asc' },
  });
}

export async function obtenerCalendario(id: string) {
  const calendario = await prisma.calendarioVacunacion.findUnique({
    where: { id },
    include: {
      medicamento: true,
      registrosVacunacion: {
        include: {
          historialMedico: {
            select: {
              animal: { select: { id: true, numeroArete: true, nombre: true } },
            },
          },
          aplicadoPor: { select: { nombre: true, apellido: true } },
        },
        orderBy: { fechaAplicacion: 'desc' },
        take: 50,
      },
    },
  });
  if (!calendario) throw new ErrorNoEncontrado(`Calendario con id '${id}' no encontrado`);
  return calendario;
}

export interface DatosCalendario {
  nombreVacuna:    string;
  descripcion?:    string;
  fabricante?:     string;
  medicamentoId?:  string;
  intervaloDias:   number;
  edadMinimasDias?: number;
  aplicaASexo?:    Sexo | null;
}

export async function crearCalendario(datos: DatosCalendario) {
  const { medicamentoId, ...resto } = datos;
  return prisma.calendarioVacunacion.create({
    data: {
      ...resto,
      ...(medicamentoId && { medicamento: { connect: { id: medicamentoId } } }),
    },
    include: {
      medicamento: { select: { id: true, nombre: true } },
      _count: { select: { registrosVacunacion: true } },
    },
  });
}

export async function actualizarCalendario(id: string, datos: Partial<DatosCalendario>) {
  const calendario = await prisma.calendarioVacunacion.findUnique({ where: { id }, select: { id: true } });
  if (!calendario) throw new ErrorNoEncontrado(`Calendario con id '${id}' no encontrado`);

  const { medicamentoId, ...resto } = datos;
  return prisma.calendarioVacunacion.update({
    where: { id },
    data: {
      ...resto,
      ...(medicamentoId !== undefined && {
        medicamento: medicamentoId
          ? { connect: { id: medicamentoId } }
          : { disconnect: true },
      }),
    },
  });
}

// ─── Registros de vacunación ──────────────────────────────────────────────────

export interface FiltrosRegistroVacunacion {
  animalId?:              string;
  calendarioVacunacionId?: string;
  historialMedicoId?:     string;
  fincaId?:               string;
  desde?:                 Date;
  hasta?:                 Date;
  pagina?:                number;
  porPagina?:             number;
}

export async function listarRegistrosVacunacion(filtros: FiltrosRegistroVacunacion = {}) {
  const { animalId, calendarioVacunacionId, historialMedicoId, fincaId, desde, hasta, pagina = 1, porPagina = 20 } = filtros;

  const donde: Prisma.RegistroVacunacionWhereInput = {
    ...(historialMedicoId     && { historialMedicoId }),
    ...(calendarioVacunacionId && { calendarioVacunacionId }),
    ...(animalId  && { historialMedico: { animalId } }),
    ...(fincaId   && { historialMedico: { animal: { lote: { fincaId } } } }),
    ...((desde || hasta) && {
      fechaAplicacion: {
        ...(desde && { gte: desde }),
        ...(hasta && { lte: hasta }),
      },
    }),
  };

  const [registros, total] = await prisma.$transaction([
    prisma.registroVacunacion.findMany({
      where: donde,
      include: {
        historialMedico: {
          select: {
            animal: { select: { id: true, numeroArete: true, nombre: true } },
          },
        },
        calendarioVacunacion: {
          select: { id: true, nombreVacuna: true, intervaloDias: true },
        },
        medicamento: { select: { id: true, nombre: true } },
        aplicadoPor: { select: { id: true, nombre: true, apellido: true } },
      },
      orderBy: { fechaAplicacion: 'desc' },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    }),
    prisma.registroVacunacion.count({ where: donde }),
  ]);

  return { registros, total };
}

export interface DatosRegistroVacunacion {
  calendarioVacunacionId: string;
  historialMedicoId?:     string;
  medicamentoId?:         string;
  fechaAplicacion:        Date;
  dosis?:                 string;
  viaAdministracion?:     string;
  lote?:                  string;
  observaciones?:         string;
  aplicadoPorId:          string;
}

export async function registrarVacunacion(datos: DatosRegistroVacunacion) {
  const calendario = await prisma.calendarioVacunacion.findUnique({
    where: { id: datos.calendarioVacunacionId },
    select: { id: true, intervaloDias: true },
  });
  if (!calendario) throw new ErrorNoEncontrado('Calendario de vacunación no encontrado');

  if (datos.historialMedicoId) {
    const historial = await prisma.historialMedico.findUnique({
      where: { id: datos.historialMedicoId },
      select: { id: true },
    });
    if (!historial) throw new ErrorNoEncontrado('Historial médico no encontrado');
  }

  // Calcular próxima fecha de aplicación sugerida
  const proximaFecha = new Date(
    datos.fechaAplicacion.getTime() + calendario.intervaloDias * 24 * 60 * 60 * 1000,
  );

  const { aplicadoPorId, historialMedicoId, medicamentoId, calendarioVacunacionId, ...resto } = datos;

  const registro = await prisma.registroVacunacion.create({
    data: {
      ...resto,
      proximaFecha,
      aplicadoPor: { connect: { id: aplicadoPorId } },
      calendarioVacunacion: { connect: { id: datos.calendarioVacunacionId } },
      ...(historialMedicoId && { historialMedico: { connect: { id: historialMedicoId } } }),
      ...(medicamentoId && { medicamento: { connect: { id: medicamentoId } } }),
    },
    include: {
      historialMedico: {
        select: { animal: { select: { id: true, numeroArete: true } } },
      },
      calendarioVacunacion: { select: { nombreVacuna: true } },
      aplicadoPor: { select: { nombre: true, apellido: true } },
    },
  });

  // Auto-resolver alertas de vacunación pendientes para este registro concreto
  // El scheduler usa el RegistroVacunacion.id como entidadId
  await resolverNotificacionesDeEntidad('RegistroVacunacion', registro.id).catch(() => {});

  return registro;
}

export async function actualizarRegistroVacunacion(
  id: string,
  datos: {
    fechaAplicacion?:  Date;
    dosis?:            string;
    viaAdministracion?: string;
    lote?:             string;
    observaciones?:    string;
  },
) {
  const registro = await prisma.registroVacunacion.findUnique({
    where: { id },
    select: { id: true, calendarioVacunacion: { select: { intervaloDias: true } } },
  });
  if (!registro) throw new ErrorNoEncontrado('Registro de vacunación no encontrado');

  // Recalcular próxima fecha si cambia la fecha de aplicación
  const proximaFecha = datos.fechaAplicacion
    ? new Date(datos.fechaAplicacion.getTime() + registro.calendarioVacunacion.intervaloDias * 24 * 60 * 60 * 1000)
    : undefined;

  return prisma.registroVacunacion.update({
    where: { id },
    data: {
      ...datos,
      ...(proximaFecha && { proximaFecha }),
    },
    include: {
      historialMedico: {
        select: { animal: { select: { id: true, numeroArete: true, nombre: true } } },
      },
      calendarioVacunacion: { select: { id: true, nombreVacuna: true, intervaloDias: true } },
      medicamento: { select: { id: true, nombre: true } },
      aplicadoPor: { select: { id: true, nombre: true, apellido: true } },
    },
  });
}

export async function eliminarRegistroVacunacion(id: string) {
  const registro = await prisma.registroVacunacion.findUnique({ where: { id }, select: { id: true } });
  if (!registro) throw new ErrorNoEncontrado('Registro de vacunación no encontrado');
  return prisma.registroVacunacion.delete({ where: { id } });
}

export async function listarMedicamentos() {
  return prisma.medicamento.findMany({
    orderBy: { nombre: 'asc' },
  });
}

export interface DatosCrearMedicamento {
  nombre: string;
  principioActivo?: string;
}

export async function crearMedicamento(datos: DatosCrearMedicamento) {
  const existente = await prisma.medicamento.findFirst({
    where: { nombre: { equals: datos.nombre, mode: 'insensitive' } },
    select: { id: true },
  });
  if (existente) throw new ErrorConflicto(`Ya existe un medicamento llamado '${datos.nombre}'`);

  return prisma.medicamento.create({ data: datos });
}
