import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import Icono from './Icono';

type TamanoModal = 'sm' | 'md' | 'lg' | 'xl' | 'completo';

interface PropiedadesModal {
  abierto: boolean;
  alCerrar: () => void;
  titulo?: string;
  descripcion?: string;
  children: React.ReactNode;
  pie?: React.ReactNode;
  tamano?: TamanoModal;
  cerrarAlHacerClicFuera?: boolean;
}

const anchosPorTamano: Record<TamanoModal, string> = {
  sm:       'max-w-sm',
  md:       'max-w-md',
  lg:       'max-w-lg',
  xl:       'max-w-2xl',
  completo: 'max-w-4xl',
};

// Modal genérico reutilizado en toda la app: se renderiza vía portal (para
// no heredar overflow/z-index del componente que lo abre), bloquea el
// scroll del body mientras está abierto y se cierra con Escape.
export default function Modal({
  abierto,
  alCerrar,
  titulo,
  descripcion,
  children,
  pie,
  tamano = 'md',
  cerrarAlHacerClicFuera = true,
}: PropiedadesModal) {
  const referenciaContenido = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (abierto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [abierto]);

  useEffect(() => {
    const manejarTeclado = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && abierto) alCerrar();
    };
    document.addEventListener('keydown', manejarTeclado);
    return () => document.removeEventListener('keydown', manejarTeclado);
  }, [abierto, alCerrar]);

  return createPortal(
    <AnimatePresence>
      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm"
            onClick={cerrarAlHacerClicFuera ? alCerrar : undefined}
          />

          <motion.div
            ref={referenciaContenido}
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={clsx(
              'relative w-full bg-surface-container-lowest rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden',
              anchosPorTamano[tamano],
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {(titulo || descripcion) && (
              <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-outline-variant/20">
                <div>
                  {titulo && (
                    <h2 className="text-base font-semibold text-on-surface">{titulo}</h2>
                  )}
                  {descripcion && (
                    <p className="text-sm text-on-surface-variant mt-0.5">{descripcion}</p>
                  )}
                </div>
                <button
                  onClick={alCerrar}
                  className="p-2 hover:bg-surface-container rounded-xl transition-colors flex-shrink-0 -mt-1 -mr-2"
                  aria-label="Cerrar"
                >
                  <Icono nombre="close" clase="text-[18px] text-on-surface-variant" />
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {children}
            </div>

            {pie && (
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-outline-variant/20 bg-surface-container-low">
                {pie}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

// ── Modal de Confirmación ──────────────────────────────────────────────────────

interface PropiedadesModalConfirmacion {
  abierto: boolean;
  alCerrar: () => void;
  alConfirmar: () => void;
  titulo: string;
  descripcion?: string;
  textoCancelar?: string;
  textoConfirmar?: string;
  variante?: 'peligro' | 'advertencia' | 'info';
  cargando?: boolean;
}

export function ModalConfirmacion({
  abierto,
  alCerrar,
  alConfirmar,
  titulo,
  descripcion,
  textoCancelar = 'Cancelar',
  textoConfirmar = 'Confirmar',
  variante = 'peligro',
  cargando = false,
}: PropiedadesModalConfirmacion) {
  return (
    <Modal
      abierto={abierto}
      alCerrar={alCerrar}
      tamano="sm"
      pie={
        <>
          <button onClick={alCerrar} className="boton boton-secundario">
            {textoCancelar}
          </button>
          <button
            onClick={alConfirmar}
            disabled={cargando}
            className={clsx(
              'boton',
              variante === 'peligro' ? 'boton-peligro' : 'boton-primario',
            )}
          >
            {cargando ? 'Procesando...' : textoConfirmar}
          </button>
        </>
      }
    >
      <div className="py-2">
        <h3 className="font-semibold text-on-surface mb-2">{titulo}</h3>
        {descripcion && (
          <p className="text-sm text-on-surface-variant">{descripcion}</p>
        )}
      </div>
    </Modal>
  );
}
