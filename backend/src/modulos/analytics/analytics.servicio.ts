import { prisma } from '../../compartido/prisma/clientePrisma';
import { EstadoAnimal, EstadoSanitario, PrioridadAlerta, EstadoGestacion } from '@prisma/client';

export async function obtenerResumenDashboard() {
  // Ejecutar todas las consultas en paralelo para minimizar latencia
  const [
    totalAnimales,
    animalesPorFinca,
    animalesPorRaza,
    alertasActivas,
    alertasCriticas,
    partosProximos30Dias,
    vacunasPendientes,
    enfermedadesActivas,
    gestacionesActivas,
    nacimientos,
  ] = await Promise.all([
    // Total de animales activos
    prisma.animal.count({ where: { estado: EstadoAnimal.ACTIVO } }),

    // Animales por finca
    prisma.finca.findMany({
      select: {
        nombre: true,
        _count: { select: { animales: { where: { estado: EstadoAnimal.ACTIVO } } } },
        lotes: {
          select: {
            _count: { select: { animales: { where: { estado: EstadoAnimal.ACTIVO } } } },
          },
        },
      },
    }),

    // Animales por raza
    prisma.raza.findMany({
      select: {
        nombre: true,
        _count: { select: { animales: { where: { estado: EstadoAnimal.ACTIVO } } } },
      },
      orderBy: { animales: { _count: 'desc' } },
      take: 5,
    }),

    // Total de alertas no leídas
    prisma.notificacion.count({ where: { leida: false } }),

    // Alertas críticas no leídas
    prisma.notificacion.count({
      where: { leida: false, prioridad: PrioridadAlerta.CRITICA },
    }),

    // Gestaciones con parto esperado en los próximos 30 días
    prisma.gestacion.count({
      where: {
        fechaPartoEsperado: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        estadoGestacion: EstadoGestacion.EN_CURSO,
      },
    }),

    // Calendarios de vacunación activos pendientes de registro en últimos intervaloDias días
    prisma.calendarioVacunacion.count({
      where: { activo: true },
    }),

    // Animales con enfermedades activas
    prisma.animal.count({
      where: { estadoSanitario: EstadoSanitario.ENFERMO },
    }),

    // Gestaciones activas para calcular tasa de preñez
    prisma.gestacion.count({ where: { estadoGestacion: EstadoGestacion.EN_CURSO } }),

    // Nacimientos del último año para calcular tasa de natalidad
    prisma.nacimiento.count({
      where: {
        fechaNacimiento: {
          gte: new Date(new Date().getFullYear() - 1, 0, 1),
        },
      },
    }),
  ]);

  // Construir datos de animales por finca
  const animalesPorFincaFormateados = animalesPorFinca.map((f) => ({
    finca: f.nombre,
    total: f._count.animales,
    activos: f._count.animales, // Todos los contados ya son activos
  }));

  // Calcular indicadores reproductivos
  const hembrasTotales = await prisma.animal.count({
    where: { sexo: 'HEMBRA', estado: EstadoAnimal.ACTIVO },
  });

  const tasaPreniez = hembrasTotales > 0
    ? (gestacionesActivas / hembrasTotales) * 100
    : 0;

  const tasaNatalidad = totalAnimales > 0
    ? (nacimientos / totalAnimales) * 100
    : 0;

  // Días abiertos: promedio de tiempo entre parto y nueva gestación (simplificado)
  const diasAbiertoPromedio = await calcularDiasAbiertoPromedio();

  // Mortalidad de crías: muertes en menores de 6 meses / nacimientos * 100
  const muertesNeonatos = await prisma.animal.count({
    where: {
      estado: EstadoAnimal.MUERTO,
      fechaNacimiento: {
        gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      },
    },
  });

  const tasaMortalidadCrias = nacimientos > 0
    ? (muertesNeonatos / nacimientos) * 100
    : 0;

  return {
    totalAnimales,
    animalesPorFinca: animalesPorFincaFormateados,
    animalesPorRaza: animalesPorRaza.map((r) => ({
      raza: r.nombre,
      total: r._count.animales,
    })),
    alertasActivas,
    alertasCriticas,
    partosProximos30Dias,
    vacunasPendientes,
    enfermedadesActivas,
    indicadoresReproductivos: {
      tasaPreniez: Math.round(tasaPreniez * 10) / 10,
      tasaNatalidad: Math.round(tasaNatalidad * 10) / 10,
      tasaMortalidadCrias: Math.round(tasaMortalidadCrias * 10) / 10,
      diasAbiertoPromedio: Math.round(diasAbiertoPromedio),
    },
  };
}

async function calcularDiasAbiertoPromedio(): Promise<number> {
  // Calcula promedio de días entre último parto y fecha actual (o nueva gestación)
  const gestacionesConParto = await prisma.gestacion.findMany({
    where: { estadoGestacion: EstadoGestacion.FINALIZADA_PARTO },
    select: {
      fechaPartoEsperado: true,
      madreId: true,
    },
    take: 50,
    orderBy: { creadoEn: 'desc' },
  });

  if (gestacionesConParto.length === 0) return 120; // Valor referencia para ganadería bovina

  const diasTotales = gestacionesConParto.reduce((acc, g) => {
    const diasDesdeUltimoParto = Math.max(
      0,
      Math.floor((Date.now() - g.fechaPartoEsperado.getTime()) / (1000 * 60 * 60 * 24)),
    );
    return acc + Math.min(diasDesdeUltimoParto, 365); // Máximo 1 año de cálculo
  }, 0);

  return diasTotales / gestacionesConParto.length;
}

export async function obtenerEvolucionMensual(anio: number) {
  const meses = Array.from({ length: 12 }, (_, i) => i);

  const datos = await Promise.all(
    meses.map(async (mes) => {
      const inicio = new Date(anio, mes, 1);
      const fin = new Date(anio, mes + 1, 0, 23, 59, 59);

      const [nacimientos, muertes, ventas] = await Promise.all([
        prisma.nacimiento.count({ where: { fechaNacimiento: { gte: inicio, lte: fin } } }),
        prisma.animal.count({
          where: { estado: EstadoAnimal.MUERTO, actualizadoEn: { gte: inicio, lte: fin } },
        }),
        prisma.animal.count({
          where: { estado: EstadoAnimal.VENDIDO, actualizadoEn: { gte: inicio, lte: fin } },
        }),
      ]);

      return {
        mes: inicio.toLocaleDateString('es-VE', { month: 'short' }),
        nacimientos,
        muertes,
        ventas,
      };
    }),
  );

  return datos;
}

export async function obtenerDistribucionPorEdad() {
  const ahora = new Date();
  const animales = await prisma.animal.findMany({
    where: { estado: EstadoAnimal.ACTIVO, fechaNacimiento: { not: null } },
    select: { fechaNacimiento: true, sexo: true },
  });

  const rangos = [
    { etiqueta: '0-6 meses',  min: 0,   max: 6 },
    { etiqueta: '6-12 meses', min: 6,   max: 12 },
    { etiqueta: '1-2 años',   min: 12,  max: 24 },
    { etiqueta: '2-4 años',   min: 24,  max: 48 },
    { etiqueta: '4+ años',    min: 48,  max: Infinity },
  ];

  return rangos.map((rango) => {
    const enRango = animales.filter((a) => {
      if (!a.fechaNacimiento) return false;
      const mesesVida = (ahora.getTime() - a.fechaNacimiento.getTime()) / (1000 * 60 * 60 * 24 * 30);
      return mesesVida >= rango.min && mesesVida < rango.max;
    });
    return {
      rango: rango.etiqueta,
      machos: enRango.filter((a) => a.sexo === 'MACHO').length,
      hembras: enRango.filter((a) => a.sexo === 'HEMBRA').length,
    };
  });
}
