import { z } from 'zod';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Carga .env manualmente porque tsx no lo hace automáticamente
try {
  const contenido = readFileSync(resolve(process.cwd(), '.env'), 'utf-8');
  for (const linea of contenido.split('\n')) {
    const trim = linea.trim();
    if (!trim || trim.startsWith('#')) continue;
    const idx = trim.indexOf('=');
    if (idx === -1) continue;
    const clave = trim.slice(0, idx).trim();
    const valor = trim.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    if (!(clave in process.env)) process.env[clave] = valor;
  }
} catch { /* .env no encontrado — usando variables del sistema (producción) */ }

// Esquema de validación de variables de entorno obligatorias
const esquemaEntorno = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PUERTO: z.string().default('3001'),
  DATABASE_URL: z.string().min(1, 'La URL de la base de datos es obligatoria'),
  JWT_SECRETO: z.string().min(32, 'El secreto JWT debe tener al menos 32 caracteres'),
  JWT_SECRETO_REFRESH: z.string().min(32, 'El secreto JWT Refresh debe tener al menos 32 caracteres'),
  JWT_EXPIRACION: z.string().default('15m'),
  JWT_EXPIRACION_REFRESH: z.string().default('7d'),
  EMAIL_SERVIDOR: z.string().default('smtp.gmail.com'),
  EMAIL_PUERTO: z.string().default('587'),
  EMAIL_USUARIO: z.string().optional(),
  EMAIL_CLAVE: z.string().optional(),
  EMAIL_REMITENTE: z.string().default('noreply@campolargo.com'),
  URL_FRONTEND: z.string().default('http://localhost:5173'),
});

const resultado = esquemaEntorno.safeParse(process.env);

if (!resultado.success) {
  console.error('Variables de entorno inválidas:');
  console.error(resultado.error.flatten().fieldErrors);
  process.exit(1);
}

export const entorno = resultado.data;

export const esProduccion = entorno.NODE_ENV === 'production';
export const esDesarrollo = entorno.NODE_ENV === 'development';
