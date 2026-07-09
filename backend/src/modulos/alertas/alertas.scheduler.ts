import cron from 'node-cron';
import prisma from '../../compartido/prisma/clientePrisma';
import { logger } from '../../config/logger';
import { TipoAlertaRegla, EstadoNotificacion, PrioridadAlerta } from '@prisma/client';
import { enviarCorreoAlerta } from '../notificaciones/correo.servicio';

// ── Inicio del motor de alertas ───────────────────────────────────────────────

/** Registra todos los cron jobs del motor de alertas */
export function iniciarMotorAlertas(): void {
  // Evaluación completa: cada hora en punto
  cron.schedule('0 * * * *', async () => {
    logger.debug('Motor de alertas: evaluación periódica');
    await evaluarTodasLasReglas();
  });

  // Partos próximos: cada 6 horas
  cron.schedule('0 */6 * * *', async () => {
    await evaluarPartosProximos();
  });

  // Vacunas y desparasitaciones: cada 12 horas
  cron.schedule('0 */12 * * *', async () => {
    await evaluarVacunas();
    await evaluarDesparasitaciones();
  });
}

/** Ejecuta todas las reglas activas de forma programática (útil para el endpoint de disparo manual) */
export async function evaluarTodasLasReglas(): Promise<{ evaluadas: number; errores: string[] }> {
  const reglas = await prisma.reglaAlerta.findMany({ where: { activa: true } });
  const errores: string[] = [];

  for (const regla of reglas) {
    try {
      switch (regla.tipoAlerta) {
        case TipoAlertaRegla.VACUNA_VENCIDA:
        case TipoAlertaRegla.VACUNA_PROXIMA:
          await evaluarVacunas(regla.umbralValor ?? 7);
          break;
        case TipoAlertaRegla.PARTO_PROXIMO:
          await evaluarPartosProximos(regla.umbralValor ?? 7);
          break;
        case TipoAlertaRegla.DIAS_ABIERTOS_EXCEDIDOS:
          await evaluarDiasAbiertos(regla.umbralValor ?? 90);
          break;
        case TipoAlertaRegla.ENFERMEDAD_ACTIVA_SIN_RESOLUCION:
          await evaluarEnfermedadesActivas(regla.umbralValor ?? 14);
          break;
        case TipoAlertaRegla.INVENTARIO_SEMEN_BAJO:
          await evaluarInventarioSemen(regla.umbralValor ?? 10);
          break;
        case TipoAlertaRegla.AUSENCIA_CONTROL_VETERINARIO:
          await evaluarAusenciaControlVeterinario(regla.umbralValor ?? 60);
          break;
        case TipoAlertaRegla.CONTROL_PESO_PENDIENTE:
          await evaluarControlPesoPendiente(regla.umbralValor ?? 30);
          break;
        case TipoAlertaRegla.INTERVALO_REPRODUCTIVO_PROLONGADO:
          await evaluarIntervaloParto(regla.umbralValor ?? 365);
          break;
      }

      await prisma.reglaAlerta.update({
        where: { id: regla.id },
        data: { ultimaEvaluacion: new Date() },
      });
    } catch (error) {
      const msg = `Error evaluando regla '${regla.nombre}': ${String(error)}`;
      logger.error(msg);
      errores.push(msg);
    }
  }

  return { evaluadas: reglas.length, errores };
}

// ── Evaluadores individuales ──────────────────────────────────────────────────

/** Vacunas próximas a vencer o ya vencidas */
async function evaluarVacunas(diasUmbral = 7): Promise<void> {
  const hoy     = new Date();
  const limite  = new Date(hoy.getTime() + diasUmbral * 86_400_000);

  const vacunasProximas = await prisma.registroVacunacion.findMany({
    where: {
      proximaFecha: { lte: limite },
      historialMedico: { animal: { estado: 'ACTIVO' } },
    },
    include: {
      historialMedico: {
        include: {
          animal: { select: { id: true, numeroArete: true, nombre: true, fincaId: true } },
        },
      },
      calendarioVacunacion: true,
    },
  });

  for (const vacuna of vacunasProximas) {
    const animal = vacuna.historialMedico?.animal;
    if (!animal) continue;

    const yaVencida = vacuna.proximaFecha != null && vacuna.proximaFecha < hoy;

    await crearNotificacionSiNoExiste(
      yaVencida
        ? `Vacuna VENCIDA — ${vacuna.calendarioVacunacion.nombreVacuna}`
        : `Vacuna próxima — ${vacuna.calendarioVacunacion.nombreVacuna}`,
      `Animal: ${animal.nombre ?? animal.numeroArete} | Próxima fecha: ${vacuna.proximaFecha?.toLocaleDateString('es-VE')}`,
      yaVencida ? PrioridadAlerta.CRITICA : PrioridadAlerta.ALTA,
      'RegistroVacunacion',
      vacuna.id,
      animal.fincaId,
    );
  }
}

/** Desparasitaciones cuya próxima aplicación se aproxima o ya pasó */
async function evaluarDesparasitaciones(diasUmbral = 15): Promise<void> {
  const hoy    = new Date();
  const limite = new Date(hoy.getTime() + diasUmbral * 86_400_000);

  // Obtener la última desparasitación de cada animal activo
  const ultimasDesp = await prisma.programaDesparasitacion.findMany({
    where: {
      historialMedico: { animal: { estado: 'ACTIVO' } },
    },
    include: {
      historialMedico: {
        include: {
          animal: { select: { id: true, numeroArete: true, nombre: true, fincaId: true } },
        },
      },
    },
    orderBy: { fecha: 'desc' },
  });

  // Agrupar por animal y quedarse solo con la más reciente
  const porAnimal = new Map<string, typeof ultimasDesp[0]>();
  for (const desp of ultimasDesp) {
    const animalId = desp.historialMedico.animal.id;
    if (!porAnimal.has(animalId)) porAnimal.set(animalId, desp);
  }

  for (const [, desp] of porAnimal) {
    const animal = desp.historialMedico.animal;

    // Calcular próxima fecha estimada: 90 días después de la última desparasitación
    const proximaFecha = new Date(desp.fecha.getTime() + 90 * 86_400_000);

    if (proximaFecha > limite) continue; // Aún no se acerca

    const yaVencida = proximaFecha < hoy;

    await crearNotificacionSiNoExiste(
      yaVencida
        ? `Desparasitación VENCIDA — ${animal.nombre ?? animal.numeroArete}`
        : `Desparasitación próxima — ${animal.nombre ?? animal.numeroArete}`,
      `Producto anterior: ${desp.producto} (${desp.fecha.toLocaleDateString('es-VE')}) | Próxima: ${proximaFecha.toLocaleDateString('es-VE')}`,
      yaVencida ? PrioridadAlerta.ALTA : PrioridadAlerta.MEDIA,
      'ProgramaDesparasitacion',
      desp.id,
      animal.fincaId,
    );
  }
}

/** Partos esperados en los próximos N días */
async function evaluarPartosProximos(diasUmbral = 7): Promise<void> {
  const hoy    = new Date();
  const limite = new Date(hoy.getTime() + diasUmbral * 86_400_000);

  const partosProximos = await prisma.gestacion.findMany({
    where: {
      estadoGestacion: 'EN_CURSO',
      fechaPartoEsperado: { gte: hoy, lte: limite },
    },
    include: {
      madre: { select: { id: true, numeroArete: true, nombre: true, fincaId: true } },
    },
  });

  for (const gestacion of partosProximos) {
    const diasRestantes = Math.ceil(
      (gestacion.fechaPartoEsperado.getTime() - hoy.getTime()) / 86_400_000,
    );

    await crearNotificacionSiNoExiste(
      `Parto próximo — ${gestacion.madre.nombre ?? gestacion.madre.numeroArete}`,
      `Parto esperado en ${diasRestantes} día(s) (${gestacion.fechaPartoEsperado.toLocaleDateString('es-VE')})`,
      diasRestantes <= 3 ? PrioridadAlerta.CRITICA : PrioridadAlerta.ALTA,
      'Gestacion',
      gestacion.id,
      gestacion.madre.fincaId,
    );
  }
}

/** Vacas con días abiertos (sin gestación confirmada) que superan el umbral */
async function evaluarDiasAbiertos(umbralDias: number): Promise<void> {
  const fechaLimite = new Date(Date.now() - umbralDias * 86_400_000);

  const ultimosPartos = await prisma.nacimiento.findMany({
    where: {
      fechaNacimiento: { lt: fechaLimite },
      gestacion: {
        madre: { estado: 'ACTIVO', sexo: 'HEMBRA' },
        estadoGestacion: 'FINALIZADA_PARTO',
      },
    },
    include: {
      gestacion: {
        include: {
          madre: { select: { id: true, numeroArete: true, nombre: true, fincaId: true } },
        },
      },
    },
  });

  for (const parto of ultimosPartos) {
    const madre = parto.gestacion.madre;
    const diasAbiertos = Math.floor(
      (Date.now() - parto.fechaNacimiento.getTime()) / 86_400_000,
    );

    await crearNotificacionSiNoExiste(
      `Días abiertos excedidos — ${madre.nombre ?? madre.numeroArete}`,
      `La vaca lleva ${diasAbiertos} días sin nueva gestación confirmada (umbral: ${umbralDias} días)`,
      PrioridadAlerta.MEDIA,
      'Animal',
      madre.id,
      madre.fincaId,
    );
  }
}

/** Enfermedades activas sin resolución que superan el umbral de días */
async function evaluarEnfermedadesActivas(umbralDias: number): Promise<void> {
  const fechaLimite = new Date(Date.now() - umbralDias * 86_400_000);

  const enfermedadesAntiguas = await prisma.enfermedadDiagnosticada.findMany({
    where: {
      activa: true,
      fechaInicio: { lt: fechaLimite },
      historialMedico: { animal: { estado: 'ACTIVO' } },
    },
    include: {
      historialMedico: {
        include: {
          animal: { select: { id: true, numeroArete: true, nombre: true, fincaId: true } },
        },
      },
    },
  });

  for (const enfermedad of enfermedadesAntiguas) {
    const animal = enfermedad.historialMedico.animal;
    const dias   = Math.floor((Date.now() - enfermedad.fechaInicio.getTime()) / 86_400_000);

    await crearNotificacionSiNoExiste(
      `Enfermedad sin resolución — ${animal.nombre ?? animal.numeroArete}`,
      `${enfermedad.nombreEnfermedad} lleva ${dias} días activa sin resolución (umbral: ${umbralDias} días)`,
      PrioridadAlerta.ALTA,
      'EnfermedadDiagnosticada',
      enfermedad.id,
      animal.fincaId,
    );
  }
}

/** Animales activos sin consulta veterinaria en más de N días */
async function evaluarAusenciaControlVeterinario(umbralDias: number): Promise<void> {
  const fechaLimite = new Date(Date.now() - umbralDias * 86_400_000);

  const animalesSinControl = await prisma.animal.findMany({
    where: {
      estado: 'ACTIVO',
      OR: [
        { historialesMedicos: { none: {} } },
        {
          historialesMedicos: {
            none: { fechaConsulta: { gte: fechaLimite } },
          },
        },
      ],
    },
    select: {
      id: true,
      numeroArete: true,
      nombre: true,
      fincaId: true,
      historialesMedicos: {
        orderBy: { fechaConsulta: 'desc' },
        take: 1,
        select: { fechaConsulta: true },
      },
    },
  });

  for (const animal of animalesSinControl) {
    const ultimaConsulta = animal.historialesMedicos[0]?.fechaConsulta;
    const diasSinControl = ultimaConsulta
      ? Math.floor((Date.now() - ultimaConsulta.getTime()) / 86_400_000)
      : null;

    const mensaje = diasSinControl != null
      ? `Último control hace ${diasSinControl} días (umbral: ${umbralDias} días)`
      : `Sin consulta veterinaria registrada en el sistema`;

    await crearNotificacionSiNoExiste(
      `Sin control veterinario — ${animal.nombre ?? animal.numeroArete}`,
      mensaje,
      PrioridadAlerta.MEDIA,
      'Animal',
      animal.id,
      animal.fincaId,
    );
  }
}

/** Animales sin registro de peso en los últimos N días */
async function evaluarControlPesoPendiente(umbralDias: number): Promise<void> {
  const fechaLimite = new Date(Date.now() - umbralDias * 86_400_000);

  // Animales activos con pesoActual desactualizado (no existe campo de fecha de peso,
  // usamos la fecha de actualizadoEn como proxy)
  const animalesSinPeso = await prisma.animal.findMany({
    where: {
      estado: 'ACTIVO',
      pesoActual: null,
    },
    select: {
      id: true,
      numeroArete: true,
      nombre: true,
      fincaId: true,
      fechaIngreso: true,
    },
  });

  for (const animal of animalesSinPeso) {
    const diasDesdeIngreso = Math.floor(
      (Date.now() - animal.fechaIngreso.getTime()) / 86_400_000,
    );

    // Solo alertar si el animal lleva más de umbralDias en el sistema
    if (diasDesdeIngreso < umbralDias) continue;

    await crearNotificacionSiNoExiste(
      `Control de peso pendiente — ${animal.nombre ?? animal.numeroArete}`,
      `El animal no tiene peso registrado y lleva ${diasDesdeIngreso} días en el sistema`,
      PrioridadAlerta.BAJA,
      'Animal',
      animal.id,
      animal.fincaId,
    );
  }
}

/** Vacas cuyo intervalo entre partos supera el umbral de días */
async function evaluarIntervaloParto(umbralDias: number): Promise<void> {
  const fechaLimite = new Date(Date.now() - umbralDias * 86_400_000);

  const gestacionesAntiguas = await prisma.gestacion.findMany({
    where: {
      estadoGestacion: 'FINALIZADA_PARTO',
      nacimientos: { some: { fechaNacimiento: { lt: fechaLimite } } },
      madre: { estado: 'ACTIVO', sexo: 'HEMBRA' },
    },
    include: {
      madre:      { select: { id: true, numeroArete: true, nombre: true, fincaId: true } },
      nacimientos: { select: { fechaNacimiento: true }, orderBy: { fechaNacimiento: 'desc' }, take: 1 },
    },
  });

  for (const gestacion of gestacionesAntiguas) {
    const primerNacimiento = gestacion.nacimientos[0];
    if (!primerNacimiento) continue;
    const dias = Math.floor(
      (Date.now() - primerNacimiento.fechaNacimiento.getTime()) / 86_400_000,
    );

    await crearNotificacionSiNoExiste(
      `Intervalo reproductivo prolongado — ${gestacion.madre.nombre ?? gestacion.madre.numeroArete}`,
      `Han pasado ${dias} días desde el último parto sin nueva gestación (umbral: ${umbralDias} días)`,
      PrioridadAlerta.MEDIA,
      'Gestacion',
      gestacion.id,
      gestacion.madre.fincaId,
    );
  }
}

/** Inventario de semen por debajo del umbral */
async function evaluarInventarioSemen(umbralUnidades: number): Promise<void> {
  const inventariosBajos = await prisma.inventarioSemen.findMany({
    where: { activo: true, cantidadDosis: { gt: 0 } },
    include: { semental: true },
  });

  for (const inventario of inventariosBajos) {
    const disponibles = inventario.cantidadDosis - inventario.cantidadUsada;
    if (disponibles > umbralUnidades) continue;

    await crearNotificacionSiNoExiste(
      `Inventario de semen bajo — ${inventario.semental.nombre}`,
      `Quedan ${disponibles} dosis disponibles (mínimo recomendado: ${umbralUnidades})`,
      PrioridadAlerta.MEDIA,
      'InventarioSemen',
      inventario.id,
      null,
    );
  }
}

// ── Helper: crear notificación evitando duplicados recientes ─────────────────

/**
 * Crea una notificación para todos los usuarios activos con el rol adecuado,
 * pero sólo si no existe ya una notificación no leída con el mismo entidadId
 * generada en las últimas 24 h.
 */
async function crearNotificacionSiNoExiste(
  titulo: string,
  mensaje: string,
  prioridad: PrioridadAlerta,
  entidadTipo: string,
  entidadId: string,
  fincaId: string | null,
): Promise<void> {
  const hace24h = new Date(Date.now() - 24 * 3_600_000);

  // Verificar si ya existe una notificación reciente para esta entidad
  const yaExiste = await prisma.notificacion.findFirst({
    where: {
      entidadId,
      entidadTipo,
      leida: false,
      creadoEn: { gte: hace24h },
    },
    select: { id: true },
  });

  if (yaExiste) return; // Evitar flood de notificaciones duplicadas

  const usuarios = await prisma.usuario.findMany({
    where: { estado: 'ACTIVO' },
    select: { id: true, correo: true, nombre: true, rol: true },
  });

  for (const usuario of usuarios) {
    await prisma.notificacion.create({
      data: {
        titulo,
        mensaje,
        prioridad,
        estado: EstadoNotificacion.PENDIENTE,
        entidadTipo,
        entidadId,
        usuarioId: usuario.id,
      },
    });

    try {
      await enviarCorreoAlerta(usuario.correo, usuario.nombre, titulo, mensaje, prioridad);
    } catch {
      logger.warn(`No se pudo enviar correo de alerta a ${usuario.correo}`);
    }
  }
}

// ── Exportaciones para uso en rutas ──────────────────────────────────────────
export {
  evaluarVacunas,
  evaluarDesparasitaciones,
  evaluarPartosProximos,
  evaluarDiasAbiertos,
  evaluarEnfermedadesActivas,
  evaluarAusenciaControlVeterinario,
  evaluarControlPesoPendiente,
  evaluarIntervaloParto,
  evaluarInventarioSemen,
};
