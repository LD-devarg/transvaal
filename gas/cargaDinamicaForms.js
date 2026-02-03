function cargarLiquidacionesDinamicamente() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Helpers");
  const form = FormApp.openById("1g89qyuOr-SsB8XYEnes2XTS_hmoghaeYRe2hfy5ugXQ");

  const last = sheet.getLastRow();
  if (last < 2) return;

  const data = sheet.getRange(2, 1, last - 1, 5).getValues();

  // Construcción de listas únicas
  const listas = {
    "Liquidación asociada": [...new Set(data.map(r => r[0]).filter(Boolean))]
  };

  const items = form.getItems();

  // Recorremos cada lista y actualizamos TODAS las preguntas que coincidan por título
  Object.entries(listas).forEach(([titulo, valores]) => {
    items.forEach(item => {
      if (item.getTitle() === titulo) {
        item.asListItem().setChoiceValues(valores);
      }
    });
  });

  Logger.log("Preguntas dinámicas de Liquidación actualizadas.");
}

function cargarViajesDinamicamente() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Helpers");
  const form = FormApp.openById("1g89qyuOr-SsB8XYEnes2XTS_hmoghaeYRe2hfy5ugXQ");

  const last = sheet.getLastRow();
  if (last < 2) return;

  const data = sheet.getRange(2, 1, last - 1, 5).getValues();

  // Construcción de listas únicas
  const listas = {
    "Viaje Relacionado": [...new Set(data.map(r => r[4]).filter(Boolean))]
  };

  const items = form.getItems();

  // Recorremos cada lista y actualizamos TODAS las preguntas que coincidan por título
  Object.entries(listas).forEach(([titulo, valores]) => {
    items.forEach(item => {
      if (item.getTitle() === titulo) {
        item.asListItem().setChoiceValues(valores);
      }
    });
  });

  Logger.log("Preguntas dinámicas de Viaje Relacionado actualizadas.");
}

function cargarPreguntasDinamicamente() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Helpers");
  const form = FormApp.openById("1g89qyuOr-SsB8XYEnes2XTS_hmoghaeYRe2hfy5ugXQ");

  const last = sheet.getLastRow();
  if (last < 2) return;

  const data = sheet.getRange(2, 1, last - 1, 5).getValues();

  // LISTAS CORRECTAS según estructura Helpers
  const listas = {
    "Cliente":   [...new Set(data.map(r => r[1]).filter(Boolean))],
    "Proveedor": [...new Set(data.map(r => r[2]).filter(Boolean))],
    "Salida":    [...new Set(data.map(r => r[3]).filter(Boolean))]
  };

  const items = form.getItems();

  Object.entries(listas).forEach(([titulo, valores]) => {
    items.forEach(item => {

      // Solo aplicar a ListItem, no otros ítems
      if (item.getType() === FormApp.ItemType.LIST && item.getTitle() === titulo) {
        item.asListItem().setChoiceValues(valores);
      }

    });
  });

  Logger.log("Preguntas dinámicas actualizadas.");
}
