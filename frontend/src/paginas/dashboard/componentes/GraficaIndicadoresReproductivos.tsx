import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts';
import EsqueletoTarjeta from '../../../componentes/ui/EsqueletoTarjeta';

interface IndicadoresReproductivos {
  tasaPreniez: number;
  tasaNatalidad: number;
  tasaMortalidadCrias: number;
  diasAbiertoPromedio: number;
}

interface PropiedadesGraficaIndicadores {
  datos?: IndicadoresReproductivos;
  cargando?: boolean;
}

// Normalizar días abiertos a porcentaje (≤90 días = 100%, ≥365 = 0%)
function normalizarDiasAbiertos(dias: number): number {
  return Math.max(0, Math.min(100, ((365 - dias) / (365 - 90)) * 100));
}

// Invertir mortalidad para que alto sea malo visualmente
function normalizarMortalidad(tasa: number): number {
  return Math.max(0, 100 - tasa * 10); // >10% mortalidad = 0
}

const etiquetaPersonalizada = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-[var(--color-piedra-100)] rounded-xl shadow-lg p-3 text-xs">
        <p className="font-semibold text-[var(--color-piedra-700)]">{payload[0]?.payload?.indicador}</p>
        <p className="text-[var(--color-verde-600)]">{payload[0]?.payload?.valorReal}</p>
      </div>
    );
  }
  return null;
};

export default function GraficaIndicadoresReproductivos({ datos, cargando }: PropiedadesGraficaIndicadores) {
  if (cargando) return <EsqueletoTarjeta className="h-48" />;
  if (!datos) return null;

  const datosRadar = [
    {
      indicador: 'Preñez',
      valor: datos.tasaPreniez,
      valorReal: `${datos.tasaPreniez.toFixed(1)}%`,
    },
    {
      indicador: 'Natalidad',
      valor: datos.tasaNatalidad,
      valorReal: `${datos.tasaNatalidad.toFixed(1)}%`,
    },
    {
      indicador: 'Días abiertos',
      valor: normalizarDiasAbiertos(datos.diasAbiertoPromedio),
      valorReal: `${datos.diasAbiertoPromedio.toFixed(0)} días`,
    },
    {
      indicador: 'Mortalidad crías',
      valor: normalizarMortalidad(datos.tasaMortalidadCrias),
      valorReal: `${datos.tasaMortalidadCrias.toFixed(1)}%`,
    },
  ];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <RadarChart data={datosRadar} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
        <PolarGrid stroke="rgba(0,0,0,0.08)" />
        <PolarAngleAxis
          dataKey="indicador"
          tick={{ fontSize: 11, fill: '#78716c' }}
        />
        <Tooltip content={etiquetaPersonalizada} />
        <Radar
          dataKey="valor"
          stroke="#15803d"
          fill="#15803d"
          fillOpacity={0.15}
          strokeWidth={2}
          dot={{ fill: '#15803d', r: 3 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
