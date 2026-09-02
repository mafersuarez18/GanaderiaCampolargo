// =============================================================
// SEED — Datos de prueba del Sistema Campolargo
// Basado en la información real de la Sucesión Joao Campolargo
// Estado Yaracuy, Venezuela
// =============================================================

import { PrismaClient, Sexo, EstadoAnimal, TipoPropositoAnimal, EstadoSanitario, TipoAlertaRegla, PrioridadAlerta } from '@prisma/client';
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
      tipoCruce: 'Sangre pura',
    },
  });

  const razaSenepol = await prisma.raza.upsert({
    where: { nombre: 'Senepol' },
    update: {},
    create: {
      nombre: 'Senepol',
      origen: 'Islas Vírgenes de EE.UU.',
      tipoCruce: 'Sangre pura',
    },
  });

  const razaCasta = await prisma.raza.upsert({
    where: { nombre: 'Casta de Lidia' },
    update: {},
    create: {
      nombre: 'Casta de Lidia',
      origen: 'España',
      tipoCruce: 'Sangre pura',
    },
  });

  const razaCebu = await prisma.raza.upsert({
    where: { nombre: 'Cebú' },
    update: {},
    create: {
      nombre: 'Cebú',
      origen: 'India',
      tipoCruce: 'Sangre pura',
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
  // Los roles (ADMINISTRADOR / VETERINARIO / TECNICO) y su catálogo de
  // privilegios se crean como datos de referencia en la migración de RBAC
  // (20260825120000_rbac_roles_privilegios), no aquí — este seed solo
  // registra las cuentas de demostración que los usan.
  const [rolAdministrador, rolVeterinario, rolTecnico] = await Promise.all([
    prisma.rol.findUniqueOrThrow({ where: { nombre: 'ADMINISTRADOR' } }),
    prisma.rol.findUniqueOrThrow({ where: { nombre: 'VETERINARIO' } }),
    prisma.rol.findUniqueOrThrow({ where: { nombre: 'TECNICO' } }),
  ]);

  const hashContrasena = await bcrypt.hash('Campolargo2026!', 12);

  const administrador = await prisma.usuario.upsert({
    where: { correo: 'admin@campolargo.com' },
    update: {},
    create: {
      nombre: 'Carmen Rosa',
      apellido: 'Campolargo',
      correo: 'admin@campolargo.com',
      contrasena: hashContrasena,
      rolId: rolAdministrador.id,
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
      rolId: rolVeterinario.id,
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
      rolId: rolTecnico.id,
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

  // ── Desparasitantes ────────────────────────────────────────
  const fenbendazol25 = await prisma.medicamento.upsert({
    where: { id: 'med-fenbendazol-25' },
    update: {},
    create: {
      id: 'med-fenbendazol-25',
      nombre: 'Fenbendazol al 25%',
      principioActivo: 'Fenbendazol',
      presentacion: 'Oral (suspensión)',
      concentracion: '250 mg/ml',
      unidadMedida: 'ml',
      descripcion: 'Antiparasitario oral para gastrointestinales y pulmonares. 1 ml por cada 50 kg PV.',
    },
  });

  const levamisol15 = await prisma.medicamento.upsert({
    where: { id: 'med-levamisol-15' },
    update: {},
    create: {
      id: 'med-levamisol-15',
      nombre: 'Levamisol al 15%',
      principioActivo: 'Levamisol',
      presentacion: 'Inyectable (intramuscular)',
      concentracion: '150 mg/ml',
      unidadMedida: 'ml',
      descripcion: 'Antiparasitario IM para gastrointestinales y pulmonares. 1 ml por cada 30 kg PV.',
    },
  });

  const ivermectina315 = await prisma.medicamento.upsert({
    where: { id: 'med-ivermectina-315' },
    update: {},
    create: {
      id: 'med-ivermectina-315',
      nombre: 'Ivermectina al 3,15%',
      principioActivo: 'Ivermectina',
      presentacion: 'Inyectable (subcutáneo)',
      concentracion: '31,5 mg/ml',
      unidadMedida: 'ml',
      descripcion: 'Control de gastrointestinales, pulmonares y ectoparásitos. 1 ml por cada 50 kg PV. Solo animales secos.',
    },
  });

  const lombifarm = await prisma.medicamento.upsert({
    where: { id: 'med-lombifarm' },
    update: {},
    create: {
      id: 'med-lombifarm',
      nombre: 'Lombifarm (Fenbendazol + Triclabendazol)',
      principioActivo: 'Fenbendazol + Triclabendazol',
      presentacion: 'Oral',
      unidadMedida: 'ml',
      descripcion: 'Para gastrointestinales y hepáticos. 1 ml por cada 10 kg PV. Solo animales secos.',
    },
  });

  const doramectina1 = await prisma.medicamento.upsert({
    where: { id: 'med-doramectina-1' },
    update: {},
    create: {
      id: 'med-doramectina-1',
      nombre: 'Doramectina al 1%',
      principioActivo: 'Doramectina',
      presentacion: 'Inyectable (subcutáneo)',
      concentracion: '10 mg/ml',
      unidadMedida: 'ml',
      descripcion: 'Para pulmonares y ectoparásitos. 1 ml por cada 50 kg PV. Solo animales secos.',
    },
  });

  const tratoril = await prisma.medicamento.upsert({
    where: { id: 'med-tratoril' },
    update: {},
    create: {
      id: 'med-tratoril',
      nombre: 'Tratoril (Toltrazuril al 5%)',
      principioActivo: 'Toltrazuril',
      presentacion: 'Oral',
      concentracion: '50 mg/ml',
      unidadMedida: 'ml',
      descripcion: 'Para coccidiosis intestinal. 3 ml por cada 10 kg PV. Solo animales secos.',
    },
  });

  // ── Vacunas adicionales ────────────────────────────────────
  const vacunaTriple = await prisma.medicamento.upsert({
    where: { id: 'med-triple-carbon' },
    update: {},
    create: {
      id: 'med-triple-carbon',
      nombre: 'Vacuna Triple (Carbón Sintomático + Septicemia + Clostridiosis)',
      principioActivo: 'Clostridium chauvoei, Pasteurella multocida, Clostridium spp.',
      presentacion: 'Inyectable (subcutáneo)',
      unidadMedida: 'dosis',
      descripcion: '2-5 ml subcutánea según marca comercial. Revacunar a los 15 días de la primera dosis.',
    },
  });

  const vacunaCarbonBact = await prisma.medicamento.upsert({
    where: { id: 'med-carbon-bacteridiano' },
    update: {},
    create: {
      id: 'med-carbon-bacteridiano',
      nombre: 'Vacuna Carbón Bacteridiano (Ántrax)',
      principioActivo: 'Bacillus anthracis cepa Sterne',
      presentacion: 'Inyectable (subcutáneo)',
      unidadMedida: 'dosis',
      descripcion: '2 ml subcutánea. Aplicar en áreas de presentación de la enfermedad.',
    },
  });

  const vacunaRabia = await prisma.medicamento.upsert({
    where: { id: 'med-rabia-bovina' },
    update: {},
    create: {
      id: 'med-rabia-bovina',
      nombre: 'Vacuna Rabia Bovina',
      principioActivo: 'Virus rábico inactivado',
      presentacion: 'Inyectable (intramuscular)',
      unidadMedida: 'dosis',
      descripcion: '2 ml intramuscular. Según presentación de la enfermedad en la zona. Anual.',
    },
  });

  const vacunaIBRDVB = await prisma.medicamento.upsert({
    where: { id: 'med-ibr-dvb-lepto' },
    update: {},
    create: {
      id: 'med-ibr-dvb-lepto',
      nombre: 'Vacuna IBR–DVB–Leptospirosis (±PI3, Campylobacter)',
      principioActivo: 'Herpesvirus bovino tipo 1, VDVB, Leptospira spp.',
      presentacion: 'Inyectable (intramuscular)',
      unidadMedida: 'dosis',
      descripcion: '5 ml intramuscular. Con asesoría del médico veterinario, previo diagnóstico de la enfermedad en el predio.',
    },
  });

  const vacunaAnaplasmosis = await prisma.medicamento.upsert({
    where: { id: 'med-anaplasmosis-babesiosis' },
    update: {},
    create: {
      id: 'med-anaplasmosis-babesiosis',
      nombre: 'Vacuna Anaplasmosis y Babesiosis',
      principioActivo: 'Anaplasma marginale, Babesia bovis, Babesia bigemina',
      presentacion: 'Inyectable (intramuscular)',
      unidadMedida: 'dosis',
      descripcion: '2 ml intramuscular (cada vial independiente). Su aplicación requiere asesoría de un médico veterinario.',
    },
  });

  console.log('Medicamentos cargados');

  // ----------------------------------------------------------
  // 6. CALENDARIOS DE VACUNACIÓN Y DESPARASITACIÓN
  // ----------------------------------------------------------

  // ── PLAN DE VACUNACIÓN EN BOVINOS ─────────────────────────

  // Fiebre Aftosa — todas las edades, cada 6 meses, 2 ml subcutánea
  await prisma.calendarioVacunacion.upsert({
    where: { id: 'cal-fiebre-aftosa' },
    update: {},
    create: {
      id: 'cal-fiebre-aftosa',
      nombreVacuna: 'Fiebre Aftosa',
      descripcion: 'Todas las edades. 2 ml vía subcutánea en la paleta o tabla del cuello. Según calendario oficial INSAI.',
      fabricante: 'Biogenética',
      intervaloDias: 180,
      medicamentoId: vacunaFiebreMortal.id,
    },
  });

  // Brucelosis — terneras 3 a 8 meses, dosis única
  await prisma.calendarioVacunacion.upsert({
    where: { id: 'cal-brucelosis' },
    update: {},
    create: {
      id: 'cal-brucelosis',
      nombreVacuna: 'Brucelosis RB51',
      descripcion: 'Terneras entre tres y ocho meses. Dosis única. 2 ml subcutánea. De acuerdo al programa oficial.',
      intervaloDias: 365,
      aplicaASexo: Sexo.HEMBRA,
      edadMinimasDias: 90,
      medicamentoId: vacunaBrucelosis.id,
    },
  });

  // Triple (Carbón Sintomático + Septicemia + Clostridiosis) — desde los 3 meses
  await prisma.calendarioVacunacion.upsert({
    where: { id: 'cal-triple-carbon' },
    update: {},
    create: {
      id: 'cal-triple-carbon',
      nombreVacuna: 'Triple (Carbón Sintomático, Septicemia, Clostridiosis)',
      descripcion: 'Machos y hembras desde los tres meses. Primera dosis + revacunación a los 15 días (OBLIGATORIA para efecto del biológico), luego anual. 2 a 5 ml subcutánea según marca comercial.',
      intervaloDias: 365,
      edadMinimasDias: 90,
      medicamentoId: vacunaTriple.id,
    },
  });

  // Carbón Bacteridiano (Ántrax) — desde los 3 meses, anual
  await prisma.calendarioVacunacion.upsert({
    where: { id: 'cal-carbon-bacteridiano' },
    update: {},
    create: {
      id: 'cal-carbon-bacteridiano',
      nombreVacuna: 'Carbón Bacteridiano (Ántrax)',
      descripcion: 'De tres meses en adelante. Revacunación 21–30 días después de la primera, luego anual. 2 ml subcutánea. Aplicar en áreas de presentación.',
      intervaloDias: 365,
      edadMinimasDias: 90,
      medicamentoId: vacunaCarbonBact.id,
    },
  });

  // Rabia Bovina — desde los 4 meses, anual
  await prisma.calendarioVacunacion.upsert({
    where: { id: 'cal-rabia-bovina' },
    update: {},
    create: {
      id: 'cal-rabia-bovina',
      nombreVacuna: 'Rabia Bovina',
      descripcion: 'De cuatro meses en adelante. Anual. 2 ml vía intramuscular. Según presentación de la enfermedad en la zona.',
      intervaloDias: 365,
      edadMinimasDias: 120,
      medicamentoId: vacunaRabia.id,
    },
  });

  // IBR–DVB–Leptospirosis — reproductores, desde los 3 meses; hembras antes del servicio + posparto
  await prisma.calendarioVacunacion.upsert({
    where: { id: 'cal-ibr-dvb-lepto' },
    update: {},
    create: {
      id: 'cal-ibr-dvb-lepto',
      nombreVacuna: 'IBR – DVB – Leptospirosis (±PI3, Campylobacter)',
      descripcion: 'Hembras y machos reproductores desde los 3 meses. Primera dosis + un mes después + anual. Hembras: al mes + un mes posparto + luego anual. 5 ml intramuscular. Con asesoría veterinaria y diagnóstico previo en el predio.',
      intervaloDias: 365,
      edadMinimasDias: 90,
      medicamentoId: vacunaIBRDVB.id,
    },
  });

  // Anaplasmosis y Babesiosis — 3 y 12 meses de edad, revacunación igual
  await prisma.calendarioVacunacion.upsert({
    where: { id: 'cal-anaplasmosis-babesiosis' },
    update: {},
    create: {
      id: 'cal-anaplasmosis-babesiosis',
      nombreVacuna: 'Anaplasmosis y Babesiosis',
      descripcion: '3 y 12 meses de edad, revacunar a los 3 y 12 meses. 2 ml intramuscular (cada vial independiente). Requiere asesoría de médico veterinario.',
      intervaloDias: 180,
      edadMinimasDias: 90,
      medicamentoId: vacunaAnaplasmosis.id,
    },
  });

  // ── PLAN DE DESPARASITACIÓN ───────────────────────────────

  // Terneros < 6 meses — Fenbendazol 25% (alternado con Levamisol 15%)
  // Primer turno con Fenbendazol, segundo con Levamisol; secuencia cada 30 días
  await prisma.calendarioVacunacion.upsert({
    where: { id: 'cal-desp-terneros-fenbendazol' },
    update: {},
    create: {
      id: 'cal-desp-terneros-fenbendazol',
      nombreVacuna: 'Desparasitación Terneros — Fenbendazol 25%',
      descripcion: 'Terneros hasta seis meses de edad. Gastrointestinales y pulmonares. Aplicar la primera vez y alternar al mes siguiente con Levamisol 15%, luego volver a Fenbendazol; mantener secuencia hasta los 6 meses. 1 ml por cada 50 kg PV vía oral.',
      intervaloDias: 60,
      edadMinimasDias: 0,
      medicamentoId: fenbendazol25.id,
    },
  });

  await prisma.calendarioVacunacion.upsert({
    where: { id: 'cal-desp-terneros-levamisol' },
    update: {},
    create: {
      id: 'cal-desp-terneros-levamisol',
      nombreVacuna: 'Desparasitación Terneros — Levamisol 15%',
      descripcion: 'Terneros hasta seis meses de edad. Gastrointestinales y pulmonares. Aplicar el mes siguiente al Fenbendazol 25% y continuar alternando. 1 ml por cada 30 kg PV vía intramuscular.',
      intervaloDias: 60,
      edadMinimasDias: 0,
      medicamentoId: levamisol15.id,
    },
  });

  // Animales mayores de 6 meses EN PRODUCCIÓN LÁCTEA — Fenbendazol 25% cada 4 meses
  await prisma.calendarioVacunacion.upsert({
    where: { id: 'cal-desp-lactea-fenbendazol' },
    update: {},
    create: {
      id: 'cal-desp-lactea-fenbendazol',
      nombreVacuna: 'Desparasitación Producción Láctea — Fenbendazol 25%',
      descripcion: 'Animales mayores de 6 meses en producción láctea. Gastrointestinales y pulmonares. Cada 4 meses. 1 ml por cada 50 kg PV vía oral.',
      intervaloDias: 120,
      edadMinimasDias: 180,
      medicamentoId: fenbendazol25.id,
    },
  });

  // Animales SECOS (no en producción láctea) — protocolo completo cada 4 meses
  await prisma.calendarioVacunacion.upsert({
    where: { id: 'cal-desp-secos-ivermectina' },
    update: {},
    create: {
      id: 'cal-desp-secos-ivermectina',
      nombreVacuna: 'Desparasitación Animales Secos — Ivermectina 3,15%',
      descripcion: 'Animales secos mayores de 6 meses (no en producción láctea). Gastrointestinales, pulmonares y ectoparásitos. Cada 4 meses. 1 ml por cada 50 kg PV vía subcutánea.',
      intervaloDias: 120,
      edadMinimasDias: 180,
      medicamentoId: ivermectina315.id,
    },
  });

  await prisma.calendarioVacunacion.upsert({
    where: { id: 'cal-desp-secos-lombifarm' },
    update: {},
    create: {
      id: 'cal-desp-secos-lombifarm',
      nombreVacuna: 'Desparasitación Animales Secos — Lombifarm',
      descripcion: 'Animales secos mayores de 6 meses. Gastrointestinales y hepáticos. Cada 4 meses. 1 ml por cada 10 kg PV vía oral.',
      intervaloDias: 120,
      edadMinimasDias: 180,
      medicamentoId: lombifarm.id,
    },
  });

  await prisma.calendarioVacunacion.upsert({
    where: { id: 'cal-desp-secos-doramectina' },
    update: {},
    create: {
      id: 'cal-desp-secos-doramectina',
      nombreVacuna: 'Desparasitación Animales Secos — Doramectina 1%',
      descripcion: 'Animales secos mayores de 6 meses. Pulmonares y ectoparásitos. Cada 4 meses. 1 ml por cada 50 kg PV vía subcutánea.',
      intervaloDias: 120,
      edadMinimasDias: 180,
      medicamentoId: doramectina1.id,
    },
  });

  await prisma.calendarioVacunacion.upsert({
    where: { id: 'cal-desp-secos-tratoril' },
    update: {},
    create: {
      id: 'cal-desp-secos-tratoril',
      nombreVacuna: 'Desparasitación Animales Secos — Tratoril (Toltrazuril 5%)',
      descripcion: 'Animales secos mayores de 6 meses. Coccidiosis intestinal. Cada 4 meses. 3 ml por cada 10 kg PV vía oral.',
      intervaloDias: 120,
      edadMinimasDias: 180,
      medicamentoId: tratoril.id,
    },
  });

  // Mantener entrada legacy de desparasitación con Ivermectina 1% (ya existía en BD)
  await prisma.calendarioVacunacion.upsert({
    where: { id: 'cal-desparasitacion' },
    update: {},
    create: {
      id: 'cal-desparasitacion',
      nombreVacuna: 'Desparasitación (Ivermectina 1%)',
      descripcion: 'Control de parásitos externos e internos cada 3 meses (protocolo legacy)',
      intervaloDias: 90,
      medicamentoId: ivermectina.id,
    },
  });

  console.log('Calendarios de vacunación y desparasitación creados');

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
    { numeroArete: 'ELP-001', nombre: 'La Princesa', sexo: Sexo.HEMBRA, proposito: TipoPropositoAnimal.REPRODUCCION, razaId: razaBrahman.id, loteId: loteParaisoA.id, pesoActual: 420 },
    { numeroArete: 'ELP-002', nombre: 'La Reina', sexo: Sexo.HEMBRA, proposito: TipoPropositoAnimal.REPRODUCCION, razaId: razaBrahman.id, loteId: loteParaisoA.id, pesoActual: 445 },
    { numeroArete: 'ELP-003', nombre: 'Estrella', sexo: Sexo.HEMBRA, proposito: TipoPropositoAnimal.CARNE, razaId: razaSenepol.id, loteId: loteParaisoA.id, pesoActual: 390 },
    { numeroArete: 'ELP-004', nombre: 'Tornado', sexo: Sexo.MACHO, proposito: TipoPropositoAnimal.TAUROMAQUIA, razaId: razaCasta.id, loteId: loteParaisoB.id, pesoActual: 520 },
    { numeroArete: 'ELP-005', nombre: 'Vendaval', sexo: Sexo.MACHO, proposito: TipoPropositoAnimal.TAUROMAQUIA, razaId: razaCasta.id, loteId: loteParaisoB.id, pesoActual: 490 },
    { numeroArete: 'ELP-006', nombre: null, sexo: Sexo.MACHO, proposito: TipoPropositoAnimal.CARNE, razaId: razaBrahman.id, loteId: loteParaisoC.id, pesoActual: 320 },
    { numeroArete: 'ELP-007', nombre: null, sexo: Sexo.MACHO, proposito: TipoPropositoAnimal.CARNE, razaId: razaBrahman.id, loteId: loteParaisoC.id, pesoActual: 310 },
    { numeroArete: 'ELP-008', nombre: 'La Morena', sexo: Sexo.HEMBRA, proposito: TipoPropositoAnimal.REPRODUCCION, razaId: razaBrahman.id, loteId: loteParaisoA.id, pesoActual: 410, estadoSanitario: EstadoSanitario.EN_TRATAMIENTO },
    { numeroArete: 'ELP-009', nombre: 'La Canela', sexo: Sexo.HEMBRA, proposito: TipoPropositoAnimal.CARNE_LECHE, razaId: razaSenepol.id, loteId: loteParaisoA.id, pesoActual: 380 },
    { numeroArete: 'ELP-010', nombre: 'Rayo', sexo: Sexo.MACHO, proposito: TipoPropositoAnimal.TAUROMAQUIA, razaId: razaCasta.id, loteId: loteParaisoB.id, pesoActual: 475 },
  ];

  const animalesCampoAlegre = [
    { numeroArete: 'CAL-001', nombre: 'Bella', sexo: Sexo.HEMBRA, proposito: TipoPropositoAnimal.REPRODUCCION, razaId: razaBrahman.id, loteId: loteCampoAlegreA.id, pesoActual: 430 },
    { numeroArete: 'CAL-002', nombre: 'Paloma', sexo: Sexo.HEMBRA, proposito: TipoPropositoAnimal.REPRODUCCION, razaId: razaSenepol.id, loteId: loteCampoAlegreA.id, pesoActual: 405 },
    { numeroArete: 'CAL-003', nombre: null, sexo: Sexo.MACHO, proposito: TipoPropositoAnimal.CARNE, razaId: razaBrahman.id, loteId: loteCampoAlegreB.id, pesoActual: 380 },
    { numeroArete: 'CAL-004', nombre: null, sexo: Sexo.MACHO, proposito: TipoPropositoAnimal.CARNE, razaId: razaSenepol.id, loteId: loteCampoAlegreB.id, pesoActual: 395 },
    { numeroArete: 'CAL-005', nombre: 'La Gorda', sexo: Sexo.HEMBRA, proposito: TipoPropositoAnimal.CARNE, razaId: razaBrahman.id, loteId: loteCampoAlegreA.id, pesoActual: 460 },
    { numeroArete: 'CAL-006', nombre: null, sexo: Sexo.MACHO, proposito: TipoPropositoAnimal.CARNE, razaId: razaCebu.id, loteId: loteCampoAlegreB.id, pesoActual: 345 },
    { numeroArete: 'CAL-007', nombre: 'Consentida', sexo: Sexo.HEMBRA, proposito: TipoPropositoAnimal.REPRODUCCION, razaId: razaSenepol.id, loteId: loteCampoAlegreA.id, pesoActual: 415 },
    { numeroArete: 'CAL-008', nombre: null, sexo: Sexo.MACHO, proposito: TipoPropositoAnimal.CARNE, razaId: razaBrahman.id, loteId: loteCampoAlegreB.id, pesoActual: 412 },
    { numeroArete: 'CAL-009', nombre: 'Mimosa', sexo: Sexo.HEMBRA, proposito: TipoPropositoAnimal.CARNE_LECHE, razaId: razaSenepol.id, loteId: loteCampoAlegreA.id, pesoActual: 395 },
    { numeroArete: 'CAL-010', nombre: null, sexo: Sexo.MACHO, proposito: TipoPropositoAnimal.CARNE, razaId: razaBrahman.id, loteId: loteCampoAlegreB.id, pesoActual: 368 },
  ];

  const animalesLasPenas = [
    { numeroArete: 'LPN-001', nombre: null, sexo: Sexo.HEMBRA, proposito: TipoPropositoAnimal.REPRODUCCION, razaId: razaBrahman.id, loteId: loteLasPenasB.id, pesoActual: 285 },
    { numeroArete: 'LPN-002', nombre: null, sexo: Sexo.HEMBRA, proposito: TipoPropositoAnimal.REPRODUCCION, razaId: razaSenepol.id, loteId: loteLasPenasB.id, pesoActual: 295 },
    { numeroArete: 'LPN-003', nombre: null, sexo: Sexo.MACHO, proposito: TipoPropositoAnimal.CARNE, razaId: razaBrahman.id, loteId: loteLasPenasA.id, pesoActual: 220 },
    { numeroArete: 'LPN-004', nombre: null, sexo: Sexo.MACHO, proposito: TipoPropositoAnimal.CARNE, razaId: razaBrahman.id, loteId: loteLasPenasA.id, pesoActual: 240 },
    { numeroArete: 'LPN-005', nombre: 'Fresita', sexo: Sexo.HEMBRA, proposito: TipoPropositoAnimal.REPRODUCCION, razaId: razaSenepol.id, loteId: loteLasPenasB.id, pesoActual: 270 },
    { numeroArete: 'LPN-006', nombre: null, sexo: Sexo.MACHO, proposito: TipoPropositoAnimal.CARNE, razaId: razaCebu.id, loteId: loteLasPenasA.id, pesoActual: 195 },
    { numeroArete: 'LPN-007', nombre: null, sexo: Sexo.HEMBRA, proposito: TipoPropositoAnimal.CARNE, razaId: razaBrahman.id, loteId: loteLasPenasB.id, pesoActual: 260 },
    { numeroArete: 'LPN-008', nombre: null, sexo: Sexo.MACHO, proposito: TipoPropositoAnimal.CARNE, razaId: razaSenepol.id, loteId: loteLasPenasA.id, pesoActual: 230 },
    { numeroArete: 'LPN-009', nombre: 'Manchita', sexo: Sexo.HEMBRA, proposito: TipoPropositoAnimal.REPRODUCCION, razaId: razaBrahman.id, loteId: loteLasPenasB.id, pesoActual: 290 },
    { numeroArete: 'LPN-010', nombre: null, sexo: Sexo.MACHO, proposito: TipoPropositoAnimal.CARNE, razaId: razaBrahman.id, loteId: loteLasPenasA.id, pesoActual: 215 },
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
      id: 'regla-vacuna-proxima',
      nombre: 'Vacuna próxima a vencer',
      tipoAlerta: TipoAlertaRegla.VACUNA_PROXIMA,
      prioridad: PrioridadAlerta.ALTA,
      umbralValor: 7,
      umbralUnidad: 'dias',
      usuarioIds: [veterinario.id, administrador.id],
    },
    {
      id: 'regla-vacuna-vencida',
      nombre: 'Vacuna vencida',
      tipoAlerta: TipoAlertaRegla.VACUNA_VENCIDA,
      prioridad: PrioridadAlerta.CRITICA,
      umbralValor: 0,
      umbralUnidad: 'dias',
      usuarioIds: [veterinario.id, administrador.id, tecnico.id],
    },
    {
      id: 'regla-parto-proximo',
      nombre: 'Parto próximo (7 días)',
      tipoAlerta: TipoAlertaRegla.PARTO_PROXIMO,
      prioridad: PrioridadAlerta.ALTA,
      umbralValor: 7,
      umbralUnidad: 'dias',
      usuarioIds: [veterinario.id, administrador.id, tecnico.id],
    },
    {
      id: 'regla-dias-abiertos',
      nombre: 'Días abiertos excedidos',
      tipoAlerta: TipoAlertaRegla.DIAS_ABIERTOS_EXCEDIDOS,
      prioridad: PrioridadAlerta.MEDIA,
      umbralValor: 90,
      umbralUnidad: 'dias',
      usuarioIds: [veterinario.id],
    },
    {
      id: 'regla-enfermedad-activa',
      nombre: 'Enfermedad activa sin resolución',
      tipoAlerta: TipoAlertaRegla.ENFERMEDAD_ACTIVA_SIN_RESOLUCION,
      prioridad: PrioridadAlerta.ALTA,
      umbralValor: 14,
      umbralUnidad: 'dias',
      usuarioIds: [veterinario.id, administrador.id],
    },
    {
      id: 'regla-inventario-semen',
      nombre: 'Inventario de semen bajo',
      tipoAlerta: TipoAlertaRegla.INVENTARIO_SEMEN_BAJO,
      prioridad: PrioridadAlerta.MEDIA,
      umbralValor: 10,
      umbralUnidad: 'unidades',
      usuarioIds: [administrador.id, veterinario.id],
    },
  ];

  for (const { usuarioIds, ...regla } of reglasAlerta) {
    await prisma.reglaAlerta.upsert({
      where: { id: regla.id },
      update: {},
      create: {
        ...regla,
        creadoPorId: administrador.id,
        usuariosNotificados: { create: usuarioIds.map((usuarioId) => ({ usuarioId })) },
      },
    });
  }

  console.log('Reglas de alerta por defecto creadas');

  // ----------------------------------------------------------
  // 10. DISPOSITIVOS GPS Y REGISTROS DE UBICACIÓN (datos de prueba)
  // ----------------------------------------------------------
  // Mientras no hay trackers IoT reales en campo, se simula el flujo completo
  // tal como quedará cuando se configuren: un DispositivoGPS por animal (con
  // su propia apiKey, igual que un dispositivo real) y su historial de
  // posiciones, con velocidad instantánea incluida, para que los reportes de
  // movilidad (distancia, tiempo de actividad, velocidad promedio) tengan
  // datos reales con los que calcular.
  const animalesParaGPS = await prisma.animal.findMany({
    where: { lote: { fincaId: fincaParaiso.id } },
    take: 5,
    select: { id: true, numeroArete: true },
  });

  let numeroDispositivo = 1;
  for (const animal of animalesParaGPS) {
    const dispositivo = await prisma.dispositivoGPS.upsert({
      where: { animalId: animal.id },
      update: {},
      create: {
        codigoDispositivo: `GPS-ELP-${String(numeroDispositivo).padStart(3, '0')}`,
        modelo: 'ESP32-GPS',
        fabricante: 'Genérico',
        apiKey: `sim_${animal.numeroArete.toLowerCase()}_${Math.random().toString(36).slice(2, 10)}`,
        nivelBateria: 60 + Math.round(Math.random() * 40),
        animalId: animal.id,
      },
    });

    // Los primeros 3 dispositivos simulan estar reportando activamente
    // (última señal hace pocos minutos); los últimos 2 simulan llevar horas
    // desconectados, para que el estado "en línea" del panel sea realista.
    const desconectado = numeroDispositivo > 3;
    const finRecorridoMs = desconectado
      ? Date.now() - 20 * 60 * 60 * 1000
      : Date.now() - numeroDispositivo * 60 * 1000;
    numeroDispositivo += 1;

    // Recorrido simulado tipo "caminata" (cada punto parte del anterior, no
    // de un centro fijo), con velocidad de pastoreo.
    let lat = 10.1875 + (Math.random() - 0.5) * 0.01;
    let lng = -68.5234 + (Math.random() - 0.5) * 0.01;
    const puntos = 8;
    let ultimaFecha = new Date(finRecorridoMs);
    for (let i = puntos - 1; i >= 0; i--) {
      lat += (Math.random() - 0.5) * 0.0015;
      lng += (Math.random() - 0.5) * 0.0015;
      const fechaRegistro = new Date(finRecorridoMs - i * 3 * 60 * 60 * 1000); // cada 3 horas
      if (i === 0) ultimaFecha = fechaRegistro;
      await prisma.registroUbicacion.create({
        data: {
          animalId: animal.id,
          dispositivoGPSId: dispositivo.id,
          latitud: lat,
          longitud: lng,
          altitud: 450 + Math.random() * 50,
          precision: 5 + Math.random() * 10,
          velocidad: +(Math.random() * 3).toFixed(1), // pastoreo: 0-3 km/h aprox.
          fechaRegistro,
        },
      });
    }

    await prisma.dispositivoGPS.update({
      where: { id: dispositivo.id },
      data: {
        ultimaConexion: ultimaFecha,
        estado: desconectado ? 'SIN_SEÑAL' : 'ACTIVO',
      },
    });
  }

  console.log('Dispositivos GPS y registros de ubicación de prueba creados');

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
