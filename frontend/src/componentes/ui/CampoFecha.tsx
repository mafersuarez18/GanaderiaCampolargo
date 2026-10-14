import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icono from './Icono';

// Reemplaza <input type="date"> por un selector propio: en iOS Safari ese
// control nativo no respeta el ancho/alto como un input de texto normal
// (su shadow DOM interno ignora min-width y agrega su propio padding), así
// que se veía desproporcionado frente a los demás campos sin forma de
// corregirlo solo con CSS. Este componente se ve y se comporta igual en
// todos los navegadores porque no usa el control nativo en absoluto.
interface PropiedadesCampoFecha {
  value: string; // 'YYYY-MM-DD' o ''
  onChange: (valor: string) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

const DIAS_SEMANA = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const MESES_NOMBRE = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function parsearLocal(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

function aISO(fecha: Date): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatearVisible(iso: string): string {
  return parsearLocal(iso).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function CampoFecha({
  value, onChange, placeholder = 'Seleccionar fecha', min, max, disabled, className = '', id,
}: PropiedadesCampoFecha) {
  const [abierto, setAbierto] = useState(false);
  const [mesVisible, setMesVisible] = useState(() => (value ? parsearLocal(value) : new Date()));
  const [posicion, setPosicion] = useState<{ top: number; left: number; width: number } | null>(null);
  const botonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const alHacerClicFuera = (e: MouseEvent) => {
      if (botonRef.current?.contains(e.target as Node)) return;
      if (panelRef.current?.contains(e.target as Node)) return;
      setAbierto(false);
    };
    const cerrar = () => setAbierto(false);
    const alEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') setAbierto(false); };
    document.addEventListener('mousedown', alHacerClicFuera);
    // Cierra en vez de reposicionar: evita el cálculo continuo de posición
    // y es el comportamiento estándar de la mayoría de selectores flotantes.
    window.addEventListener('scroll', cerrar, true);
    window.addEventListener('resize', cerrar);
    document.addEventListener('keydown', alEscape);
    return () => {
      document.removeEventListener('mousedown', alHacerClicFuera);
      window.removeEventListener('scroll', cerrar, true);
      window.removeEventListener('resize', cerrar);
      document.removeEventListener('keydown', alEscape);
    };
  }, [abierto]);

  const abrir = () => {
    if (disabled) return;
    const rect = botonRef.current?.getBoundingClientRect();
    if (rect) setPosicion({ top: rect.bottom + 6, left: rect.left, width: rect.width });
    setMesVisible(value ? parsearLocal(value) : new Date());
    setAbierto(true);
  };

  const seleccionar = (dia: Date) => {
    onChange(aISO(dia));
    setAbierto(false);
  };

  const minDate = min ? parsearLocal(min) : null;
  const maxDate = max ? parsearLocal(max) : null;

  const primerDia = new Date(mesVisible.getFullYear(), mesVisible.getMonth(), 1);
  const ultimoDia = new Date(mesVisible.getFullYear(), mesVisible.getMonth() + 1, 0);
  const celdas: (Date | null)[] = [];
  for (let i = 0; i < primerDia.getDay(); i++) celdas.push(null);
  for (let d = 1; d <= ultimoDia.getDate(); d++) celdas.push(new Date(mesVisible.getFullYear(), mesVisible.getMonth(), d));

  const hoy = new Date();
  const valorActual = value ? parsearLocal(value) : null;

  return (
    <>
      <button
        type="button"
        id={id}
        ref={botonRef}
        disabled={disabled}
        onClick={abrir}
        className={`campo-entrada flex items-center justify-between text-left ${className}`}
      >
        <span className={value ? '' : 'text-outline'}>
          {value ? formatearVisible(value) : placeholder}
        </span>
        <Icono nombre="calendar_month" clase="text-[16px] text-on-surface-variant flex-shrink-0 ml-2" />
      </button>

      {abierto && posicion && createPortal(
        <div
          ref={panelRef}
          style={{ position: 'fixed', top: posicion.top, left: posicion.left, minWidth: Math.max(posicion.width, 260) }}
          className="z-[100] bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-lg p-3"
        >
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={() => setMesVisible((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
              className="p-1 rounded-lg hover:bg-surface-container-high transition-colors">
              <Icono nombre="chevron_left" clase="text-[18px]" />
            </button>
            <span className="text-sm font-semibold text-on-surface capitalize">
              {MESES_NOMBRE[mesVisible.getMonth()]} {mesVisible.getFullYear()}
            </span>
            <button type="button" onClick={() => setMesVisible((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
              className="p-1 rounded-lg hover:bg-surface-container-high transition-colors">
              <Icono nombre="chevron_right" clase="text-[18px]" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DIAS_SEMANA.map((d, i) => (
              <span key={i} className="text-[10px] text-center text-on-surface-variant font-medium">{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {celdas.map((dia, i) => {
              if (!dia) return <span key={i} />;
              const esHoy = dia.toDateString() === hoy.toDateString();
              const esSeleccionado = !!valorActual && dia.toDateString() === valorActual.toDateString();
              const deshabilitado = (minDate && dia < minDate) || (maxDate && dia > maxDate);
              return (
                <button
                  key={i}
                  type="button"
                  disabled={!!deshabilitado}
                  onClick={() => seleccionar(dia)}
                  className={`w-8 h-8 rounded-lg text-xs flex items-center justify-center transition-colors ${
                    esSeleccionado
                      ? 'bg-primary text-on-primary font-semibold'
                      : deshabilitado
                        ? 'text-outline-variant cursor-not-allowed'
                        : esHoy
                          ? 'border border-primary text-primary hover:bg-primary/10'
                          : 'text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  {dia.getDate()}
                </button>
              );
            })}
          </div>
          {value && (
            <button
              type="button"
              onClick={() => { onChange(''); setAbierto(false); }}
              className="w-full mt-2 text-xs text-on-surface-variant hover:text-error transition-colors py-1"
            >
              Limpiar
            </button>
          )}
        </div>,
        document.body,
      )}
    </>
  );
}
