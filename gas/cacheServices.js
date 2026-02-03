// Manejo de servicios de caché en la aplicación

function precargarProveedores() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName("Proveedores");
    const last = sh.getLastRow();

    if (last < 2) return; // No hay datos

    const data = sh.getRange(2, 1, last - 1, 1).getValues().map(r => r[0]).filter(Boolean);

    const cache = CacheService.getScriptCache();
    cache.put("proveedores", JSON.stringify(data), 21600); // Cache por 6 horas

    return data;
}

function obtenerProveedores() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get("proveedores");

  if (cached) {
    return JSON.parse(cached);
  }

  // Si no hay cache → recalcular
  return precargarProveedores();
}

function precargarViajes(proveedor, desdeISO, hastaISO) {
  const clave = `viajes_${proveedor}_${desdeISO}_${hastaISO}`;

  const cache = CacheService.getScriptCache();
  const cached = cache.get(clave);
  if (cached) return JSON.parse(cached);

  // Si no existe en cache → calcular
  const viajes = obtenerViajesCandidatos(proveedor, desdeISO, hastaISO);

  cache.put(clave, JSON.stringify(viajes), 21600);

  return viajes;
}
