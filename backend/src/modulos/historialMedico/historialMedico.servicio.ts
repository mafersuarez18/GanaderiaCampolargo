import { Prisma, EstadoSanitario, EstadoReproductivo, TipoDesparasitante, NivelGravedad } from '@prisma/client';
import { prisma } from '../../compartido/prisma/clientePrisma';
import { ErrorNoEncontrado } from '../../compartido/tipos/respuesta';

// Registra la consulta médica y todo lo que se diagnosticó/trató/aplicó en
// ella en una sola operación (enfermedades, tratamientos, desparasitaciones,
// información epidemiológica), y sincroniza la desparasitación con el
// calendario de vacunación correspondiente.

// ─── Pre-fill de nueva consulta ───────────────────────────────────────────────

/**
 * Devuelve los datos que sirven para pre-rellenar el formulario de nueva consulta
 * cuando el veterinario selecciona un animal:
 *   - última desparasitación registrada (de cualquier consulta anterior)
 *   - calendarios de vacunación activos para saber si hay uno de "desparasitación"
 */
export async function obtenerPrefillConsulta(animalId: string) {
  const [ultimaDesparasitacion, calendarios, enfermedadesActivas] = await Promise.all([
    // Última desparasitación del animal
    prisma.programaDesparasitacion.findFirst({
      where: { animalId },
      orderBy: { fecha: 'desc' },
    }),
    // Calendarios de tipo desparasitación (nombre contiene la palabra)
    prisma.calendarioVacunacion.findMany({
      select: { id: true, nombreVacuna: true, intervaloDias: true },
      orderBy: { nombreVacuna: 'asc' },
    }),
    // Enfermedades activas del animal (de cualquier consulta anterior), para poder
    // vincular un nuevo tratamiento a la enfermedad que atiende
    prisma.enfermedadDiagnosticada.findMany({
      where: { historialMedico: { animalId }, activa: true },
      select: { id: true, nombreEnfermedad: true, fechaInicio: true },
      orderBy: { fechaInicio: 'desc' },
    }),
  ]);

  return { ultimaDesparasitacion, calendarios, enfermedadesActivas };
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
  observaciones: true,
  estadoSanitario: true,
  // Anamnesis
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
  resultadosPruebas: true,
  animal: {
    select: { id: true, numeroArete: true, nombre: true, lote: { select: { finca: { select: { nombre: true } } } } },
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
      enfermedadDiagnosticadaId: true,
      medicamento: { select: { nombre: true } },
      enfermedadDiagnosticada: { select: { nombreEnfermedad: true } },
    },
  },
  informacionEpidemiologica: true,
} satisfies Prisma.HistorialMedicoSelect;

export async function listarHistorialMedico(filtros: FiltrosHistorial = {}) {
  const { animalId, fincaId, desde, hasta, pagina = 1, porPagina = 20 } = filtros;

  const donde: Prisma.HistorialMedicoWhereInput = {
    ...(animalId && { animalId }),
    ...(fincaId  && { animal: { lote: { fincaId } } }),
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
  observaciones?:        string;
  veterinarioId:         string;
  actualizarEstadoSanitario?: EstadoSanitario;
  // Estado sanitario evaluado en esta consulta puntual
  estadoSanitario?:      EstadoSanitario;
  // Anamnesis
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
  // Diagnóstico y plan (a nivel de consulta general)
  diagnosticoDefinitivo?:    string;
  resultadosPruebas?: string;
  // Relaciones hijas
  informacionEpidemiologica?: {
    garrapatas?:    boolean;
    mosquitos?:     boolean;
    murcielagos?:   boolean;
    moscas?:        boolean;
    otrosVectores?: string;
    descripcionEntorno?: string;
  };
  desparasitaciones?: Array<{
    medicamentoId:   string;
    tipo:             TipoDesparasitante;
    fecha:            Date;
    dosis?:           string;
    via?:             string;
    observaciones?:   string;
  }>;
  enfermedades?: Array<{
    nombreEnfermedad:    string;
    nivelGravedad?:      NivelGravedad;
    fechaInicio:         Date;
    descripcionClinica?: string;
    observaciones?:      string;
    // Diagnóstico/plan/pronóstico/síntomas de esta condición específica,
    // según el modelo lógico del tomo (DETALLE_DIAGNOSTICO)
    diagnosticoDefinitivo?: string;
    pronostico?:         string;
    planDiagnostico?:    string;
    tiempoEvolucion?:    string;
    sintomas?:           string;
    pruebasDiagnostico?: string;
  }>;
  tratamientos?: Array<{
    medicamentoId:             string;
    enfermedadDiagnosticadaId?: string;
    fechaInicio:               Date;
    dosis:                     string;
    viaAdministracion:         string;
    frecuencia:                string;
    duracionDias?:             number;
    observaciones?:            string;
    descripcion?:              string;
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
    informacionEpidemiologica, desparasitaciones,
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
              nivelGravedad:     enf.nivelGravedad,
              fechaInicio:       enf.fechaInicio,
              descripcionClinica: enf.descripcionClinica,
              observaciones:     enf.observaciones,
              diagnosticoDefinitivo: enf.diagnosticoDefinitivo,
              pronostico:        enf.pronostico,
              planDiagnostico:   enf.planDiagnostico,
              tiempoEvolucion:   enf.tiempoEvolucion,
              sintomas:          enf.sintomas,
              pruebasDiagnostico: enf.pruebasDiagnostico,
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
              descripcion:       t.descripcion,
              medicamento: { connect: { id: t.medicamentoId } },
              ...(t.enfermedadDiagnosticadaId && {
                enfermedadDiagnosticada: { connect: { id: t.enfermedadDiagnosticadaId } },
              }),
            })),
          }
        : undefined,
      informacionEpidemiologica: informacionEpidemiologica
        ? { create: informacionEpidemiologica }
        : undefined,
    },
    select: seleccionHistorial,
  });

  // Las desparasitaciones ya no cuelgan del historial médico (se identifican
  // solo por el animal), así que se crean aparte en vez de como relación
  // anidada — el formulario de consulta las sigue enviando igual, solo
  // cambia cómo quedan guardadas.
  let desparasitacionesCreadas: Array<{
    id: string; tipo: TipoDesparasitante; fecha: Date; dosis: string | null; via: string | null;
    medicamento: { nombre: string; principioActivo: string | null };
  }> = [];

  if (desparasitaciones?.length) {
    desparasitacionesCreadas = await Promise.all(
      desparasitaciones.map((d) =>
        prisma.programaDesparasitacion.create({
          data: {
            tipo: d.tipo,
            fecha: d.fecha,
            dosis: d.dosis,
            via: d.via,
            observaciones: d.observaciones,
            animal:      { connect: { id: animalId } },
            medicamento: { connect: { id: d.medicamentoId } },
            veterinario: { connect: { id: veterinarioId } },
          },
          include: { medicamento: { select: { nombre: true, principioActivo: true } } },
        }),
      ),
    );

    // ── Sincronización automática con vacunación ───────────────────────────
    // Cada desparasitación registrada también deja un RegistroVacunacion en
    // el calendario de desparasitación que corresponda (por nombre del
    // producto), para que el motor de alertas la considere igual que
    // cualquier otra vacuna próxima a vencer.
    const calendariosDesp = await prisma.calendarioVacunacion.findMany({
      where: { nombreVacuna: { contains: 'desparasit', mode: 'insensitive' } },
      select: { id: true, intervaloDias: true },
    });

    if (calendariosDesp.length > 0) {
      const calendario = calendariosDesp[0];
      await Promise.all(
        desparasitaciones.map((d, i) => {
          const proximaFecha = new Date(
            d.fecha.getTime() + calendario.intervaloDias * 24 * 60 * 60 * 1000,
          );
          const nombreMedicamento = desparasitacionesCreadas[i]?.medicamento?.nombre;
          return prisma.registroVacunacion.create({
            data: {
              fechaAplicacion:      d.fecha,
              proximaFecha,
              dosis:                d.dosis,
              viaAdministracion:    d.via,
              observaciones:        d.observaciones ?? `Auto-registrado desde consulta${nombreMedicamento ? `: ${nombreMedicamento}` : ''}`,
              animal:               { connect: { id: animalId } },
              calendarioVacunacion: { connect: { id: calendario.id } },
              aplicadoPor:          { connect: { id: veterinarioId } },
            },
          });
        }),
      );
    }
  }

  return { ...historial, desparasitaciones: desparasitacionesCreadas };
}

export async function eliminarHistorialMedico(id: string) {
  const historial = await prisma.historialMedico.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!historial) throw new ErrorNoEncontrado(`Historial médico con id '${id}' no encontrado`);
  return prisma.historialMedico.delete({ where: { id } });
}
