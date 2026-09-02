import { crearApp } from './app';
import { entorno } from './config/entorno';
import { logger } from './config/logger';
import prisma from './compartido/prisma/clientePrisma';
import { iniciarMotorAlertas } from './modulos/alertas/alertas.scheduler';
import { verificarConexionCorreo } from './modulos/notificaciones/correo.servicio';

const puerto = parseInt(entorno.PUERTO, 10);

async function iniciar(): Promise<void> {
  try {
    // Antes de levantar el servidor HTTP se confirma que la base de datos
    // responde; si no hay conexión no tiene sentido seguir arrancando.
    await prisma.$connect();
    logger.info('Conexión con la base de datos establecida');

    const app = crearApp();

    const servidor = app.listen(puerto, () => {
      logger.info(`Servidor iniciado en el puerto ${puerto}`);
      logger.info(`Ambiente: ${entorno.NODE_ENV}`);
      logger.info(`API disponible en: http://localhost:${puerto}/api`);
      logger.info(`Verificación de salud: http://localhost:${puerto}/health`);
    });

    // El motor de alertas corre en segundo plano, evaluando periódicamente
    // las reglas configuradas (vacunas próximas, partos, etc.)
    iniciarMotorAlertas();
    logger.info('Motor de alertas iniciado');

    // Se verifica la conexión SMTP al arrancar (no bloquea el arranque) para
    // detectar de inmediato un EMAIL_CLAVE inválido en vez de enterarse
    // recién cuando falle el primer correo de alerta.
    if (entorno.EMAIL_USUARIO) {
      verificarConexionCorreo();
    } else {
      logger.debug('Envío de correo desactivado: EMAIL_USUARIO no configurado');
    }

    // Ante SIGTERM/SIGINT (p. ej. al detener el contenedor) se deja de
    // aceptar conexiones nuevas, se cierra la conexión a la base de datos y
    // recién ahí se termina el proceso, para no cortar peticiones a medias.
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

    // Última red de seguridad: un error no capturado no debe dejar el
    // proceso en un estado zombie, así que se registra y se sale.
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
