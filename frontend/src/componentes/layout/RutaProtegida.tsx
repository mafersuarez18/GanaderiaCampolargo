import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAutenticacionStore } from '../../stores/autenticacionStore';
import { renovarTokenSilencioso } from '../../servicios/clienteAxios';

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
  const tokenFresco = tienda.estaAutenticado();
  const [verificando, setVerificando] = useState(false);
  const [renovacionFallida, setRenovacionFallida] = useState(false);

  // El access token dura 15 min y "estaAutenticado()" ya lo da por vencido
  // un minuto antes de tiempo. Como este componente se re-renderiza en cada
  // navegación (es la ruta padre de todo el layout), navegar justo en ese
  // margen redirigía al login de inmediato aunque el refresh token (7 días)
  // siguiera siendo válido — esto pasaba, por ejemplo, al entrar a
  // Geolocalización tras ~15 min de sesión. Ahora, en vez de cortar la
  // sesión de una vez, se intenta renovar en silencio primero.
  useEffect(() => {
    if (tokenFresco || !tienda.tokenRefresh) return;
    let cancelado = false;
    setVerificando(true);
    renovarTokenSilencioso().then((token) => {
      if (cancelado) return;
      setVerificando(false);
      if (!token) setRenovacionFallida(true);
    });
    return () => { cancelado = true; };
  }, [tokenFresco, tienda.tokenRefresh]);

  if (!tokenFresco && (!tienda.tokenRefresh || renovacionFallida)) {
    return <Navigate to={redirigirA} replace />;
  }

  if (!tokenFresco && verificando) {
    return null;
  }

  if (roles && tienda.usuario && !roles.includes(tienda.usuario.rol.nombre)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
