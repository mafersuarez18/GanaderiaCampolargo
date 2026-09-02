import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAutenticacionStore } from '../../stores/autenticacionStore';

interface PropiedadesRutaProtegida {
  children: ReactNode;
  redirigirA?: string;
  roles?: string[];
}

// Envuelve una ruta exigiendo sesión iniciada (y, opcionalmente, uno de
// los roles indicados); redirige en vez de renderizar cuando no se cumple.
export default function RutaProtegida({
  children,
  redirigirA = '/iniciar-sesion',
  roles,
}: PropiedadesRutaProtegida) {
  const tienda = useAutenticacionStore();

  if (!tienda.estaAutenticado()) {
    return <Navigate to={redirigirA} replace />;
  }

  if (roles && tienda.usuario && !roles.includes(tienda.usuario.rol.nombre)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
