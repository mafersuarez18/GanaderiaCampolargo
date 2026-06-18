import clsx from 'clsx';

interface PropiedadesEsqueletoTarjeta {
  className?: string;
}

export default function EsqueletoTarjeta({ className }: PropiedadesEsqueletoTarjeta) {
  return (
    <div className={clsx('tarjeta esqueleto', className)} />
  );
}

export function EsqueletoLinea({ className }: PropiedadesEsqueletoTarjeta) {
  return (
    <div className={clsx('h-4 rounded-lg esqueleto', className)} />
  );
}

export function EsqueletoCirculo({ className }: PropiedadesEsqueletoTarjeta) {
  return (
    <div className={clsx('rounded-full esqueleto', className)} />
  );
}

export function EsqueletoTexto({ lineas = 3 }: { lineas?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lineas }).map((_, i) => (
        <EsqueletoLinea
          key={i}
          className={i === lineas - 1 ? 'w-3/4' : 'w-full'}
        />
      ))}
    </div>
  );
}
