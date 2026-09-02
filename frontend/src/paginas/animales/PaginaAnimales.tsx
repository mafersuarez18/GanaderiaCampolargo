import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { clienteHttp } from '../../servicios/clienteAxios';
import { useAutenticacion } from '../../hooks/useAutenticacion';
import Tabla, { ColumnaTabla } from '../../componentes/ui/Tabla';
import Paginacion from '../../componentes/ui/Paginacion';
import Badge, { BadgeEstadoAnimal } from '../../componentes/ui/Badge';
import useDebounce from '../../hooks/useDebounce';
import Icono from '../../componentes/ui/Icono';

// Listado principal de animales, con búsqueda (debounced), filtros y
// paginación server-side.
interface Animal {
  id: string;
  numeroArete: string;
  nombre?: string;
  sexo: 'MACHO' | 'HEMBRA';
  estado: string;
  estadoSanitario: string;
  fechaNacimiento?: string;
  pesoActual?: number;
  raza?: { id: string; nombre: string };
  lote?: { id: string; nombre: string; finca?: { id: string; nombre: string } };
}

interface RespuestaAnimales {
  datos: Animal[];
  meta: { total: number; pagina: number; porPagina: number; totalPaginas: number };
}

interface Finca { id: string; nombre: string; }
interface Raza  { id: string; nombre: string; }

const COLUMNAS: ColumnaTabla<Animal>[] = [
  {
    clave: 'numeroArete',
    encabezado: 'Arete',
    ordenable: true,
    render: (a) => (
      <span className="font-mono font-semibold text-on-surface text-xs bg-surface-container px-2 py-0.5 rounded">
        #{a.numeroArete}
      </span>
    ),
  },
  {
    clave: 'nombre',
    encabezado: 'Nombre',
    render: (a) => (
      <span className="text-on-surface-variant text-sm">
        {a.nombre ?? <em className="text-outline">Sin nombre</em>}
      </span>
    ),
  },
  {
    clave: 'sexo',
    encabezado: 'Sexo',
    render: (a) => (
      <Badge variante={a.sexo === 'MACHO' ? 'azul' : 'morado'} tamano="xs">
        {a.sexo === 'MACHO' ? 'Macho' : 'Hembra'}
      </Badge>
    ),
  },
  {
    clave: 'raza',
    encabezado: 'Raza',
    render: (a) => <span className="text-on-surface-variant text-xs">{a.raza?.nombre ?? '—'}</span>,
  },
  {
    clave: 'finca',
    encabezado: 'Finca',
    render: (a) => (
      <span className="text-on-surface-variant text-xs">{a.lote?.finca?.nombre ?? '—'}</span>
    ),
  },
  {
    clave: 'lote',
    encabezado: 'Lote',
    render: (a) => (
      <span className="text-on-surface-variant text-xs">{a.lote?.nombre ?? '—'}</span>
    ),
  },
  {
    clave: 'fechaNacimiento',
    encabezado: 'Nacimiento',
    render: (a) => a.fechaNacimiento
      ? <span className="text-xs text-on-surface-variant">{new Date(a.fechaNacimiento).toLocaleDateString('es-VE')}</span>
      : <span className="text-xs text-outline">—</span>,
  },
  {
    clave: 'estado',
    encabezado: 'Estado',
    render: (a) => <BadgeEstadoAnimal estado={a.estado} />,
  },
  {
    clave: 'estadoSanitario',
    encabezado: 'Sanitario',
    render: (a) => {
      const mapa: Record<string, { var_: 'verde' | 'rojo' | 'amarillo' | 'gris'; et: string }> = {
        SANO:          { var_: 'verde',    et: 'Sano' },
        ENFERMO:       { var_: 'rojo',     et: 'Enfermo' },
        EN_CUARENTENA: { var_: 'amarillo', et: 'Cuarentena' },
        FALLECIDO:     { var_: 'gris',     et: 'Fallecido' },
      };
      const cfg = mapa[a.estadoSanitario] ?? { var_: 'gris', et: a.estadoSanitario };
      return <Badge variante={cfg.var_} tamano="xs" punto>{cfg.et}</Badge>;
    },
  },
];

async function obtenerAnimales(params: Record<string, string>): Promise<RespuestaAnimales> {
  const qs = new URLSearchParams(params).toString();
  const { data } = await clienteHttp.get(`/animales?${qs}`);
  return data;
}

async function obtenerFincas(): Promise<Finca[]> {
  const { data } = await clienteHttp.get('/fincas?porPagina=100');
  return data.datos ?? [];
}

async function obtenerRazas(): Promise<Raza[]> {
  const { data } = await clienteHttp.get('/animales/razas');
  return data.datos ?? [];
}

export default function PaginaAnimales() {
  const navegar = useNavigate();
  const { esAdministrador, esVeterinario } = useAutenticacion();
  const puedeCrear = esAdministrador || esVeterinario;

  const [pagina, setPagina]             = useState(1);
  const [busqueda, setBusqueda]         = useState('');
  const [filtroFinca, setFiltroFinca]   = useState('');
  const [filtroRaza, setFiltroRaza]     = useState('');
  const [filtroSexo, setFiltroSexo]     = useState('');
  const [filtroEstado, setFiltroEstado] = useState('ACTIVO');
  const [panelFiltros, setPanelFiltros] = useState(false);

  const busquedaDebounced = useDebounce(busqueda, 350);

  const parametros = {
    pagina: String(pagina),
    porPagina: '25',
    ...(busquedaDebounced && { busqueda: busquedaDebounced }),
    ...(filtroFinca  && { fincaId: filtroFinca }),
    ...(filtroRaza   && { razaId:  filtroRaza }),
    ...(filtroSexo   && { sexo:    filtroSexo }),
    ...(filtroEstado && { estado:  filtroEstado }),
  };

  const { data, isLoading } = useQuery({
    queryKey: ['animales', parametros],
    queryFn: () => obtenerAnimales(parametros),
    placeholderData: (prev) => prev,
  });

  const { data: fincas = [] } = useQuery({ queryKey: ['fincas-select'], queryFn: obtenerFincas });
  const { data: razas  = [] } = useQuery({ queryKey: ['razas-select'],  queryFn: obtenerRazas });

  const limpiarFiltros = useCallback(() => {
    setBusqueda(''); setFiltroFinca(''); setFiltroRaza('');
    setFiltroSexo(''); setFiltroEstado('ACTIVO'); setPagina(1);
  }, []);

  const hayFiltrosActivos = busqueda || filtroFinca || filtroRaza || filtroSexo || filtroEstado !== 'ACTIVO';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Icono nombre="pets" relleno clase="text-[22px] text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-on-surface">Animales</h1>
            <p className="text-xs text-on-surface-variant">
              {data?.meta?.total ?? 0} registros en total
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="boton boton-secundario gap-2 text-sm">
            <Icono nombre="download" clase="text-[18px]" />
            Exportar
          </button>
          {puedeCrear && (
            <button
              onClick={() => navegar('/animales/nuevo')}
              className="boton boton-primario gap-2 text-sm"
            >
              <Icono nombre="add" clase="text-[18px]" />
              Nuevo animal
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="tarjeta-vidrio rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Icono nombre="search" clase="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
              placeholder="Buscar por arete, nombre..."
              className="campo-entrada pl-10 py-2 text-sm"
            />
          </div>

          {/* Filtros rápidos de estado */}
          <div className="flex items-center gap-1 p-1 bg-surface-container rounded-xl">
            {['ACTIVO', 'VENDIDO', 'MUERTO', ''].map((est) => (
              <button
                key={est}
                onClick={() => { setFiltroEstado(est); setPagina(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filtroEstado === est
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {est === '' ? 'Todos' : est.charAt(0) + est.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <button
            onClick={() => setPanelFiltros(!panelFiltros)}
            className={`boton boton-secundario gap-2 text-sm ${hayFiltrosActivos ? 'ring-2 ring-primary/40' : ''}`}
          >
            <Icono nombre="filter_list" clase="text-[18px]" />
            Filtros
            {hayFiltrosActivos && <span className="w-2 h-2 rounded-full bg-primary" />}
          </button>
        </div>

        {/* Panel de filtros avanzados */}
        {panelFiltros && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-outline-variant/30 grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">Finca</label>
              <select
                value={filtroFinca}
                onChange={(e) => { setFiltroFinca(e.target.value); setPagina(1); }}
                className="campo-entrada py-1.5 text-xs"
              >
                <option value="">Todas las fincas</option>
                {fincas.map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">Raza</label>
              <select
                value={filtroRaza}
                onChange={(e) => { setFiltroRaza(e.target.value); setPagina(1); }}
                className="campo-entrada py-1.5 text-xs"
              >
                <option value="">Todas las razas</option>
                {razas.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">Sexo</label>
              <select
                value={filtroSexo}
                onChange={(e) => { setFiltroSexo(e.target.value); setPagina(1); }}
                className="campo-entrada py-1.5 text-xs"
              >
                <option value="">Ambos</option>
                <option value="MACHO">Macho</option>
                <option value="HEMBRA">Hembra</option>
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={limpiarFiltros} className="boton boton-secundario text-xs py-1.5 w-full">
                Limpiar filtros
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Tabla */}
      <div className="tarjeta-vidrio rounded-2xl overflow-hidden">
        <Tabla
          columnas={COLUMNAS}
          datos={data?.datos ?? []}
          claveId="id"
          cargando={isLoading}
          filasEsqueleto={10}
          alHacerClicFila={(a) => navegar(`/animales/${a.id}`)}
          vacio={
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center">
                <Icono nombre="pets" clase="text-[32px] text-outline" />
              </div>
              <p className="font-medium text-on-surface-variant">No se encontraron animales</p>
              {hayFiltrosActivos && (
                <button onClick={limpiarFiltros} className="text-xs text-primary hover:underline">
                  Limpiar filtros
                </button>
              )}
            </div>
          }
        />

        {data && data.meta.totalPaginas > 1 && (
          <div className="px-4 py-3 border-t border-outline-variant/20">
            <Paginacion
              paginaActual={data.meta.pagina}
              totalPaginas={data.meta.totalPaginas}
              totalRegistros={data.meta.total}
              porPagina={25}
              alCambiarPagina={setPagina}
            />
          </div>
        )}
      </div>

      {/* FAB para crear en mobile */}
      {puedeCrear && (
        <button
          onClick={() => navegar('/animales/nuevo')}
          className="md:hidden fixed bottom-20 right-5 w-14 h-14 bg-primary text-on-primary rounded-full
                     shadow-[var(--shadow-primary)] flex items-center justify-center
                     hover:scale-110 active:scale-95 transition-transform z-20"
          aria-label="Nuevo animal"
        >
          <Icono nombre="add" clase="text-[28px]" />
        </button>
      )}
    </motion.div>
  );
}
