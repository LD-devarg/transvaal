/********************************************************************
 * SISTEMA DE LIQUIDACIONES (SIN PDF)
 ********************************************************************/

const SH_VIAJES = 'Viajes';
const SH_GASTOS = 'Gastos';
const SH_LIQUIDACIONES = 'Liquidaciones';
const SH_LIQ_DETALLE = 'Liquidaciones_Detalle';

const DATA_START_VIAJES = 4;
const DATA_START_GASTOS = 4;

const IVA_RATE = 0.21;

/********************************************************************
 * UTILIDADES
 ********************************************************************/
function getSheet_(name) {
  const sh = SpreadsheetApp.getActive().getSheetByName(name);
  if (!sh) throw new Error('No existe hoja: ' + name);
  return sh;
}

function yyyymmdd_(d) {
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function parseISO_(iso) {
  if (!iso) return null;
  const [y, m, d] = String(iso).split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toNumber_(value) {
  if (typeof value === 'number') return isNaN(value) ? 0 : value;

  const cleaned = String(value == null ? '' : value)
    .replace(/\$/g, '')
    .replace(/\./g, '')
    .replace(/,/g, '.')
    .trim();

  if (!cleaned) return 0;
  const parsed = Number(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/********************************************************************
 * OBTENER VIAJES PARA LIQUIDACION
 * Estructura esperada (fila 3):
 * B=Nro Viaje, C=Fecha, D=Salida, E=Cliente, F=Tarifa, G=Chofer,
 * I=Remito Nro, J=Estado, L=Nro Liquidacion
 ********************************************************************/
function obtenerViajesCandidatos(proveedor, desdeISO, hastaISO) {
  const sh = getSheet_(SH_VIAJES);
  const last = sh.getLastRow();
  if (last < DATA_START_VIAJES) return [];

  const numRows = last - DATA_START_VIAJES + 1;
  const values = sh.getRange(DATA_START_VIAJES, 2, numRows, 11).getValues(); // B:L

  const desde = parseISO_(desdeISO) || new Date(1900, 0, 1);
  const hasta = parseISO_(hastaISO) || new Date(9999, 11, 31);

  const out = [];

  values.forEach(function (row, i) {
    const nViaje = row[0];
    const fecha = row[1];
    const salida = row[2];
    const cliente = row[3];
    const tarifa = toNumber_(row[4]);
    const chofer = row[5];
    const remito = row[7] || '';
    const estado = row[8] || '';

    if (String(chofer).trim().toLowerCase() !== String(proveedor).trim().toLowerCase()) return;
    if (!(fecha instanceof Date)) return;
    if (fecha < desde || fecha > hasta) return;
    if (String(estado).trim().toLowerCase() === 'liquidado') return;

    out.push({
      nViaje: nViaje,
      fecha: yyyymmdd_(fecha),
      chofer: chofer,
      cliente: cliente,
      salida: salida,
      remito: remito,
      tarifa: tarifa,
      estado: estado,
      seleccionable: String(estado).trim().toLowerCase() === 'habilitado',
      _sheetRow: DATA_START_VIAJES + i,
    });
  });

  out.sort(function (a, b) {
    return a.fecha.localeCompare(b.fecha) || String(a.nViaje).localeCompare(String(b.nViaje));
  });

  return out;
}

/********************************************************************
 * OBTENER GASTOS DEL PERIODO
 * Estructura esperada (fila 3):
 * A=Fecha, B=Chofer, C=Cubiertas, D=Adelanto/Otros, G=Total Comb.
 ********************************************************************/
function obtenerGastosPeriodo(proveedor, desdeISO, hastaISO) {
  const sh = getSheet_(SH_GASTOS);
  const last = sh.getLastRow();
  if (last < DATA_START_GASTOS) return 0;

  const numRows = last - DATA_START_GASTOS + 1;
  const values = sh.getRange(DATA_START_GASTOS, 1, numRows, 8).getValues(); // A:H

  const desde = parseISO_(desdeISO) || new Date(1900, 0, 1);
  const hasta = parseISO_(hastaISO) || new Date(9999, 11, 31);

  let total = 0;

  values.forEach(function (row) {
    const fecha = row[0];
    const chofer = row[1];
    const cubiertas = toNumber_(row[2]);
    const adelanto = toNumber_(row[3]);
    const totalComb = toNumber_(row[6]);

    if (!(fecha instanceof Date)) return;
    if (String(chofer).trim().toLowerCase() !== String(proveedor).trim().toLowerCase()) return;
    if (fecha < desde || fecha > hasta) return;

    total += cubiertas + adelanto + totalComb;
  });

  return total;
}

/********************************************************************
 * GENERAR LIQUIDACION
 ********************************************************************/
function generarLiquidacion(payload) {
  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);

  try {
    const proveedor = payload.proveedor;
    const desdeISO = payload.desdeISO;
    const hastaISO = payload.hastaISO;
    const items = payload.items;

    if (!proveedor) throw new Error('Falta proveedor.');
    if (!items || !items.length) throw new Error('No se enviaron items seleccionados.');

    const candidatos = obtenerViajesCandidatos(proveedor, desdeISO, hastaISO);
    const idsSeleccionados = new Set(items.filter(function (x) { return x.incluir; }).map(function (x) { return String(x.nViaje); }));

    const seleccion = candidatos.filter(function (v) {
      return v.seleccionable && idsSeleccionados.has(String(v.nViaje));
    });

    if (seleccion.length === 0) throw new Error('No hay viajes habilitados seleccionados.');

    const totalSIVA = seleccion.reduce(function (a, v) { return a + (Number(v.tarifa) || 0); }, 0);
    const totalCIVA = totalSIVA * (1 + IVA_RATE);
    const gastosPeriodo = obtenerGastosPeriodo(proveedor, desdeISO, hastaISO);
    const adeudadoFinal = totalCIVA - gastosPeriodo;

    const shL = getSheet_(SH_LIQUIDACIONES);
    const nroLiq = nextLiquidationNumber_(shL);
    const hoy = new Date();

    escribirDetalleLiquidacion_(nroLiq, proveedor, seleccion, hoy);
    marcarViajesLiquidados_(nroLiq, seleccion);
    escribirCabeceraLiquidacion_(nroLiq, proveedor, desdeISO, hastaISO, hoy, gastosPeriodo, totalSIVA, totalCIVA, adeudadoFinal);

    if (typeof cargarLiquidacionesDinamicamente === 'function') {
      cargarLiquidacionesDinamicamente();
    }

    return {
      numero: nroLiq,
      proveedor: proveedor,
      cantidadViajes: seleccion.length,
      totales: {
        gastosPeriodo: gastosPeriodo,
        totalSinIVA: totalSIVA,
        totalConIVA: totalCIVA,
        adeudadoFinal: adeudadoFinal,
      },
    };
  } finally {
    lock.releaseLock();
  }
}

/********************************************************************
 * GENERAR Nro DE LIQUIDACION
 ********************************************************************/
function nextLiquidationNumber_(sh) {
  const anio = new Date().getFullYear();
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return 'LQ-' + anio + '-0001';

  const colB = sh.getRange(2, 2, lastRow - 1, 1).getValues().flat();
  const nums = colB
    .map(function (v) { return String(v || ''); })
    .filter(function (v) { return v.indexOf('LQ-' + anio + '-') === 0; })
    .map(function (v) { return Number(v.split('-').pop()); })
    .filter(function (n) { return !isNaN(n); });

  const next = (nums.length ? Math.max.apply(null, nums) : 0) + 1;
  return 'LQ-' + anio + '-' + String(next).padStart(4, '0');
}

/********************************************************************
 * MARCAR VIAJES COMO LIQUIDADOS
 ********************************************************************/
function marcarViajesLiquidados_(nroLiq, viajes) {
  const sh = getSheet_(SH_VIAJES);

  viajes.forEach(function (v) {
    const row = v._sheetRow;
    sh.getRange(row, 10).setValue('Liquidado'); // J Estado
    sh.getRange(row, 12).setValue(nroLiq);      // L Nro Liquidacion
  });
}

/********************************************************************
 * ESCRIBIR DETALLE (solo viajes)
 ********************************************************************/
function ensureDetalleSheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(SH_LIQ_DETALLE);
  if (!sh) sh = ss.insertSheet(SH_LIQ_DETALLE);

  if (sh.getLastRow() < 3) {
    const headers = [
      '', 'Nro Liq.', 'Fecha Liq.', 'Nro Viaje', 'Fecha Viaje', 'Chofer', 'Cliente', 'Salida',
      'Remito Viaje', 'Tarifa s/IVA', 'Tarifa c/IVA', 'Neto a Pagar'
    ];
    sh.getRange(3, 1, 1, headers.length).setValues([headers]);
    sh.setFrozenRows(3);
  }

  return sh;
}

function escribirDetalleLiquidacion_(nLiq, proveedor, viajes, fechaLiq) {
  const sh = ensureDetalleSheet_();

  const rows = viajes.map(function (v) {
    const tarifaSI = Number(v.tarifa) || 0;
    const tarifaCI = tarifaSI * (1 + IVA_RATE);

    return [
      '',
      nLiq,
      fechaLiq,
      v.nViaje,
      v.fecha,
      v.chofer || proveedor,
      v.cliente,
      v.salida,
      v.remito || '',
      tarifaSI,
      tarifaCI,
      tarifaCI,
    ];
  });

  sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
}

/********************************************************************
 * ESCRIBIR CABECERA LIQUIDACION
 ********************************************************************/
function escribirCabeceraLiquidacion_(nLiq, proveedor, desdeISO, hastaISO, fecha, gastosPeriodo, totalSIVA, totalCIVA, adeudadoFinal) {
  const sh = getSheet_(SH_LIQUIDACIONES);

  if (sh.getLastRow() === 0) {
    sh.appendRow(['', 'Nro Liquidacion', 'Fecha', 'Proveedor', 'Desde', 'Hasta', 'Gastos Periodo', 'Total s/IVA', 'Total c/IVA', 'Adeudado Final', 'Estado', 'Factura']);
    sh.setFrozenRows(1);
  }

  sh.appendRow([
    '',
    nLiq,
    fecha,
    proveedor,
    desdeISO,
    hastaISO,
    gastosPeriodo,
    totalSIVA,
    totalCIVA,
    adeudadoFinal,
    'Pendiente',
    '',
  ]);
}

/********************************************************************
 * LISTAR LIQUIDACIONES (modal PDF)
 ********************************************************************/
function obtenerLiquidaciones() {
  const sh = SpreadsheetApp.getActive().getSheetByName('Liquidaciones');
  const last = sh.getLastRow();

  if (last < 4) return [];

  const rowsCount = last - 3;
  const numeros = sh.getRange(4, 2, rowsCount, 1).getValues();
  const fechas = sh.getRange(4, 3, rowsCount, 1).getValues();
  const proveedores = sh.getRange(4, 4, rowsCount, 1).getValues();
  const estados = sh.getRange(4, 11, rowsCount, 1).getValues();

  const out = [];

  for (let i = 0; i < rowsCount; i++) {
    const numero = numeros[i][0];
    if (!numero) continue;

    const fecha = fechas[i][0];

    out.push({
      numero: numero,
      proveedor: proveedores[i][0] || '',
      fecha: fecha instanceof Date
        ? Utilities.formatDate(fecha, 'America/Argentina/Buenos_Aires', 'yyyy-MM-dd')
        : fecha,
      estado: estados[i][0] || '',
    });
  }

  return out;
}
