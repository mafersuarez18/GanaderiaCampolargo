import { EstadoUsuario } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../../compartido/prisma/clientePrisma';
import {
  ErrorNoEncontrado,
  ErrorConflicto,
  ErrorValidacionDatos,
} from '../../compartido/tipos/respuesta';

const seleccionUsuario = {
  id: true,
  nombre: true,
  apellido: true,
  correo: true,
  rol: { select: { id: true, nombre: true, descripcion: true } },
  estado: true,
  cargo: true,
  telefono: true,
  bloqueadoHasta: true,
  intentosFallidos: true,
} as const;

export async function listarUsuarios(busqueda?: string, rolId?: string) {
  return prisma.usuario.findMany({
    where: {
      ...(rolId && { rolId }),
      ...(busqueda && {
        OR: [
          { nombre:   { contains: busqueda, mode: 'insensitive' } },
          { apellido: { contains: busqueda, mode: 'insensitive' } },
          { correo:   { contains: busqueda, mode: 'insensitive' } },
        ],
      }),
    },
    select: seleccionUsuario,
    orderBy: [{ estado: 'asc' }, { nombre: 'asc' }],
  });
}

export async function obtenerUsuarioPorId(id: string) {
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: seleccionUsuario,
  });
  if (!usuario) throw new ErrorNoEncontrado(`Usuario con id '${id}' no encontrado`);
  return usuario;
}

export interface DatosCrearUsuario {
  nombre:     string;
  apellido:   string;
  correo:     string;
  contrasena: string;
  rolId:      string;
}

export async function crearUsuario(datos: DatosCrearUsuario) {
  const existente = await prisma.usuario.findUnique({
    where: { correo: datos.correo },
    select: { id: true },
  });
  if (existente) throw new ErrorConflicto(`Ya existe un usuario con el correo '${datos.correo}'`);

  const rol = await prisma.rol.findUnique({ where: { id: datos.rolId }, select: { id: true } });
  if (!rol) throw new ErrorNoEncontrado(`Rol con id '${datos.rolId}'`);

  if (datos.contrasena.length < 8) {
    throw new ErrorValidacionDatos('La contraseña debe tener al menos 8 caracteres');
  }

  const hashContrasena = await bcrypt.hash(datos.contrasena, 12);
  return prisma.usuario.create({
    data: {
      nombre:     datos.nombre,
      apellido:   datos.apellido,
      correo:     datos.correo,
      contrasena: hashContrasena,
      rolId:      datos.rolId,
    },
    select: seleccionUsuario,
  });
}

export interface DatosActualizarUsuario {
  nombre?:   string;
  apellido?: string;
  rolId?:    string;
  estado?:   EstadoUsuario;
  cargo?:    string;
  telefono?: string;
}

export async function actualizarUsuario(id: string, datos: DatosActualizarUsuario) {
  const usuario = await prisma.usuario.findUnique({ where: { id }, select: { id: true } });
  if (!usuario) throw new ErrorNoEncontrado(`Usuario con id '${id}' no encontrado`);

  if (datos.rolId) {
    const rol = await prisma.rol.findUnique({ where: { id: datos.rolId }, select: { id: true } });
    if (!rol) throw new ErrorNoEncontrado(`Rol con id '${datos.rolId}'`);
  }

  return prisma.usuario.update({ where: { id }, data: datos, select: seleccionUsuario });
}

export async function cambiarContrasena(
  id: string,
  contrasenaActual: string,
  nuevaContrasena: string,
) {
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: { contrasena: true },
  });
  if (!usuario) throw new ErrorNoEncontrado('Usuario no encontrado');

  const esValida = await bcrypt.compare(contrasenaActual, usuario.contrasena);
  if (!esValida) throw new ErrorValidacionDatos('La contraseña actual es incorrecta');

  if (nuevaContrasena.length < 8) {
    throw new ErrorValidacionDatos('La nueva contraseña debe tener al menos 8 caracteres');
  }

  const hashNuevo = await bcrypt.hash(nuevaContrasena, 12);
  await prisma.usuario.update({ where: { id }, data: { contrasena: hashNuevo } });
}

export async function desbloquearUsuario(id: string) {
  const usuario = await prisma.usuario.findUnique({ where: { id }, select: { id: true } });
  if (!usuario) throw new ErrorNoEncontrado('Usuario no encontrado');

  return prisma.usuario.update({
    where: { id },
    data: { intentosFallidos: 0, bloqueadoHasta: null },
    select: seleccionUsuario,
  });
}

export async function eliminarUsuario(id: string, idSolicitante: string) {
  if (id === idSolicitante) {
    throw new ErrorValidacionDatos('No puede eliminar su propia cuenta');
  }
  const usuario = await prisma.usuario.findUnique({ where: { id }, select: { id: true } });
  if (!usuario) throw new ErrorNoEncontrado('Usuario no encontrado');
  return prisma.usuario.delete({ where: { id } });
}
