import cron from 'node-cron';
import prisma from '../../compartido/prisma/clientePrisma';
import { logger } from '../../config/logger';
import { TipoAlertaRegla, EstadoNotificacion, PrioridadAlerta } from '@prisma/client';
import { enviarCorreoAlerta } from '../notificaciones/correo.servicio';

// Inicia todos los jobs del motor de alertas
export function iniciarMotorAlertas(): void {
  // Evaluación principal: cada hora
  cron.schedule('0 * * * *', async () => {
    logger.debug('Motor de alertas: ejecutando evaluación periódica');
    await evaluarTodasLasReglas();
  });

  // Evaluación de partos próximos: cada 6 horas
  cron.schedule('0 */6 * * *', async () => {
    await evaluarPartosProximos();
  });

  // Evaluación de vacunas vencidas: cada 12 horas
  cron.schedule('0 */12 * * *', async () => {
    await evaluarVacunas();
  });
}

async function evaluarTodasLasReglas(): Promise<void> {
  const reglas = await prisma.reglaAlerta.findMany({
    where: { activa: true },
  });

  for (const regla of reglas) {
    try {
      switch (regla.tipoAlerta) {
        case TipoAlertaRegla.VACUNA_VENCIDA:
        case TipoAlertaRegla.VACUNA_PROXIMA:
          await evaluarVacunas();
          break;
        case TipoAlertaRegla.PARTO_PROXIMO:
          await evaluarPartosProximos();
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
      }

      // Actualizar fecha de última evaluación
      await prisma.reglaAlerta.update({
        where: { id: regla.id },
        data: { ultimaEvaluacion: new Date() },
      });
    } catch (error) {
      logger.error(`Error evaluando regla ${regla.nombre}:`, error);
    }
  }
}

async function evaluarVacunas(): Promise<void> {
  const hoy = new Date();
  const en7Dias = new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Buscar vacunas próximas a vencer o ya vencidas
  const vacunasProximas = await prisma.registroVacunacion.findMany({
    where: {
      proximaFecha: { lte: en7Dias },
      historialMedico: {
        animal: { estado: 'ACTIVO' },
      },
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

    const yaVencida = vacuna.proximaFecha && vacuna.proximaFecha < hoy;
    const titulo = yaVencida
      ? `Vacuna VENCIDA: ${vacuna.calendarioVacunacion.nombreVacuna}`
      : `Vacuna próxima: ${vacuna.calendarioVacunacion.nombreVacuna}`;

    await crearNotificacionParaRol(
      titulo,
      `Animal: ${animal.nombre ?? animal.numeroArete} | Fecha: ${vacuna.proximaFecha?.toLocaleDateString('es-VE')}`,
      yaVencida ? PrioridadAlerta.CRITICA : PrioridadAlerta.ALTA,
      'RegistroVacunacion',
      vacuna.id,
      animal.fincaId
    );
  }
}

async function evaluarPartosProximos(): Promise<void> {
  const hoy = new Date();
  const en7Dias = new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000);

  const partosProximos = await prisma.gestacion.findMany({
    where: {
      estadoGestacion: 'EN_CURSO',
      fechaPartoEsperado: { gte: hoy, lte: en7Dias },
    },
    include: {
      madre: { select: { id: true, numeroArete: true, nombre: true, fincaId: true } },
    },
  });

  for (const gestacion of partosProximos) {
    const diasRestantes = Math.ceil(
      (gestacion.fechaPartoEsperado.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
    );

    await crearNotificacionParaRol(
      `Parto próximo: ${gestacion.madre.nombre ?? gestacion.madre.numeroArete}`,
      `Parto esperado en ${diasRestantes} días (${gestacion.fechaPartoEsperado.toLocaleDateString('es-VE')})`,
      PrioridadAlerta.ALTA,
      'Gestacion',
      gestacion.id,
      gestacion.madre.fincaId
    );
  }
}

async function evaluarDiasAbiertos(umbralDias: number): Promise<void> {
  const fechaLimite = new Date(Date.now() - umbralDias * 24 * 60 * 60 * 1000);

  // Vacas activas cuya última gestación terminó hace más del umbral sin nueva gestación
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
      (Date.now() - parto.fechaNacimiento.getTime()) / (1000 * 60 * 60 * 24)
    );

    await crearNotificacionParaRol(
      `Días abiertos excedidos: ${madre.nombre ?? madre.numeroArete}`,
      `La vaca lleva ${diasAbiertos} días abiertos sin nueva gestación confirmada`,
      PrioridadAlerta.MEDIA,
      'Animal',
      madre.id,
      madre.fincaId
    );
  }
}

async function evaluarEnfermedadesActivas(umbralDias: number): Promise<void> {
  const fechaLimite = new Date(Date.now() - umbralDias * 24 * 60 * 60 * 1000);

  const enfermedadesAntiguas = await prisma.enfermedadDiagnosticada.findMany({
    where: {
      activa: true,
      fechaInicio: { lt: fechaLimite },
      historialMedico: {
        animal: { estado: 'ACTIVO' },
      },
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
    const dias = Math.floor(
      (Date.now() - enfermedad.fechaInicio.getTime()) / (1000 * 60 * 60 * 24)
    );

    await crearNotificacionParaRol(
      `Enfermedad sin resolución: ${animal.nombre ?? animal.numeroArete}`,
      `${enfermedad.nombreEnfermedad} - ${dias} días activa sin resolución`,
      PrioridadAlerta.ALTA,
      'EnfermedadDiagnosticada',
      enfermedad.id,
      animal.fincaId
    );
  }
}

async function evaluarInventarioSemen(umbralUnidades: number): Promise<void> {
  const inventarioBajo = await prisma.inventarioSemen.findMany({
    where: {
      activo: true,
      cantidadDosis: { gt: 0 },
    },
    include: { semental: true },
  });

  for (const inventario of inventarioBajo) {
    const disponibles = inventario.cantidadDosis - inventario.cantidadUsada;
    if (disponibles <= umbralUnidades) {
      await crearNotificacionParaRol(
        `Inventario de semen bajo: ${inventario.semental.nombre}`,
        `Solo quedan ${disponibles} dosis disponibles (mínimo recomendado: ${umbralUnidades})`,
        PrioridadAlerta.MEDIA,
        'InventarioSemen',
        inventario.id,
        null
      );
    }
  }
}

async function crearNotificacionParaRol(
  titulo: string,
  mensaje: string,
  prioridad: PrioridadAlerta,
  entidadTipo: string,
  entidadId: string,
  fincaId: string | null
): Promise<void> {
  // Obtener usuarios activos que deben recibir la notificación
  const usuarios = await prisma.usuario.findMany({
    where: { estado: 'ACTIVO' },
    select: { id: true, correo: true, nombre: true, rol: true },
  });

  for (const usuario of usuarios) {
    // Crear notificación en BD
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

    // Enviar correo si está configurado
    try {
      await enviarCorreoAlerta(usuario.correo, usuario.nombre, titulo, mensaje, prioridad);
    } catch {
      // El fallo de correo no debe detener el motor
      logger.warn(`No se pudo enviar correo de alerta a ${usuario.correo}`);
    }
  }
}
