/********************************************************************
 * pdfLiquidaciones.js
 * Build a single PDF with 2 pages:
 *  - Page 1: Viajes
 *  - Page 2: Gastos
 ********************************************************************/

const PDF_VIAJES_TEMPLATE_ID = '1-Ex7nRUSY24kfKoAHKaeKYmo0yk2JX2wnFKwjKsEtD4';
const PDF_GASTOS_TEMPLATE_ID = '1_661bTvPniWO0YyYsdQdhhvINYGHjWgmRZ7PPCyPPSg';
const PDF_DEST_FOLDER_ID = '1O1jkcIEs3IhA3KveV1RA0v01yNXnfpCD';
const PDF_TIMEZONE = 'America/Argentina/Buenos_Aires';

function generarPDFLiquidacion(nroLiq) {
  const numero = String(nroLiq || '').trim();
  if (!numero) throw new Error('Numero de liquidacion invalido');

  const data = _pdfGetLiquidacionData_(numero);
  const folder = DriveApp.getFolderById(PDF_DEST_FOLDER_ID);

  const viajesDocFile = DriveApp.getFileById(PDF_VIAJES_TEMPLATE_ID)
    .makeCopy('Liquidacion_' + numero + '_tmp_viajes', folder);
  const gastosDocFile = DriveApp.getFileById(PDF_GASTOS_TEMPLATE_ID)
    .makeCopy('Liquidacion_' + numero + '_tmp_gastos', folder);

  const viajesDoc = DocumentApp.openById(viajesDocFile.getId());
  const gastosDoc = DocumentApp.openById(gastosDocFile.getId());

  _pdfFillViajesTemplate_(viajesDoc, data);
  _pdfFillGastosTemplate_(gastosDoc, data);

  viajesDoc.saveAndClose();
  gastosDoc.saveAndClose();

  const mergeDoc = DocumentApp.openById(viajesDocFile.getId());
  const mergeBody = mergeDoc.getBody();
  const gastosBody = DocumentApp.openById(gastosDocFile.getId()).getBody();

  mergeBody.appendPageBreak();
  _pdfAppendBodyElements_(mergeBody, gastosBody);
  mergeDoc.saveAndClose();

  const pdfBlob = viajesDocFile.getAs(MimeType.PDF).setName('Liquidacion_' + numero + '.pdf');
  const pdfFile = folder.createFile(pdfBlob);

  DriveApp.getFileById(viajesDocFile.getId()).setTrashed(true);
  DriveApp.getFileById(gastosDocFile.getId()).setTrashed(true);

  _pdfEnviarEmail_(data.email, numero, pdfBlob);

  return { pdfUrl: pdfFile.getUrl() };
}

function _pdfGetLiquidacionData_(nroLiq) {
  const sh = SpreadsheetApp.getActive().getSheetByName('Liquidaciones');
  if (!sh) throw new Error('No existe hoja Liquidaciones');

  const last = sh.getLastRow();
  if (last < 4) throw new Error('No hay liquidaciones cargadas');

  const values = sh.getRange(4, 1, last - 3, sh.getLastColumn()).getValues();
  let cab = null;

  values.some(function (row) {
    if (String(row[1] || '').trim() !== nroLiq) return false; // B

    cab = {
      nro: nroLiq,
      fecha: row[2],
      fechaDMY: _pdfFormatFechaDMY_(row[2]),
      proveedor: String(row[3] || '').trim(),
      desde: row[4],
      desdeDMY: _pdfFormatFechaDMY_(row[4]),
      hasta: row[5],
      hastaDMY: _pdfFormatFechaDMY_(row[5]),
      gastosPeriodo: _pdfToNumber_(row[6]),
      totalSIVA: _pdfToNumber_(row[7]),
      totalCIVA: _pdfToNumber_(row[8]),
      totalFinal: _pdfToNumber_(row[9]),
    };

    return true;
  });

  if (!cab) throw new Error('No existe la liquidacion ' + nroLiq);

  const viajes = _pdfGetViajesDetalle_(nroLiq);
  const gastos = _pdfGetGastosDetalle_(cab.proveedor, cab.desde, cab.hasta);
  const gastosCalc = gastos.reduce(function (acc, g) {
    return acc + g.cubiertas + g.adelanto + g.totalComb;
  }, 0);
  const descuentos = cab.gastosPeriodo || gastosCalc;
  const provData = _pdfGetProveedorData_(cab.proveedor);

  return {
    nro: cab.nro,
    fechaDMY: cab.fechaDMY,
    proveedor: cab.proveedor,
    desdeDMY: cab.desdeDMY,
    hastaDMY: cab.hastaDMY,
    totalSIVA: cab.totalSIVA,
    totalCIVA: cab.totalCIVA,
    totalFinal: cab.totalFinal,
    descuentos: descuentos,
    viajes: viajes,
    gastos: gastos,
    patente: provData.patente,
    email: provData.email,
  };
}

function _pdfGetViajesDetalle_(nroLiq) {
  const sh = SpreadsheetApp.getActive().getSheetByName('Liquidaciones_Detalle');
  if (!sh) return [];

  const last = sh.getLastRow();
  if (last < 4) return [];

  const values = sh.getRange(4, 1, last - 3, sh.getLastColumn()).getValues();
  const out = [];

  values.forEach(function (row) {
    if (String(row[1] || '').trim() !== nroLiq) return; // B

    out.push({
      fecha: _pdfFormatFechaDMY_(row[4]),      // E Fecha Viaje
      salida: String(row[7] || '').trim(),     // H Salida
      remito: String(row[8] || '').trim(),     // I Remito Viaje
      cliente: String(row[6] || '').trim(),    // G Cliente
      tarifa: _pdfToNumber_(row[9]),           // J Tarifa s/IVA
    });
  });

  return out;
}

function _pdfGetGastosDetalle_(proveedor, desdeRaw, hastaRaw) {
  const sh = SpreadsheetApp.getActive().getSheetByName('Gastos');
  if (!sh) return [];

  const last = sh.getLastRow();
  if (last < 4) return [];

  const desde = _pdfToDate_(desdeRaw);
  const hasta = _pdfToDate_(hastaRaw);

  const values = sh.getRange(4, 1, last - 3, 8).getValues(); // A:H
  const out = [];

  values.forEach(function (row) {
    const fecha = _pdfToDate_(row[0]);
    const chofer = String(row[1] || '').trim();

    if (!fecha) return;
    if (String(chofer).toLowerCase() !== String(proveedor || '').trim().toLowerCase()) return;
    if (!_pdfIsDateInRange_(fecha, desde, hasta)) return;

    out.push({
      fecha: _pdfFormatFechaDMY_(row[0]),
      cubiertas: _pdfToNumber_(row[2]),
      adelanto: _pdfToNumber_(row[3]),
      ltsComb: _pdfToNumber_(row[4]),
      montoComb: _pdfToNumber_(row[5]),
      totalComb: _pdfToNumber_(row[6]),
      remitoComb: String(row[7] || '').trim(),
    });
  });

  return out;
}

function _pdfFillViajesTemplate_(doc, data) {
  _pdfReplaceInDoc_(doc, '{{Liq_N}}', data.nro);
  _pdfReplaceInDoc_(doc, '{{Fecha_Liq}}', data.fechaDMY);
  _pdfReplaceInDoc_(doc, '{{Chofer}}', data.proveedor);
  _pdfReplaceInDoc_(doc, '{{Patente}}', data.patente || '');
  _pdfReplaceInDoc_(doc, '{{Desde}}', data.desdeDMY);
  _pdfReplaceInDoc_(doc, '{{Hasta}}', data.hastaDMY);

  _pdfReplaceInDoc_(doc, '{{TOTAL_SIVA}}', _pdfFormatARS_(data.totalSIVA));
  _pdfReplaceInDoc_(doc, '{{TOTAL_CIVA}}', _pdfFormatARS_(data.totalCIVA));
  _pdfReplaceInDoc_(doc, '{{DESCUENTOS}}', _pdfFormatARS_(data.descuentos));
  _pdfReplaceInDoc_(doc, '{{TOTAL}}', _pdfFormatARS_(data.totalFinal));

  _pdfInsertTableRows_(doc.getBody(), data.viajes, ['{{DET_FECHA}}', '{{DET_SALIDA}}', '{{DET_REMITO}}', '{{DET_CLIENTE}}', '{{DET_TARIFA}}'], function (row, item) {
    row.replaceText('{{DET_FECHA}}', item.fecha);
    row.replaceText('{{DET_SALIDA}}', item.salida);
    row.replaceText('{{DET_REMITO}}', item.remito);
    row.replaceText('{{DET_CLIENTE}}', item.cliente);
    row.replaceText('{{DET_TARIFA}}', _pdfFormatARS_(item.tarifa));
  });
}

function _pdfFillGastosTemplate_(doc, data) {
  _pdfReplaceInDoc_(doc, '{{Chofer}}', data.proveedor);
  _pdfReplaceInDoc_(doc, '{{Patente}}', data.patente || '');
  _pdfReplaceInDoc_(doc, '{{Desde}}', data.desdeDMY);
  _pdfReplaceInDoc_(doc, '{{Hasta}}', data.hastaDMY);

  _pdfReplaceInDoc_(doc, '{{DESCUENTOS}}', _pdfFormatARS_(data.descuentos));

  _pdfInsertTableRows_(doc.getBody(), data.gastos, ['{{DET_FECHA}}', '{{DET_CUB}}', '{{DET_ADEL}}', '{{DET_LTCOMB}}', '{{DET_PCOMB}}', '{{DET_TOTALCOMB}}', '{{DET_RCOMB}}'], function (row, item) {
    row.replaceText('{{DET_FECHA}}', item.fecha);
    row.replaceText('{{DET_CUB}}', _pdfFormatARS_(item.cubiertas));
    row.replaceText('{{DET_ADEL}}', _pdfFormatARS_(item.adelanto));
    row.replaceText('{{DET_LTCOMB}}', _pdfFormatNumber_(item.ltsComb));
    row.replaceText('{{DET_PCOMB}}', _pdfFormatARS_(item.montoComb));
    row.replaceText('{{DET_TOTALCOMB}}', _pdfFormatARS_(item.totalComb));
    row.replaceText('{{DET_RCOMB}}', item.remitoComb);
  });
}

function _pdfInsertTableRows_(body, rows, tokenCandidates, replaceFn) {
  const found = _pdfFindTemplateTableRow_(body, tokenCandidates);
  if (!found) throw new Error('No se encontro la fila plantilla de detalle');

  const table = found.table;
  const templateRowIndex = found.rowIndex;
  const templateRow = table.getRow(templateRowIndex).copy();

  while (table.getNumRows() > templateRowIndex) {
    table.removeRow(templateRowIndex);
  }

  const safeRows = rows && rows.length ? rows : [null];
  safeRows.forEach(function (item) {
    const newRow = templateRow.copy();
    replaceFn(newRow, item || {
      fecha: '', salida: '', remito: '', cliente: '', tarifa: 0,
      cubiertas: 0, adelanto: 0, ltsComb: 0, montoComb: 0, totalComb: 0, remitoComb: ''
    });
    table.appendTableRow(newRow);
  });
}

function _pdfFindTemplateTableRow_(body, tokenCandidates) {
  const tokens = tokenCandidates || [];
  const tables = body.getTables();

  for (var t = 0; t < tables.length; t++) {
    var table = tables[t];
    for (var r = 0; r < table.getNumRows(); r++) {
      var rowText = table.getRow(r).getText();
      var hasToken = tokens.some(function (token) {
        return rowText.indexOf(token) !== -1;
      });
      if (hasToken) {
        return { table: table, rowIndex: r };
      }
    }
  }

  return null;
}

function _pdfAppendBodyElements_(targetBody, sourceBody) {
  for (var i = 0; i < sourceBody.getNumChildren(); i++) {
    var child = sourceBody.getChild(i).copy();
    var type = child.getType();

    if (type === DocumentApp.ElementType.PARAGRAPH) {
      targetBody.appendParagraph(child.asParagraph());
    } else if (type === DocumentApp.ElementType.TABLE) {
      targetBody.appendTable(child.asTable());
    } else if (type === DocumentApp.ElementType.LIST_ITEM) {
      targetBody.appendListItem(child.asListItem());
    } else if (type === DocumentApp.ElementType.PAGE_BREAK) {
      targetBody.appendPageBreak();
    } else if (type === DocumentApp.ElementType.HORIZONTAL_RULE) {
      targetBody.appendHorizontalRule();
    }
  }
}

function _pdfReplaceInDoc_(doc, token, value) {
  var text = String(value == null ? '' : value);

  var header = doc.getHeader();
  if (header) header.replaceText(token, text);

  doc.getBody().replaceText(token, text);

  var footer = doc.getFooter();
  if (footer) footer.replaceText(token, text);
}

function _pdfGetProveedorData_(nombre) {
  const sh = SpreadsheetApp.getActive().getSheetByName('Proveedores');
  if (!sh) return { email: '', patente: '' };

  const last = sh.getLastRow();
  if (last < 3) return { email: '', patente: '' };

  const headers = sh.getRange(2, 1, 1, sh.getLastColumn()).getValues()[0];
  const map = {};
  headers.forEach(function (h, idx) {
    const key = _pdfNormalizeHeader_(h);
    if (key) map[key] = idx + 1;
  });

  const nameCol = map.nombre || 1;
  const patenteCol = map.patente || 8;
  const mailCol = map.mail || 9;

  const rows = sh.getRange(3, 1, last - 2, sh.getLastColumn()).getValues();
  const target = String(nombre || '').trim().toLowerCase();

  for (var i = 0; i < rows.length; i++) {
    const row = rows[i];
    const prov = String(row[nameCol - 1] || '').trim().toLowerCase();
    if (prov !== target) continue;

    return {
      patente: String(row[patenteCol - 1] || '').trim(),
      email: String(row[mailCol - 1] || '').trim(),
    };
  }

  return { email: '', patente: '' };
}

function _pdfEnviarEmail_(dest, nro, pdfBlob) {
  if (!dest) return;

  MailApp.sendEmail({
    to: dest,
    subject: 'Liquidacion Nro ' + nro,
    body: 'Adjunto PDF de la liquidacion Nro ' + nro + '.',
    attachments: [pdfBlob],
  });
}

function _pdfFormatFechaDMY_(value) {
  const d = _pdfToDate_(value);
  if (!d) return '';
  return Utilities.formatDate(d, PDF_TIMEZONE, 'dd/MM/yyyy');
}

function _pdfFormatARS_(n) {
  const value = Number(n || 0);
  return value.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function _pdfFormatNumber_(n) {
  const value = Number(n || 0);
  return value.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function _pdfToNumber_(value) {
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

function _pdfToDate_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const raw = String(value == null ? '' : value).trim();
  if (!raw) return null;

  const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymd) {
    return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
  }

  const dmy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
  }

  const parsed = new Date(raw);
  if (isNaN(parsed.getTime())) return null;

  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function _pdfIsDateInRange_(date, desde, hasta) {
  if (!date) return false;
  if (desde && date < desde) return false;
  if (hasta && date > hasta) return false;
  return true;
}

function _pdfNormalizeHeader_(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}
