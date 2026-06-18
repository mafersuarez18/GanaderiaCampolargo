import { useState, useEffect } from 'react';

export default function useDebounce<T>(valor: T, demora: number): T {
  const [valorDebounced, setValorDebounced] = useState<T>(valor);

  useEffect(() => {
    const temporizador = setTimeout(() => setValorDebounced(valor), demora);
    return () => clearTimeout(temporizador);
  }, [valor, demora]);

  return valorDebounced;
}
