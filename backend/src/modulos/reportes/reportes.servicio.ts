import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { Response } from 'express';
import path from 'path';
import { prisma } from '../../compartido/prisma/clientePrisma';

const RUTA_LOGO = path.join(__dirname, '../../assets/logo-campolargo.png');

// ── Colores corporativos ───────────────────────────────────────────────────────
const VERDE_OSCURO = '#0d631b';
const VERDE_CLARO  = '#e8f5e9';
const GRIS_TEXTO   = '#40493d';
const GRIS_LINEA   = '#e2e2e2';

// ── Helpers PDF ───────────────────────────────────────────────────────────────
function encabezadoPDF(
  doc: PDFKit.PDFDocument,
  titulo: string,
  subtitulo: string,
) {
  const anchoHdr = doc.page.width;
  doc.rect(0, 0, anchoHdr, 90).fill(VERDE_OSCURO);

  // Logo en la esquina superior izquierda
  try {
    doc.image(RUTA_LOGO, 12, 12, { width: 66, height: 66 });
  } catch {
    // Logo no disponible — continuar sin él
  }

  // Nombre de la empresa
  doc.fillColor('white')
     .font('Helvetica-Bold')
     .fontSize(17)
     .text('Sucesión Joao Campolargo', 90, 18, { lineBreak: false });

  doc.font('Helvetica')
     .fontSize(9)
     .fillColor('rgba(255,255,255,0.85)')
     .text('Sistema de Gestión Veterinaria · Yaracuy, Venezuela', 90, 38, { lineBreak: false });

  const fecha = new Date().toLocaleDateString('es-VE', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  doc.fontSize(8)
     .fillColor('rgba(255,255,255,0.70)')
     .text(`Generado: ${fecha}`, 90, 55, { lineBreak: false });

  // Título del reporte
  doc.y = 108;
  doc.fillColor(VERDE_OSCURO)
     .font('Helvetica-Bold')
     .fontSize(14)
     .text(titulo, 50, doc.y);

  doc.font('Helvetica')
     .fontSize(9)
     .fillColor(GRIS_TEXTO)
     .text(subtitulo)
     .moveDown(0.8);

  doc.moveTo(50, doc.y)
     .lineTo(doc.page.width - 50, doc.y)
     .strokeColor(VERDE_OSCURO)
     .lineWidth(1.5)
     .stroke()
     .moveDown(0.6);
}

function piePaginaPDF(doc: PDFKit.PDFDocument) {
  const rango = doc.bufferedPageRange();
  for (let i = rango.start; i < rango.start + rango.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(8)
       .fillColor(GRIS_TEXTO)
       .text(
         `Página ${i - rango.start + 1} de ${rango.count}  ·  Sistema Campolargo`,
         50,
         doc.page.height - 40,
         { align: 'center', lineBreak: false },
       );
  }
}

function filaPDF(
  doc: PDFKit.PDFDocument,
  celdas: string[],
  anchos: number[],
  esEncabezado = false,
  esImpar = false,
) {
  const alturaCelda = 18;
  const x0 = 50;
  let x = x0;
  const y = doc.y;
  const anchoTotal = anchos.reduce((a, b) => a + b, 0);

  if (esEncabezado) {
    doc.rect(x0, y, anchoTotal, alturaCelda).fill(VERDE_OSCURO);
  } else if (esImpar) {
    doc.rect(x0, y, anchoTotal, alturaCelda).fill(VERDE_CLARO);
  }

  celdas.forEach((celda, i) => {
    doc.fillColor(esEncabezado ? 'white' : GRIS_TEXTO)
       .font(esEncabezado ? 'Helvetica-Bold' : 'Helvetica')
       .fontSize(8)
       .text(String(celda ?? '—'), x + 3, y + 5, {
         width: anchos[i] - 6,
         lineBreak: false,
         ellipsis: true,
       });
    x += anchos[i];
  });

  doc.rect(x0, y, anchoTotal, alturaCelda)
     .strokeColor(GRIS_LINEA)
     .lineWidth(0.5)
     .stroke();

  doc.y = y + alturaCelda;

  if (doc.y > doc.page.height - 80) {
    doc.addPage();
    doc.y = 50;
  }
}

// ── Helpers Excel ─────────────────────────────────────────────────────────────
function estiloEncabezadoExcel(fila: ExcelJS.Row) {
  fila.eachCell((celda) => {
    celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D631B' } };
    celda.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    celda.alignment = { vertical: 'middle', horizontal: 'center' };
    celda.border = { bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } } };
  });
  fila.height = 22;
}

function estiloFilaExcel(fila: ExcelJS.Row, impar: boolean) {
  fila.eachCell((celda) => {
    celda.fill = {
      type: 'pattern', pattern: 'solid',
      fgColor: { argb: impar ? 'FFF1F8E9' : 'FFFFFFFF' },
    };
    celda.font = { size: 9 };
    celda.alignment = { vertical: 'middle' };
    celda.border = { bottom: { style: 'hair', color: { argb: 'FFE0E0E0' } } };
  });
  fila.height = 18;
}

function anchoAutoExcel(hoja: ExcelJS.Worksheet) {
  hoja.columns.forEach((col) => {
    let maxLen = 10;
    col.eachCell?.({ includeEmpty: false }, (celda) => {
      maxLen = Math.max(maxLen, String(celda.value ?? '').length + 2);
    });
    col.width = Math.min(maxLen, 40);
  });
}

const fmtFecha = (d: Date | string | null | undefined): string =>
  d ? new Date(d).toLocaleDateString('es-VE') : '—';

// ─────────────────────────────────────────────────────────────────────────────
// REPORTE 1 — INVENTARIO DE ANIMALES
// ─────────────────────────────────────────────────────────────────────────────
export async function generarInventario(
  res: Response,
  formato: 'pdf' | 'excel',
  filtros: { anio: number; fincaId?: string; estado?: string },
) {
  const animales = await prisma.animal.findMany({
    where: {
      ...(filtros.fincaId && { fincaId: filtros.fincaId }),
      ...(filtros.estado  && { estado: filtros.estado as any }),
    },
    include: {
      raza:  { select: { nombre: true } },
      finca: { select: { nombre: true } },
      lote:  { select: { nombre: true } },
    },
    orderBy: [{ finca: { nombre: 'asc' } }, { numeroArete: 'asc' }],
  });

  const subtitulo = `Total: ${animales.length} animales${filtros.fincaId ? '' : ' · Todas las fincas'}`;

  if (formato === 'pdf') {
    const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true, autoFirstPage: true });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="inventario_animales_${filtros.anio}.pdf"`);
    doc.pipe(res);

    encabezadoPDF(doc, 'Inventario de Animales', subtitulo);

    const anchos = [65, 90, 50, 80, 90, 60, 60, 55];
    filaPDF(doc, ['Arete', 'Nombre', 'Sexo', 'Raza', 'Finca', 'Lote', 'Estado', 'Peso (kg)'], anchos, true);

    animales.forEach((a, i) => {
      filaPDF(doc, [
        a.numeroArete,
        a.nombre ?? '—',
        a.sexo === 'MACHO' ? 'Macho' : 'Hembra',
        a.raza?.nombre ?? '—',
        a.finca?.nombre ?? '—',
        a.lote?.nombre  ?? '—',
        a.estado,
        a.pesoActual != null ? String(a.pesoActual) : '—',
      ], anchos, false, i % 2 === 0);
    });

    piePaginaPDF(doc);
    doc.end();

  } else {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Sistema Campolargo';
    wb.created = new Date();

    const ws = wb.addWorksheet('Inventario');
    ws.columns = [
      { header: 'Arete',          key: 'arete'      },
      { header: 'Nombre',         key: 'nombre'     },
      { header: 'Sexo',           key: 'sexo'       },
      { header: 'Raza',           key: 'raza'       },
      { header: 'Finca',          key: 'finca'      },
      { header: 'Lote',           key: 'lote'       },
      { header: 'Estado',         key: 'estado'     },
      { header: 'Est. Sanitario', key: 'sanitario'  },
      { header: 'Peso (kg)',      key: 'peso'       },
      { header: 'F. Nacimiento',  key: 'nacimiento' },
    ];
    estiloEncabezadoExcel(ws.getRow(1));

    animales.forEach((a, i) => {
      estiloFilaExcel(ws.addRow({
        arete:       a.numeroArete,
        nombre:      a.nombre ?? '',
        sexo:        a.sexo === 'MACHO' ? 'Macho' : 'Hembra',
        raza:        a.raza?.nombre ?? '',
        finca:       a.finca?.nombre ?? '',
        lote:        a.lote?.nombre  ?? '',
        estado:      a.estado,
        sanitario:   a.estadoSanitario,
        peso:        a.pesoActual ?? '',
        nacimiento:  fmtFecha(a.fechaNacimiento),
      }), i % 2 === 0);
    });

    // Hoja resumen por finca
    const wsFinca = wb.addWorksheet('Resumen por finca');
    wsFinca.columns = [
      { header: 'Finca',          key: 'finca' },
      { header: 'Total animales', key: 'total' },
    ];
    estiloEncabezadoExcel(wsFinca.getRow(1));
    const porFinca = animales.reduce<Record<string, number>>((acc, a) => {
      const n = a.finca?.nombre ?? 'Sin finca';
      acc[n] = (acc[n] ?? 0) + 1;
      return acc;
    }, {});
    Object.entries(porFinca).forEach(([finca, total], i) => {
      estiloFilaExcel(wsFinca.addRow({ finca, total }), i % 2 === 0);
    });

    anchoAutoExcel(ws);
    anchoAutoExcel(wsFinca);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="inventario_animales_${filtros.anio}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// REPORTE 2 — REPORTE SANITARIO
// ─────────────────────────────────────────────────────────────────────────────
export async function generarSanitario(
  res: Response,
  formato: 'pdf' | 'excel',
  filtros: { anio: number; fincaId?: string },
) {
  const desde = new Date(filtros.anio, 0, 1);
  const hasta = new Date(filtros.anio, 11, 31, 23, 59, 59);

  const [consultas, vacunaciones] = await Promise.all([
    prisma.historialMedico.findMany({
      where: {
        fechaConsulta: { gte: desde, lte: hasta },
        ...(filtros.fincaId ? { animal: { fincaId: filtros.fincaId } } : {}),
      },
      include: {
        animal: {
          select: {
            numeroArete: true, nombre: true,
            finca: { select: { nombre: true } },
          },
        },
        veterinario: { select: { nombre: true, apellido: true } },
      },
      orderBy: { fechaConsulta: 'desc' },
    }),
    prisma.registroVacunacion.findMany({
      where: {
        fechaAplicacion: { gte: desde, lte: hasta },
        ...(filtros.fincaId
          ? { historialMedico: { animal: { fincaId: filtros.fincaId } } }
          : {}),
      },
      include: {
        historialMedico: {
          include: {
            animal: {
              select: {
                numeroArete: true, nombre: true,
                finca: { select: { nombre: true } },
              },
            },
          },
        },
        calendarioVacunacion: { select: { nombreVacuna: true } },
      },
      orderBy: { fechaAplicacion: 'desc' },
    }),
  ]);

  if (formato === 'pdf') {
    const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true, autoFirstPage: true });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="reporte_sanitario_${filtros.anio}.pdf"`);
    doc.pipe(res);

    encabezadoPDF(
      doc,
      `Reporte Sanitario ${filtros.anio}`,
      `${consultas.length} consultas · ${vacunaciones.length} vacunaciones`,
    );

    doc.font('Helvetica-Bold').fontSize(10).fillColor(VERDE_OSCURO)
       .text('Consultas y Diagnósticos').moveDown(0.3);

    const aCons = [55, 90, 80, 90, 90, 95];
    filaPDF(doc, ['Fecha', 'Animal', 'Finca', 'Motivo', 'Diagnóstico', 'Veterinario'], aCons, true);
    consultas.forEach((c, i) =>
      filaPDF(doc, [
        fmtFecha(c.fechaConsulta),
        `${c.animal.nombre ?? ''} #${c.animal.numeroArete}`.trim(),
        c.animal.finca?.nombre ?? '—',
        c.motivoConsulta,
        c.diagnostico,
        `${c.veterinario.nombre} ${c.veterinario.apellido}`.trim(),
      ], aCons, false, i % 2 === 0),
    );

    doc.moveDown(1)
       .font('Helvetica-Bold').fontSize(10).fillColor(VERDE_OSCURO)
       .text('Vacunaciones Aplicadas').moveDown(0.3);

    const aVac = [55, 90, 80, 130, 90, 55];
    filaPDF(doc, ['Fecha', 'Animal', 'Finca', 'Vacuna', 'Próxima cita', 'Dosis'], aVac, true);
    vacunaciones.forEach((v, i) => {
      const animal = v.historialMedico?.animal;
      filaPDF(doc, [
        fmtFecha(v.fechaAplicacion),
        `${animal?.nombre ?? ''} #${animal?.numeroArete ?? ''}`.trim(),
        animal?.finca?.nombre ?? '—',
        v.calendarioVacunacion.nombreVacuna,
        fmtFecha(v.proximaFecha),
        v.dosis ?? '—',
      ], aVac, false, i % 2 === 0);
    });

    piePaginaPDF(doc);
    doc.end();

  } else {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Sistema Campolargo';

    const wsC = wb.addWorksheet('Consultas médicas');
    wsC.columns = [
      { header: 'Fecha',       key: 'fecha'       },
      { header: 'Animal',      key: 'animal'      },
      { header: 'Finca',       key: 'finca'       },
      { header: 'Motivo',      key: 'motivo'      },
      { header: 'Diagnóstico', key: 'diagnostico' },
      { header: 'Pronóstico',  key: 'pronostico'  },
      { header: 'Veterinario', key: 'vet'         },
    ];
    estiloEncabezadoExcel(wsC.getRow(1));
    consultas.forEach((c, i) => {
      estiloFilaExcel(wsC.addRow({
        fecha:       fmtFecha(c.fechaConsulta),
        animal:      `${c.animal.nombre ?? ''} #${c.animal.numeroArete}`.trim(),
        finca:       c.animal.finca?.nombre ?? '',
        motivo:      c.motivoConsulta,
        diagnostico: c.diagnostico,
        pronostico:  c.pronostico ?? '',
        vet:         `${c.veterinario.nombre} ${c.veterinario.apellido}`.trim(),
      }), i % 2 === 0);
    });

    const wsV = wb.addWorksheet('Vacunaciones');
    wsV.columns = [
      { header: 'Fecha aplicación', key: 'fecha'   },
      { header: 'Animal',           key: 'animal'  },
      { header: 'Finca',            key: 'finca'   },
      { header: 'Vacuna',           key: 'vacuna'  },
      { header: 'Dosis',            key: 'dosis'   },
      { header: 'Próxima cita',     key: 'proxima' },
    ];
    estiloEncabezadoExcel(wsV.getRow(1));
    vacunaciones.forEach((v, i) => {
      const animal = v.historialMedico?.animal;
      estiloFilaExcel(wsV.addRow({
        fecha:   fmtFecha(v.fechaAplicacion),
        animal:  `${animal?.nombre ?? ''} #${animal?.numeroArete ?? ''}`.trim(),
        finca:   animal?.finca?.nombre ?? '',
        vacuna:  v.calendarioVacunacion.nombreVacuna,
        dosis:   v.dosis ?? '',
        proxima: fmtFecha(v.proximaFecha),
      }), i % 2 === 0);
    });

    anchoAutoExcel(wsC);
    anchoAutoExcel(wsV);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="reporte_sanitario_${filtros.anio}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// REPORTE 3 — CUMPLIMIENTO DE VACUNACIÓN
// ─────────────────────────────────────────────────────────────────────────────
export async function generarVacunacion(
  res: Response,
  formato: 'pdf' | 'excel',
  filtros: { anio: number; fincaId?: string },
) {
  const hoy  = new Date();
  const en30 = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000);

  const registros = await prisma.registroVacunacion.findMany({
    where: {
      historialMedico: {
        animal: {
          estado: 'ACTIVO',
          ...(filtros.fincaId ? { fincaId: filtros.fincaId } : {}),
        },
      },
    },
    include: {
      historialMedico: {
        include: {
          animal: {
            select: {
              numeroArete: true, nombre: true,
              finca: { select: { nombre: true } },
            },
          },
        },
      },
      calendarioVacunacion: { select: { nombreVacuna: true, intervaloDias: true } },
    },
    orderBy: { proximaFecha: 'asc' },
  });

  const calcularEstado = (proxima: Date | null | undefined): string => {
    if (!proxima) return 'Sin próxima fecha';
    const p = new Date(proxima);
    if (p < hoy)   return 'VENCIDA';
    if (p <= en30) return 'PRÓXIMA';
    return 'AL DÍA';
  };

  const datos = registros.map((r) => ({
    arete:            r.historialMedico?.animal?.numeroArete ?? '',
    nombre:           r.historialMedico?.animal?.nombre ?? '',
    finca:            r.historialMedico?.animal?.finca?.nombre ?? '',
    vacuna:           r.calendarioVacunacion.nombreVacuna,
    intervaloDias:    `${r.calendarioVacunacion.intervaloDias} días`,
    ultimaAplicacion: fmtFecha(r.fechaAplicacion),
    proximaFecha:     fmtFecha(r.proximaFecha),
    estado:           calcularEstado(r.proximaFecha),
  }));

  if (formato === 'pdf') {
    const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true, autoFirstPage: true });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="vacunacion_cumplimiento_${filtros.anio}.pdf"`);
    doc.pipe(res);

    const vencidas = datos.filter((d) => d.estado === 'VENCIDA').length;
    const proximas = datos.filter((d) => d.estado === 'PRÓXIMA').length;
    encabezadoPDF(
      doc,
      'Cumplimiento de Vacunación',
      `${datos.length} registros · ${vencidas} vencidas · ${proximas} próximas en 30 días`,
    );

    const anchos = [55, 85, 75, 110, 65, 65, 55];
    filaPDF(doc, ['Arete', 'Animal', 'Finca', 'Vacuna', 'Última aplic.', 'Próxima cita', 'Estado'], anchos, true);
    datos.forEach((d, i) => {
      filaPDF(doc, [d.arete, d.nombre || '—', d.finca || '—', d.vacuna, d.ultimaAplicacion, d.proximaFecha, d.estado], anchos, false, i % 2 === 0);
    });

    piePaginaPDF(doc);
    doc.end();

  } else {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Cumplimiento vacunación');
    ws.columns = [
      { header: 'Arete',             key: 'arete'    },
      { header: 'Nombre',            key: 'nombre'   },
      { header: 'Finca',             key: 'finca'    },
      { header: 'Vacuna',            key: 'vacuna'   },
      { header: 'Intervalo',         key: 'intervalo'},
      { header: 'Última aplicación', key: 'ultima'   },
      { header: 'Próxima cita',      key: 'proxima'  },
      { header: 'Estado',            key: 'estado'   },
    ];
    estiloEncabezadoExcel(ws.getRow(1));

    datos.forEach((d, i) => {
      const fila = ws.addRow({
        arete: d.arete, nombre: d.nombre, finca: d.finca,
        vacuna: d.vacuna, intervalo: d.intervaloDias,
        ultima: d.ultimaAplicacion, proxima: d.proximaFecha, estado: d.estado,
      });
      estiloFilaExcel(fila, i % 2 === 0);

      const celdaEstado = fila.getCell('estado');
      if (d.estado === 'VENCIDA') {
        celdaEstado.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFCDD2' } };
        celdaEstado.font = { bold: true, color: { argb: 'FFB71C1C' }, size: 9 };
      } else if (d.estado === 'PRÓXIMA') {
        celdaEstado.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF9C4' } };
        celdaEstado.font = { bold: true, color: { argb: 'FFF57F17' }, size: 9 };
      } else if (d.estado === 'AL DÍA') {
        celdaEstado.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC8E6C9' } };
        celdaEstado.font = { bold: true, color: { argb: 'FF1B5E20' }, size: 9 };
      }
    });

    anchoAutoExcel(ws);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="vacunacion_cumplimiento_${filtros.anio}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// REPORTE 4 — INDICADORES REPRODUCTIVOS
// ─────────────────────────────────────────────────────────────────────────────
export async function generarReproductivo(
  res: Response,
  formato: 'pdf' | 'excel',
  filtros: { anio: number; fincaId?: string },
) {
  const desde = new Date(filtros.anio, 0, 1);
  const hasta = new Date(filtros.anio, 11, 31, 23, 59, 59);
  const dondeFinca = filtros.fincaId ? { fincaId: filtros.fincaId } : {};

  const [gestaciones, nacimientos, totalHembras] = await Promise.all([
    prisma.gestacion.findMany({
      where: {
        fechaInicio: { gte: desde, lte: hasta },
        madre: { ...dondeFinca },
      },
      include: {
        madre: {
          select: {
            numeroArete: true, nombre: true,
            finca: { select: { nombre: true } },
          },
        },
      },
      orderBy: { fechaInicio: 'desc' },
    }),
    prisma.nacimiento.findMany({
      where: {
        fechaNacimiento: { gte: desde, lte: hasta },
        gestacion: { madre: { ...dondeFinca } },
      },
      include: {
        gestacion: {
          include: {
            madre: {
              select: {
                numeroArete: true, nombre: true,
                finca: { select: { nombre: true } },
              },
            },
          },
        },
        cria: { select: { numeroArete: true, nombre: true, sexo: true } },
      },
      orderBy: { fechaNacimiento: 'desc' },
    }),
    prisma.animal.count({
      where: { sexo: 'HEMBRA', estado: 'ACTIVO', ...dondeFinca },
    }),
  ]);

  const enCurso      = gestaciones.filter((g) => g.estadoGestacion === 'EN_CURSO').length;
  const finalizadas  = gestaciones.filter((g) => g.estadoGestacion === 'FINALIZADA_PARTO').length;
  const tasaPrenez   = totalHembras > 0
    ? ((gestaciones.length / totalHembras) * 100).toFixed(1)
    : '—';
  const machosCrias  = nacimientos.filter((n) => n.cria?.sexo === 'MACHO').length;
  const hembrasCrias = nacimientos.filter((n) => n.cria?.sexo === 'HEMBRA').length;

  const kpis: [string, string][] = [
    ['Total hembras activas',          String(totalHembras)],
    ['Gestaciones en el período',      String(gestaciones.length)],
    ['Tasa de preñez estimada',        `${tasaPrenez}%`],
    ['Gestaciones en curso',           String(enCurso)],
    ['Gestaciones finalizadas (parto)', String(finalizadas)],
    ['Total nacimientos',              String(nacimientos.length)],
    ['Crías macho',                    String(machosCrias)],
    ['Crías hembra',                   String(hembrasCrias)],
  ];

  if (formato === 'pdf') {
    const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true, autoFirstPage: true });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="indicadores_reproductivos_${filtros.anio}.pdf"`);
    doc.pipe(res);

    encabezadoPDF(
      doc,
      `Indicadores Reproductivos ${filtros.anio}`,
      `${gestaciones.length} gestaciones · ${nacimientos.length} nacimientos · Tasa preñez: ${tasaPrenez}%`,
    );

    doc.font('Helvetica-Bold').fontSize(10).fillColor(VERDE_OSCURO)
       .text('Indicadores clave').moveDown(0.4);

    kpis.forEach(([label, val], i) => {
      const y = doc.y;
      if (i % 2 === 0) {
        doc.rect(50, y, doc.page.width - 100, 20).fill(VERDE_CLARO);
      }
      doc.fillColor(GRIS_TEXTO).font('Helvetica').fontSize(9)
         .text(label, 55, y + 5, { continued: true })
         .font('Helvetica-Bold').text(val, { align: 'right' });
      doc.y = y + 20;
    });

    doc.moveDown(1);

    doc.font('Helvetica-Bold').fontSize(10).fillColor(VERDE_OSCURO)
       .text('Gestaciones').moveDown(0.3);

    const aGes = [55, 95, 80, 80, 80, 110];
    filaPDF(doc, ['Arete', 'Madre', 'Finca', 'Inicio', 'Parto esperado', 'Estado'], aGes, true);
    gestaciones.forEach((g, i) =>
      filaPDF(doc, [
        g.madre.numeroArete,
        g.madre.nombre ?? '—',
        g.madre.finca?.nombre ?? '—',
        fmtFecha(g.fechaInicio),
        fmtFecha(g.fechaPartoEsperado),
        g.estadoGestacion.replace(/_/g, ' '),
      ], aGes, false, i % 2 === 0),
    );

    if (nacimientos.length) {
      doc.moveDown(1)
         .font('Helvetica-Bold').fontSize(10).fillColor(VERDE_OSCURO)
         .text('Nacimientos').moveDown(0.3);

      const aNac = [55, 95, 55, 95, 80, 80];
      filaPDF(doc, ['Arete cría', 'Nombre cría', 'Sexo', 'Madre', 'Finca', 'Fecha nacim.'], aNac, true);
      nacimientos.forEach((n, i) =>
        filaPDF(doc, [
          n.cria?.numeroArete ?? '—',
          n.cria?.nombre ?? '—',
          n.cria?.sexo === 'MACHO' ? 'Macho' : 'Hembra',
          n.gestacion.madre.nombre ?? n.gestacion.madre.numeroArete,
          n.gestacion.madre.finca?.nombre ?? '—',
          fmtFecha(n.fechaNacimiento),
        ], aNac, false, i % 2 === 0),
      );
    }

    piePaginaPDF(doc);
    doc.end();

  } else {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Sistema Campolargo';

    const wsR = wb.addWorksheet('Resumen');
    wsR.addRow([`Indicadores Reproductivos ${filtros.anio}`]);
    wsR.getRow(1).font = { bold: true, size: 13, color: { argb: 'FF0D631B' } };
    wsR.addRow([]);
    kpis.forEach(([k, v], i) => {
      estiloFilaExcel(wsR.addRow([k, v]), i % 2 === 0);
    });
    wsR.getColumn(1).width = 38;
    wsR.getColumn(2).width = 18;

    const wsG = wb.addWorksheet('Gestaciones');
    wsG.columns = [
      { header: 'Arete madre',      key: 'arete'  },
      { header: 'Nombre madre',     key: 'nombre' },
      { header: 'Finca',            key: 'finca'  },
      { header: 'Inicio gestación', key: 'inicio' },
      { header: 'Parto esperado',   key: 'parto'  },
      { header: 'Estado',           key: 'estado' },
    ];
    estiloEncabezadoExcel(wsG.getRow(1));
    gestaciones.forEach((g, i) => {
      estiloFilaExcel(wsG.addRow({
        arete:  g.madre.numeroArete,
        nombre: g.madre.nombre ?? '',
        finca:  g.madre.finca?.nombre ?? '',
        inicio: fmtFecha(g.fechaInicio),
        parto:  fmtFecha(g.fechaPartoEsperado),
        estado: g.estadoGestacion.replace(/_/g, ' '),
      }), i % 2 === 0);
    });

    const wsN = wb.addWorksheet('Nacimientos');
    wsN.columns = [
      { header: 'Arete cría',       key: 'arete'  },
      { header: 'Nombre cría',      key: 'nombre' },
      { header: 'Sexo',             key: 'sexo'   },
      { header: 'Madre',            key: 'madre'  },
      { header: 'Finca',            key: 'finca'  },
      { header: 'Fecha nacimiento', key: 'fecha'  },
    ];
    estiloEncabezadoExcel(wsN.getRow(1));
    nacimientos.forEach((n, i) => {
      estiloFilaExcel(wsN.addRow({
        arete:  n.cria?.numeroArete ?? '',
        nombre: n.cria?.nombre ?? '',
        sexo:   n.cria?.sexo === 'MACHO' ? 'Macho' : 'Hembra',
        madre:  n.gestacion.madre.nombre ?? n.gestacion.madre.numeroArete,
        finca:  n.gestacion.madre.finca?.nombre ?? '',
        fecha:  fmtFecha(n.fechaNacimiento),
      }), i % 2 === 0);
    });

    anchoAutoExcel(wsG);
    anchoAutoExcel(wsN);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="indicadores_reproductivos_${filtros.anio}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// REPORTE 5 — HISTORIAL MÉDICO COMPLETO DE UN ANIMAL (PDF)
// ─────────────────────────────────────────────────────────────────────────────
export async function generarHistorialAnimal(
  res: Response,
  animalId: string,
) {
  const animal = await prisma.animal.findUnique({
    where: { id: animalId },
    select: {
      numeroArete: true,
      nombre: true,
      sexo: true,
      fechaNacimiento: true,
      estadoSanitario: true,
      raza: { select: { nombre: true } },
      finca: { select: { nombre: true } },
    },
  });

  if (!animal) {
    res.status(404).json({ error: 'Animal no encontrado' });
    return;
  }

  const consultas = await prisma.historialMedico.findMany({
    where: { animalId },
    include: {
      veterinario: { select: { nombre: true, apellido: true } },
      enfermedades: true,
      tratamientos: {
        include: { medicamento: { select: { nombre: true } } },
      },
      informacionEpidemiologica: true,
      ayudasDiagnosticas: true,
      desparasitaciones: true,
    },
    orderBy: { fechaConsulta: 'desc' },
  });

  const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true, autoFirstPage: true });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="historial_${animal.numeroArete}.pdf"`);
  doc.pipe(res);

  const nombreAnimal = animal.nombre ? `${animal.nombre} — #${animal.numeroArete}` : `#${animal.numeroArete}`;
  encabezadoPDF(
    doc,
    `Historial Médico: ${nombreAnimal}`,
    `${animal.raza?.nombre ?? '—'} · ${animal.finca?.nombre ?? '—'} · ${consultas.length} consulta(s)`,
  );

  // Ficha del animal
  doc.font('Helvetica-Bold').fontSize(10).fillColor(VERDE_OSCURO).text('Datos del Animal').moveDown(0.3);
  const fichaItems: [string, string][] = [
    ['Arete',           animal.numeroArete],
    ['Nombre',          animal.nombre ?? '—'],
    ['Sexo',            animal.sexo === 'MACHO' ? 'Macho' : 'Hembra'],
    ['Raza',            animal.raza?.nombre ?? '—'],
    ['Finca',           animal.finca?.nombre ?? '—'],
    ['Nacimiento',      fmtFecha(animal.fechaNacimiento)],
    ['Estado sanitario', animal.estadoSanitario ?? '—'],
  ];
  fichaItems.forEach(([k, v], i) => {
    const y = doc.y;
    if (i % 2 === 0) doc.rect(50, y, doc.page.width - 100, 18).fill(VERDE_CLARO);
    doc.fillColor(GRIS_TEXTO).font('Helvetica').fontSize(9)
       .text(k, 55, y + 4, { continued: true })
       .font('Helvetica-Bold').text(v, { align: 'right' });
    doc.y = y + 18;
  });

  doc.moveDown(1);

  if (consultas.length === 0) {
    doc.font('Helvetica').fontSize(10).fillColor(GRIS_TEXTO).text('Sin consultas registradas.');
  }

  // Una sección por consulta
  consultas.forEach((c, idx) => {
    if (doc.y > doc.page.height - 180) { doc.addPage(); doc.y = 50; }

    const titleY = doc.y;
    doc.rect(50, titleY, doc.page.width - 100, 22).fill(VERDE_OSCURO);
    doc.fillColor('white').font('Helvetica-Bold').fontSize(10)
       .text(
         `Consulta ${idx + 1} — ${fmtFecha(c.fechaConsulta)}   ·   Vet: ${c.veterinario.nombre} ${c.veterinario.apellido}`,
         55, titleY + 6, { width: doc.page.width - 110, lineBreak: false },
       );
    doc.y = titleY + 26;

    const campo = (etiqueta: string, valor: string | null | undefined) => {
      if (!valor) return;
      const y = doc.y;
      doc.fillColor(GRIS_TEXTO).font('Helvetica-Bold').fontSize(8)
         .text(etiqueta + ': ', 55, y, { continued: true })
         .font('Helvetica').text(valor, { width: doc.page.width - 110 });
      if (doc.y > doc.page.height - 80) { doc.addPage(); doc.y = 50; }
    };

    campo('Motivo', c.motivoConsulta);
    campo('Síntomas', c.sintomasObservados);
    campo('Diagnóstico', c.diagnostico);
    if (c.diagnosticoDefinitivo) campo('Diag. definitivo', c.diagnosticoDefinitivo);
    if (c.pronostico)             campo('Pronóstico', c.pronostico);
    if (c.planDiagnostico)        campo('Plan diagnóstico', c.planDiagnostico);
    if (c.observaciones)          campo('Observaciones', c.observaciones);

    // Signos vitales
    const vitales: string[] = [];
    if (c.temperatura != null)           vitales.push(`Temp: ${c.temperatura}°C`);
    if (c.frecuenciaCardiaca != null)    vitales.push(`FC: ${c.frecuenciaCardiaca} lpm`);
    if (c.frecuenciaRespiratoria != null) vitales.push(`FR: ${c.frecuenciaRespiratoria} rpm`);
    if (c.tiempoLlenadoCapilar != null)  vitales.push(`TLC: ${c.tiempoLlenadoCapilar} seg`);
    if (c.movimientosRuminales != null)  vitales.push(`Rum: ${c.movimientosRuminales}/min`);
    if (c.condicionCorporal != null)     vitales.push(`CC: ${c.condicionCorporal}/5`);
    if (vitales.length) campo('Signos vitales', vitales.join('   '));

    // Enfermedades
    if (c.enfermedades.length) {
      campo('Enfermedades', c.enfermedades.map((e) => `${e.nombreEnfermedad} (${e.activa ? 'activa' : 'resuelta'})`).join('; '));
    }

    // Tratamientos
    if (c.tratamientos.length) {
      c.tratamientos.forEach((t) => {
        campo('Tratamiento', `${t.medicamento.nombre} — ${t.dosis} — ${t.viaAdministracion} — ${t.frecuencia}${t.duracionDias ? ` — ${t.duracionDias}d` : ''}`);
      });
    }

    // Desparasitaciones
    if (c.desparasitaciones.length) {
      c.desparasitaciones.forEach((d) => {
        campo('Desparasitación', `${d.producto}${d.principioActivo ? ` (${d.principioActivo})` : ''} — ${fmtFecha(d.fecha)}${d.dosis ? ` — ${d.dosis}` : ''}`);
      });
    }

    // Ayudas diagnósticas
    if (c.ayudasDiagnosticas.length) {
      c.ayudasDiagnosticas.forEach((a) => {
        const linea = [a.tipo.replace(/_/g, ' '), fmtFecha(a.fecha), a.resultado].filter(Boolean).join(' — ');
        campo('Ayuda diagnóstica', linea);
      });
    }

    // Info epidemiológica
    if (c.informacionEpidemiologica) {
      const ep = c.informacionEpidemiologica as any;
      const vecs = [ep.garrapatas && 'Garrapatas', ep.mosquitos && 'Mosquitos', ep.murcielagos && 'Murciélagos', ep.moscas && 'Moscas', ep.otrosVectores].filter(Boolean).join(', ');
      if (vecs) campo('Vectores', vecs);
      if (ep.descripcion) campo('Epid. descripción', ep.descripcion);
    }

    doc.moveDown(0.8);
  });

  piePaginaPDF(doc);
  doc.end();
}

// ─────────────────────────────────────────────────────────────────────────────
// REPORTE 6 — PDF DE UNA CONSULTA ESPECÍFICA
// ─────────────────────────────────────────────────────────────────────────────
export async function generarConsulta(
  res: Response,
  consultaId: string,
) {
  const c = await prisma.historialMedico.findUnique({
    where: { id: consultaId },
    include: {
      animal: {
        select: {
          numeroArete: true, nombre: true, sexo: true, fechaNacimiento: true,
          raza: { select: { nombre: true } },
          finca: { select: { nombre: true } },
        },
      },
      veterinario: { select: { nombre: true, apellido: true } },
      enfermedades: true,
      tratamientos: { include: { medicamento: { select: { nombre: true } } } },
      informacionEpidemiologica: true,
      ayudasDiagnosticas: true,
      desparasitaciones: true,
    },
  });

  if (!c) {
    res.status(404).json({ error: 'Consulta no encontrada' });
    return;
  }

  const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true, autoFirstPage: true });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="consulta_${c.id}.pdf"`);
  doc.pipe(res);

  const nombreAnimal = c.animal.nombre ? `${c.animal.nombre} — #${c.animal.numeroArete}` : `#${c.animal.numeroArete}`;
  encabezadoPDF(
    doc,
    `Consulta Médica — ${fmtFecha(c.fechaConsulta)}`,
    `${nombreAnimal}  ·  ${c.animal.finca?.nombre ?? '—'}`,
  );

  // Bloque ficha
  doc.font('Helvetica-Bold').fontSize(10).fillColor(VERDE_OSCURO).text('Datos del Animal').moveDown(0.3);
  const fichaA: [string, string][] = [
    ['Arete',     c.animal.numeroArete],
    ['Nombre',    c.animal.nombre ?? '—'],
    ['Raza',      c.animal.raza?.nombre ?? '—'],
    ['Finca',     c.animal.finca?.nombre ?? '—'],
    ['Sexo',      c.animal.sexo === 'MACHO' ? 'Macho' : 'Hembra'],
    ['Nacimiento', fmtFecha(c.animal.fechaNacimiento)],
  ];
  fichaA.forEach(([k, v], i) => {
    const y = doc.y;
    if (i % 2 === 0) doc.rect(50, y, doc.page.width - 100, 18).fill(VERDE_CLARO);
    doc.fillColor(GRIS_TEXTO).font('Helvetica').fontSize(9)
       .text(k, 55, y + 4, { continued: true })
       .font('Helvetica-Bold').text(v, { align: 'right' });
    doc.y = y + 18;
  });

  doc.moveDown(0.8);
  doc.font('Helvetica-Bold').fontSize(10).fillColor(VERDE_OSCURO).text('Información de la Consulta').moveDown(0.3);

  const campo = (etiqueta: string, valor: string | null | undefined) => {
    if (!valor) return;
    const y = doc.y;
    doc.fillColor(GRIS_TEXTO).font('Helvetica-Bold').fontSize(9)
       .text(etiqueta + ': ', 55, y, { continued: true })
       .font('Helvetica').text(valor, { width: doc.page.width - 110 });
    if (doc.y > doc.page.height - 80) { doc.addPage(); doc.y = 50; }
  };

  doc.font('Helvetica').fontSize(9).fillColor(GRIS_TEXTO)
     .text(`Veterinario: ${c.veterinario.nombre} ${c.veterinario.apellido}   ·   Fecha: ${fmtFecha(c.fechaConsulta)}`)
     .moveDown(0.4);

  campo('Motivo de consulta',    c.motivoConsulta);
  campo('Síntomas observados',   c.sintomasObservados);
  campo('Tiempo de evolución',   c.tiempoEvolucion);
  campo('Tratamientos previos',  c.tratamientosPrevios);
  campo('Cirugías',              c.cirugias);

  // Signos vitales
  const vitales: string[] = [];
  if (c.temperatura != null)            vitales.push(`Temp: ${c.temperatura}°C`);
  if (c.frecuenciaCardiaca != null)     vitales.push(`FC: ${c.frecuenciaCardiaca} lpm`);
  if (c.frecuenciaRespiratoria != null) vitales.push(`FR: ${c.frecuenciaRespiratoria} rpm`);
  if (c.tiempoLlenadoCapilar != null)   vitales.push(`TLC: ${c.tiempoLlenadoCapilar} seg`);
  if (c.movimientosRuminales != null)   vitales.push(`Rum: ${c.movimientosRuminales}/min`);
  if (c.condicionCorporal != null)      vitales.push(`CC: ${c.condicionCorporal}/5`);
  if (vitales.length) campo('Signos vitales', vitales.join('   ·   '));

  campo('Est. reproductivo',     c.estadoReproductivo?.replace(/_/g, ' ') ?? null);
  campo('Litros leche/día',      c.litrosLechesDiarios != null ? String(c.litrosLechesDiarios) : null);
  campo('Ganancia de peso (kg)', c.gananciaPeso != null ? String(c.gananciaPeso) : null);

  doc.moveDown(0.5);
  doc.font('Helvetica-Bold').fontSize(10).fillColor(VERDE_OSCURO).text('Diagnóstico y Plan').moveDown(0.3);
  campo('Diagnóstico presuntivo',           c.diagnostico);
  campo('Diagnóstico definitivo',           c.diagnosticoDefinitivo);
  campo('Plan diagnóstico',                 c.planDiagnostico);
  campo('Pronóstico',                       c.pronostico);
  campo('Obs. diagnósticos oficiales',      c.observacionesDiagnosticosOficiales);
  campo('Observaciones generales',          c.observaciones);

  // Enfermedades
  if (c.enfermedades.length) {
    doc.moveDown(0.5).font('Helvetica-Bold').fontSize(10).fillColor(VERDE_OSCURO).text('Enfermedades').moveDown(0.3);
    const aE = [120, 70, 80, 230];
    filaPDF(doc, ['Enfermedad', 'Inicio', 'Estado', 'Descripción clínica'], aE, true);
    c.enfermedades.forEach((e, i) =>
      filaPDF(doc, [
        e.nombreEnfermedad,
        fmtFecha(e.fechaInicio),
        e.activa ? 'Activa' : 'Resuelta',
        e.descripcionClinica ?? '—',
      ], aE, false, i % 2 === 0),
    );
  }

  // Tratamientos
  if (c.tratamientos.length) {
    doc.moveDown(0.5).font('Helvetica-Bold').fontSize(10).fillColor(VERDE_OSCURO).text('Tratamientos').moveDown(0.3);
    const aT = [120, 70, 80, 60, 80, 90];
    filaPDF(doc, ['Medicamento', 'Dosis', 'Vía', 'Duración', 'Frecuencia', 'Estado'], aT, true);
    c.tratamientos.forEach((t, i) =>
      filaPDF(doc, [
        t.medicamento.nombre,
        t.dosis,
        t.viaAdministracion,
        t.duracionDias ? `${t.duracionDias}d` : '—',
        t.frecuencia,
        t.estado === 'EN_CURSO' ? 'En curso' : t.estado === 'COMPLETADO' ? 'Completado' : t.estado,
      ], aT, false, i % 2 === 0),
    );
  }

  // Desparasitaciones
  if (c.desparasitaciones.length) {
    doc.moveDown(0.5).font('Helvetica-Bold').fontSize(10).fillColor(VERDE_OSCURO).text('Desparasitaciones').moveDown(0.3);
    const aD = [110, 110, 70, 70, 70, 70];
    filaPDF(doc, ['Producto', 'P. Activo', 'Tipo', 'Fecha', 'Dosis', 'Vía'], aD, true);
    c.desparasitaciones.forEach((d: any, i: number) =>
      filaPDF(doc, [
        d.producto,
        d.principioActivo ?? '—',
        (d.tipo as string).replace(/_/g, ' '),
        fmtFecha(d.fecha),
        d.dosis ?? '—',
        d.via ?? '—',
      ], aD, false, i % 2 === 0),
    );
  }

  // Ayudas diagnósticas
  if (c.ayudasDiagnosticas.length) {
    doc.moveDown(0.5).font('Helvetica-Bold').fontSize(10).fillColor(VERDE_OSCURO).text('Ayudas Diagnósticas').moveDown(0.3);
    const aAD = [100, 70, 150, 180];
    filaPDF(doc, ['Tipo', 'Fecha', 'Descripción', 'Resultado'], aAD, true);
    c.ayudasDiagnosticas.forEach((a: any, i: number) =>
      filaPDF(doc, [
        (a.tipo as string).replace(/_/g, ' '),
        fmtFecha(a.fecha),
        a.descripcion ?? '—',
        a.resultado ?? '—',
      ], aAD, false, i % 2 === 0),
    );
  }

  // Info epidemiológica
  if (c.informacionEpidemiologica) {
    const ep = c.informacionEpidemiologica as any;
    const vecs = [ep.garrapatas && 'Garrapatas', ep.mosquitos && 'Mosquitos', ep.murcielagos && 'Murciélagos', ep.moscas && 'Moscas', ep.otrosVectores].filter(Boolean).join(', ');
    if (vecs || ep.descripcion) {
      doc.moveDown(0.5).font('Helvetica-Bold').fontSize(10).fillColor(VERDE_OSCURO).text('Información Epidemiológica').moveDown(0.3);
      if (vecs)          campo('Vectores',      vecs);
      if (ep.descripcion) campo('Descripción', ep.descripcion);
    }
  }

  piePaginaPDF(doc);
  doc.end();
}
