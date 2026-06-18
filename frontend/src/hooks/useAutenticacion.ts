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
    return roles.includes(tienda.usuario.rol);
  }

  return {
    usuario: tienda.usuario,
    estaAutenticado,
    cargando,
    iniciarSesion,
    cerrarSesion,
    tienePermiso,
    esAdministrador: tienda.usuario?.rol === 'ADMINISTRADOR',
    esVeterinario: tienda.usuario?.rol === 'VETERINARIO',
    esTecnico: tienda.usuario?.rol === 'TECNICO',
  };
}
