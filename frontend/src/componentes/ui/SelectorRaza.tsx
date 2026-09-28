import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { clienteHttp } from '../../servicios/clienteAxios';
import Icono from './Icono';

// Campo "buscar o crear" para razas: si el nombre escrito no coincide con
// ninguna del catálogo, se ofrece registrarla ahí mismo. Este componente solo
// resuelve razaId (existente) o razaNombreNueva (a crear); quien lo use hace
// el POST real a /animales/razas al enviar su formulario. Reutilizado en el
// alta de animales y de sementales.
export interface RazaOpcion { id: string; nombre: string; }

interface PropsSelectorRaza {
  razaId: string;
  razaNombreNueva: string;
  onSeleccionar: (id: string, nombre: string) => void;
  onEscribir: (texto: string) => void;
  error?: string;
  etiqueta?: string;
}

export default function SelectorRaza({
  razaId, razaNombreNueva, onSeleccionar, onEscribir, error, etiqueta = 'Raza',
}: PropsSelectorRaza) {
  const { data: razas = [] } = useQuery<RazaOpcion[]>({
    queryKey: ['razas-select'],
    queryFn: () => clienteHttp.get('/animales/razas').then((r) => r.data.datos ?? []),
  });

  const [abierto, setAbierto] = useState(false);
  const refContenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const manejador = (e: MouseEvent) => {
      if (refContenedor.current && !refContenedor.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    };
    document.addEventListener('mousedown', manejador);
    return () => document.removeEventListener('mousedown', manejador);
  }, []);

  const razaSeleccionada = razas.find((r) => r.id === razaId);
  const texto = razaSeleccionada ? razaSeleccionada.nombre : razaNombreNueva;
  const textoNormalizado = texto.trim().toLowerCase();

  const coincidencias = textoNormalizado
    ? razas.filter((r) => r.nombre.toLowerCase().includes(textoNormalizado))
    : razas;
  const coincideExacta = razas.some((r) => r.nombre.toLowerCase() === textoNormalizado);

  return (
    <div>
      <label className="block text-xs font-medium text-[var(--color-piedra-600)] mb-1.5">{etiqueta} *</label>
      <div ref={refContenedor} className="relative">
        <input
          type="text"
          value={texto}
          onChange={(e) => { onEscribir(e.target.value); setAbierto(true); }}
          onFocus={() => setAbierto(true)}
          placeholder="Seleccione o escriba una raza..."
          className="campo-entrada"
          autoComplete="off"
        />
        {abierto && (
          <div
            className="absolute top-full left-0 right-0 mt-1 bg-surface-container-lowest rounded-xl shadow-xl
                       border border-outline-variant/30 z-50 overflow-hidden max-h-52 overflow-y-auto"
          >
            {coincidencias.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => { onSeleccionar(r.id, r.nombre); setAbierto(false); }}
                className="w-full text-left px-4 py-2.5 hover:bg-surface-container-low transition-colors
                           border-b border-outline-variant/10 last:border-0 flex items-center gap-2"
              >
                <Icono nombre="pets" clase="text-[14px] text-outline flex-shrink-0" />
                <span className="text-sm text-on-surface">{r.nombre}</span>
              </button>
            ))}
            {!!textoNormalizado && !coincideExacta && (
              <div className="w-full text-left px-4 py-2.5 flex items-center gap-2 text-primary text-sm bg-primary/5">
                <Icono nombre="add_circle" clase="text-[14px] flex-shrink-0" />
                Se creará una raza nueva: "{texto.trim()}"
              </div>
            )}
            {!coincidencias.length && !textoNormalizado && (
              <div className="px-4 py-3 text-xs text-on-surface-variant">
                Escriba para buscar o registrar una raza nueva
              </div>
            )}
          </div>
        )}
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 text-xs mt-1"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
