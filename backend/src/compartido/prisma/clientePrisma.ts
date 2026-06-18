import { PrismaClient } from '@prisma/client';
import { logger } from '../../config/logger';

// Instancia única de Prisma (patrón singleton para evitar múltiples conexiones)
const clientePrisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
});

// Registrar consultas lentas en desarrollo (> 2 segundos)
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

// Reutilizar instancia en desarrollo (hot-reload de tsx)
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
