import { crearApp } from './app';
import { entorno } from './config/entorno';
import { logger } from './config/logger';
import prisma from './compartido/prisma/clientePrisma';
import { iniciarMotorAlertas } from './modulos/alertas/alertas.scheduler';

const puerto = parseInt(entorno.PUERTO, 10);

async function iniciar(): Promise<void> {
  try {
    // Verificar conexión con la base de datos
    await prisma.$connect();
    logger.info('Conexión con la base de datos establecida');

    const app = crearApp();

    const servidor = app.listen(puerto, () => {
      logger.info(`Servidor iniciado en el puerto ${puerto}`);
      logger.info(`Ambiente: ${entorno.NODE_ENV}`);
      logger.info(`API disponible en: http://localhost:${puerto}/api/v1`);
      logger.info(`Verificación de salud: http://localhost:${puerto}/health`);
    });

    // Iniciar motor de alertas (evaluación periódica de reglas)
    iniciarMotorAlertas();
    logger.info('Motor de alertas iniciado');

    // Cierre ordenado al recibir señales del sistema
    const cerrarOrdenadamente = async (senal: string) => {
      logger.info(`Señal ${senal} recibida. Cerrando servidor...`);
      servidor.close(async () => {
        await prisma.$disconnect();
        logger.info('Servidor cerrado correctamente');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => cerrarOrdenadamente('SIGTERM'));
    process.on('SIGINT', () => cerrarOrdenadamente('SIGINT'));

    // Capturar excepciones no manejadas
    process.on('uncaughtException', (error) => {
      logger.error('Excepción no capturada:', { error: error.message, pila: error.stack });
      process.exit(1);
    });

    process.on('unhandledRejection', (razon) => {
      logger.error('Promesa rechazada no manejada:', { razon });
      process.exit(1);
    });

  } catch (error) {
    logger.error('Error al iniciar el servidor:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

iniciar();
