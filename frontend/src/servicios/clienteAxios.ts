import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAutenticacionStore } from '../stores/autenticacionStore';
import toast from 'react-hot-toast';

const URL_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1';

export const clienteHttp = axios.create({
  baseURL: URL_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor de solicitud — adjunta el token de acceso
clienteHttp.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const tokenAcceso = useAutenticacionStore.getState().tokenAcceso;
    if (tokenAcceso && config.headers) {
      config.headers.Authorization = `Bearer ${tokenAcceso}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Control para evitar múltiples intentos de renovación simultáneos
let renovandoToken = false;
let colaEspera: Array<(token: string | null) => void> = [];

function procesarCola(token: string | null) {
  colaEspera.forEach((resolver) => resolver(token));
  colaEspera = [];
}

// Interceptor de respuesta — maneja renovación automática de token y errores
clienteHttp.interceptors.response.use(
  (respuesta) => respuesta,
  async (error: AxiosError) => {
    const solicitudOriginal = error.config as InternalAxiosRequestConfig & { _reintentado?: boolean };

    if (error.response?.status === 401 && !solicitudOriginal._reintentado) {
      solicitudOriginal._reintentado = true;

      const tienda = useAutenticacionStore.getState();

      if (!tienda.tokenRefresh) {
        tienda.cerrarSesion();
        window.location.href = '/iniciar-sesion';
        return Promise.reject(error);
      }

      if (renovandoToken) {
        // Si ya se está renovando, esperar en cola
        return new Promise((resolve, reject) => {
          colaEspera.push((nuevoToken) => {
            if (nuevoToken) {
              solicitudOriginal.headers.Authorization = `Bearer ${nuevoToken}`;
              resolve(clienteHttp(solicitudOriginal));
            } else {
              reject(error);
            }
          });
        });
      }

      renovandoToken = true;

      try {
        const { data } = await axios.post(`${URL_BASE}/auth/renovar-token`, {
          tokenRefresh: tienda.tokenRefresh,
        });

        const { tokenAcceso, expiraEn } = data.datos;
        tienda.actualizarToken(tokenAcceso, expiraEn);
        procesarCola(tokenAcceso);

        solicitudOriginal.headers.Authorization = `Bearer ${tokenAcceso}`;
        return clienteHttp(solicitudOriginal);
      } catch {
        procesarCola(null);
        tienda.cerrarSesion();
        window.location.href = '/iniciar-sesion';
        return Promise.reject(error);
      } finally {
        renovandoToken = false;
      }
    }

    // Mostrar toast de error para errores no relacionados con auth
    if (error.response?.status !== 401) {
      const mensaje = (error.response?.data as { mensaje?: string })?.mensaje
        ?? error.message
        ?? 'Ocurrió un error inesperado';

      if (error.response?.status && error.response.status >= 500) {
        toast.error('Error del servidor. Por favor intente nuevamente.');
      } else if (error.response?.status !== 422) {
        // Los errores 422 (validación) se manejan en el formulario
        toast.error(mensaje);
      }
    }

    return Promise.reject(error);
  }
);
