import clsx from 'clsx';
import Icono from './Icono';

interface PropiedadesPaginacion {
  paginaActual: number;
  totalPaginas: number;
  alCambiarPagina: (pagina: number) => void;
  totalRegistros?: number;
  porPagina?: number;
  className?: string;
}

// Control de paginación reutilizable, con números de página truncados
// (1 … 4 5 6 … 20) cuando hay muchas páginas.
export default function Paginacion({
  paginaActual,
  totalPaginas,
  alCambiarPagina,
  totalRegistros,
  porPagina,
  className,
}: PropiedadesPaginacion) {
  if (totalPaginas <= 1) return null;

  const obtenerPaginas = (): (number | '...')[] => {
    if (totalPaginas <= 7) {
      return Array.from({ length: totalPaginas }, (_, i) => i + 1);
    }
    const paginas: (number | '...')[] = [1];
    if (paginaActual > 3) paginas.push('...');
    const inicio = Math.max(2, paginaActual - 1);
    const fin    = Math.min(totalPaginas - 1, paginaActual + 1);
    for (let i = inicio; i <= fin; i++) paginas.push(i);
    if (paginaActual < totalPaginas - 2) paginas.push('...');
    paginas.push(totalPaginas);
    return paginas;
  };

  const inicio = porPagina ? (paginaActual - 1) * porPagina + 1 : undefined;
  const fin    = porPagina && totalRegistros ? Math.min(paginaActual * porPagina, totalRegistros) : undefined;

  return (
    <div className={clsx('flex flex-col sm:flex-row items-center justify-between gap-3', className)}>
      {totalRegistros !== undefined && (
        <p className="text-xs text-on-surface-variant">
          {inicio && fin
            ? <>Mostrando <strong>{inicio}–{fin}</strong> de <strong>{totalRegistros}</strong> registros</>
            : <><strong>{totalRegistros}</strong> registros en total</>
          }
        </p>
      )}

      <div className="flex items-center gap-1">
        <BotoNavPag onClick={() => alCambiarPagina(1)} disabled={paginaActual === 1} aria-label="Primera página">
          <Icono nombre="first_page" clase="text-[16px]" />
        </BotoNavPag>
        <BotoNavPag onClick={() => alCambiarPagina(paginaActual - 1)} disabled={paginaActual === 1} aria-label="Página anterior">
          <Icono nombre="chevron_left" clase="text-[16px]" />
        </BotoNavPag>

        {obtenerPaginas().map((pagina, i) =>
          pagina === '...' ? (
            <span key={`sep-${i}`} className="w-8 text-center text-outline text-sm">…</span>
          ) : (
            <button
              key={pagina}
              onClick={() => alCambiarPagina(pagina)}
              className={clsx(
                'w-8 h-8 rounded-lg text-xs font-medium transition-colors',
                pagina === paginaActual
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface-variant hover:bg-surface-container',
              )}
            >
              {pagina}
            </button>
          )
        )}

        <BotoNavPag onClick={() => alCambiarPagina(paginaActual + 1)} disabled={paginaActual === totalPaginas} aria-label="Página siguiente">
          <Icono nombre="chevron_right" clase="text-[16px]" />
        </BotoNavPag>
        <BotoNavPag onClick={() => alCambiarPagina(totalPaginas)} disabled={paginaActual === totalPaginas} aria-label="Última página">
          <Icono nombre="last_page" clase="text-[16px]" />
        </BotoNavPag>
      </div>
    </div>
  );
}

function BotoNavPag({ children, disabled, onClick, 'aria-label': ariaLabel }: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  'aria-label'?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant
                 hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  );
}
