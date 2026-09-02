import { motion } from 'framer-motion';

interface PropiedadesCargandoPagina {
  mensaje?: string;
}

// Pantalla de carga a página completa, usada mientras se verifica la
// sesión o mientras el code-splitting de rutas trae el chunk de una página.
export default function CargandoPagina({ mensaje = 'Cargando...' }: PropiedadesCargandoPagina) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-4"
      >
        {/* Logo animado */}
        <motion.div
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-verde-700)] to-[var(--color-verde-500)] flex items-center justify-center shadow-lg"
          animate={{
            scale: [1, 1.05, 1],
            rotate: [0, 3, -3, 0],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="text-white font-bold text-xl">JC</span>
        </motion.div>

        {/* Barra de progreso indeterminada */}
        <div className="w-40 h-1 bg-[var(--color-piedra-100)] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[var(--color-verde-500)] rounded-full"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: '50%' }}
          />
        </div>

        <p className="text-sm text-[var(--color-piedra-400)]">{mensaje}</p>
      </motion.div>
    </div>
  );
}
