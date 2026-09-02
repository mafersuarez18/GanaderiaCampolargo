import { motion } from 'framer-motion';
import clsx from 'clsx';
import { EsqueletoLinea } from './EsqueletoTarjeta';
import Icono from './Icono';

// Tabla genérica y tipada: cada página define sus columnas (con un
// `render` opcional para celdas personalizadas) y le pasa sus datos; la
// tabla se encarga de esqueletos de carga, orden, selección y estado vacío.
export interface ColumnaTabla<T> {
  clave: string;
  encabezado: string;
  render?: (fila: T) => React.ReactNode;
  alineacion?: 'izquierda' | 'centro' | 'derecha';
  ordenable?: boolean;
  className?: string;
}

interface ConfiguracionOrden {
  columna: string;
  direccion: 'asc' | 'desc';
}

interface PropiedadesTabla<T> {
  columnas: ColumnaTabla<T>[];
  datos: T[];
  claveId: keyof T;
  cargando?: boolean;
  filasEsqueleto?: number;
  alOrdenar?: (columna: string, direccion: 'asc' | 'desc') => void;
  ordenActual?: ConfiguracionOrden;
  alHacerClicFila?: (fila: T) => void;
  filasSeleccionadas?: Set<string | number>;
  alSeleccionarFila?: (id: string | number) => void;
  alSeleccionarTodo?: () => void;
  vacio?: React.ReactNode;
  className?: string;
}

export default function Tabla<T extends object>({
  columnas,
  datos,
  claveId,
  cargando = false,
  filasEsqueleto = 5,
  alOrdenar,
  ordenActual,
  alHacerClicFila,
  filasSeleccionadas,
  alSeleccionarFila,
  alSeleccionarTodo,
  vacio,
  className,
}: PropiedadesTabla<T>) {
  const manejarOrden = (columna: string) => {
    if (!alOrdenar) return;
    const nuevaDireccion =
      ordenActual?.columna === columna && ordenActual.direccion === 'asc' ? 'desc' : 'asc';
    alOrdenar(columna, nuevaDireccion);
  };

  const tieneSeleccion = !!filasSeleccionadas;
  const todasSeleccionadas = tieneSeleccion && datos.length > 0 && datos.every(
    (fila) => filasSeleccionadas.has(fila[claveId] as string | number)
  );

  return (
    <div className={clsx('w-full overflow-x-auto', className)}>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-outline-variant/20">
            {tieneSeleccion && (
              <th className="w-10 px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={todasSeleccionadas}
                  onChange={alSeleccionarTodo}
                  className="w-4 h-4 rounded border-outline-variant accent-primary cursor-pointer"
                />
              </th>
            )}
            {columnas.map((col) => (
              <th
                key={col.clave}
                className={clsx(
                  'px-4 py-3 font-semibold text-[11px] uppercase tracking-wide text-on-surface-variant',
                  col.alineacion === 'derecha' ? 'text-right' :
                  col.alineacion === 'centro'  ? 'text-center' : 'text-left',
                  col.ordenable && 'cursor-pointer hover:text-on-surface select-none',
                  col.className,
                )}
                onClick={() => col.ordenable && manejarOrden(col.clave)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.encabezado}
                  {col.ordenable && (
                    ordenActual?.columna === col.clave ? (
                      <Icono
                        nombre={ordenActual.direccion === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                        clase="text-[12px] text-primary"
                      />
                    ) : (
                      <Icono nombre="unfold_more" clase="text-[12px] opacity-40" />
                    )
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {cargando ? (
            Array.from({ length: filasEsqueleto }).map((_, i) => (
              <tr key={i} className="border-b border-outline-variant/10">
                {tieneSeleccion && <td className="px-4 py-3"><EsqueletoLinea className="w-4 h-4" /></td>}
                {columnas.map((col) => (
                  <td key={col.clave} className="px-4 py-3">
                    <EsqueletoLinea className={`h-4 ${i % 3 === 0 ? 'w-3/4' : 'w-1/2'}`} />
                  </td>
                ))}
              </tr>
            ))
          ) : datos.length === 0 ? (
            <tr>
              <td
                colSpan={columnas.length + (tieneSeleccion ? 1 : 0)}
                className="px-4 py-12 text-center text-on-surface-variant text-sm"
              >
                {vacio ?? 'No hay registros para mostrar'}
              </td>
            </tr>
          ) : (
            datos.map((fila, indice) => {
              const id = fila[claveId] as string | number;
              const estaSeleccionada = filasSeleccionadas?.has(id) ?? false;

              return (
                <motion.tr
                  key={id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: indice * 0.02, duration: 0.2 }}
                  className={clsx(
                    'border-b border-outline-variant/10 transition-colors',
                    alHacerClicFila && 'cursor-pointer',
                    estaSeleccionada
                      ? 'bg-primary/5'
                      : 'hover:bg-surface-container-low/50',
                  )}
                  onClick={() => alHacerClicFila?.(fila)}
                >
                  {tieneSeleccion && (
                    <td
                      className="px-4 py-3"
                      onClick={(e) => { e.stopPropagation(); alSeleccionarFila?.(id); }}
                    >
                      <input
                        type="checkbox"
                        checked={estaSeleccionada}
                        onChange={() => alSeleccionarFila?.(id)}
                        className="w-4 h-4 rounded border-outline-variant accent-primary cursor-pointer"
                      />
                    </td>
                  )}
                  {columnas.map((col) => (
                    <td
                      key={col.clave}
                      className={clsx(
                        'px-4 py-3 text-on-surface-variant',
                        col.alineacion === 'derecha' ? 'text-right' :
                        col.alineacion === 'centro'  ? 'text-center' : 'text-left',
                        col.className,
                      )}
                    >
                      {col.render
                        ? col.render(fila)
                        : String((fila as Record<string, unknown>)[col.clave] ?? '—')}
                    </td>
                  ))}
                </motion.tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
