import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAutenticacionStore } from '../../stores/autenticacionStore';

interface PropiedadesRutaProtegida {
  children: ReactNode;
  redirigirA?: string;
  roles?: string[];
}

export default function RutaProtegida({
  children,
  redirigirA = '/iniciar-sesion',
  roles,
}: PropiedadesRutaProtegida) {
  const tienda = useAutenticacionStore();

  if (!tienda.estaAutenticado()) {
    return <Navigate to={redirigirA} replace />;
  }

  if (roles && tienda.usuario && !roles.includes(tienda.usuario.rol)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
