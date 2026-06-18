import { Prisma, EstadoSanitario } from '@prisma/client';
import { prisma } from '../../compartido/prisma/clientePrisma';
import { ErrorNoEncontrado } from '../../compartido/tipos/respuesta';

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
  animal: {
    select: { id: true, numeroArete: true, nombre: true, finca: { select: { nombre: true } } },
  },
  veterinario: { select: { id: true, nombre: true, apellido: true } },
  enfermedades: true,
  tratamientos: {
    include: { medicamento: { select: { nombre: true } } },
  },
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

  const { enfermedades, tratamientos, veterinarioId, animalId, actualizarEstadoSanitario, ...restoHistorial } = datos;

  // Actualizar estado sanitario del animal si se especificó
  if (actualizarEstadoSanitario) {
    await prisma.animal.update({
      where: { id: animalId },
      data: { estadoSanitario: actualizarEstadoSanitario },
    });
  }

  return prisma.historialMedico.create({
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
    },
    select: seleccionHistorial,
  });
}

export async function eliminarHistorialMedico(id: string) {
  const historial = await prisma.historialMedico.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!historial) throw new ErrorNoEncontrado(`Historial médico con id '${id}' no encontrado`);
  return prisma.historialMedico.delete({ where: { id } });
}
