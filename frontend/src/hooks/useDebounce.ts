import { useState, useEffect } from 'react';

// Retrasa la propagación de un valor hasta que deja de cambiar por
// `demora` ms — típicamente usado en cajas de búsqueda, para no disparar
// una petición en cada tecla presionada.
export default function useDebounce<T>(valor: T, demora: number): T {
  const [valorDebounced, setValorDebounced] = useState<T>(valor);

  useEffect(() => {
    const temporizador = setTimeout(() => setValorDebounced(valor), demora);
    return () => clearTimeout(temporizador);
  }, [valor, demora]);

  return valorDebounced;
}
