import clsx from 'clsx';

// Etiqueta pequeña de estado (verde, rojo, amarillo...), con variantes
// semánticas listas para usar más abajo (BadgeEstadoAnimal, BadgePrioridad,
// BadgeRol) que mapean cada valor del dominio a su color correspondiente.

type VarianteBadge = 'verde' | 'tierra' | 'rojo' | 'amarillo' | 'azul' | 'gris' | 'morado';
type TamanoBadge = 'xs' | 'sm' | 'md';

interface PropiedadesBadge {
  variante?: VarianteBadge;
  tamano?: TamanoBadge;
  children: React.ReactNode;
  className?: string;
  punto?: boolean;
}

const estilosPorVariante: Record<VarianteBadge, string> = {
  verde:  'bg-[var(--color-verde-50)]  text-[var(--color-verde-700)]  ring-[var(--color-verde-200)]',
  tierra: 'bg-[var(--color-tierra-50)] text-[var(--color-tierra-700)] ring-[var(--color-tierra-200)]',
  rojo:   'bg-red-50   text-red-700   ring-red-200',
  amarillo: 'bg-amber-50 text-amber-700 ring-amber-200',
  azul:   'bg-blue-50  text-blue-700  ring-blue-200',
  gris:   'bg-[var(--color-piedra-100)] text-[var(--color-piedra-600)] ring-[var(--color-piedra-200)]',
  morado: 'bg-purple-50 text-purple-700 ring-purple-200',
};

const estilosPuntoPorVariante: Record<VarianteBadge, string> = {
  verde:    'bg-[var(--color-verde-500)]',
  tierra:   'bg-[var(--color-tierra-500)]',
  rojo:     'bg-red-500',
  amarillo: 'bg-amber-500',
  azul:     'bg-blue-500',
  gris:     'bg-[var(--color-piedra-400)]',
  morado:   'bg-purple-500',
};

const estilosPorTamano: Record<TamanoBadge, string> = {
  xs: 'px-1.5 py-0.5 text-[10px]',
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
};

export default function Badge({
  variante = 'gris',
  tamano = 'sm',
  children,
  className,
  punto = false,
}: PropiedadesBadge) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full font-medium ring-1 ring-inset',
        estilosPorVariante[variante],
        estilosPorTamano[tamano],
        className,
      )}
    >
      {punto && (
        <span className={clsx('w-1.5 h-1.5 rounded-full', estilosPuntoPorVariante[variante])} />
      )}
      {children}
    </span>
  );
}

// Variantes semánticas listas para usar
export function BadgeEstadoAnimal({ estado }: { estado: string }) {
  const mapa: Record<string, { variante: VarianteBadge; etiqueta: string }> = {
    ACTIVO:       { variante: 'verde',    etiqueta: 'Activo' },
    VENDIDO:      { variante: 'azul',     etiqueta: 'Vendido' },
    MUERTO:       { variante: 'gris',     etiqueta: 'Muerto' },
    ROBADO:       { variante: 'rojo',     etiqueta: 'Robado' },
    TRANSFERIDO:  { variante: 'amarillo', etiqueta: 'Transferido' },
  };
  const cfg = mapa[estado] ?? { variante: 'gris', etiqueta: estado };
  return <Badge variante={cfg.variante} punto>{cfg.etiqueta}</Badge>;
}

export function BadgePrioridad({ prioridad }: { prioridad: string }) {
  const mapa: Record<string, { variante: VarianteBadge; etiqueta: string }> = {
    BAJA:   { variante: 'verde',    etiqueta: 'Baja' },
    MEDIA:  { variante: 'amarillo', etiqueta: 'Media' },
    ALTA:   { variante: 'tierra',   etiqueta: 'Alta' },
    CRITICA:{ variante: 'rojo',     etiqueta: 'Crítica' },
  };
  const cfg = mapa[prioridad] ?? { variante: 'gris', etiqueta: prioridad };
  return <Badge variante={cfg.variante}>{cfg.etiqueta}</Badge>;
}

export function BadgeRol({ rol }: { rol: string }) {
  const mapa: Record<string, { variante: VarianteBadge; etiqueta: string }> = {
    ADMINISTRADOR: { variante: 'morado', etiqueta: 'Administrador' },
    VETERINARIO:   { variante: 'azul',   etiqueta: 'Veterinario' },
    TECNICO:       { variante: 'verde',  etiqueta: 'Técnico' },
  };
  const cfg = mapa[rol] ?? { variante: 'gris', etiqueta: rol };
  return <Badge variante={cfg.variante}>{cfg.etiqueta}</Badge>;
}
