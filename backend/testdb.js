const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const t0 = Date.now();
prisma.$connect()
  .then(() => { console.log('OK conectado en', Date.now() - t0, 'ms'); return prisma.$disconnect(); })
  .then(() => process.exit(0))
  .catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
setTimeout(() => { console.error('TIMEOUT tras 10s'); process.exit(2); }, 10000);
