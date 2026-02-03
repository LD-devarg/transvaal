/********************************************************************
 *   SISTEMA DE LIQUIDACIONES  (SIN PDF)
 ********************************************************************/

const SH_VIAJES            = 'Viajes';
const SH_LIQUIDACIONES     = 'Liquidaciones';
const SH_LIQ_DETALLE       = 'Liquidaciones_Detalle';
const SH_PROVEEDORES       = 'Proveedores';

const HEADER_ROW_VIAJES    = 3;
const DATA_START_VIAJES    = 4;

const IVA_RATE             = 0.21;

/********************************************************************
 * UTILIDADES
 ********************************************************************/
function getSheet_(name) {
  const sh = SpreadsheetApp.getActive().getSheetByName(name);
  if (!sh) throw new Error("No existe hoja: " + name);
  return sh;
}

function yyyymmdd_(d) {
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function parseISO_(iso) {
  if (!iso) return null;
  const [y,m,d] = iso.split('-').map(Number);
  return new Date(y, (m-1), d);
}

/********************************************************************
 * OBTENER VIAJES PARA LIQUIDACIÓN
 ********************************************************************/
function obtenerViajesCandidatos(proveedor, desdeISO, hastaISO) {

  const sh = getSheet_(SH_VIAJES);
  const last = sh.getLastRow();
  if (last < DATA_START_VIAJES) return [];

  const numRows = last - DATA_START_VIAJES + 1;
  const values = sh.getRange(DATA_START_VIAJES, 2, numRows, sh.getLastColumn()).getValues();

  const desde = parseISO_(desdeISO) || new Date(1900,0,1);
  const hasta = parseISO_(hastaISO) || new Date(9999,11,31);

  const out = [];

  values.forEach((row, i) => {

    const nroViaje = row[0];
    const fecha    = row[1];
    const salida   = row[3];
    const cliente  = row[4];
    const tarifa   = row[5];
    const chofer   = row[6];
    const cub      = row[8]  || 0;
    const adel     = row[9]  || 0;
    const lts      = row[10] || 0;
    const pComb    = row[11] || 0;
    const totComb  = row[12] || 0;
    const remito   = row[13] || '';
    const estado   = row[17];
    const nroLiq   = row[18] || '';

    if (String(chofer).trim().toLowerCase() !== String(proveedor).trim().toLowerCase()) 
      return;

    if (!(fecha instanceof Date)) return;
    if (fecha < desde || fecha > hasta) return;

    if (estado === "Liquidado") return;

    out.push({
      nViaje: nroViaje,
      fecha: yyyymmdd_(fecha),
      cliente,
      salida,
      remito,
      cubiertas: cub,
      adelanto: adel,
      lts,
      precioComb: pComb,
      totalComb: totComb,
      tarifa,
      estado,
      seleccionable: estado === "Habilitado",
      _sheetRow: DATA_START_VIAJES + i
    });
  });

  out.sort((a,b)=> 
    (a.fecha.localeCompare(b.fecha) || String(a.nViaje).localeCompare(String(b.nViaje)))
  );

  return out;
}

/********************************************************************
 * GENERAR LIQUIDACIÓN
 ********************************************************************/
function generarLiquidacion(payload) {

  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);

  try {
    const { proveedor, desdeISO, hastaISO, items } = payload;

    if (!proveedor) throw new Error("Falta proveedor.");
    if (!items || !items.length) throw new Error("No se enviaron ítems seleccionados.");

    const candidatos = obtenerViajesCandidatos(proveedor, desdeISO, hastaISO);

    const idsSeleccionados = new Set(
      items.filter(x=>x.incluir).map(x=>String(x.nViaje))
    );

    const seleccion = candidatos.filter(v => 
      v.seleccionable && idsSeleccionados.has(String(v.nViaje))
    );

    if (seleccion.length === 0) 
      throw new Error("No hay viajes habilitados seleccionados.");

    const totalSIVA = seleccion.reduce((a,v)=> a + (Number(v.tarifa)||0), 0);
    const totalCIVA = totalSIVA * (1 + IVA_RATE);

    const saldoProv = seleccion.reduce((a,v)=>
      a + (v.cubiertas||0) + (v.adelanto||0) + (v.totalComb||0)
    ,0);

    const adeudadoFinal = totalCIVA - saldoProv;

    const shL = getSheet_(SH_LIQUIDACIONES);
    const nroLiq = nextLiquidationNumber_(shL);
    const hoy = new Date();

    escribirDetalleLiquidacion_(nroLiq, proveedor, seleccion, hoy);
    marcarViajesLiquidados_(nroLiq, seleccion);
    escribirCabeceraLiquidacion_(nroLiq, proveedor, desdeISO, hastaISO, hoy, totalSIVA, totalCIVA, saldoProv, adeudadoFinal);

    cargarLiquidacionesDinamicamente?.(); // opcional

    return {
      numero: nroLiq,
      proveedor,
      cantidadViajes: seleccion.length,
      totales: {
        totalSinIVA: totalSIVA,
        totalConIVA: totalCIVA,
        saldoProveedor: saldoProv,
        adeudadoFinal
      }
    };

  } finally {
    lock.releaseLock();
  }
}

/********************************************************************
 * GENERAR N° DE LIQUIDACIÓN
 ********************************************************************/
function nextLiquidationNumber_(sh) {
  const año = new Date().getFullYear();
  const colB = sh.getRange(2,2, sh.getLastRow()-1, 1).getValues().flat();

  const nums = colB
    .map(v => String(v||''))
    .filter(v => v.startsWith(`LQ-${año}-`))
    .map(v => Number(v.split('-').pop()))
    .filter(n => !isNaN(n));

  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `LQ-${año}-${String(next).padStart(4,'0')}`;
}

/********************************************************************
 * MARCAR VIAJES COMO LIQUIDADOS
 ********************************************************************/
function marcarViajesLiquidados_(nroLiq, viajes) {

  const sh = getSheet_(SH_VIAJES);

  viajes.forEach(v => {
    const row = v._sheetRow;
    sh.getRange(row, 19).setValue("Liquidado"); // Col S
    sh.getRange(row, 20).setValue(nroLiq);      // Col T
  });
}

/********************************************************************
 * ESCRIBIR DETALLE
 ********************************************************************/
function ensureDetalleSheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(SH_LIQ_DETALLE);
  if (!sh) sh = ss.insertSheet(SH_LIQ_DETALLE);

  if (sh.getLastRow() < 3) {
    const headers = [
      'N° Liquidación','Fecha','N° Viaje','Fecha Viaje','Chofer','Cliente','Salida','Remito',
      'Cubiertas','Adelanto','Lts','Precio Comb','Total Comb','Tarifa s/IVA','Tarifa c/IVA',
      'Saldo Prov','Neto','Obs'
    ];
    sh.getRange(3,1,1,headers.length).setValues([headers]);
    sh.setFrozenRows(3);
  }
  return sh;
}

function escribirDetalleLiquidacion_(nLiq, proveedor, viajes, fechaLiq) {

  const sh = ensureDetalleSheet_();
  const rows = [];

  viajes.forEach(v => {

    const tarifaSI  = Number(v.tarifa)||0;
    const tarifaCI  = tarifaSI * (1 + IVA_RATE);
    const saldoProv = (v.cubiertas||0) + (v.adelanto||0) + (v.totalComb||0);
    const neto      = tarifaCI - saldoProv;

    rows.push([
      '',
      nLiq,
      fechaLiq,
      v.nViaje,
      v.fecha,
      proveedor,
      v.cliente,
      v.salida,
      v.remito,
      v.cubiertas||0,
      v.adelanto||0,
      v.lts||0,
      v.precioComb||0,
      v.totalComb||0,
      tarifaSI,
      tarifaCI,
      saldoProv,
      neto,
    ]);
  });

  sh.getRange(sh.getLastRow()+1, 1, rows.length, rows[0].length).setValues(rows);
}

/********************************************************************
 * ESCRIBIR CABECERA LIQUIDACIÓN
 ********************************************************************/
function escribirCabeceraLiquidacion_(nLiq, proveedor, desdeISO, hastaISO, fecha, totalSIVA, totalCIVA, saldoProv, adeudadoFinal) {

  const sh = getSheet_(SH_LIQUIDACIONES);

  if (sh.getLastRow() === 0) {
    sh.appendRow(['','N° Liquidación','Fecha','Proveedor','Desde','Hasta','Saldo Prov.','Total s/IVA','Total c/IVA','Adeudado','Estado']);
    sh.setFrozenRows(1);
  }

  sh.appendRow([
    '',
    nLiq,
    fecha,
    proveedor,
    desdeISO,
    hastaISO,
    saldoProv,
    totalSIVA,
    totalCIVA,
    adeudadoFinal,
    'Pendiente'
  ]);
}

/********************************************************************
 * LISTAR LIQUIDACIONES (para el modal PDF)
 ********************************************************************/
function obtenerLiquidaciones() {
  const sh = SpreadsheetApp.getActive().getSheetByName("Liquidaciones");
  const last = sh.getLastRow();

  if (last < 4) return [];

  const rowsCount = last - 3;

  const numeros     = sh.getRange(4, 2, rowsCount, 1).getValues();
  const fechas      = sh.getRange(4, 3, rowsCount, 1).getValues();
  const proveedores = sh.getRange(4, 4, rowsCount, 1).getValues();
  const estados     = sh.getRange(4, 11, rowsCount, 1).getValues();

  const out = [];

  for (let i = 0; i < rowsCount; i++) {
    const numero = numeros[i][0];
    if (!numero) continue;

    const fecha = fechas[i][0];

    out.push({
      numero,
      proveedor: proveedores[i][0] || "",
      fecha: fecha instanceof Date
              ? Utilities.formatDate(fecha, "America/Argentina/Buenos_Aires", "yyyy-MM-dd")
              : fecha,
      estado: estados[i][0] || ""
    });
  }

  return out;
}

