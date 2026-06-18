import 'leaflet/dist/leaflet.css';
import { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Tooltip, Polyline, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import Badge from '../../componentes/ui/Badge';
import Icono from '../../componentes/ui/Icono';

// ── Fix icono default de Leaflet en Vite ─────────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface PuntoTrack {
  lat: number;
  lng: number;
  timestamp: string;
  velocidad: number;
}

interface DispositivoMock {
  id: string;
  nombre: string;
  apiKey: string;
  activo: boolean;
  enLinea: boolean;
  ultimaConexion: string | null;
  animal: { numeroArete: string; nombre: string | null; finca: string } | null;
  lat: number | null;
  lng: number | null;
  track: PuntoTrack[];
}

interface FincaMock {
  nombre: string;
  municipio: string;
  lat: number;
  lng: number;
  hectareas: number;
  animalesActivos: number;
  color: string;
  radioMetros: number;
}

// ── Datos simulados ───────────────────────────────────────────────────────────
const AHORA = new Date();
const hace = (min: number) => new Date(AHORA.getTime() - min * 60_000).toISOString();

const FINCAS: FincaMock[] = [
  { nombre: 'El Paraíso',   municipio: 'Cocorote', lat: 10.1875, lng: -68.5234, hectareas: 680, animalesActivos: 187, color: '#0d631b', radioMetros: 1800 },
  { nombre: 'Campo Alegre', municipio: 'Sucre',    lat: 10.2318, lng: -68.4912, hectareas: 750, animalesActivos: 213, color: '#006419', radioMetros: 2000 },
  { nombre: 'Las Peñas',    municipio: 'Veroes',   lat: 10.2756, lng: -68.4461, hectareas: 570, animalesActivos: 148, color: '#79564b', radioMetros: 1600 },
];

const DISPOSITIVOS: DispositivoMock[] = [
  {
    id: 'd1', nombre: 'GPS-001', apiKey: 'GPS-ELP-001-2026-aBcD1234',
    activo: true, enLinea: true, ultimaConexion: hace(2),
    animal: { numeroArete: 'A-001', nombre: 'Luna', finca: 'El Paraíso' },
    lat: 10.1882, lng: -68.5241,
    track: [
      { lat: 10.1855, lng: -68.5260, timestamp: hace(23 * 60), velocidad: 1.8 },
      { lat: 10.1862, lng: -68.5252, timestamp: hace(20 * 60), velocidad: 2.3 },
      { lat: 10.1868, lng: -68.5248, timestamp: hace(17 * 60), velocidad: 1.5 },
      { lat: 10.1875, lng: -68.5244, timestamp: hace(14 * 60), velocidad: 2.1 },
      { lat: 10.1879, lng: -68.5240, timestamp: hace(10 * 60), velocidad: 1.2 },
      { lat: 10.1876, lng: -68.5235, timestamp: hace(6 * 60),  velocidad: 0.8 },
      { lat: 10.1880, lng: -68.5238, timestamp: hace(3 * 60),  velocidad: 1.4 },
      { lat: 10.1882, lng: -68.5241, timestamp: hace(2),       velocidad: 0.3 },
    ],
  },
  {
    id: 'd2', nombre: 'GPS-002', apiKey: 'GPS-ELP-002-2026-xYzW5678',
    activo: true, enLinea: false, ultimaConexion: hace(18 * 60),
    animal: { numeroArete: 'T-012', nombre: 'Trueno', finca: 'El Paraíso' },
    lat: 10.1863, lng: -68.5220,
    track: [
      { lat: 10.1840, lng: -68.5210, timestamp: hace(26 * 60), velocidad: 3.2 },
      { lat: 10.1848, lng: -68.5215, timestamp: hace(24 * 60), velocidad: 2.8 },
      { lat: 10.1855, lng: -68.5218, timestamp: hace(22 * 60), velocidad: 1.9 },
      { lat: 10.1860, lng: -68.5221, timestamp: hace(20 * 60), velocidad: 1.1 },
      { lat: 10.1863, lng: -68.5220, timestamp: hace(18 * 60), velocidad: 0.0 },
    ],
  },
  {
    id: 'd3', nombre: 'GPS-003', apiKey: 'GPS-CAL-003-2026-mNoP9012',
    activo: true, enLinea: true, ultimaConexion: hace(1),
    animal: { numeroArete: 'S-047', nombre: null, finca: 'Campo Alegre' },
    lat: 10.2329, lng: -68.4920,
    track: [
      { lat: 10.2305, lng: -68.4940, timestamp: hace(22 * 60), velocidad: 2.5 },
      { lat: 10.2312, lng: -68.4935, timestamp: hace(18 * 60), velocidad: 2.0 },
      { lat: 10.2318, lng: -68.4928, timestamp: hace(14 * 60), velocidad: 1.7 },
      { lat: 10.2324, lng: -68.4924, timestamp: hace(10 * 60), velocidad: 1.3 },
      { lat: 10.2327, lng: -68.4921, timestamp: hace(5 * 60),  velocidad: 0.9 },
      { lat: 10.2329, lng: -68.4920, timestamp: hace(1),       velocidad: 0.2 },
    ],
  },
  {
    id: 'd4', nombre: 'GPS-004', apiKey: 'GPS-LPE-004-2026-qRsT3456',
    activo: true, enLinea: false, ultimaConexion: hace(3 * 60 * 60),
    animal: { numeroArete: 'B-089', nombre: null, finca: 'Las Peñas' },
    lat: 10.2768, lng: -68.4472,
    track: [
      { lat: 10.2750, lng: -68.4490, timestamp: hace(5 * 60 * 60), velocidad: 1.6 },
      { lat: 10.2757, lng: -68.4483, timestamp: hace(4 * 60 * 60), velocidad: 2.2 },
      { lat: 10.2762, lng: -68.4479, timestamp: hace(3.5 * 60 * 60), velocidad: 1.4 },
      { lat: 10.2765, lng: -68.4475, timestamp: hace(3 * 60 * 60), velocidad: 0.8 },
      { lat: 10.2768, lng: -68.4472, timestamp: hace(3 * 60 * 60), velocidad: 0.0 },
    ],
  },
  {
    id: 'd5', nombre: 'GPS-005', apiKey: 'GPS-LPE-005-2026-uVwX7890',
    activo: false, enLinea: false, ultimaConexion: null,
    animal: null,
    lat: null, lng: null,
    track: [],
  },
];

// ── Icono personalizado MD3 ───────────────────────────────────────────────────
function crearIconoAnimal(enLinea: boolean) {
  const color = enLinea ? '#0d631b' : '#707a6c';
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:36px;height:36px;border-radius:50% 50% 50% 0;
        background:${color};border:3px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.3);
        transform:rotate(-45deg);
        display:flex;align-items:center;justify-content:center;
      ">
        <span class="material-symbols-outlined" style="
          font-size:16px;color:white;transform:rotate(45deg);
          font-variation-settings:'FILL' 1,'wght' 500;
        ">pets</span>
      </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -38],
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function tiempoRelativo(fecha: string | null): string {
  if (!fecha) return 'Sin conexión';
  const min = Math.floor((Date.now() - new Date(fecha).getTime()) / 60_000);
  if (min < 1)  return 'Ahora mismo';
  if (min < 60) return `Hace ${min}m`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `Hace ${hrs}h`;
  return `Hace ${Math.floor(hrs / 24)}d`;
}

function haversineMetros(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calcularEstadisticasTrack(track: PuntoTrack[]) {
  if (track.length < 2) return { distanciaM: 0, duracionMin: 0, velocidadPromedio: 0 };
  let distanciaM = 0;
  for (let i = 1; i < track.length; i++) {
    distanciaM += haversineMetros(track[i - 1].lat, track[i - 1].lng, track[i].lat, track[i].lng);
  }
  const duracionMin = Math.round(
    (new Date(track[track.length - 1].timestamp).getTime() - new Date(track[0].timestamp).getTime()) / 60_000,
  );
  const velocidadPromedio = track.reduce((s, p) => s + p.velocidad, 0) / track.length;
  return { distanciaM: Math.round(distanciaM), duracionMin, velocidadPromedio: +velocidadPromedio.toFixed(1) };
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function PaginaMapa() {
  const [pestaña, setPestaña]               = useState<'dispositivos' | 'mapa' | 'movilidad'>('dispositivos');
  const [modalConfig, setModalConfig]       = useState(false);
  const [dispositivoAmp, setDispositivoAmp] = useState<string | null>(null);
  const [filtroFinca, setFiltroFinca]       = useState<string>('todas');
  const [dispositivoTrack, setDispositivoTrack] = useState<string>(
    DISPOSITIVOS.find((d) => d.track.length > 0)?.id ?? '',
  );

  const dispositivosFiltrados = useMemo(() =>
    filtroFinca === 'todas'
      ? DISPOSITIVOS
      : DISPOSITIVOS.filter((d) => d.animal?.finca === filtroFinca),
    [filtroFinca],
  );

  const enLinea    = DISPOSITIVOS.filter((d) => d.enLinea).length;
  const activos    = DISPOSITIVOS.filter((d) => d.activo).length;
  const posiciones = DISPOSITIVOS.filter((d) => d.lat !== null && d.enLinea);

  const centroMapa: [number, number] = [10.2316, -68.4869];

  const dispSeleccionado  = DISPOSITIVOS.find((d) => d.id === dispositivoTrack) ?? null;
  const trackActivo       = dispSeleccionado?.track ?? [];
  const statsTrack        = calcularEstadisticasTrack(trackActivo);

  return (
    <div className="space-y-5">

      {/* Encabezado */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <Icono nombre="map" relleno clase="text-[22px] text-primary" />
            Mapa y Geolocalización
          </h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Seguimiento GPS de animales en las tres fincas — Yaracuy, Venezuela
          </p>
        </div>
        <button onClick={() => setModalConfig(true)} className="boton boton-primario gap-2 text-sm">
          <Icono nombre="add_circle" clase="text-[18px]" />
          Agregar dispositivo
        </button>
      </motion.div>

      {/* Banner datos simulados */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex items-start gap-3 px-4 py-3.5 bg-tertiary/8 border border-tertiary/20 rounded-2xl">
        <Icono nombre="science" relleno clase="text-[18px] text-tertiary flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <span className="font-semibold text-on-surface">Datos de demostración — </span>
          <span className="text-on-surface-variant">
            Las posiciones y dispositivos mostrados son simulados. Una vez que los dispositivos IoT
            queden instalados en campo, este módulo mostrará datos reales en tiempo real.
          </span>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { et: 'Dispositivos totales', val: DISPOSITIVOS.length, ico: 'router',       col: 'text-on-surface', fondo: 'bg-surface-container' },
          { et: 'Activos',              val: activos,              ico: 'check_circle',  col: 'text-primary',    fondo: 'bg-primary/10' },
          { et: 'En línea (últ. 5min)', val: enLinea,              ico: 'wifi',          col: enLinea > 0 ? 'text-primary' : 'text-outline', fondo: enLinea > 0 ? 'bg-primary/10' : 'bg-surface-container' },
          { et: 'Sin asignar',          val: DISPOSITIVOS.filter((d) => !d.animal).length, ico: 'device_unknown', col: 'text-secondary', fondo: 'bg-secondary/10' },
        ].map((kpi) => (
          <div key={kpi.et} className="tarjeta-vidrio rounded-2xl p-4 flex items-center gap-3">
            <div className={`p-2.5 ${kpi.fondo} rounded-xl flex-shrink-0`}>
              <Icono nombre={kpi.ico} relleno clase={`text-[20px] ${kpi.col}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-on-surface">{kpi.val}</p>
              <p className="text-xs text-on-surface-variant leading-tight">{kpi.et}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pestañas */}
      <div className="flex gap-1 p-1 bg-surface-container rounded-xl w-fit">
        {([
          { clave: 'dispositivos', et: 'Dispositivos GPS',   ico: 'router' },
          { clave: 'mapa',         et: 'Mapa en vivo',       ico: 'satellite_alt' },
          { clave: 'movilidad',    et: 'Historial Movilidad', ico: 'route' },
        ] as const).map((p) => (
          <button
            key={p.clave}
            onClick={() => setPestaña(p.clave)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              pestaña === p.clave
                ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Icono nombre={p.ico} clase="text-[16px]" />
            {p.et}
          </button>
        ))}
      </div>

      {/* ── PESTAÑA: DISPOSITIVOS ─────────────────────────────────────────────── */}
      {pestaña === 'dispositivos' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

          {/* Filtro por finca */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-on-surface-variant font-medium">Finca:</span>
            {['todas', ...FINCAS.map((f) => f.nombre)].map((f) => (
              <button
                key={f}
                onClick={() => setFiltroFinca(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  filtroFinca === f
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {f === 'todas' ? 'Todas' : f}
              </button>
            ))}
          </div>

          {/* Lista de dispositivos */}
          <div className="tarjeta-vidrio rounded-2xl overflow-hidden">
            {dispositivosFiltrados.map((disp, idx) => {
              const ampliado = dispositivoAmp === disp.id;
              return (
                <div key={disp.id}>
                  <div
                    className={`flex items-center gap-4 p-4 cursor-pointer transition-colors
                      ${idx < dispositivosFiltrados.length - 1 ? 'border-b border-outline-variant/15' : ''}
                      ${ampliado ? 'bg-primary/5' : 'hover:bg-surface-container-low'}`}
                    onClick={() => setDispositivoAmp(ampliado ? null : disp.id)}
                  >
                    <div className={`p-2.5 rounded-xl flex-shrink-0 ${
                      !disp.activo ? 'bg-surface-container' : disp.enLinea ? 'bg-primary/10' : 'bg-secondary/10'
                    }`}>
                      <Icono
                        nombre={!disp.activo ? 'router' : disp.enLinea ? 'wifi' : 'wifi_off'}
                        relleno={disp.enLinea}
                        clase={`text-[20px] ${!disp.activo ? 'text-outline' : disp.enLinea ? 'text-primary' : 'text-secondary'}`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-on-surface">{disp.nombre}</span>
                        {disp.activo
                          ? disp.enLinea
                            ? <Badge variante="verde" tamano="xs" punto>En línea</Badge>
                            : <Badge variante="gris"  tamano="xs">Desconectado</Badge>
                          : <Badge variante="gris"    tamano="xs">Inactivo</Badge>
                        }
                      </div>
                      {disp.animal ? (
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-on-surface-variant flex-wrap">
                          <Icono nombre="pets" clase="text-[11px] text-primary" />
                          <span>#{disp.animal.numeroArete}</span>
                          {disp.animal.nombre && <span>· {disp.animal.nombre}</span>}
                          <span className="text-outline">· {disp.animal.finca}</span>
                        </div>
                      ) : (
                        <p className="text-xs text-outline mt-0.5 italic">Sin animal asignado</p>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-on-surface-variant flex items-center gap-1 justify-end">
                        <Icono nombre="schedule" clase="text-[11px]" />
                        {tiempoRelativo(disp.ultimaConexion)}
                      </p>
                      {disp.lat !== null && (
                        <p className="text-[10px] text-outline font-mono mt-0.5">
                          {disp.lat.toFixed(4)}, {disp.lng!.toFixed(4)}
                        </p>
                      )}
                    </div>

                    <Icono nombre={ampliado ? 'expand_less' : 'chevron_right'} clase="text-[18px] text-outline flex-shrink-0" />
                  </div>

                  <AnimatePresence>
                    {ampliado && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-b border-outline-variant/15"
                      >
                        <div className="px-5 pb-4 pt-2 bg-surface-container-low/40 space-y-3">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <InfoBloque titulo="API Key" valor={disp.apiKey} mono />
                            <InfoBloque titulo="Estado" valor={disp.activo ? 'Activo' : 'Inactivo'} />
                            <InfoBloque titulo="Última señal" valor={tiempoRelativo(disp.ultimaConexion)} />
                          </div>
                          <div className="text-xs text-on-surface-variant bg-surface-container rounded-xl px-3 py-2 font-mono leading-relaxed">
                            <p className="text-outline text-[10px] font-sans mb-1">Endpoint de envío (HTTP POST):</p>
                            <p className="break-all">{`POST /api/v1/geolocalizacion/dispositivos/${disp.apiKey}/ubicacion`}</p>
                            <p className="mt-1 text-outline font-sans text-[10px]">Body: {'{ "latitud": 10.1875, "longitud": -68.5234, "precision": 3.5 }'}</p>
                          </div>
                          {disp.track.length > 0 && (
                            <button
                              onClick={() => { setDispositivoTrack(disp.id); setPestaña('movilidad'); }}
                              className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                            >
                              <Icono nombre="route" clase="text-[14px]" />
                              Ver historial de movilidad
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Resumen por finca */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {FINCAS.map((finca) => {
              const dispFinca     = DISPOSITIVOS.filter((d) => d.animal?.finca === finca.nombre);
              const enLineaFinca  = dispFinca.filter((d) => d.enLinea).length;
              return (
                <div key={finca.nombre} className="tarjeta-vidrio rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: finca.color }} />
                    <p className="text-sm font-semibold text-on-surface truncate">{finca.nombre}</p>
                  </div>
                  <div className="space-y-1.5 text-xs text-on-surface-variant">
                    {[
                      ['Animales activos', finca.animalesActivos],
                      ['Dispositivos GPS', dispFinca.length],
                      ['En línea ahora', enLineaFinca],
                      ['Cobertura GPS', finca.animalesActivos > 0 ? `${Math.round((dispFinca.length / finca.animalesActivos) * 100)}%` : '—'],
                    ].map(([label, val]) => (
                      <div key={String(label)} className="flex justify-between">
                        <span>{label}</span>
                        <span className={`font-semibold ${label === 'En línea ahora' && Number(val) > 0 ? 'text-primary' : 'text-on-surface'}`}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── PESTAÑA: MAPA ─────────────────────────────────────────────────────── */}
      {pestaña === 'mapa' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap text-xs text-on-surface-variant">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span>Dispositivo en línea</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-outline" />
              <span>Sin señal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full border-2 border-primary bg-transparent opacity-40" />
              <span>Área de finca (simulada)</span>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden border border-outline-variant/20 shadow-sm" style={{ height: 480 }}>
            <MapContainer center={centroMapa} zoom={12} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {FINCAS.map((finca) => (
                <Circle key={finca.nombre} center={[finca.lat, finca.lng]} radius={finca.radioMetros}
                  pathOptions={{ color: finca.color, fillColor: finca.color, fillOpacity: 0.08, weight: 2, dashArray: '6 4' }}>
                  <Tooltip permanent direction="top">
                    <span style={{ fontSize: 11, fontWeight: 600, color: finca.color }}>{finca.nombre}</span>
                  </Tooltip>
                </Circle>
              ))}
              {DISPOSITIVOS.filter((d) => d.lat !== null).map((disp) => (
                <Marker key={disp.id} position={[disp.lat!, disp.lng!]} icon={crearIconoAnimal(disp.enLinea)}>
                  <Popup>
                    <div style={{ minWidth: 180, fontFamily: 'Inter, sans-serif' }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#1a1c1c', marginBottom: 4 }}>{disp.nombre}</div>
                      {disp.animal && (
                        <>
                          <div style={{ fontSize: 12, color: '#40493d' }}>
                            <strong>Animal:</strong> #{disp.animal.numeroArete}
                            {disp.animal.nombre && ` — ${disp.animal.nombre}`}
                          </div>
                          <div style={{ fontSize: 12, color: '#707a6c' }}><strong>Finca:</strong> {disp.animal.finca}</div>
                        </>
                      )}
                      <div style={{ fontSize: 11, color: '#707a6c', marginTop: 4 }}>
                        {disp.enLinea
                          ? <span style={{ color: '#0d631b', fontWeight: 600 }}>● En línea</span>
                          : <span style={{ color: '#707a6c' }}>○ Desconectado</span>}
                        {' · '}{tiempoRelativo(disp.ultimaConexion)}
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#9ca3af', marginTop: 4 }}>
                        {disp.lat?.toFixed(6)}, {disp.lng?.toFixed(6)}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <div className="tarjeta-vidrio rounded-2xl overflow-hidden">
            <div className="px-5 py-3 bg-surface-container-low border-b border-outline-variant/20 flex items-center justify-between">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Últimas posiciones</p>
              <Badge variante="verde" tamano="xs" punto>{posiciones.length} activos</Badge>
            </div>
            {DISPOSITIVOS.filter((d) => d.lat !== null).map((disp, idx, arr) => (
              <div key={disp.id}
                className={`grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center px-5 py-3 text-xs hover:bg-surface-container-low transition-colors
                  ${idx < arr.length - 1 ? 'border-b border-outline-variant/10' : ''}`}
              >
                <div>
                  <p className="font-semibold text-on-surface">
                    #{disp.animal?.numeroArete ?? '—'}
                    {disp.animal?.nombre && <span className="text-on-surface-variant font-normal ml-1">· {disp.animal.nombre}</span>}
                  </p>
                  <p className="text-outline text-[10px]">{disp.animal?.finca ?? 'Sin asignar'}</p>
                </div>
                <span className="font-mono text-on-surface-variant">{disp.lat?.toFixed(6)}</span>
                <span className="font-mono text-on-surface-variant">{disp.lng?.toFixed(6)}</span>
                <div className="text-right">
                  <span className="text-outline">{tiempoRelativo(disp.ultimaConexion)}</span>
                  <div className="mt-0.5">
                    {disp.enLinea
                      ? <Badge variante="verde" tamano="xs" punto>En línea</Badge>
                      : <Badge variante="gris"  tamano="xs">Offline</Badge>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── PESTAÑA: HISTORIAL DE MOVILIDAD ────────────────────────────────────── */}
      {pestaña === 'movilidad' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

          {/* Selector de animal/dispositivo */}
          <div className="tarjeta-vidrio rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Icono nombre="route" relleno clase="text-[18px] text-primary" />
              <h2 className="text-sm font-semibold text-on-surface">Seleccionar animal</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {DISPOSITIVOS.filter((d) => d.track.length > 0).map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDispositivoTrack(d.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                    dispositivoTrack === d.id
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:border-primary/30'
                  }`}
                >
                  <Icono nombre={d.enLinea ? 'wifi' : 'wifi_off'} clase="text-[14px]" />
                  <span>{d.nombre}</span>
                  {d.animal && <span className="opacity-75">· #{d.animal.numeroArete}</span>}
                </button>
              ))}
            </div>
          </div>

          {dispSeleccionado && trackActivo.length > 0 ? (
            <>
              {/* KPIs del track */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  {
                    et: 'Distancia recorrida',
                    val: statsTrack.distanciaM >= 1000
                      ? `${(statsTrack.distanciaM / 1000).toFixed(2)} km`
                      : `${statsTrack.distanciaM} m`,
                    ico: 'straighten', col: 'text-primary', fondo: 'bg-primary/10',
                  },
                  {
                    et: 'Tiempo de actividad',
                    val: statsTrack.duracionMin >= 60
                      ? `${Math.floor(statsTrack.duracionMin / 60)}h ${statsTrack.duracionMin % 60}m`
                      : `${statsTrack.duracionMin} min`,
                    ico: 'timer', col: 'text-secondary', fondo: 'bg-secondary/10',
                  },
                  {
                    et: 'Velocidad promedio',
                    val: `${statsTrack.velocidadPromedio} km/h`,
                    ico: 'speed', col: 'text-tertiary', fondo: 'bg-tertiary/10',
                  },
                ].map((kpi) => (
                  <div key={kpi.et} className="tarjeta-vidrio rounded-2xl p-4 flex items-center gap-3">
                    <div className={`p-2.5 ${kpi.fondo} rounded-xl flex-shrink-0`}>
                      <Icono nombre={kpi.ico} relleno clase={`text-[20px] ${kpi.col}`} />
                    </div>
                    <div>
                      <p className={`text-xl font-bold ${kpi.col}`}>{kpi.val}</p>
                      <p className="text-xs text-on-surface-variant leading-tight">{kpi.et}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mapa con trayectoria */}
              <div className="tarjeta-vidrio rounded-2xl overflow-hidden">
                <div className="px-5 py-3 bg-surface-container-low border-b border-outline-variant/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icono nombre="route" clase="text-[16px] text-primary" />
                    <p className="text-xs font-semibold text-on-surface">
                      Trayectoria — {dispSeleccionado.animal?.nombre ?? `#${dispSeleccionado.animal?.numeroArete}`}
                      {dispSeleccionado.animal && <span className="text-on-surface-variant font-normal ml-1">· {dispSeleccionado.animal.finca}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-outline inline-block" />Inicio
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-primary inline-block" />Actual
                    </span>
                  </div>
                </div>
                <div style={{ height: 400 }}>
                  <MapContainer
                    center={[trackActivo[Math.floor(trackActivo.length / 2)].lat, trackActivo[Math.floor(trackActivo.length / 2)].lng]}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Línea del recorrido */}
                    <Polyline
                      positions={trackActivo.map((p) => [p.lat, p.lng] as [number, number])}
                      pathOptions={{ color: '#0d631b', weight: 4, opacity: 0.8, dashArray: undefined }}
                    />

                    {/* Puntos del track */}
                    {trackActivo.map((punto, i) => {
                      const esPrimero = i === 0;
                      const esUltimo  = i === trackActivo.length - 1;
                      return (
                        <CircleMarker
                          key={i}
                          center={[punto.lat, punto.lng]}
                          radius={esUltimo ? 8 : esPrimero ? 6 : 4}
                          pathOptions={{
                            color:       esUltimo ? '#0d631b' : esPrimero ? '#707a6c' : '#0d631b',
                            fillColor:   esUltimo ? '#0d631b' : esPrimero ? '#707a6c' : '#a3f69c',
                            fillOpacity: 1,
                            weight:      2,
                          }}
                        >
                          <Popup>
                            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12 }}>
                              <div style={{ fontWeight: 700, color: '#1a1c1c', marginBottom: 4 }}>
                                {esPrimero ? '⬤ Inicio del recorrido' : esUltimo ? '⬤ Posición actual' : `Punto ${i + 1}`}
                              </div>
                              <div style={{ color: '#707a6c' }}>
                                {new Date(punto.timestamp).toLocaleString('es-VE', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                              </div>
                              <div style={{ color: '#0d631b', fontWeight: 600, marginTop: 4 }}>
                                {punto.velocidad} km/h
                              </div>
                              <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#9ca3af', marginTop: 2 }}>
                                {punto.lat.toFixed(6)}, {punto.lng.toFixed(6)}
                              </div>
                            </div>
                          </Popup>
                        </CircleMarker>
                      );
                    })}
                  </MapContainer>
                </div>
              </div>

              {/* Tabla de puntos del historial */}
              <div className="tarjeta-vidrio rounded-2xl overflow-hidden">
                <div className="px-5 py-3 bg-surface-container-low border-b border-outline-variant/20">
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                    Registro de ubicaciones — últimas {trackActivo.length} entradas
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-surface-container/50">
                        <th className="px-4 py-2.5 text-left font-semibold text-on-surface-variant">#</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-on-surface-variant">Fecha / Hora</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-on-surface-variant">Latitud</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-on-surface-variant">Longitud</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-on-surface-variant">Velocidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...trackActivo].reverse().map((punto, i) => (
                        <tr key={i} className="border-t border-outline-variant/10 hover:bg-surface-container-low/50">
                          <td className="px-4 py-2.5 text-outline">{trackActivo.length - i}</td>
                          <td className="px-4 py-2.5 text-on-surface-variant">
                            {new Date(punto.timestamp).toLocaleString('es-VE', {
                              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                            })}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-on-surface">{punto.lat.toFixed(6)}</td>
                          <td className="px-4 py-2.5 font-mono text-on-surface">{punto.lng.toFixed(6)}</td>
                          <td className="px-4 py-2.5">
                            <span className={`font-semibold ${punto.velocidad > 0 ? 'text-primary' : 'text-outline'}`}>
                              {punto.velocidad > 0 ? `${punto.velocidad} km/h` : 'Detenido'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="tarjeta-vidrio rounded-2xl p-12 text-center">
              <Icono nombre="route" clase="text-[40px] text-outline mx-auto mb-3" />
              <p className="font-medium text-on-surface-variant">Sin historial disponible</p>
              <p className="text-sm text-outline mt-1">Seleccione un dispositivo activo para ver su trayectoria</p>
            </div>
          )}

        </motion.div>
      )}

      {/* ── MODAL: Agregar dispositivo ───────────────────────────────────────── */}
      <AnimatePresence>
        {modalConfig && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm"
              onClick={() => setModalConfig(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-outline-variant/20">
                <div>
                  <h2 className="text-base font-semibold text-on-surface">Configurar dispositivo GPS</h2>
                  <p className="text-sm text-on-surface-variant mt-0.5">Instrucciones para registrar un nuevo tracker IoT</p>
                </div>
                <button onClick={() => setModalConfig(false)} className="p-2 hover:bg-surface-container rounded-xl transition-colors -mt-1 -mr-2">
                  <Icono nombre="close" clase="text-[18px] text-on-surface-variant" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
                <Paso numero={1} titulo="Asignar el dispositivo en el sistema">
                  <p className="text-sm text-on-surface-variant">
                    Ve a <strong className="text-on-surface">Seguridad → Dispositivos GPS</strong> y crea un
                    registro nuevo con el nombre y el animal al que se asociará. El sistema generará una
                    <strong className="text-on-surface"> API Key</strong> única para ese tracker.
                  </p>
                </Paso>
                <Paso numero={2} titulo="Programar el firmware del tracker">
                  <p className="text-sm text-on-surface-variant mb-2">
                    Configura el dispositivo para que envíe peticiones HTTP POST cada N segundos a:
                  </p>
                  <div className="bg-surface-container rounded-xl px-4 py-3 font-mono text-xs text-on-surface-variant break-all leading-relaxed">
                    <span className="text-outline">POST </span>
                    <span>{window.location.origin}/api/v1/geolocalizacion/dispositivos/</span>
                    <span className="text-primary">{'{'}'API_KEY'{'}'}</span>
                    <span>/ubicacion</span>
                  </div>
                </Paso>
                <Paso numero={3} titulo="Formato del payload JSON">
                  <pre className="bg-surface-container rounded-xl px-4 py-3 text-xs text-on-surface-variant overflow-x-auto">
{`{
  "latitud":  10.1875,   // requerido
  "longitud": -68.5234,  // requerido
  "precision": 3.5,      // opcional (metros)
  "velocidad": 0.8       // opcional (km/h)
}`}
                  </pre>
                </Paso>
                <Paso numero={4} titulo="Verificar conectividad">
                  <p className="text-sm text-on-surface-variant">
                    Una vez el tracker empiece a enviar datos, el indicador cambiará a
                    <Badge variante="verde" tamano="xs" punto className="mx-1">En línea</Badge>
                    en el panel de dispositivos.
                  </p>
                </Paso>
                <div className="flex items-start gap-2 text-xs text-on-surface-variant bg-surface-container/60 rounded-xl p-3">
                  <Icono nombre="info" clase="text-[14px] text-primary flex-shrink-0 mt-0.5" />
                  <p>
                    Dispositivos probados: <strong className="text-on-surface">SIM7600, ESP32-GPS, Quectel EC21</strong> y
                    cualquier tracker con soporte HTTP/HTTPS.
                  </p>
                </div>
              </div>

              <div className="flex justify-end px-6 py-4 border-t border-outline-variant/20 bg-surface-container-low">
                <button onClick={() => setModalConfig(false)} className="boton boton-primario">Entendido</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Sub-componentes ───────────────────────────────────────────────────────────
function InfoBloque({ titulo, valor, mono }: { titulo: string; valor: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] text-outline uppercase tracking-wide mb-0.5">{titulo}</p>
      <p className={`text-xs text-on-surface break-all ${mono ? 'font-mono' : ''}`}>{valor}</p>
    </div>
  );
}

function Paso({ numero, titulo, children }: { numero: number; titulo: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-on-primary text-xs font-bold">{numero}</span>
      </div>
      <div>
        <p className="text-sm font-semibold text-on-surface mb-1">{titulo}</p>
        {children}
      </div>
    </div>
  );
}
