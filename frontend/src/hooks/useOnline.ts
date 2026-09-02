import { useState, useEffect } from 'react';

// Refleja el estado de conectividad del navegador (navigator.onLine), para
// avisarle al usuario cuando se quedó sin conexión.
export function useOnline(): boolean {
  const [estaEnLinea, setEstaEnLinea] = useState(navigator.onLine);

  useEffect(() => {
    const manejarEnLinea = () => setEstaEnLinea(true);
    const manejarFueraDeLinea = () => setEstaEnLinea(false);

    window.addEventListener('online', manejarEnLinea);
    window.addEventListener('offline', manejarFueraDeLinea);

    return () => {
      window.removeEventListener('online', manejarEnLinea);
      window.removeEventListener('offline', manejarFueraDeLinea);
    };
  }, []);

  return estaEnLinea;
}
