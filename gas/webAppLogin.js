const SHEET_ID = "1-NfIkZS761jBgJpLRa4YmOdr9VR7oPh_eiVb3Z9d-O4";
const USERS_SHEET_NAME = "Usuarios";

function doGet() {
  return jsonResponse({ ok: true, message: "web app activa" });
}

function doPost(e) {
  try {
    const payload = parsePayload_(e);

    if (payload.action === "login") {
      return loginByPin_(payload);
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
