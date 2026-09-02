// Envuelve la fuente de iconos Material Symbols: `nombre` debe ser el
// nombre exacto del ligature de Google (p. ej. "pets", "wifi_off") — un
// nombre inválido se renderiza como texto literal en vez de un ícono.
interface PropiedadesIcono {
  nombre: string;
  relleno?: boolean;
  clase?: string;
  opz?: number;
  peso?: number;
}

export default function Icono({ nombre, relleno = false, clase = '', opz = 24, peso = 400 }: PropiedadesIcono) {
  return (
    <span
      className={`material-symbols-outlined ${clase}`}
      style={{ fontVariationSettings: `'FILL' ${relleno ? 1 : 0}, 'wght' ${peso}, 'GRAD' 0, 'opsz' ${opz}` }}
      aria-hidden="true"
    >
      {nombre}
    </span>
  );
}
