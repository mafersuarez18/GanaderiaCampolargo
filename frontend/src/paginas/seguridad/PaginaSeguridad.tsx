import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { clienteHttp } from '../../servicios/clienteAxios';
import Badge, { BadgeRol } from '../../componentes/ui/Badge';
import { ModalConfirmacion } from '../../componentes/ui/Modal';
import { useAutenticacion } from '../../hooks/useAutenticacion';
import Icono from '../../componentes/ui/Icono';

interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  rol: 'ADMINISTRADOR' | 'VETERINARIO' | 'TECNICO';
  estado: 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';
  creadoEn: string;
  ultimoAcceso?: string;
}

interface RespuestaUsuarios {
  datos: Usuario[];
  meta: { total: number; pagina: number; porPagina: number; totalPaginas: number };
}

interface FormUsuario {
  nombre: string;
  apellido: string;
  correo: string;
  contrasena: string;
  rol: 'ADMINISTRADOR' | 'VETERINARIO' | 'TECNICO';
}

const ESTADO_ESTILOS: Record<string, { variante: 'verde' | 'gris' | 'rojo'; etiqueta: string }> = {
  ACTIVO:    { variante: 'verde', etiqueta: 'Activo' },
  INACTIVO:  { variante: 'gris',  etiqueta: 'Inactivo' },
  BLOQUEADO: { variante: 'rojo',  etiqueta: 'Bloqueado' },
};

export default function PaginaSeguridad() {
  const queryClient = useQueryClient();
  const { usuario: usuarioActual } = useAutenticacion();

  const [mostrarForm, setMostrarForm]               = useState(false);
  const [usuarioEditar, setUsuarioEditar]           = useState<Usuario | null>(null);
  const [usuarioBloquear, setUsuarioBloquear]       = useState<{ id: string; bloqueado: boolean } | null>(null);
  const [busqueda, setBusqueda]                     = useState('');
  const [filtroRol, setFiltroRol]                   = useState('');

  const { data, isLoading } = useQuery<RespuestaUsuarios>({
    queryKey: ['usuarios', busqueda, filtroRol],
    queryFn: () =>
      clienteHttp
        .get('/usuarios', {
          params: { porPagina: 50, ...(busqueda && { busqueda }), ...(filtroRol && { rol: filtroRol }) },
        })
        .then((r) => r.data),
  });

  const bloquearMutacion = useMutation({
    mutationFn: ({ id, bloqueado }: { id: string; bloqueado: boolean }) =>
      clienteHttp.patch(`/usuarios/${id}`, { estado: bloqueado ? 'BLOQUEADO' : 'ACTIVO' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      setUsuarioBloquear(null);
    },
  });

  const usuarios      = data?.datos ?? [];
  const totalUsuarios = data?.meta?.total ?? 0;

  const resumenPorRol = {
    ADMINISTRADOR: usuarios.filter((u) => u.rol === 'ADMINISTRADOR').length,
    VETERINARIO:   usuarios.filter((u) => u.rol === 'VETERINARIO').length,
    TECNICO:       usuarios.filter((u) => u.rol === 'TECNICO').length,
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <Icono nombre="security" relleno clase="text-[22px] text-primary" />
            Seguridad y Usuarios
          </h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Gestión de accesos, roles y permisos
            <span className="ml-2 font-medium text-on-surface">· {totalUsuarios} usuarios</span>
          </p>
        </div>
        <button
          onClick={() => { setUsuarioEditar(null); setMostrarForm(true); }}
          className="boton boton-primario gap-2 text-sm"
        >
          <Icono nombre="person_add" clase="text-[18px]" />
          Nuevo usuario
        </button>
      </motion.div>

      {/* KPIs por rol */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { rol: 'ADMINISTRADOR', et: 'Administradores', ico: 'admin_panel_settings', col: 'text-tertiary',  fondo: 'bg-tertiary/10' },
          { rol: 'VETERINARIO',   et: 'Veterinarios',    ico: 'medical_services',     col: 'text-primary',   fondo: 'bg-primary/10' },
          { rol: 'TECNICO',       et: 'Técnicos',        ico: 'engineering',          col: 'text-secondary', fondo: 'bg-secondary/10' },
        ].map((item) => (
          <div key={item.rol} className="tarjeta-vidrio rounded-2xl p-4">
            <div className={`p-2.5 ${item.fondo} rounded-xl w-fit mb-3`}>
              <Icono nombre={item.ico} relleno clase={`text-[20px] ${item.col}`} />
            </div>
            <p className={`text-3xl font-bold ${item.col}`}>
              {resumenPorRol[item.rol as keyof typeof resumenPorRol]}
            </p>
            <p className="text-xs text-on-surface-variant mt-0.5">{item.et}</p>
          </div>
        ))}
      </div>

      {/* Barra de filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Icono nombre="search" clase="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]" />
          <input
            type="text"
            placeholder="Buscar usuario..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="campo-entrada pl-10"
          />
        </div>
        <div className="flex gap-1 p-1 bg-surface-container rounded-xl">
          {['', 'ADMINISTRADOR', 'VETERINARIO', 'TECNICO'].map((rol) => (
            <button
              key={rol}
              onClick={() => setFiltroRol(rol)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filtroRol === rol
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {rol === '' ? 'Todos' : rol === 'ADMINISTRADOR' ? 'Admin' : rol === 'VETERINARIO' ? 'Vet' : 'Técnico'}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-surface-container animate-pulse" />
          ))}
        </div>
      ) : !usuarios.length ? (
        <div className="tarjeta-vidrio rounded-2xl p-12 text-center">
          <Icono nombre="group" clase="text-[40px] text-outline mx-auto mb-3" />
          <p className="font-medium text-on-surface-variant">Sin usuarios</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="tarjeta-vidrio rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-6 py-3 bg-surface-container-low
                         border-b border-outline-variant/20">
            {['Usuario', 'Rol', 'Estado', 'Creado', 'Acciones'].map((h) => (
              <span key={h} className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">{h}</span>
            ))}
          </div>

          {usuarios.map((u, idx) => (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className={`grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-6 py-4
                         hover:bg-surface-container-low transition-colors
                         ${idx < usuarios.length - 1 ? 'border-b border-outline-variant/15' : ''}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/60 to-primary
                               flex items-center justify-center text-on-primary font-bold text-sm flex-shrink-0">
                  {u.nombre[0]}{u.apellido[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-on-surface truncate">
                    {u.nombre} {u.apellido}
                    {u.id === usuarioActual?.id && (
                      <span className="ml-2 text-[10px] font-normal text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                        Tú
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-on-surface-variant truncate">{u.correo}</p>
                </div>
              </div>

              <BadgeRol rol={u.rol} />

              <Badge variante={ESTADO_ESTILOS[u.estado]?.variante ?? 'gris'} tamano="xs" punto={u.estado === 'ACTIVO'}>
                {ESTADO_ESTILOS[u.estado]?.etiqueta ?? u.estado}
              </Badge>

              <span className="text-xs text-on-surface-variant">
                {new Date(u.creadoEn).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: '2-digit' })}
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setUsuarioEditar(u); setMostrarForm(true); }}
                  title="Editar"
                  className="p-1.5 text-outline hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                >
                  <Icono nombre="edit" clase="text-[16px]" />
                </button>
                {u.id !== usuarioActual?.id && (
                  <button
                    onClick={() => setUsuarioBloquear({ id: u.id, bloqueado: u.estado !== 'BLOQUEADO' })}
                    title={u.estado === 'BLOQUEADO' ? 'Desbloquear' : 'Bloquear'}
                    className={`p-1.5 rounded-lg transition-colors ${
                      u.estado === 'BLOQUEADO'
                        ? 'text-primary hover:bg-primary/10'
                        : 'text-outline hover:text-error hover:bg-error-container'
                    }`}
                  >
                    <Icono nombre={u.estado === 'BLOQUEADO' ? 'lock_open' : 'lock'} clase="text-[16px]" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Modal: Crear / Editar */}
      <AnimatePresence>
        {mostrarForm && (
          <FormularioUsuario
            usuarioEditar={usuarioEditar}
            onCerrar={() => { setMostrarForm(false); setUsuarioEditar(null); }}
            onExito={() => {
              queryClient.invalidateQueries({ queryKey: ['usuarios'] });
              setMostrarForm(false);
              setUsuarioEditar(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Modal: Bloquear / Desbloquear */}
      <ModalConfirmacion
        abierto={!!usuarioBloquear}
        titulo={usuarioBloquear?.bloqueado ? 'Bloquear usuario' : 'Desbloquear usuario'}
        descripcion={
          usuarioBloquear?.bloqueado
            ? 'El usuario no podrá iniciar sesión mientras esté bloqueado. ¿Confirma?'
            : '¿Desea restaurar el acceso de este usuario?'
        }
        textoConfirmar={usuarioBloquear?.bloqueado ? 'Bloquear' : 'Desbloquear'}
        variante={usuarioBloquear?.bloqueado ? 'peligro' : 'info'}
        cargando={bloquearMutacion.isPending}
        alConfirmar={() =>
          usuarioBloquear &&
          bloquearMutacion.mutate({ id: usuarioBloquear.id, bloqueado: usuarioBloquear.bloqueado })
        }
        alCerrar={() => setUsuarioBloquear(null)}
      />
    </div>
  );
}

// ── Formulario: Crear / Editar Usuario ──────────────────────────────────────

function FormularioUsuario({
  usuarioEditar,
  onCerrar,
  onExito,
}: { usuarioEditar: Usuario | null; onCerrar: () => void; onExito: () => void }) {
  const esEdicion = !!usuarioEditar;
  const [form, setForm] = useState<FormUsuario>({
    nombre:     usuarioEditar?.nombre    ?? '',
    apellido:   usuarioEditar?.apellido  ?? '',
    correo:     usuarioEditar?.correo    ?? '',
    contrasena: '',
    rol:        usuarioEditar?.rol ?? 'TECNICO',
  });
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [error, setError] = useState('');

  const mutacion = useMutation({
    mutationFn: (datos: FormUsuario) => {
      if (esEdicion) {
        const { contrasena, ...resto } = datos;
        return clienteHttp.put(`/usuarios/${usuarioEditar.id}`, {
          ...resto,
          ...(contrasena && { contrasena }),
        });
      }
      return clienteHttp.post('/usuarios', datos);
    },
    onSuccess: () => onExito(),
    onError: (err: any) => setError(err?.response?.data?.mensaje ?? 'Error al guardar el usuario'),
  });

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-inverse-surface/40 z-40" onClick={onCerrar}
      />
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md">
          <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
            <h2 className="font-bold text-on-surface flex items-center gap-2">
              <Icono nombre={esEdicion ? 'manage_accounts' : 'person_add'} clase="text-[20px] text-primary" />
              {esEdicion ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>
            <button onClick={onCerrar} className="p-2 hover:bg-surface-container rounded-xl transition-colors">
              <Icono nombre="close" clase="text-[20px] text-on-surface-variant" />
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.nombre.trim() || !form.apellido.trim()) { setError('Nombre y apellido son requeridos'); return; }
              if (!form.correo.trim()) { setError('El correo es requerido'); return; }
              if (!esEdicion && !form.contrasena) { setError('La contraseña es requerida'); return; }
              if (!esEdicion && form.contrasena.length < 8) { setError('La contraseña debe tener mínimo 8 caracteres'); return; }
              setError('');
              mutacion.mutate(form);
            }}
            className="p-6 space-y-4"
          >
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-error-container border border-error/20 rounded-xl text-sm text-on-error-container">
                <Icono nombre="error" clase="text-[18px] flex-shrink-0 text-error" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {[
                { campo: 'nombre',   et: 'Nombre' },
                { campo: 'apellido', et: 'Apellido' },
              ].map(({ campo, et }) => (
                <div key={campo}>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                    {et} <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={(form as any)[campo]}
                    onChange={(e) => setForm((f) => ({ ...f, [campo]: e.target.value }))}
                    className="campo-entrada"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                Correo electrónico <span className="text-error">*</span>
              </label>
              <input
                type="email" value={form.correo}
                onChange={(e) => setForm((f) => ({ ...f, correo: e.target.value }))}
                className="campo-entrada"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                Contraseña {!esEdicion && <span className="text-error">*</span>}
                {esEdicion && <span className="font-normal text-outline">(vacía para no cambiar)</span>}
              </label>
              <div className="relative">
                <input
                  type={mostrarContrasena ? 'text' : 'password'}
                  value={form.contrasena}
                  onChange={(e) => setForm((f) => ({ ...f, contrasena: e.target.value }))}
                  placeholder="Mínimo 8 caracteres"
                  className="campo-entrada pr-11"
                />
                <button
                  type="button"
                  onClick={() => setMostrarContrasena(!mostrarContrasena)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                >
                  <Icono nombre={mostrarContrasena ? 'visibility_off' : 'visibility'} clase="text-[18px]" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Rol</label>
              <select
                value={form.rol}
                onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value as FormUsuario['rol'] }))}
                className="campo-entrada"
              >
                <option value="ADMINISTRADOR">Administrador — acceso total</option>
                <option value="VETERINARIO">Veterinario — gestión clínica</option>
                <option value="TECNICO">Técnico — operaciones básicas</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onCerrar} className="flex-1 boton boton-secundario">Cancelar</button>
              <button type="submit" disabled={mutacion.isPending} className="flex-1 boton boton-primario">
                {mutacion.isPending ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear usuario'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  );
}
