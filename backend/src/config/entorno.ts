import { z } from 'zod';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// tsx no carga el archivo .env por su cuenta, así que se lee y se vuelca a
// process.env a mano antes de validar el resto de la configuración.
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
} catch { /* No hay .env (típico en producción): se usan las variables del sistema */ }

// Todas las variables que la aplicación necesita para arrancar, con sus
// valores por defecto donde tiene sentido tenerlos. Si falta algo
// obligatorio (como los secretos JWT), el proceso no debe arrancar.
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
  // Sin valor por defecto fijo: Gmail exige que el remitente coincida con la
  // cuenta autenticada (EMAIL_USUARIO), así que si no se define explícito,
  // correo.servicio.ts usa EMAIL_USUARIO como remitente.
  EMAIL_REMITENTE: z.string().optional(),
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
