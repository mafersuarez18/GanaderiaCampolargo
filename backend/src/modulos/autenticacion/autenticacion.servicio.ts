import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../compartido/prisma/clientePrisma';
import { entorno } from '../../config/entorno';
import { ErrorNoAutorizado, ErrorForbidden } from '../../compartido/tipos/respuesta';
import { EstadoUsuario } from '@prisma/client';
import { UsuarioToken } from '../../compartido/middlewares/autenticacion';

interface DatosInicioSesion {
  correo: string;
  contrasena: string;
}

interface RespuestaAutenticacion {
  usuario: {
    id: string;
    nombre: string;
    apellido: string;
    correo: string;
    rol: { id: string; nombre: string; descripcion: string | null };
    privilegios: string[];
    cargo: string | null;
  };
  tokenAcceso: string;
  tokenRefresh: string;
  expiraEn: number; // timestamp unix
}

// Tras 5 intentos fallidos seguidos la cuenta se bloquea temporalmente,
// como protección básica contra fuerza bruta sobre el login.
const MAX_INTENTOS_FALLIDOS = 5;
const TIEMPO_BLOQUEO_MINUTOS = 30;

// El rol y sus privilegios se traen siempre junto con el usuario porque
// ambos terminan embebidos en el JWT (así no hay que consultar la base de
// datos en cada petición para saber qué puede hacer el usuario).
const incluirRolYPrivilegios = {
  rol: { include: { privilegios: { include: { privilegio: true } } } },
} as const;

function extraerCodigosPrivilegios(usuario: {
  rol: { privilegios: { privilegio: { descripcion: string } }[] };
}): string[] {
  return usuario.rol.privilegios.map((rp) => rp.privilegio.descripcion);
}

export async function iniciarSesion(datos: DatosInicioSesion): Promise<RespuestaAutenticacion> {
  const usuario = await prisma.usuario.findUnique({
    where: { correo: datos.correo.toLowerCase().trim() },
    include: incluirRolYPrivilegios,
  });

  if (!usuario) {
    // Respuesta genérica para no revelar si el correo existe
    throw new ErrorNoAutorizado('Credenciales incorrectas');
  }

  // Verificar si la cuenta está bloqueada
  if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > new Date()) {
    const minutosRestantes = Math.ceil(
      (usuario.bloqueadoHasta.getTime() - Date.now()) / 60000
    );
    throw new ErrorForbidden(
      `Cuenta bloqueada por múltiples intentos fallidos. Intente nuevamente en ${minutosRestantes} minutos.`
    );
  }

  // Verificar estado de la cuenta
  if (usuario.estado === EstadoUsuario.INACTIVO) {
    throw new ErrorForbidden('Esta cuenta ha sido desactivada. Contacte al administrador.');
  }

  if (usuario.estado === EstadoUsuario.BLOQUEADO) {
    throw new ErrorForbidden('Esta cuenta está bloqueada. Contacte al administrador.');
  }

  // Verificar contraseña
  const contrasenaValida = await bcrypt.compare(datos.contrasena, usuario.contrasena);

  if (!contrasenaValida) {
    const nuevosIntentos = usuario.intentosFallidos + 1;

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        intentosFallidos: nuevosIntentos,
        // Bloquear cuenta si excede el límite
        bloqueadoHasta: nuevosIntentos >= MAX_INTENTOS_FALLIDOS
          ? new Date(Date.now() + TIEMPO_BLOQUEO_MINUTOS * 60 * 1000)
          : null,
      },
    });

    throw new ErrorNoAutorizado('Credenciales incorrectas');
  }

  // Generar tokens JWT
  const codigosPrivilegios = extraerCodigosPrivilegios(usuario);
  const payloadToken: Omit<UsuarioToken, 'id'> & { sub: string } = {
    sub: usuario.id,
    correo: usuario.correo,
    rolId: usuario.rolId,
    rolNombre: usuario.rol.nombre,
    privilegios: codigosPrivilegios,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
  };

  const tokenAcceso = jwt.sign(payloadToken, entorno.JWT_SECRETO, {
    expiresIn: entorno.JWT_EXPIRACION as any,
  });

  const tokenRefresh = jwt.sign(
    { sub: usuario.id },
    entorno.JWT_SECRETO_REFRESH,
    { expiresIn: entorno.JWT_EXPIRACION_REFRESH as any }
  );

  // Guardar hash del refresh token y resetear intentos fallidos
  const hashRefresh = await bcrypt.hash(tokenRefresh, 10);

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      tokenRefresh: hashRefresh,
      ultimoAcceso: new Date(),
      intentosFallidos: 0,
      bloqueadoHasta: null,
    },
  });

  const expiracion = jwt.decode(tokenAcceso) as { exp: number };

  return {
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      correo: usuario.correo,
      rol: { id: usuario.rol.id, nombre: usuario.rol.nombre, descripcion: usuario.rol.descripcion },
      privilegios: codigosPrivilegios,
      cargo: usuario.cargo,
    },
    tokenAcceso,
    tokenRefresh,
    expiraEn: expiracion.exp,
  };
}

export async function renovarToken(tokenRefreshRecibido: string): Promise<{ tokenAcceso: string; expiraEn: number }> {
  let payload: { sub: string };

  try {
    payload = jwt.verify(tokenRefreshRecibido, entorno.JWT_SECRETO_REFRESH) as { sub: string };
  } catch {
    throw new ErrorNoAutorizado('Token de renovación inválido o expirado');
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: payload.sub },
    include: incluirRolYPrivilegios,
  });

  if (!usuario?.tokenRefresh) {
    throw new ErrorNoAutorizado('Sesión inválida. Inicie sesión nuevamente.');
  }

  // Verificar que el refresh token coincide con el almacenado
  const tokenValido = await bcrypt.compare(tokenRefreshRecibido, usuario.tokenRefresh);
  if (!tokenValido) {
    throw new ErrorNoAutorizado('Token de renovación inválido');
  }

  if (usuario.estado !== EstadoUsuario.ACTIVO) {
    throw new ErrorForbidden('Cuenta desactivada');
  }

  const nuevoTokenAcceso = jwt.sign(
    {
      sub: usuario.id,
      correo: usuario.correo,
      rolId: usuario.rolId,
      rolNombre: usuario.rol.nombre,
      privilegios: extraerCodigosPrivilegios(usuario),
      nombre: usuario.nombre,
      apellido: usuario.apellido,
    },
    entorno.JWT_SECRETO,
    { expiresIn: entorno.JWT_EXPIRACION as any }
  );

  const expiracion = jwt.decode(nuevoTokenAcceso) as { exp: number };

  return { tokenAcceso: nuevoTokenAcceso, expiraEn: expiracion.exp };
}

export async function cerrarSesion(usuarioId: string): Promise<void> {
  await prisma.usuario.update({
    where: { id: usuarioId },
    data: { tokenRefresh: null },
  });
}
