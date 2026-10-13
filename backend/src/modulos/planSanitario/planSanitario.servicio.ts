import { CategoriaActividadSanitaria } from '@prisma/client';
import { prisma } from '../../compartido/prisma/clientePrisma';
import { ErrorNoEncontrado } from '../../compartido/tipos/respuesta';

// Plan sanitario anual por finca: a diferencia del calendario de vacunación
// (por animal individual, basado en intervalos), este es un calendario a
// nivel de hato que la veterinaria arma una vez al año (higiene, vacunas,
// vitaminas, control de parásitos/plagas...) y cuyo cumplimiento se marca
// mes a mes.

const incluirActividades = {
  actividades: { orderBy: { categoria: 'asc' as const } },
} as const;

/**
 * Devuelve el plan sanitario de una finca para un año dado, creándolo vacío
 * si todavía no existe (así el frontend siempre tiene un plan sobre el cual
 * agregar actividades, sin un paso previo de "crear plan").
 */
export async function obtenerOCrearPlan(fincaId: string, anio: number) {
  return prisma.planSanitario.upsert({
    where: { fincaId_anio: { fincaId, anio } },
    create: { fincaId, anio },
    update: {},
    include: incluirActividades,
  });
}

export interface DatosActividadPlanSanitario {
  categoria:         CategoriaActividadSanitaria;
  nombreControl:     string;
  unidadReferencia?: string;
  prevencion?:       string;
  tratamiento?:      string;
  via?:              string;
  mesesProgramados?: number[];
}

export async function crearActividad(planId: string, datos: DatosActividadPlanSanitario) {
  const plan = await prisma.planSanitario.findUnique({ where: { id: planId }, select: { id: true } });
  if (!plan) throw new ErrorNoEncontrado(`Plan sanitario con id '${planId}' no encontrado`);

  return prisma.actividadPlanSanitario.create({
    data: { ...datos, plan: { connect: { id: planId } } },
  });
}

export async function actualizarActividad(
  id: string,
  datos: Partial<DatosActividadPlanSanitario>,
) {
  const actividad = await prisma.actividadPlanSanitario.findUnique({ where: { id }, select: { id: true } });
  if (!actividad) throw new ErrorNoEncontrado(`Actividad con id '${id}' no encontrada`);
  return prisma.actividadPlanSanitario.update({ where: { id }, data: datos });
}

export async function eliminarActividad(id: string) {
  const actividad = await prisma.actividadPlanSanitario.findUnique({ where: { id }, select: { id: true } });
  if (!actividad) throw new ErrorNoEncontrado(`Actividad con id '${id}' no encontrada`);
  return prisma.actividadPlanSanitario.delete({ where: { id } });
}

/**
 * Marca (o desmarca) un mes puntual de una actividad como completado --
 * cada clic de una casilla de la grilla del plan es una llamada a esta
 * función, nunca un reemplazo completo de la actividad.
 */
export async function marcarMesActividad(actividadId: string, mes: number, completado: boolean) {
  const actividad = await prisma.actividadPlanSanitario.findUnique({ where: { id: actividadId } });
  if (!actividad) throw new ErrorNoEncontrado(`Actividad con id '${actividadId}' no encontrada`);

  const meses = new Set(actividad.mesesCompletados);
  if (completado) meses.add(mes); else meses.delete(mes);

  return prisma.actividadPlanSanitario.update({
    where: { id: actividadId },
    data: { mesesCompletados: Array.from(meses).sort((a, b) => a - b) },
  });
}

/**
 * Resumen para el widget del Dashboard: cuántas actividades tocaban este
 * mes y cuántas de esas (más las de meses anteriores del mismo año) siguen
 * sin marcarse como hechas.
 */
export async function obtenerResumenSanitario(fincaId?: string) {
  const ahora = new Date();
  const anioActual = ahora.getFullYear();
  const mesActual = ahora.getMonth() + 1;

  const planes = await prisma.planSanitario.findMany({
    where: { anio: anioActual, ...(fincaId && { fincaId }) },
    include: {
      finca: { select: { nombre: true } },
      actividades: true,
    },
  });

  let pendientesEsteMes = 0;
  let atrasadas = 0;
  const detalle: Array<{ finca: string; actividad: string; mes: number }> = [];

  for (const plan of planes) {
    for (const actividad of plan.actividades) {
      for (const mes of actividad.mesesProgramados) {
        if (mes > mesActual) continue; // todavía no toca
        if (actividad.mesesCompletados.includes(mes)) continue; // ya se hizo

        if (mes === mesActual) pendientesEsteMes++;
        else atrasadas++;
        detalle.push({ finca: plan.finca.nombre, actividad: actividad.nombreControl, mes });
      }
    }
  }

  return { pendientesEsteMes, atrasadas, detalle: detalle.slice(0, 10) };
}
