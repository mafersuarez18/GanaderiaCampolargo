import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Estado de sesión persistido en localStorage (clave "campolargo-auth"),
// para que el usuario siga con la sesión iniciada tras recargar la página.

export interface RolSesion {
  id: string;
  nombre: string;
  descripcion: string | null;
}

export interface UsuarioSesion {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  rol: RolSesion;
  privilegios: string[];
  cargo: string | null;
}

interface EstadoAutenticacion {
  usuario: UsuarioSesion | null;
  tokenAcceso: string | null;
  tokenRefresh: string | null;
  expiraEn: number | null;
  // Acciones
  iniciarSesion: (usuario: UsuarioSesion, tokenAcceso: string, tokenRefresh: string, expiraEn: number) => void;
  actualizarToken: (tokenAcceso: string, expiraEn: number) => void;
  actualizarUsuario: (parcial: Partial<UsuarioSesion>) => void;
  cerrarSesion: () => void;
  estaAutenticado: () => boolean;
  tokenVencido: () => boolean;
}

export const useAutenticacionStore = create<EstadoAutenticacion>()(
  persist(
    (set, get) => ({
      usuario: null,
      tokenAcceso: null,
      tokenRefresh: null,
      expiraEn: null,

      iniciarSesion: (usuario, tokenAcceso, tokenRefresh, expiraEn) => {
        set({ usuario, tokenAcceso, tokenRefresh, expiraEn });
      },

      actualizarToken: (tokenAcceso, expiraEn) => {
        set({ tokenAcceso, expiraEn });
      },

      actualizarUsuario: (parcial) => {
        set((estado) => ({
          usuario: estado.usuario ? { ...estado.usuario, ...parcial } : null,
        }));
      },

      cerrarSesion: () => {
        set({ usuario: null, tokenAcceso: null, tokenRefresh: null, expiraEn: null });
      },

      estaAutenticado: () => {
        const { tokenAcceso, expiraEn } = get();
        if (!tokenAcceso || !expiraEn) return false;
        // Verificar si el token aún es válido (con 1 minuto de margen)
        return expiraEn * 1000 > Date.now() + 60000;
      },

      tokenVencido: () => {
        const { expiraEn } = get();
        if (!expiraEn) return true;
        return expiraEn * 1000 <= Date.now();
      },
    }),
    {
      name: 'campolargo-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (estado) => ({
        usuario: estado.usuario,
        tokenAcceso: estado.tokenAcceso,
        tokenRefresh: estado.tokenRefresh,
        expiraEn: estado.expiraEn,
      }),
    }
  )
);
