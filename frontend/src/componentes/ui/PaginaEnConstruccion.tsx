import Icono from './Icono';

interface PropiedadesPaginaEnConstruccion {
  titulo: string;
  descripcion?: string;
  nombreIcono?: string;
}

export default function PaginaEnConstruccion({
  titulo,
  descripcion,
  nombreIcono = 'construction',
}: PropiedadesPaginaEnConstruccion) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-5">
        <Icono nombre={nombreIcono} clase="text-[36px] text-primary" />
      </div>
      <h1 className="text-xl font-bold text-on-surface mb-2">{titulo}</h1>
      {descripcion && (
        <p className="text-sm text-on-surface-variant max-w-sm leading-relaxed">{descripcion}</p>
      )}
      <p className="text-xs text-outline mt-4 px-4 py-2 bg-surface-container rounded-full">
        Este módulo está siendo implementado
      </p>
    </div>
  );
}
