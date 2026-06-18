import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { clienteHttp } from '../../servicios/clienteAxios';
import { useAutenticacion } from '../../hooks/useAutenticacion';
import EsqueletoTarjeta from '../../componentes/ui/EsqueletoTarjeta';
import GraficaAnimalesPorFinca from './componentes/GraficaAnimalesPorFinca';
import GraficaIndicadoresReproductivos from './componentes/GraficaIndicadoresReproductivos';
import ListaAlertasRecientes from './componentes/ListaAlertasRecientes';
import ListaPartosProximos from './componentes/ListaPartosProximos';
import Icono from '../../componentes/ui/Icono';
import { Link } from 'react-router-dom';

interface ResumenDashboard {
  totalAnimales: number;
  animalesPorFinca: Array<{ finca: string; total: number; activos: number }>;
  animalesPorRaza: Array<{ raza: string; total: number }>;
  alertasActivas: number;
  alertasCriticas: number;
  partosProximos30Dias: number;
  vacunasPendientes: number;
  enfermedadesActivas: number;
  indicadoresReproductivos: {
    tasaPreniez: number;
    tasaNatalidad: number;
    tasaMortalidadCrias: number;
    diasAbiertoPromedio: number;
  };
}

async function obtenerResumen(): Promise<ResumenDashboard> {
  const { data } = await clienteHttp.get('/analytics/dashboard');
  return data.datos;
}

const variantesContenedor = {
  oculto: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const variantesElemento = {
  oculto: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export default function PaginaDashboard() {
  const { usuario } = useAutenticacion();
  const { data: resumen, isLoading } = useQuery({
    queryKey: ['dashboard-resumen'],
    queryFn: obtenerResumen,
    refetchInterval: 1000 * 60 * 5,
  });

  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <motion.div
      variants={variantesContenedor}
      initial="oculto"
      animate="visible"
      className="space-y-6"
    >
      {/* Encabezado */}
      <motion.div variants={variantesElemento} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">
            {saludo}, {usuario?.nombre}
          </h1>
          <p className="text-on-surface-variant text-sm mt-0.5">
            Resumen operativo — Sucesión Joao Campolargo
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-full">
          <Icono nombre="calendar_today" clase="text-[14px]" />
          {new Date().toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </motion.div>

      {/* KPIs principales */}
      <motion.div variants={variantesElemento}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <TarjetaKPI
            icono="pets"
            etiqueta="Total Animales"
            valor={resumen?.totalAnimales}
            colorIcono="text-primary"
            fondoIcono="bg-primary/10"
            cargando={isLoading}
          />
          <TarjetaKPI
            icono="warning"
            etiqueta="Alertas Activas"
            valor={resumen?.alertasActivas}
            subvalor={resumen?.alertasCriticas ? `${resumen.alertasCriticas} críticas` : undefined}
            colorIcono="text-error"
            fondoIcono="bg-error-container"
            colorValor={resumen?.alertasCriticas ? 'text-error' : undefined}
            bordeError={!!resumen?.alertasCriticas}
            cargando={isLoading}
          />
          <TarjetaKPI
            icono="pregnant_woman"
            etiqueta="Partos (30 días)"
            valor={resumen?.partosProximos30Dias}
            colorIcono="text-secondary"
            fondoIcono="bg-secondary-container"
            cargando={isLoading}
          />
          <TarjetaKPI
            icono="vaccines"
            etiqueta="Vacunas Pendientes"
            valor={resumen?.vacunasPendientes}
            colorIcono="text-tertiary"
            fondoIcono="bg-tertiary-container/20"
            colorValor={resumen?.vacunasPendientes ? 'text-tertiary' : undefined}
            cargando={isLoading}
          />
          <TarjetaKPI
            icono="medical_services"
            etiqueta="Enfermedades"
            valor={resumen?.enfermedadesActivas}
            colorIcono="text-error"
            fondoIcono="bg-error-container"
            cargando={isLoading}
          />
        </div>
      </motion.div>

      {/* Indicadores reproductivos */}
      <motion.div variants={variantesElemento}>
        <p className="text-xs font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">
          Indicadores Reproductivos
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { et: 'Tasa de Preñez',    val: resumen?.indicadoresReproductivos.tasaPreniez,        uni: '%',    ico: 'trending_up',   pos: true  },
            { et: 'Tasa de Natalidad', val: resumen?.indicadoresReproductivos.tasaNatalidad,       uni: '%',    ico: 'trending_up',   pos: true  },
            { et: 'Mortalidad Crías',  val: resumen?.indicadoresReproductivos.tasaMortalidadCrias, uni: '%',    ico: 'trending_down', pos: false },
            { et: 'Días Abiertos',     val: resumen?.indicadoresReproductivos.diasAbiertoPromedio, uni: ' días',ico: 'schedule',      pos: false },
          ].map((ind) => (
            <div key={ind.et} className="tarjeta-vidrio rounded-2xl p-4">
              {isLoading ? (
                <EsqueletoTarjeta className="h-16" />
              ) : (
                <>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Icono
                      nombre={ind.ico}
                      clase={`text-[16px] ${ind.pos ? 'text-primary' : 'text-error'}`}
                    />
                    <p className="text-xs text-on-surface-variant truncate">{ind.et}</p>
                  </div>
                  <p className="text-xl font-bold text-on-surface">
                    {ind.val?.toFixed(1) ?? '—'}
                    <span className="text-sm font-normal text-on-surface-variant">{ind.uni}</span>
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Gráficas */}
      <motion.div variants={variantesElemento}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="tarjeta-vidrio rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-on-surface">Animales por Finca</h3>
              <Link to="/fincas" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                Ver todo <Icono nombre="chevron_right" clase="text-[16px]" />
              </Link>
            </div>
            <GraficaAnimalesPorFinca datos={resumen?.animalesPorFinca ?? []} cargando={isLoading} />
          </div>
          <div className="tarjeta-vidrio rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-on-surface">Indicadores Reproductivos</h3>
              <Link to="/reproduccion" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                Ver todo <Icono nombre="chevron_right" clase="text-[16px]" />
              </Link>
            </div>
            <GraficaIndicadoresReproductivos datos={resumen?.indicadoresReproductivos} cargando={isLoading} />
          </div>
        </div>
      </motion.div>

      {/* Listas recientes */}
      <motion.div variants={variantesElemento}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="tarjeta-vidrio rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-on-surface flex items-center gap-2">
                <Icono nombre="notifications_active" clase="text-[18px] text-error" />
                Alertas Recientes
              </h3>
              <Link to="/alertas" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                Ver todas <Icono nombre="arrow_forward" clase="text-[14px]" />
              </Link>
            </div>
            <ListaAlertasRecientes />
          </div>
          <div className="tarjeta-vidrio rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-on-surface flex items-center gap-2">
                <Icono nombre="pregnant_woman" clase="text-[18px] text-secondary" />
                Partos Próximos
              </h3>
              <Link to="/reproduccion" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                Ver todos <Icono nombre="arrow_forward" clase="text-[14px]" />
              </Link>
            </div>
            <ListaPartosProximos />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Tarjeta KPI ──────────────────────────────────────────────────────────────

interface PropsTarjetaKPI {
  icono: string;
  etiqueta: string;
  valor?: number;
  subvalor?: string;
  colorIcono: string;
  fondoIcono: string;
  colorValor?: string;
  bordeError?: boolean;
  cargando?: boolean;
}

function TarjetaKPI({ icono, etiqueta, valor, subvalor, colorIcono, fondoIcono, colorValor, bordeError, cargando }: PropsTarjetaKPI) {
  if (cargando) return <EsqueletoTarjeta className="h-28" />;

  return (
    <div className={`tarjeta-vidrio rounded-2xl p-4 cursor-default
                     ${bordeError ? 'border-l-4 border-l-error' : ''}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className={`${fondoIcono} p-2.5 rounded-xl flex-shrink-0`}>
          <Icono nombre={icono} relleno clase={`text-[20px] ${colorIcono}`} />
        </div>
      </div>
      <p className={`text-2xl font-bold ${colorValor ?? 'text-on-surface'}`}>
        {valor?.toLocaleString('es-VE') ?? '—'}
      </p>
      <p className="text-xs text-on-surface-variant mt-0.5">{etiqueta}</p>
      {subvalor && <p className="text-xs text-error mt-0.5 font-medium">{subvalor}</p>}
    </div>
  );
}
