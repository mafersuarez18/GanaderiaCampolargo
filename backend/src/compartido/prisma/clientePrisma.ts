import { PrismaClient } from '@prisma/client';
import { logger } from '../../config/logger';

// Cliente Prisma compartido por toda la aplicación: una sola instancia,
// una sola pool de conexiones a la base de datos.
const clientePrisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
});

// Cualquier consulta que tarde más de 2 segundos queda registrada como
// advertencia, para poder detectar cuellos de botella sin activar el log
// completo de queries.
clientePrisma.$on('query', (evento) => {
  if (evento.duration > 2000) {
    logger.warn('Consulta lenta detectada', {
      consulta: evento.query,
      duracion: `${evento.duration}ms`,
    });
  }
});

clientePrisma.$on('error', (evento) => {
  logger.error('Error en Prisma', { mensaje: evento.message });
});

// En desarrollo, tsx watch recarga el módulo en cada cambio de archivo;
// guardar la instancia en el objeto global evita crear una conexión nueva
// por cada recarga.
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = clientePrisma;
} else {
  if (!global.__prisma) {
    global.__prisma = clientePrisma;
  }
  prisma = global.__prisma;
}

export { prisma };
export default prisma;
