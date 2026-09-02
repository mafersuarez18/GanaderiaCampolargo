import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from 'recharts';
import EsqueletoTarjeta from '../../../componentes/ui/EsqueletoTarjeta';

// Barras con el total de animales activos por finca.
interface DatoFinca {
  finca: string;
  total: number;
  activos: number;
}

const COLORES = ['#15803d', '#166534', '#4ade80'];

const etiquetaPersonalizada = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-[var(--color-piedra-100)] rounded-xl shadow-lg p-3 text-xs">
        <p className="font-semibold text-[var(--color-piedra-700)] mb-1">{label}</p>
        <p className="text-[var(--color-verde-600)]">Total: <strong>{payload[0]?.value}</strong></p>
        <p className="text-[var(--color-piedra-500)]">Activos: <strong>{payload[1]?.value}</strong></p>
      </div>
    );
  }
  return null;
};

interface PropiedadesGraficaAnimalesPorFinca {
  datos: DatoFinca[];
  cargando?: boolean;
}

export default function GraficaAnimalesPorFinca({ datos, cargando }: PropiedadesGraficaAnimalesPorFinca) {
  if (cargando) return <EsqueletoTarjeta className="h-48" />;

  const datosFormateados = datos.map((d) => ({
    ...d,
    finca: d.finca.split(' ').slice(0, 2).join(' '), // Acortar nombre
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={datosFormateados} barGap={4} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
        <XAxis
          dataKey="finca"
          tick={{ fontSize: 11, fill: '#78716c' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#78716c' }}
          axisLine={false}
          tickLine={false}
          width={30}
        />
        <Tooltip content={etiquetaPersonalizada} cursor={{ fill: 'rgba(0,0,0,0.04)', radius: 6 }} />
        <Legend
          wrapperStyle={{ fontSize: 11, color: '#78716c', paddingTop: 8 }}
          iconType="circle"
          iconSize={8}
        />
        <Bar dataKey="total" name="Total" radius={[4, 4, 0, 0]} fill="#15803d" maxBarSize={40} />
        <Bar dataKey="activos" name="Activos" radius={[4, 4, 0, 0]} fill="#4ade80" maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}
