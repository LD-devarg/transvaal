const SHEET_ID = "1-NfIkZS761jBgJpLRa4YmOdr9VR7oPh_eiVb3Z9d-O4";
const USERS_SHEET_NAME = "Usuarios";
const CLIENTS_SHEET_NAME = "Clientes";
const PROVIDERS_SHEET_NAME = "Proveedores";
const SALIDAS_SHEET_NAME = "Salidas";
const CACHE_TTL_OPTIONS_SECONDS = 1800; // 30 min
const CACHE_TTL_SALIDAS_SECONDS = 900; // 15 min
const CACHE_TTL_VIAJES_SIN_REMITO_SECONDS = 300; // 5 min

function doGet(e) {
  const action = e && e.parameter ? String(e.parameter.action || "") : "";

  if (action === "login") {
    const payload = {
      username: e.parameter.username || "",
      pin: e.parameter.pin || "",
    };
    return loginByPin_(payload);
  }
  if (action === "viajes_options") {
    return getViajesOptions_();
  }
  if (action === "salidas_by_cliente") {
    return getSalidasByCliente_(e.parameter.cliente || "");
  }
  if (action === "save_viaje") {
    return saveViaje_(e.parameter || {});
  }
  if (action === "save_gasto") {
    return saveGasto_(e.parameter || {});
  }
  if (action === "viajes_sin_remito") {
    return getViajesSinRemito_();
  }
  if (action === "save_remito") {
    return saveRemito_(e.parameter || {});
  }

  return jsonResponse({ ok: true, message: "web app activa" });
}

function doPost(e) {
  try {
    const payload = parsePayload_(e);

    if (payload.action === "login") {
      return loginByPin_(payload);
    }
    if (payload.action === "save_viaje") {
      return saveViaje_(payload);
    }
    if (payload.action === "save_gasto") {
      return saveGasto_(payload);
    }
    if (payload.action === "save_remito") {
      return saveRemito_(payload);
    }

    return jsonResponse({ ok: false, message: "Accion no soportada" });
  } catch (error) {
    return jsonResponse({ ok: false, message: error.message || "Error interno" });
  }
}

function loginByPin_(payload) {
  const username = String(payload.username || "").trim();
  const pin = String(payload.pin || "").trim();

  if (!username || !pin) {
    return jsonResponse({ ok: false, message: "Nombre y PIN son obligatorios" });
  }

  if (!/^\d{4}$/.test(pin)) {
    return jsonResponse({ ok: false, message: "El PIN debe tener 4 digitos" });
  }

  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(USERS_SHEET_NAME);
  if (!sheet) {
    return jsonResponse({ ok: false, message: "No existe la hoja Usuarios" });
  }

  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) {
    return jsonResponse({ ok: false, message: "No hay usuarios cargados" });
  }

  const headers = rows[0].map(function (cell) {
    return String(cell).trim();
  });
  const userCol = headers.indexOf("Usuario");
  const pinCol = headers.indexOf("PIN");
  const mailCol = headers.indexOf("Mail");

  if (userCol === -1 || pinCol === -1 || mailCol === -1) {
    return jsonResponse({ ok: false, message: "Faltan columnas Usuario, PIN o Mail" });
  }

  const userRow = rows.slice(1).find(function (row) {
    return (
      String(row[userCol] || "").trim().toLowerCase() === username.toLowerCase() &&
      String(row[pinCol] || "").trim() === pin
    );
  });

  if (!userRow) {
    return jsonResponse({ ok: false, message: "Credenciales invalidas" });
  }

  return jsonResponse({
    ok: true,
    user: {
      name: String(userRow[userCol] || ""),
      mail: String(userRow[mailCol] || ""),
    },
  });
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error("Body vacio");
  }

  return JSON.parse(e.postData.contents);
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getViajesOptions_() {
  const cacheKey = "viajes_options_v1";
  const cached = getCachedJson_(cacheKey);
  if (cached) {
    return jsonResponse({
      ok: true,
      clientes: cached.clientes || [],
      choferes: cached.choferes || [],
    });
  }

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const clients = getColumnValues_(ss, CLIENTS_SHEET_NAME, 1, 3);
  const choferes = getColumnValues_(ss, PROVIDERS_SHEET_NAME, 1, 3);
  putCachedJson_(cacheKey, { clientes: clients, choferes: choferes }, CACHE_TTL_OPTIONS_SECONDS);

  return jsonResponse({
    ok: true,
    clientes: clients,
    choferes: choferes,
  });
}

function getSalidasByCliente_(cliente) {
  const selectedClient = String(cliente || "").trim();
  if (!selectedClient) {
    return jsonResponse({ ok: true, salidas: [] });
  }

  const cacheKey = "salidas_by_cliente_v1_" + selectedClient.toLowerCase();
  const cached = getCachedJson_(cacheKey);
  if (cached && Array.isArray(cached.salidas)) {
    return jsonResponse({ ok: true, salidas: cached.salidas });
  }

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SALIDAS_SHEET_NAME);
  if (!sheet) {
    return jsonResponse({ ok: false, message: "No existe la hoja Salidas" });
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return jsonResponse({ ok: true, salidas: [] });
  }

  const values = sheet.getRange(2, 3, lastRow - 1, 2).getValues(); // C:Salida, D:Cliente
  const salidas = [];
  const seen = {};

  values.forEach(function (row) {
    const salida = String(row[0] || "").trim();
    const client = String(row[1] || "").trim();
    if (!salida || !client) return;
    if (client.toLowerCase() !== selectedClient.toLowerCase()) return;
    if (seen[salida]) return;
    seen[salida] = true;
    salidas.push(salida);
  });

  putCachedJson_(cacheKey, { salidas: salidas }, CACHE_TTL_SALIDAS_SECONDS);

  return jsonResponse({ ok: true, salidas: salidas });
}

function getColumnValues_(spreadsheet, sheetName, colNumber, startRow) {
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) return [];

  const lastRow = sheet.getLastRow();
  if (lastRow < startRow) return [];

  const values = sheet.getRange(startRow, colNumber, lastRow - startRow + 1, 1).getValues();
  const result = [];
  const seen = {};

  values.forEach(function (row) {
    const value = String(row[0] || "").trim();
    if (!value) return;
    const key = value.toLowerCase();
    if (seen[key]) return;
    seen[key] = true;
    result.push(value);
  });

  return result;
}

function saveViaje_(payload) {
  const fecha = String(payload.fecha || "").trim();
  const salida = String(payload.salida || "").trim();
  const cliente = String(payload.cliente || "").trim();
  const chofer = String(payload.chofer || "").trim();
  const remito = String(payload.remito || "").trim();

  if (!fecha || !salida || !cliente || !chofer) {
    return jsonResponse({ ok: false, message: "Faltan campos obligatorios de viaje" });
  }

  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Viajes");
  if (!sheet) {
    return jsonResponse({ ok: false, message: "No existe la hoja Viajes" });
  }

  const colMap = getHeaderColumns_(sheet, 3);
  const required = ["fecha", "salida", "cliente", "chofer"];
  const missing = required.filter(function (key) { return !colMap[key]; });
  if (missing.length > 0) {
    return jsonResponse({ ok: false, message: "Faltan columnas en Viajes: " + missing.join(", ") });
  }

  const nextRow = getNextDataRow_(sheet, 4, [colMap.salida, colMap.cliente, colMap.chofer]);
  sheet.getRange(nextRow, colMap.fecha).setValue(fecha);
  sheet.getRange(nextRow, colMap.salida).setValue(salida);
  sheet.getRange(nextRow, colMap.cliente).setValue(cliente);
  sheet.getRange(nextRow, colMap.chofer).setValue(chofer);
  const remitoCol = getViajesRemitoColumn_(sheet);
  if (remitoCol && remito) {
    sheet.getRange(nextRow, remitoCol).setValue(remito);
  }

  return jsonResponse({ ok: true, row: nextRow, message: "Viaje guardado" });
}

function saveGasto_(payload) {
  const fecha = String(payload.fecha || "").trim();
  const proveedor = String(payload.proveedor || "").trim();
  const cubiertas = toNumber_(payload.cubiertas);
  const adelantoOtros = toNumber_(payload.adelantoOtros);
  const ltsComb = toNumber_(payload.ltsComb);
  const montoComb = toNumber_(payload.montoComb);
  const remitoComb = String(payload.remitoComb || "").trim();
  const totalComb = round2_(ltsComb * montoComb * 0.9);

  if (!fecha) {
    return jsonResponse({ ok: false, message: "La fecha es obligatoria" });
  }

  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Gastos");
  if (!sheet) {
    return jsonResponse({ ok: false, message: "No existe la hoja Gastos" });
  }

  const colMap = getHeaderColumns_(sheet, 3);
  const proveedorCol = colMap.proveedor || colMap.chofer;
  const required = ["fecha", "cubiertas", "adelanto_otros", "lts_comb", "monto_comb", "total_comb", "remito_comb"];
  const missing = required.filter(function (key) { return !colMap[key]; });
  if (!proveedorCol) {
    missing.push("proveedor/chofer");
  }
  if (missing.length > 0) {
    return jsonResponse({ ok: false, message: "Faltan columnas en Gastos: " + missing.join(", ") });
  }

  const nextRow = getNextDataRow_(sheet, 4, [colMap.fecha, proveedorCol, colMap.cubiertas, colMap.lts_comb, colMap.monto_comb]);
  sheet.getRange(nextRow, colMap.fecha).setValue(fecha);
  sheet.getRange(nextRow, proveedorCol).setValue(proveedor);
  sheet.getRange(nextRow, colMap.cubiertas).setValue(cubiertas);
  sheet.getRange(nextRow, colMap.adelanto_otros).setValue(adelantoOtros);
  sheet.getRange(nextRow, colMap.lts_comb).setValue(ltsComb);
  sheet.getRange(nextRow, colMap.monto_comb).setValue(montoComb);
  sheet.getRange(nextRow, colMap.total_comb).setValue(totalComb);
  sheet.getRange(nextRow, colMap.remito_comb).setValue(remitoComb);

  return jsonResponse({ ok: true, row: nextRow, message: "Gasto guardado" });
}

function saveRemito_(payload) {
  const nViaje = String(payload.nViaje || "").trim();
  const remito = String(payload.remito || "").trim();

  if (!nViaje || !remito) {
    return jsonResponse({ ok: false, message: "Nro. de viaje y remito son obligatorios" });
  }

  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Viajes");
  if (!sheet) {
    return jsonResponse({ ok: false, message: "No existe la hoja Viajes" });
  }

  const colMap = getHeaderColumns_(sheet, 3);
  const nViajeCol = colMap.n_viaje;
  const remitoCol = getViajesRemitoColumn_(sheet);
  if (!nViajeCol || !remitoCol) {
    return jsonResponse({ ok: false, message: "No se encontraron columnas N° Viaje o Remito" });
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 4) {
    return jsonResponse({ ok: false, message: "No hay viajes cargados" });
  }

  const rowCount = lastRow - 3;
  const nViajes = sheet.getRange(4, nViajeCol, rowCount, 1).getValues();
  let foundRow = -1;
  for (var i = 0; i < nViajes.length; i++) {
    if (String(nViajes[i][0] || "").trim() === nViaje) {
      foundRow = i + 4;
      break;
    }
  }

  if (foundRow === -1) {
    return jsonResponse({ ok: false, message: "No se encontro el viaje seleccionado" });
  }

  const currentRemito = String(sheet.getRange(foundRow, remitoCol).getValue() || "").trim();
  if (currentRemito) {
    return jsonResponse({ ok: false, message: "Ese viaje ya tiene remito cargado" });
  }

  sheet.getRange(foundRow, remitoCol).setValue(remito);
  clearViajesSinRemitoCache_();

  return jsonResponse({ ok: true, row: foundRow, message: "Remito guardado" });
}

function getViajesSinRemito_() {
  const cacheKey = "viajes_sin_remito_v1";
  const cached = getCachedJson_(cacheKey);
  if (cached && Array.isArray(cached.viajes)) {
    return jsonResponse({ ok: true, viajes: cached.viajes });
  }

  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Viajes");
  if (!sheet) {
    return jsonResponse({ ok: false, message: "No existe la hoja Viajes" });
  }

  const colMap = getHeaderColumns_(sheet, 3);
  const nViajeCol = colMap.n_viaje;
  const fechaCol = colMap.fecha;
  const salidaCol = colMap.salida;
  const clienteCol = colMap.cliente;
  const choferCol = colMap.chofer;
  const remitoCol = getViajesRemitoColumn_(sheet);

  if (!nViajeCol || !fechaCol || !salidaCol || !clienteCol || !choferCol || !remitoCol) {
    return jsonResponse({ ok: false, message: "Faltan columnas requeridas en Viajes" });
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 4) {
    return jsonResponse({ ok: true, viajes: [] });
  }

  const rowCount = lastRow - 3;
  const lastCol = sheet.getLastColumn();
  const data = sheet.getRange(4, 1, rowCount, lastCol).getValues();
  const viajes = [];

  data.forEach(function (row) {
    const nViaje = String(row[nViajeCol - 1] || "").trim();
    const remito = String(row[remitoCol - 1] || "").trim();
    if (!nViaje || remito) return;

    const fecha = formatFechaDisplay_(row[fechaCol - 1]);
    const salida = String(row[salidaCol - 1] || "").trim();
    const cliente = String(row[clienteCol - 1] || "").trim();
    const chofer = String(row[choferCol - 1] || "").trim();

    const descripcion = [fecha, salida, cliente, chofer].filter(Boolean).join(" - ");
    viajes.push({
      id: nViaje,
      descripcion: descripcion || nViaje,
    });
  });

  putCachedJson_(cacheKey, { viajes: viajes }, CACHE_TTL_VIAJES_SIN_REMITO_SECONDS);
  return jsonResponse({ ok: true, viajes: viajes });
}

function getHeaderColumns_(sheet, headerRow) {
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(headerRow, 1, 1, lastCol).getValues()[0];
  const map = {};

  headers.forEach(function (value, idx) {
    const key = normalizeHeader_(value);
    if (!key) return;
    map[key] = idx + 1;
  });

  return map;
}

function normalizeHeader_(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\./g, "")
    .replace(/\$/g, "monto_")
    .replace(/\s+/g, "_")
    .replace(/[áàäâ]/g, "a")
    .replace(/[éèëê]/g, "e")
    .replace(/[íìïî]/g, "i")
    .replace(/[óòöô]/g, "o")
    .replace(/[úùüû]/g, "u")
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getViajesRemitoColumn_(sheet) {
  const row2 = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row3 = sheet.getRange(3, 1, 1, sheet.getLastColumn()).getValues()[0];

  for (var i = 0; i < row3.length; i++) {
    const section = normalizeHeader_(row2[i]);
    const header = normalizeHeader_(row3[i]);
    if (section === "remito" && header === "n") {
      return i + 1;
    }
  }

  return null;
}

function getNextDataRow_(sheet, startRow, columnsToCheck) {
  const lastRow = sheet.getLastRow();
  if (lastRow < startRow) return startRow;

  const maxRow = Math.max(lastRow, startRow);
  const valuesByColumn = columnsToCheck.map(function (col) {
    return sheet.getRange(startRow, col, maxRow - startRow + 1, 1).getValues();
  });

  for (var i = maxRow - startRow; i >= 0; i--) {
    var hasData = valuesByColumn.some(function (colValues) {
      return String(colValues[i][0] || "").trim() !== "";
    });
    if (hasData) return startRow + i + 1;
  }

  return startRow;
}

function toNumber_(value) {
  const raw = String(value == null ? "" : value).replace(",", ".").trim();
  if (!raw) return 0;
  const parsed = Number(raw);
  return isNaN(parsed) ? 0 : parsed;
}

function round2_(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatFechaDisplay_(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "dd/MM/yyyy");
  }
  return String(value || "").trim();
}

function clearViajesSinRemitoCache_() {
  CacheService.getScriptCache().remove("viajes_sin_remito_v1");
}
