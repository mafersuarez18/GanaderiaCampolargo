import { Prisma, EstadoSanitario, EstadoReproductivo, TipoAyudaDiagnostica, TipoDesparasitante } from '@prisma/client';
import { prisma } from '../../compartido/prisma/clientePrisma';
import { ErrorNoEncontrado } from '../../compartido/tipos/respuesta';

// ─── Pre-fill de nueva consulta ───────────────────────────────────────────────

/**
 * Devuelve los datos que sirven para pre-rellenar el formulario de nueva consulta
 * cuando el veterinario selecciona un animal:
 *   - última desparasitación registrada (de cualquier consulta anterior)
 *   - calendarios de vacunación activos para saber si hay uno de "desparasitación"
 */
export async function obtenerPrefillConsulta(animalId: string) {
  const [ultimaDesparasitacion, calendarios] = await Promise.all([
    // Última desparasitación del animal (cualquier historial)
    prisma.programaDesparasitacion.findFirst({
      where: { historialMedico: { animalId } },
      orderBy: { fecha: 'desc' },
    }),
    // Calendarios activos de tipo desparasitación (nombre contiene la palabra)
    prisma.calendarioVacunacion.findMany({
      where: { activo: true },
      select: { id: true, nombreVacuna: true, intervaloDias: true },
      orderBy: { nombreVacuna: 'asc' },
    }),
  ]);

  return { ultimaDesparasitacion, calendarios };
}

export interface FiltrosHistorial {
  animalId?: string;
  fincaId?:  string;
  desde?:    Date;
  hasta?:    Date;
  pagina?:   number;
  porPagina?: number;
}

const seleccionHistorial = {
  id: true,
  fechaConsulta: true,
  motivoConsulta: true,
  sintomasObservados: true,
  diagnostico: true,
  pronostico: true,
  observaciones: true,
  // Anamnesis
  tiempoEvolucion: true,
  tratamientosPrevios: true,
  cirugias: true,
  // Exploración física
  temperatura: true,
  frecuenciaCardiaca: true,
  frecuenciaRespiratoria: true,
  tiempoLlenadoCapilar: true,
  movimientosRuminales: true,
  condicionCorporal: true,
  // Estado del animal
  estadoReproductivo: true,
  litrosLechesDiarios: true,
  gananciaPeso: true,
  // Diagnóstico y plan
  diagnosticoDefinitivo: true,
  planDiagnostico: true,
  observacionesDiagnosticosOficiales: true,
  animal: {
    select: { id: true, numeroArete: true, nombre: true, finca: { select: { nombre: true } } },
  },
  veterinario: { select: { id: true, nombre: true, apellido: true } },
  enfermedades: true,
  tratamientos: {
    select: {
      id: true,
      dosis: true,
      viaAdministracion: true,
      frecuencia: true,
      duracionDias: true,
      estado: true,
      medicamento: { select: { nombre: true } },
    },
  },
  informacionEpidemiologica: true,
  ayudasDiagnosticas: true,
  desparasitaciones: true,
  creadoEn: true,
} satisfies Prisma.HistorialMedicoSelect;

export async function listarHistorialMedico(filtros: FiltrosHistorial = {}) {
  const { animalId, fincaId, desde, hasta, pagina = 1, porPagina = 20 } = filtros;

  const donde: Prisma.HistorialMedicoWhereInput = {
    ...(animalId && { animalId }),
    ...(fincaId  && { animal: { fincaId } }),
    ...((desde || hasta) && {
      fechaConsulta: {
        ...(desde && { gte: desde }),
        ...(hasta && { lte: hasta }),
      },
    }),
  };

  const [registros, total] = await prisma.$transaction([
    prisma.historialMedico.findMany({
      where: donde,
      select: seleccionHistorial,
      orderBy: { fechaConsulta: 'desc' },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    }),
    prisma.historialMedico.count({ where: donde }),
  ]);

  return { registros, total };
}

export async function obtenerHistorialPorId(id: string) {
  const historial = await prisma.historialMedico.findUnique({
    where: { id },
    select: seleccionHistorial,
  });
  if (!historial) throw new ErrorNoEncontrado(`Historial médico con id '${id}' no encontrado`);
  return historial;
}

export interface DatosCrearHistorial {
  animalId:              string;
  fechaConsulta:         Date;
  motivoConsulta:        string;
  sintomasObservados?:   string;
  diagnostico:           string;
  pronostico?:           string;
  observaciones?:        string;
  veterinarioId:         string;
  actualizarEstadoSanitario?: EstadoSanitario;
  // Anamnesis
  tiempoEvolucion?:      string;
  tratamientosPrevios?:  string;
  cirugias?:             string;
  // Exploración física
  temperatura?:              number;
  frecuenciaCardiaca?:       number;
  frecuenciaRespiratoria?:   number;
  tiempoLlenadoCapilar?:     number;
  movimientosRuminales?:     number;
  condicionCorporal?:        number;
  // Estado del animal
  estadoReproductivo?:       EstadoReproductivo;
  litrosLechesDiarios?:      number;
  gananciaPeso?:             number;
  // Diagnóstico y plan
  diagnosticoDefinitivo?:    string;
  planDiagnostico?:          string;
  observacionesDiagnosticosOficiales?: string;
  // Relaciones hijas
  informacionEpidemiologica?: {
    garrapatas?:    boolean;
    mosquitos?:     boolean;
    murcielagos?:   boolean;
    moscas?:        boolean;
    otrosVectores?: string;
    descripcion?:   string;
  };
  ayudasDiagnosticas?: Array<{
    tipo:        TipoAyudaDiagnostica;
    descripcion?: string;
    resultado?:   string;
    fecha:        Date;
  }>;
  desparasitaciones?: Array<{
    producto:        string;
    principioActivo?: string;
    tipo:             TipoDesparasitante;
    fecha:            Date;
    dosis?:           string;
    via?:             string;
    observaciones?:   string;
  }>;
  enfermedades?: Array<{
    nombreEnfermedad:    string;
    fechaInicio:         Date;
    descripcionClinica?: string;
    observaciones?:      string;
  }>;
  tratamientos?: Array<{
    medicamentoId:     string;
    fechaInicio:       Date;
    dosis:             string;
    viaAdministracion: string;
    frecuencia:        string;
    duracionDias?:     number;
    observaciones?:    string;
  }>;
}

export async function crearHistorialMedico(datos: DatosCrearHistorial) {
  const animal = await prisma.animal.findUnique({
    where: { id: datos.animalId },
    select: { id: true },
  });
  if (!animal) throw new ErrorNoEncontrado(`Animal con id '${datos.animalId}' no encontrado`);

  const {
    enfermedades, tratamientos, veterinarioId, animalId, actualizarEstadoSanitario,
    informacionEpidemiologica, ayudasDiagnosticas, desparasitaciones,
    ...restoHistorial
  } = datos;

  // Actualizar estado sanitario del animal si se especificó
  if (actualizarEstadoSanitario) {
    await prisma.animal.update({
      where: { id: animalId },
      data: { estadoSanitario: actualizarEstadoSanitario },
    });
  }

  const historial = await prisma.historialMedico.create({
    data: {
      ...restoHistorial,
      animal:      { connect: { id: animalId } },
      veterinario: { connect: { id: veterinarioId } },
      enfermedades: enfermedades?.length
        ? {
            create: enfermedades.map((enf) => ({
              nombreEnfermedad:  enf.nombreEnfermedad,
              fechaInicio:       enf.fechaInicio,
              descripcionClinica: enf.descripcionClinica,
              observaciones:     enf.observaciones,
            })),
          }
        : undefined,
      tratamientos: tratamientos?.length
        ? {
            create: tratamientos.map((t) => ({
              dosis:             t.dosis,
              viaAdministracion: t.viaAdministracion,
              frecuencia:        t.frecuencia,
              duracionDias:      t.duracionDias,
              fechaInicio:       t.fechaInicio,
              observaciones:     t.observaciones,
              medicamento: { connect: { id: t.medicamentoId } },
            })),
          }
        : undefined,
      informacionEpidemiologica: informacionEpidemiologica
        ? { create: informacionEpidemiologica }
        : undefined,
      ayudasDiagnosticas: ayudasDiagnosticas?.length
        ? { create: ayudasDiagnosticas }
        : undefined,
      desparasitaciones: desparasitaciones?.length
        ? { create: desparasitaciones }
        : undefined,
    },
    select: seleccionHistorial,
  });

  // ── Sincronización automática con vacunación ─────────────────────────────────
  // Si se registraron desparasitaciones nuevas, crear RegistroVacunacion en el
  // calendario de desparasitación que corresponda (por nombre del producto).
  if (desparasitaciones?.length) {
    // Buscar calendarios activos cuyo nombre mencione "desparasitación" o "desparasitacion"
    const calendariosDesp = await prisma.calendarioVacunacion.findMany({
      where: {
        activo: true,
        nombreVacuna: { contains: 'desparasit', mode: 'insensitive' },
      },
      select: { id: true, intervaloDias: true },
    });

    if (calendariosDesp.length > 0) {
      // Usar el primer calendario encontrado
      const calendario = calendariosDesp[0];

      // Crear un RegistroVacunacion por cada desparasitación registrada
      await Promise.all(
        desparasitaciones.map((d) => {
          const proximaFecha = new Date(
            d.fecha.getTime() + calendario.intervaloDias * 24 * 60 * 60 * 1000,
          );
          return prisma.registroVacunacion.create({
            data: {
              fechaAplicacion:      d.fecha,
              proximaFecha,
              dosis:                d.dosis,
              viaAdministracion:    d.via,
              observaciones:        d.observaciones ?? `Auto-registrado desde consulta: ${d.producto}${d.principioActivo ? ` (${d.principioActivo})` : ''}`,
              historialMedico:      { connect: { id: historial.id } },
              calendarioVacunacion: { connect: { id: calendario.id } },
              aplicadoPor:          { connect: { id: veterinarioId } },
            },
          });
        }),
      );
    }
  }

  return historial;
}

export async function eliminarHistorialMedico(id: string) {
  const historial = await prisma.historialMedico.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!historial) throw new ErrorNoEncontrado(`Historial médico con id '${id}' no encontrado`);
  return prisma.historialMedico.delete({ where: { id } });
}
