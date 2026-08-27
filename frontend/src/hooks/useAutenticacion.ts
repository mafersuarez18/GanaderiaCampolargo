import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutenticacionStore } from '../stores/autenticacionStore';
import { clienteHttp } from '../servicios/clienteAxios';
import toast from 'react-hot-toast';

interface DatosInicioSesion {
  correo: string;
  contrasena: string;
}

export function useAutenticacion() {
  const [cargando, setCargando] = useState(false);
  const navegar = useNavigate();
  const tienda = useAutenticacionStore();

  const estaAutenticado = tienda.estaAutenticado();

  async function iniciarSesion(datos: DatosInicioSesion): Promise<void> {
    setCargando(true);
    try {
      const respuesta = await clienteHttp.post('/auth/iniciar-sesion', datos);
      const { usuario, tokenAcceso, tokenRefresh, expiraEn } = respuesta.data.datos;

      tienda.iniciarSesion(usuario, tokenAcceso, tokenRefresh, expiraEn);
      toast.success(`Bienvenido, ${usuario.nombre}`);
      navegar('/dashboard');
    } finally {
      setCargando(false);
    }
  }

  async function cerrarSesion(): Promise<void> {
    try {
      await clienteHttp.post('/auth/cerrar-sesion');
    } catch {
      // Si falla el cierre en servidor, igual limpiamos localmente
    } finally {
      tienda.cerrarSesion();
      navegar('/iniciar-sesion');
      toast.success('Sesión cerrada correctamente');
    }
  }

  function tienePermiso(...roles: string[]): boolean {
    if (!tienda.usuario) return false;
    return roles.includes(tienda.usuario.rol.nombre);
  }

  // Verifica si el usuario tiene al menos uno de los privilegios indicados
  // (ej. tienePrivilegio('animales.crear')), reflejando lo que el backend valida.
  function tienePrivilegio(...codigos: string[]): boolean {
    if (!tienda.usuario) return false;
    return codigos.some((codigo) => tienda.usuario!.privilegios.includes(codigo));
  }

  return {
    usuario: tienda.usuario,
    estaAutenticado,
    cargando,
    iniciarSesion,
    cerrarSesion,
    tienePermiso,
    tienePrivilegio,
    esAdministrador: tienda.usuario?.rol.nombre === 'ADMINISTRADOR',
    esVeterinario: tienda.usuario?.rol.nombre === 'VETERINARIO',
    esTecnico: tienda.usuario?.rol.nombre === 'TECNICO',
  };
}
