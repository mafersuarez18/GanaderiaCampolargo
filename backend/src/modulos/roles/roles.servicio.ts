import { prisma } from '../../compartido/prisma/clientePrisma';
import {
  ErrorNoEncontrado,
  ErrorConflicto,
} from '../../compartido/tipos/respuesta';

const seleccionRol = {
  id: true,
  nombre: true,
  descripcion: true,
  privilegios: {
    select: { privilegio: { select: { id: true, descripcion: true } } },
  },
  _count: { select: { usuarios: true } },
} as const;

function aplanarPrivilegios<T extends { privilegios: { privilegio: { id: string; descripcion: string } }[] }>(
  rol: T,
) {
  const { privilegios, ...resto } = rol;
  return { ...resto, privilegios: privilegios.map((rp) => rp.privilegio) };
}

export async function listarRoles() {
  const roles = await prisma.rol.findMany({
    select: seleccionRol,
    orderBy: { nombre: 'asc' },
  });
  return roles.map(aplanarPrivilegios);
}

export async function obtenerRolPorId(id: string) {
  const rol = await prisma.rol.findUnique({ where: { id }, select: seleccionRol });
  if (!rol) throw new ErrorNoEncontrado(`Rol con id '${id}'`);
  return aplanarPrivilegios(rol);
}

export interface DatosCrearRol {
  nombre: string;
  descripcion?: string;
  privilegioIds?: string[];
}

export async function crearRol(datos: DatosCrearRol) {
  const existente = await prisma.rol.findUnique({ where: { nombre: datos.nombre }, select: { id: true } });
  if (existente) throw new ErrorConflicto(`Ya existe un rol llamado '${datos.nombre}'`);

  const rol = await prisma.rol.create({
    data: {
      nombre: datos.nombre,
      descripcion: datos.descripcion,
      privilegios: datos.privilegioIds?.length
        ? { create: datos.privilegioIds.map((privilegioId) => ({ privilegioId })) }
        : undefined,
    },
    select: seleccionRol,
  });
  return aplanarPrivilegios(rol);
}

export interface DatosActualizarRol {
  nombre?: string;
  descripcion?: string;
}

export async function actualizarRol(id: string, datos: DatosActualizarRol) {
  const rol = await prisma.rol.findUnique({ where: { id }, select: { id: true } });
  if (!rol) throw new ErrorNoEncontrado(`Rol con id '${id}'`);

  if (datos.nombre) {
    const duplicado = await prisma.rol.findFirst({
      where: { nombre: datos.nombre, id: { not: id } },
      select: { id: true },
    });
    if (duplicado) throw new ErrorConflicto(`Ya existe un rol llamado '${datos.nombre}'`);
  }

  const actualizado = await prisma.rol.update({ where: { id }, data: datos, select: seleccionRol });
  return aplanarPrivilegios(actualizado);
}

export async function reemplazarPrivilegiosRol(id: string, privilegioIds: string[]) {
  const rol = await prisma.rol.findUnique({ where: { id }, select: { id: true } });
  if (!rol) throw new ErrorNoEncontrado(`Rol con id '${id}'`);

  await prisma.$transaction([
    prisma.rolPrivilegio.deleteMany({ where: { rolId: id } }),
    prisma.rolPrivilegio.createMany({
      data: privilegioIds.map((privilegioId) => ({ rolId: id, privilegioId })),
      skipDuplicates: true,
    }),
  ]);

  return obtenerRolPorId(id);
}

export async function eliminarRol(id: string) {
  const rol = await prisma.rol.findUnique({ where: { id }, select: { _count: { select: { usuarios: true } } } });
  if (!rol) throw new ErrorNoEncontrado(`Rol con id '${id}'`);

  if (rol._count.usuarios > 0) {
    throw new ErrorConflicto(
      `No se puede eliminar el rol porque tiene ${rol._count.usuarios} usuario(s) asignado(s)`,
    );
  }

  await prisma.rol.delete({ where: { id } });
}

// ── Privilegios ────────────────────────────────────────────────────────────
// Los privilegios son un catálogo de referencia consumido directamente por los
// middlewares de autorización del backend. Por eso solo se permite listarlos y
// registrar nuevos (para futuros desarrollos); no se exponen edición ni borrado,
// ya que renombrar o eliminar uno vigente rompería en silencio el control de
// acceso de las rutas que lo verifican.

export async function listarPrivilegios() {
  return prisma.privilegio.findMany({ orderBy: { descripcion: 'asc' } });
}

export async function crearPrivilegio(descripcion: string) {
  const existente = await prisma.privilegio.findUnique({ where: { descripcion }, select: { id: true } });
  if (existente) throw new ErrorConflicto(`Ya existe un privilegio '${descripcion}'`);
  return prisma.privilegio.create({ data: { descripcion } });
}
