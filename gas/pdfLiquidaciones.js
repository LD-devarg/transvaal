/********************************************************************
 *  pdfLiquidaciones.js
 *  Generación de PDF + Envío de Email para Liquidaciones
 *
 *  ENCABEZADO:
 *    {{Liq_N}}
 *    {{Fecha_Liq}}
 *    {{Chofer}}
 *    {{Patente}}
 *    {{Desde}}
     {{Hasta}}
 *
 *  DETALLE (tabla nº2 en el body):
 *    {{DET_FECHA}}
 *    {{DET_SALIDA}}
 *    {{DET_CLIENTE}}
 *    {{DET_ADEL}}
 *    {{DET_CUB}}
 *    {{DET_COMB}}
 *    {{DET_TARIFA}}
 *
 *  TOTALES (footer):
 *    {{TOTAL_SIVA}}
 *    {{TOTAL_CIVA}}
 *    {{DESCUENTOS}}
 *    {{TOTAL}}
 ********************************************************************/

const PDF_DOC_TEMPLATE_ID = '1-Ex7nRUSY24kfKoAHKaeKYmo0yk2JX2wnFKwjKsEtD4';
const PDF_DEST_FOLDER_ID  = '1O1jkcIEs3IhA3KveV1RA0v01yNXnfpCD';
const TIMEZONE            = "America/Argentina/Buenos_Aires";
const IVA                 = 0.21;

/********************************************************************
 * FORMATEADORES
 ********************************************************************/
function formatFechaDMY(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, TIMEZONE, "dd/MM/yyyy");
  }

  if (!value || value === "") return "";

  // Si viene un string tipo yyyy-mm-dd → convertir a Date
  const parts = value.toString().split("-");
  if (parts.length === 3) {
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return Utilities.formatDate(d, TIMEZONE, "dd/MM/yyyy");
  }

  // Si viene cualquier otra cosa, intentar parsear
  const d2 = new Date(value);
  if (!isNaN(d2.getTime())) {
    return Utilities.formatDate(d2, TIMEZONE, "dd/MM/yyyy");
  }

  return ""; // si nada funciona
}


function formatARS(n) {
  n = Number(n || 0);
  return n.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/********************************************************************
 * PUBLIC: Generar PDF
 ********************************************************************/
function generarPDFLiquidacion(nroLiq) {

  console.log("=== INICIO generarPDFLiquidacion ===");
  console.log(">> nroLiq recibido:", nroLiq);

  // 1) Obtener datos consolidados
  console.log(">> Llamando _pdf_obtenerDatos...");
  const data = _pdf_obtenerDatos(nroLiq);
  console.log(">> Resultado _pdf_obtenerDatos:", JSON.stringify(data));

  if (!data) {
    console.error("ERROR: _pdf_obtenerDatos devolvió null");
    throw new Error("No se encontró la liquidación " + nroLiq);
  }

  // 2) Obtener plantilla
  console.log(">> Obteniendo plantilla PDF_DOC_TEMPLATE_ID:", PDF_DOC_TEMPLATE_ID);
  const tpl = DriveApp.getFileById(PDF_DOC_TEMPLATE_ID);
  console.log(">> Plantilla encontrada:", tpl.getName());

  // 3) Copiar plantilla
  console.log(">> Copiando plantilla a carpeta destino:", PDF_DEST_FOLDER_ID);
  const copy = tpl.makeCopy(`Liquidación_${nroLiq}`, DriveApp.getFolderById(PDF_DEST_FOLDER_ID));
  console.log(">> Copia creada con ID:", copy.getId());

  const doc = DocumentApp.openById(copy.getId());
  console.log(">> Documento abierto correctamente.");

  const body = doc.getBody();
  const header = doc.getHeader();
  const footer = doc.getFooter();

  // 4) Reemplazo de encabezado
  console.log(">> Reemplazando encabezado...");
  header.replaceText('{{Liq_N}}', nroLiq);
  header.replaceText('{{Fecha_Liq}}', data.fechaDMY);

  body.replaceText('{{Chofer}}', data.proveedor);
  body.replaceText('{{Patente}}', data.patente);
  body.replaceText('{{Desde}}', data.desdeDMY);
  body.replaceText('{{Hasta}}', data.hastaDMY);

  // 5) Insertar detalle
  console.log(">> Insertando detalle. Cantidad filas:", data.detalle.length);
  _pdf_insertarDetalle(doc, data.detalle);
  console.log(">> Detalle insertado.");

  // 6) Totales
  console.log(">> Insertando totales...");
  footer.replaceText('{{TOTAL_SIVA}}', formatARS(data.totalSIVA));
  footer.replaceText('{{TOTAL_CIVA}}', formatARS(data.totalCIVA));
  footer.replaceText('{{DESCUENTOS}}', formatARS(data.descuentos));
  footer.replaceText('{{TOTAL}}', formatARS(data.totalFinal));
  console.log(">> Totales insertados.");

  doc.saveAndClose();
  console.log(">> Documento guardado.");

  // 7) Convertir a PDF
  console.log(">> Generando PDF...");
  const pdfBlob = copy.getAs(MimeType.PDF);
  console.log(">> PDF generado. Tamaño:", pdfBlob.getBytes().length);

  pdfBlob.setName(`Liquidación_${nroLiq}.pdf`);

  const folder = DriveApp.getFolderById(PDF_DEST_FOLDER_ID);
  const pdfFile = folder.createFile(pdfBlob);

  // 8) Eliminar copia DOC
  console.log(">> Eliminando copia temporal DOC...");
  DriveApp.getFileById(copy.getId()).setTrashed(true);

  // 9) Enviar email
  console.log(">> Enviando email a:", data.email);
  _pdf_enviarEmail(data.email, nroLiq, pdfBlob);
  console.log(">> Email enviado.");

  console.log("=== FIN generarPDFLiquidacion ===");

  return { pdfUrl: pdfFile.getUrl() };
}


/********************************************************************
 * Obtener datos completos de cabecera + detalle + totales
 ********************************************************************/
function _pdf_obtenerDatos(nLiq) {

  console.log(">> _pdf_obtenerDatos INICIO para:", nLiq);

  const shL = SpreadsheetApp.getActive().getSheetByName("Liquidaciones");
  const last = shL.getLastRow();

  console.log(">> Liquidaciones lastRow:", last);

  const rows = shL.getRange(4,1,last-3, shL.getLastColumn()).getValues();
  console.log(">> Cantidad de filas leídas:", rows.length);

  let cab = null;

  rows.forEach((r, idx) => {
    console.log(`>>> Revisando fila ${idx+4}:`, r[1]);

    if (String(r[1]) === nLiq) {

      console.log(">>> Coincidencia encontrada en fila:", idx+4);

      cab = {
        nro: nLiq,
        fecha: r[2],
        fechaDMY: formatFechaDMY(r[2]),
        proveedor: r[3],
        desde: r[4],
        desdeDMY: r[4] ? formatFechaDMY(r[4]) : "",
        hasta: r[5],
        hastaDMY: r[5] ? formatFechaDMY(r[5]) : "",
        totalSIVA: Number(r[7] || 0),
        totalCIVA: Number(r[8] || 0),
        totalFinal: Number(r[9] || 0)
      };
    }
  });

  console.log(">> CAB encontrada:", cab);

  if (!cab) throw new Error("No existe la cabecera de la liquidación.");

  const detalle = _pdf_obtenerDetalle(nLiq);
  console.log(">> Detalle obtenido:", detalle.length);

  const descuentos = detalle.reduce((acc, d) =>
    acc + d.adelanto + d.cubiertas + d.combustible, 0);

  const { email, patente } = _pdf_datosProveedor(cab.proveedor);

  return { ...cab, descuentos, detalle, email, patente };
}


/********************************************************************
 * Leer detalle desde Liquidaciones_Detalle
 ********************************************************************/
function _pdf_obtenerDetalle(nLiq) {

  console.log(">> _pdf_obtenerDetalle INICIO para:", nLiq);

  const sh = SpreadsheetApp.getActive().getSheetByName("Liquidaciones_Detalle");
  const last = sh.getLastRow();

  console.log(">> Liquidaciones_Detalle lastRow:", last);

  const rows = sh.getRange(4,1,last-3, sh.getLastColumn()).getValues();
  console.log(">> Cantidad de filas leídas:", rows.length);

  const out = [];

  rows.forEach((r, idx) => {
    if (String(r[1]) === nLiq) {
      console.log(">>> Detalle encontrado en fila:", idx+4);

      out.push({
        fecha: formatFechaDMY(r[4]),
        salida: r[7],
        cliente: r[6],
        remito: r[7],
        cubiertas: Number(r[9] || 0),
        adelanto: Number(r[10] || 0),
        combustible: Number(r[13] || 0),
        tarifa: Number(r[14] || 0)
      });
    }
  });

  console.log(">> Detalle total:", out.length);

  return out;
}


/********************************************************************
 * Insertar detalle en tabla #2
 ********************************************************************/
function _pdf_insertarDetalle(doc, detalleRows) {
  const body = doc.getBody();
  const tables = body.getTables();

  if (tables.length < 2) throw new Error("La plantilla no tiene tabla #2.");

  const table = tables[1];

  // Fila plantilla = fila 1 (la que tiene {{DET_*}})
  const templateRow = table.getRow(1).copy();  

  // Borrar filas previas (dejamos encabezado y plantilla)
  while (table.getNumRows() > 2) {
    table.removeRow(2);
  }

  // Insertar filas
  detalleRows.forEach(d => {
    const newRow = templateRow.copy();

    newRow.replaceText('{{DET_FECHA}}', d.fecha);
    newRow.replaceText('{{DET_SALIDA}}', d.salida);
    newRow.replaceText('{{DET_CLIENTE}}', d.cliente);
    newRow.replaceText('{{DET_ADEL}}', formatARS(d.adelanto));
    newRow.replaceText('{{DET_CUB}}', formatARS(d.cubiertas));
    newRow.replaceText('{{DET_COMB}}', formatARS(d.combustible));
    newRow.replaceText('{{DET_TARIFA}}', formatARS(d.tarifa));

    table.appendTableRow(newRow);
  });

  // borrar plantilla
  table.removeRow(1);
}


/********************************************************************
 * Datos del proveedor
 ********************************************************************/
function _pdf_datosProveedor(nombre) {

  const sh = SpreadsheetApp.getActive().getSheetByName("Proveedores");
  const last = sh.getLastRow();
  if (last < 2) return { email: "", patente: "" };

  const rows = sh.getRange(2,1,last-1, sh.getLastColumn()).getValues();
  const target = nombre.toLowerCase().trim();

  for (let r of rows) {
    const prov = String(r[0] || "").toLowerCase().trim();
    if (prov === target) {
      return {
        patente: r[1] || "",
        email: r[3] || ""
      };
    }
  }
  return { email: "", patente: "" };
}

/********************************************************************
 * Envío de email
 ********************************************************************/
function _pdf_enviarEmail(dest, nro, pdfBlob) {
  if (!dest) {
    console.log("Proveedor sin email, no se envía.");
    return;
  }

  MailApp.sendEmail({
    to: dest,
    subject: `Liquidación N° ${nro}`,
    body: `Adjunto PDF de la liquidación N° ${nro}.`,
    attachments: [pdfBlob]
  });

  console.log(`Email enviado a ${dest}`);
}
