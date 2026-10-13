import { useQuery } from '@tanstack/react-query';
import { clienteHttp } from '../../../servicios/clienteAxios';
import { EsqueletoLinea } from '../../../componentes/ui/EsqueletoTarjeta';
import Icono from '../../../componentes/ui/Icono';

// Resumen del plan sanitario anual (todas las fincas): qué toca este mes y
// qué quedó atrasado de meses anteriores sin marcarse como hecho.
interface ResumenPlanSanitario {
  pendientesEsteMes: number;
  atrasadas: number;
  detalle: Array<{ finca: string; actividad: string; mes: number }>;
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

async function obtenerResumen(): Promise<ResumenPlanSanitario> {
  const { data } = await clienteHttp.get('/plan-sanitario/resumen');
  return data.datos;
}

export default function ResumenPlanSanitario() {
  const { data, isLoading } = useQuery({
    queryKey: ['plan-sanitario-resumen-dashboard'],
    queryFn: obtenerResumen,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => <EsqueletoLinea key={i} className="h-4" />)}
      </div>
    );
  }

  if (!data || (data.pendientesEsteMes === 0 && data.atrasadas === 0)) {
    return (
      <div className="py-8 text-center">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
          <Icono nombre="task_alt" clase="text-[18px] text-primary" />
        </div>
        <p className="text-sm text-on-surface-variant">Plan sanitario al día</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5 text-on-surface-variant">
          <Icono nombre="pending_actions" clase="text-[14px]" /> {data.pendientesEsteMes} pendientes este mes
        </span>
        {data.atrasadas > 0 && (
          <span className="flex items-center gap-1.5 text-error font-semibold">
            <Icono nombre="warning" clase="text-[14px]" /> {data.atrasadas} atrasadas
          </span>
        )}
      </div>
      <div className="space-y-2">
        {data.detalle.map((item, i) => (
          <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-container-low transition-colors">
            <div className="bg-secondary/10 p-2 rounded-xl flex-shrink-0">
              <Icono nombre="event_available" relleno clase="text-[14px] text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-on-surface truncate">{item.actividad}</p>
              <p className="text-[11px] text-outline">{item.finca} · {MESES[item.mes - 1]}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
