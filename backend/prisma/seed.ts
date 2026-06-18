// =============================================================
// SEED — Datos de prueba del Sistema Campolargo
// Basado en la información real de la Sucesión Joao Campolargo
// Estado Yaracuy, Venezuela
// =============================================================

import { PrismaClient, Sexo, EstadoAnimal, TipoPropositoAnimal, RolUsuario, EstadoSanitario, TipoAlertaRegla, PrioridadAlerta } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando carga de datos de prueba...');

  // ----------------------------------------------------------
  // 1. RAZAS
  // ----------------------------------------------------------
  const razaBrahman = await prisma.raza.upsert({
    where: { nombre: 'Brahman' },
    update: {},
    create: {
      nombre: 'Brahman',
      origen: 'India / Estados Unidos',
      proposito: TipoPropositoAnimal.CARNE,
      descripcion: 'Raza cebuína adaptada al trópico, resistente al calor y parásitos. Principal raza de carne en la empresa.',
    },
  });

  const razaSenepol = await prisma.raza.upsert({
    where: { nombre: 'Senepol' },
    update: {},
    create: {
      nombre: 'Senepol',
      origen: 'Islas Vírgenes de EE.UU.',
      proposito: TipoPropositoAnimal.CARNE_LECHE,
      descripcion: 'Raza sin cuernos, polled. Alta adaptabilidad al calor y buena producción de carne y leche.',
    },
  });

  const razaCasta = await prisma.raza.upsert({
    where: { nombre: 'Casta de Lidia' },
    update: {},
    create: {
      nombre: 'Casta de Lidia',
      origen: 'España',
      proposito: TipoPropositoAnimal.TAUROMAQUIA,
      descripcion: 'Ganado de casta para espectáculos taurinos. Bravura y nobleza características.',
    },
  });

  const razaCebu = await prisma.raza.upsert({
    where: { nombre: 'Cebú' },
    update: {},
    create: {
      nombre: 'Cebú',
      origen: 'India',
      proposito: TipoPropositoAnimal.CARNE,
      descripcion: 'Raza base del cruce ganadero venezolano, excelente adaptación al trópico.',
    },
  });

  console.log('Razas cargadas:', [razaBrahman.nombre, razaSenepol.nombre, razaCasta.nombre, razaCebu.nombre].join(', '));

  // ----------------------------------------------------------
  // 2. FINCAS (Las 3 fincas reales de la empresa)
  // ----------------------------------------------------------
  const fincaParaiso = await prisma.finca.upsert({
    where: { nombre: 'El Paraíso' },
    update: {},
    create: {
      nombre: 'El Paraíso',
      municipio: 'Cocorote',
      estado: 'Yaracuy',
      hectareas: 680,
      descripcion: 'Finca principal. Sede del laboratorio de inseminación artificial. Concentra ganado Brahman y Casta de Lidia.',
      latitudCentro: 10.1875,
      longitudCentro: -68.5234,
    },
  });

  const fincaCampoAlegre = await prisma.finca.upsert({
    where: { nombre: 'Campo Alegre' },
    update: {},
    create: {
      nombre: 'Campo Alegre',
      municipio: 'Sucre',
      estado: 'Yaracuy',
      hectareas: 750,
      descripcion: 'Finca de producción de carne. Mayor concentración de animales Senepol y cruces Brahman x Senepol.',
      latitudCentro: 10.2318,
      longitudCentro: -68.4912,
    },
  });

  const fincaLasPenas = await prisma.finca.upsert({
    where: { nombre: 'Las Peñas' },
    update: {},
    create: {
      nombre: 'Las Peñas',
      municipio: 'Veroes',
      estado: 'Yaracuy',
      hectareas: 570,
      descripcion: 'Finca de recría. Gestión de bovinos jóvenes y novillos en desarrollo.',
      latitudCentro: 10.2756,
      longitudCentro: -68.4461,
    },
  });

  console.log('Fincas cargadas: El Paraíso, Campo Alegre, Las Peñas');

  // ----------------------------------------------------------
  // 3. LOTES
  // ----------------------------------------------------------
  const loteParaisoA = await prisma.lote.upsert({
    where: { nombre_fincaId: { nombre: 'Lote A - Reproductoras', fincaId: fincaParaiso.id } },
    update: {},
    create: { nombre: 'Lote A - Reproductoras', fincaId: fincaParaiso.id, capacidad: 60, descripcion: 'Vacas en ciclo reproductivo activo' },
  });

  const loteParaisoB = await prisma.lote.upsert({
    where: { nombre_fincaId: { nombre: 'Lote B - Casta', fincaId: fincaParaiso.id } },
    update: {},
    create: { nombre: 'Lote B - Casta', fincaId: fincaParaiso.id, capacidad: 40, descripcion: 'Ganado de lidia y espectáculos taurinos' },
  });

  const loteParaisoC = await prisma.lote.upsert({
    where: { nombre_fincaId: { nombre: 'Lote C - Novillos', fincaId: fincaParaiso.id } },
    update: {},
    create: { nombre: 'Lote C - Novillos', fincaId: fincaParaiso.id, capacidad: 90, descripcion: 'Novillos en engorde' },
  });

  const loteCampoAlegreA = await prisma.lote.upsert({
    where: { nombre_fincaId: { nombre: 'Lote A - Vacas Paridas', fincaId: fincaCampoAlegre.id } },
    update: {},
    create: { nombre: 'Lote A - Vacas Paridas', fincaId: fincaCampoAlegre.id, capacidad: 70, descripcion: 'Vacas con cría al pie' },
  });

  const loteCampoAlegreB = await prisma.lote.upsert({
    where: { nombre_fincaId: { nombre: 'Lote B - Engorde', fincaId: fincaCampoAlegre.id } },
    update: {},
    create: { nombre: 'Lote B - Engorde', fincaId: fincaCampoAlegre.id, capacidad: 140, descripcion: 'Novillos y mautas en finalización' },
  });

  const loteLasPenasA = await prisma.lote.upsert({
    where: { nombre_fincaId: { nombre: 'Lote A - Recría', fincaId: fincaLasPenas.id } },
    update: {},
    create: { nombre: 'Lote A - Recría', fincaId: fincaLasPenas.id, capacidad: 80, descripcion: 'Becerros y mautas en recría' },
  });

  const loteLasPenasB = await prisma.lote.upsert({
    where: { nombre_fincaId: { nombre: 'Lote B - Hembras Vientre', fincaId: fincaLasPenas.id } },
    update: {},
    create: { nombre: 'Lote B - Hembras Vientre', fincaId: fincaLasPenas.id, capacidad: 70, descripcion: 'Novillas para incorporar a reproducción' },
  });

  console.log('Lotes creados');

  // ----------------------------------------------------------
  // 4. USUARIOS DEL SISTEMA
  // ----------------------------------------------------------
  const hashContrasena = await bcrypt.hash('Campolargo2026!', 12);

  const administrador = await prisma.usuario.upsert({
    where: { correo: 'admin@campolargo.com' },
    update: {},
    create: {
      nombre: 'Carmen Rosa',
      apellido: 'Campolargo',
      correo: 'admin@campolargo.com',
      contrasena: hashContrasena,
      rol: RolUsuario.ADMINISTRADOR,
      telefono: '04121556740',
      cargo: 'CEO - Administradora General',
    },
  });

  const veterinario = await prisma.usuario.upsert({
    where: { correo: 'veterinario@campolargo.com' },
    update: {},
    create: {
      nombre: 'Dr. Alejandro',
      apellido: 'Rodríguez',
      correo: 'veterinario@campolargo.com',
      contrasena: hashContrasena,
      rol: RolUsuario.VETERINARIO,
      cargo: 'Médico Veterinario Principal',
      creadoPorId: administrador.id,
    },
  });

  const tecnico = await prisma.usuario.upsert({
    where: { correo: 'tecnico@campolargo.com' },
    update: {},
    create: {
      nombre: 'José',
      apellido: 'Pereira',
      correo: 'tecnico@campolargo.com',
      contrasena: hashContrasena,
      rol: RolUsuario.TECNICO,
      cargo: 'Técnico de Campo - El Paraíso',
      creadoPorId: administrador.id,
    },
  });

  console.log('Usuarios creados: admin, veterinario, técnico');

  // ----------------------------------------------------------
  // 5. MEDICAMENTOS BASE
  // ----------------------------------------------------------
  const ivermectina = await prisma.medicamento.upsert({
    where: { id: 'med-ivermectina' },
    update: {},
    create: {
      id: 'med-ivermectina',
      nombre: 'Ivermectina 1%',
      principioActivo: 'Ivermectina',
      laboratorio: 'Virbac',
      presentacion: 'Inyectable',
      concentracion: '10 mg/ml',
      unidadMedida: 'ml',
    },
  });

  const closantel = await prisma.medicamento.upsert({
    where: { id: 'med-closantel' },
    update: {},
    create: {
      id: 'med-closantel',
      nombre: 'Closantel 10%',
      principioActivo: 'Closantel',
      laboratorio: 'Intervet',
      presentacion: 'Oral',
      concentracion: '100 mg/ml',
      unidadMedida: 'ml',
    },
  });

  const oxitetraciclina = await prisma.medicamento.upsert({
    where: { id: 'med-oxitetracilina' },
    update: {},
    create: {
      id: 'med-oxitetracilina',
      nombre: 'Oxitetraciclina LA 200',
      principioActivo: 'Oxitetraciclina',
      laboratorio: 'Pfizer',
      presentacion: 'Inyectable',
      concentracion: '200 mg/ml',
      unidadMedida: 'ml',
      descripcion: 'Antibiótico de amplio espectro de larga acción',
    },
  });

  const vacunaFiebreMortal = await prisma.medicamento.upsert({
    where: { id: 'med-fiebre-aftosa' },
    update: {},
    create: {
      id: 'med-fiebre-aftosa',
      nombre: 'Vacuna Fiebre Aftosa bivalente',
      principioActivo: 'Virus inactivado tipos O y A',
      presentacion: 'Inyectable',
      unidadMedida: 'dosis',
    },
  });

  const vacunaBrucelosis = await prisma.medicamento.upsert({
    where: { id: 'med-brucelosis' },
    update: {},
    create: {
      id: 'med-brucelosis',
      nombre: 'Vacuna Brucelosis RB51',
      principioActivo: 'Brucella abortus cepa RB51',
      presentacion: 'Inyectable',
      unidadMedida: 'dosis',
    },
  });

  console.log('Medicamentos cargados');

  // ----------------------------------------------------------
  // 6. CALENDARIOS DE VACUNACIÓN
  // ----------------------------------------------------------
  await prisma.calendarioVacunacion.upsert({
    where: { id: 'cal-fiebre-aftosa' },
    update: {},
    create: {
      id: 'cal-fiebre-aftosa',
      nombreVacuna: 'Fiebre Aftosa',
      descripcion: 'Vacunación obligatoria bianual según plan INSAI Venezuela',
      fabricante: 'Biogenética',
      intervaloDias: 180,
      medicamentoId: vacunaFiebreMortal.id,
    },
  });

  await prisma.calendarioVacunacion.upsert({
    where: { id: 'cal-brucelosis' },
    update: {},
    create: {
      id: 'cal-brucelosis',
      nombreVacuna: 'Brucelosis RB51',
      descripcion: 'Vacunación de hembras entre 3 y 8 meses de edad',
      intervaloDias: 365,
      aplicaASexo: Sexo.HEMBRA,
      edadMinimasDias: 90,
      medicamentoId: vacunaBrucelosis.id,
    },
  });

  await prisma.calendarioVacunacion.upsert({
    where: { id: 'cal-desparasitacion' },
    update: {},
    create: {
      id: 'cal-desparasitacion',
      nombreVacuna: 'Desparasitación (Ivermectina)',
      descripcion: 'Control de parásitos externos e internos cada 3 meses',
      intervaloDias: 90,
      medicamentoId: ivermectina.id,
    },
  });

  console.log('Calendarios de vacunación creados');

  // ----------------------------------------------------------
  // 7. SEMENTALES DEL LABORATORIO
  // ----------------------------------------------------------
  const sementalNegro = await prisma.semental.upsert({
    where: { registro: 'SEM-001-BRAH' },
    update: {},
    create: {
      nombre: 'Campolargo Negro',
      registro: 'SEM-001-BRAH',
      origen: 'Venezuela',
      razaId: razaBrahman.id,
      observaciones: 'Semental élite de la finca. Alta progenie comprobada.',
    },
  });

  const sementalMaestro = await prisma.semental.upsert({
    where: { registro: 'SEM-002-SEN' },
    update: {},
    create: {
      nombre: 'Maestro Senepol',
      registro: 'SEM-002-SEN',
      origen: 'Brasil',
      razaId: razaSenepol.id,
      observaciones: 'Importado. Excelentes características de carne y adaptación.',
    },
  });

  // Inventario de semen
  await prisma.inventarioSemen.upsert({
    where: { codigoDosis: 'DOS-NEGRO-001' },
    update: {},
    create: {
      codigoDosis: 'DOS-NEGRO-001',
      sementalId: sementalNegro.id,
      cantidadDosis: 50,
      cantidadUsada: 12,
      motivilidad: 78.5,
      concentracion: 85.0,
      fechaVencimiento: new Date('2027-06-30'),
    },
  });

  await prisma.inventarioSemen.upsert({
    where: { codigoDosis: 'DOS-MAESTRO-001' },
    update: {},
    create: {
      codigoDosis: 'DOS-MAESTRO-001',
      sementalId: sementalMaestro.id,
      cantidadDosis: 35,
      cantidadUsada: 8,
      motivilidad: 82.0,
      concentracion: 91.0,
      fechaVencimiento: new Date('2027-03-15'),
    },
  });

  console.log('Sementales e inventario de semen cargados');

  // ----------------------------------------------------------
  // 8. ANIMALES (muestra representativa de las ~550 reses)
  // ----------------------------------------------------------
  // Se crean 30 animales de ejemplo distribuidos en las 3 fincas.
  // El seed completo de 550 animales está en seed-animales-completo.ts

  const animalesParaiso = [
    { numeroArete: 'ELP-001', nombre: 'La Princesa', sexo: Sexo.HEMBRA, proposito: TipoPropositoAnimal.REPRODUCCION, razaId: razaBrahman.id, fincaId: fincaParaiso.id, loteId: loteParaisoA.id, pesoActual: 420 },
    { numeroArete: 'ELP-002', nombre: 'La Reina', sexo: Sexo.HEMBRA, proposito: TipoPropositoAnimal.REPRODUCCION, razaId: razaBrahman.id, fincaId: fincaParaiso.id, loteId: loteParaisoA.id, pesoActual: 445 },
    { numeroArete: 'ELP-003', nombre: 'Estrella', sexo: Sexo.HEMBRA, proposito: TipoPropositoAnimal.CARNE, razaId: razaSenepol.id, fincaId: fincaParaiso.id, loteId: loteParaisoA.id, pesoActual: 390 },
    { numeroArete: 'ELP-004', nombre: 'Tornado', sexo: Sexo.MACHO, proposito: TipoPropositoAnimal.TAUROMAQUIA, razaId: razaCasta.id, fincaId: fincaParaiso.id, loteId: loteParaisoB.id, pesoActual: 520 },
    { numeroArete: 'ELP-005', nombre: 'Vendaval', sexo: Sexo.MACHO, proposito: TipoPropositoAnimal.TAUROMAQUIA, razaId: razaCasta.id, fincaId: fincaParaiso.id, loteId: loteParaisoB.id, pesoActual: 490 },
    { numeroArete: 'ELP-006', nombre: null, sexo: Sexo.MACHO, proposito: TipoPropositoAnimal.CARNE, razaId: razaBrahman.id, fincaId: fincaParaiso.id, loteId: loteParaisoC.id, pesoActual: 320 },
    { numeroArete: 'ELP-007', nombre: null, sexo: Sexo.MACHO, proposito: TipoPropositoAnimal.CARNE, razaId: razaBrahman.id, fincaId: fincaParaiso.id, loteId: loteParaisoC.id, pesoActual: 310 },
    { numeroArete: 'ELP-008', nombre: 'La Morena', sexo: Sexo.HEMBRA, proposito: TipoPropositoAnimal.REPRODUCCION, razaId: razaBrahman.id, fincaId: fincaParaiso.id, loteId: loteParaisoA.id, pesoActual: 410, estadoSanitario: EstadoSanitario.EN_TRATAMIENTO },
    { numeroArete: 'ELP-009', nombre: 'La Canela', sexo: Sexo.HEMBRA, proposito: TipoPropositoAnimal.CARNE_LECHE, razaId: razaSenepol.id, fincaId: fincaParaiso.id, loteId: loteParaisoA.id, pesoActual: 380 },
    { numeroArete: 'ELP-010', nombre: 'Rayo', sexo: Sexo.MACHO, proposito: TipoPropositoAnimal.TAUROMAQUIA, razaId: razaCasta.id, fincaId: fincaParaiso.id, loteId: loteParaisoB.id, pesoActual: 475 },
  ];

  const animalesCampoAlegre = [
    { numeroArete: 'CAL-001', nombre: 'Bella', sexo: Sexo.HEMBRA, proposito: TipoPropositoAnimal.REPRODUCCION, razaId: razaBrahman.id, fincaId: fincaCampoAlegre.id, loteId: loteCampoAlegreA.id, pesoActual: 430 },
    { numeroArete: 'CAL-002', nombre: 'Paloma', sexo: Sexo.HEMBRA, proposito: TipoPropositoAnimal.REPRODUCCION, razaId: razaSenepol.id, fincaId: fincaCampoAlegre.id, loteId: loteCampoAlegreA.id, pesoActual: 405 },
    { numeroArete: 'CAL-003', nombre: null, sexo: Sexo.MACHO, proposito: TipoPropositoAnimal.CARNE, razaId: razaBrahman.id, fincaId: fincaCampoAlegre.id, loteId: loteCampoAlegreB.id, pesoActual: 380 },
    { numeroArete: 'CAL-004', nombre: null, sexo: Sexo.MACHO, proposito: TipoPropositoAnimal.CARNE, razaId: razaSenepol.id, fincaId: fincaCampoAlegre.id, loteId: loteCampoAlegreB.id, pesoActual: 395 },
    { numeroArete: 'CAL-005', nombre: 'La Gorda', sexo: Sexo.HEMBRA, proposito: TipoPropositoAnimal.CARNE, razaId: razaBrahman.id, fincaId: fincaCampoAlegre.id, loteId: loteCampoAlegreA.id, pesoActual: 460 },
    { numeroArete: 'CAL-006', nombre: null, sexo: Sexo.MACHO, proposito: TipoPropositoAnimal.CARNE, razaId: razaCebu.id, fincaId: fincaCampoAlegre.id, loteId: loteCampoAlegreB.id, pesoActual: 345 },
    { numeroArete: 'CAL-007', nombre: 'Consentida', sexo: Sexo.HEMBRA, proposito: TipoPropositoAnimal.REPRODUCCION, razaId: razaSenepol.id, fincaId: fincaCampoAlegre.id, loteId: loteCampoAlegreA.id, pesoActual: 415 },
    { numeroArete: 'CAL-008', nombre: null, sexo: Sexo.MACHO, proposito: TipoPropositoAnimal.CARNE, razaId: razaBrahman.id, fincaId: fincaCampoAlegre.id, loteId: loteCampoAlegreB.id, pesoActual: 412 },
    { numeroArete: 'CAL-009', nombre: 'Mimosa', sexo: Sexo.HEMBRA, proposito: TipoPropositoAnimal.CARNE_LECHE, razaId: razaSenepol.id, fincaId: fincaCampoAlegre.id, loteId: loteCampoAlegreA.id, pesoActual: 395 },
    { numeroArete: 'CAL-010', nombre: null, sexo: Sexo.MACHO, proposito: TipoPropositoAnimal.CARNE, razaId: razaBrahman.id, fincaId: fincaCampoAlegre.id, loteId: loteCampoAlegreB.id, pesoActual: 368 },
  ];

  const animalesLasPenas = [
    { numeroArete: 'LPN-001', nombre: null, sexo: Sexo.HEMBRA, proposito: TipoPropositoAnimal.REPRODUCCION, razaId: razaBrahman.id, fincaId: fincaLasPenas.id, loteId: loteLasPenasB.id, pesoActual: 285 },
    { numeroArete: 'LPN-002', nombre: null, sexo: Sexo.HEMBRA, proposito: TipoPropositoAnimal.REPRODUCCION, razaId: razaSenepol.id, fincaId: fincaLasPenas.id, loteId: loteLasPenasB.id, pesoActual: 295 },
    { numeroArete: 'LPN-003', nombre: null, sexo: Sexo.MACHO, proposito: TipoPropositoAnimal.CARNE, razaId: razaBrahman.id, fincaId: fincaLasPenas.id, loteId: loteLasPenasA.id, pesoActual: 220 },
    { numeroArete: 'LPN-004', nombre: null, sexo: Sexo.MACHO, proposito: TipoPropositoAnimal.CARNE, razaId: razaBrahman.id, fincaId: fincaLasPenas.id, loteId: loteLasPenasA.id, pesoActual: 240 },
    { numeroArete: 'LPN-005', nombre: 'Fresita', sexo: Sexo.HEMBRA, proposito: TipoPropositoAnimal.REPRODUCCION, razaId: razaSenepol.id, fincaId: fincaLasPenas.id, loteId: loteLasPenasB.id, pesoActual: 270 },
    { numeroArete: 'LPN-006', nombre: null, sexo: Sexo.MACHO, proposito: TipoPropositoAnimal.CARNE, razaId: razaCebu.id, fincaId: fincaLasPenas.id, loteId: loteLasPenasA.id, pesoActual: 195 },
    { numeroArete: 'LPN-007', nombre: null, sexo: Sexo.HEMBRA, proposito: TipoPropositoAnimal.CARNE, razaId: razaBrahman.id, fincaId: fincaLasPenas.id, loteId: loteLasPenasB.id, pesoActual: 260 },
    { numeroArete: 'LPN-008', nombre: null, sexo: Sexo.MACHO, proposito: TipoPropositoAnimal.CARNE, razaId: razaSenepol.id, fincaId: fincaLasPenas.id, loteId: loteLasPenasA.id, pesoActual: 230 },
    { numeroArete: 'LPN-009', nombre: 'Manchita', sexo: Sexo.HEMBRA, proposito: TipoPropositoAnimal.REPRODUCCION, razaId: razaBrahman.id, fincaId: fincaLasPenas.id, loteId: loteLasPenasB.id, pesoActual: 290 },
    { numeroArete: 'LPN-010', nombre: null, sexo: Sexo.MACHO, proposito: TipoPropositoAnimal.CARNE, razaId: razaBrahman.id, fincaId: fincaLasPenas.id, loteId: loteLasPenasA.id, pesoActual: 215 },
  ];

  const todosLosAnimales = [...animalesParaiso, ...animalesCampoAlegre, ...animalesLasPenas];

  for (const datosAnimal of todosLosAnimales) {
    await prisma.animal.upsert({
      where: { numeroArete: datosAnimal.numeroArete },
      update: {},
      create: {
        ...datosAnimal,
        fechaNacimiento: new Date(Date.now() - Math.random() * 5 * 365 * 24 * 60 * 60 * 1000),
        color: ['Pardo', 'Negro', 'Blanco', 'Colorado', 'Bayero', 'Pinto'][Math.floor(Math.random() * 6)],
        estadoSanitario: datosAnimal.estadoSanitario ?? EstadoSanitario.SANO,
      },
    });
  }

  console.log(`${todosLosAnimales.length} animales de muestra cargados`);

  // ----------------------------------------------------------
  // 9. REGLAS DE ALERTA POR DEFECTO
  // ----------------------------------------------------------
  const reglasAlerta = [
    {
      nombre: 'Vacuna próxima a vencer',
      tipoAlerta: TipoAlertaRegla.VACUNA_PROXIMA,
      prioridad: PrioridadAlerta.ALTA,
      umbralValor: 7,
      umbralUnidad: 'dias',
      mensajeAlerta: 'El animal {animal} tiene la vacuna {vacuna} que vence en {dias} días.',
      notificarVeterinario: true,
      notificarAdministrador: true,
    },
    {
      nombre: 'Vacuna vencida',
      tipoAlerta: TipoAlertaRegla.VACUNA_VENCIDA,
      prioridad: PrioridadAlerta.CRITICA,
      umbralValor: 0,
      umbralUnidad: 'dias',
      mensajeAlerta: 'El animal {animal} tiene la vacuna {vacuna} VENCIDA. Requiere atención inmediata.',
      notificarVeterinario: true,
      notificarAdministrador: true,
      notificarTecnico: true,
    },
    {
      nombre: 'Parto próximo (7 días)',
      tipoAlerta: TipoAlertaRegla.PARTO_PROXIMO,
      prioridad: PrioridadAlerta.ALTA,
      umbralValor: 7,
      umbralUnidad: 'dias',
      mensajeAlerta: 'La vaca {animal} tiene parto esperado en {dias} días ({fecha}). Prepare el área de parición.',
      notificarVeterinario: true,
      notificarAdministrador: true,
      notificarTecnico: true,
    },
    {
      nombre: 'Días abiertos excedidos',
      tipoAlerta: TipoAlertaRegla.DIAS_ABIERTOS_EXCEDIDOS,
      prioridad: PrioridadAlerta.MEDIA,
      umbralValor: 90,
      umbralUnidad: 'dias',
      mensajeAlerta: 'La vaca {animal} lleva {dias} días abiertos sin quedar gestante. Evaluación reproductiva recomendada.',
      notificarVeterinario: true,
      notificarAdministrador: false,
    },
    {
      nombre: 'Enfermedad activa sin resolución',
      tipoAlerta: TipoAlertaRegla.ENFERMEDAD_ACTIVA_SIN_RESOLUCION,
      prioridad: PrioridadAlerta.ALTA,
      umbralValor: 14,
      umbralUnidad: 'dias',
      mensajeAlerta: 'El animal {animal} lleva {dias} días con diagnóstico activo de {enfermedad} sin resolución.',
      notificarVeterinario: true,
      notificarAdministrador: true,
    },
    {
      nombre: 'Inventario de semen bajo',
      tipoAlerta: TipoAlertaRegla.INVENTARIO_SEMEN_BAJO,
      prioridad: PrioridadAlerta.MEDIA,
      umbralValor: 10,
      umbralUnidad: 'unidades',
      mensajeAlerta: 'El inventario de semen del semental {semental} tiene solo {cantidad} dosis disponibles.',
      notificarAdministrador: true,
      notificarVeterinario: true,
    },
  ];

  for (const regla of reglasAlerta) {
    await prisma.reglaAlerta.create({
      data: {
        ...regla,
        creadoPorId: administrador.id,
      },
    }).catch(() => {
      // Ignorar si ya existe (por ejecuciones anteriores del seed)
    });
  }

  console.log('Reglas de alerta por defecto creadas');

  // ----------------------------------------------------------
  // 10. REGISTROS DE UBICACIÓN SIMULADOS (datos GPS de prueba)
  // ----------------------------------------------------------
  // Coordenadas centradas en las coordenadas de cada finca en Yaracuy
  const animalesParaGPS = await prisma.animal.findMany({
    where: { fincaId: fincaParaiso.id },
    take: 5,
    select: { id: true, fincaId: true },
  });

  for (const animal of animalesParaGPS) {
    // Simular varios puntos de ubicación histórica
    const puntos = 5;
    for (let i = 0; i < puntos; i++) {
      await prisma.registroUbicacion.create({
        data: {
          animalId: animal.id,
          latitud: 10.1875 + (Math.random() - 0.5) * 0.02,
          longitud: -68.5234 + (Math.random() - 0.5) * 0.02,
          altitud: 450 + Math.random() * 50,
          precision: 5 + Math.random() * 10,
          esDatoSimulado: true,
          fechaRegistro: new Date(Date.now() - i * 6 * 60 * 60 * 1000), // Cada 6 horas
        },
      });
    }
  }

  console.log('Registros de ubicación simulados creados');

  // ----------------------------------------------------------
  // RESUMEN FINAL
  // ----------------------------------------------------------
  const conteoAnimales = await prisma.animal.count();
  const conteoFincas = await prisma.finca.count();
  const conteoUsuarios = await prisma.usuario.count();

  console.log('\n✓ Seed completado exitosamente');
  console.log(`  Fincas: ${conteoFincas}`);
  console.log(`  Animales: ${conteoAnimales}`);
  console.log(`  Usuarios: ${conteoUsuarios}`);
  console.log('\nCredenciales de acceso:');
  console.log('  Administrador: admin@campolargo.com / Campolargo2026!');
  console.log('  Veterinario:   veterinario@campolargo.com / Campolargo2026!');
  console.log('  Técnico:       tecnico@campolargo.com / Campolargo2026!');
}

main()
  .catch((error) => {
    console.error('Error en el seed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
