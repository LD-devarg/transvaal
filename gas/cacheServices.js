// Manejo de servicios de cache en la aplicacion

function precargarProveedores() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName("Proveedores");
  if (!sh) return [];

  const last = sh.getLastRow();
  const startRow = 3;

  if (last < startRow) return []; // No hay datos

  const data = sh
    .getRange(startRow, 1, last - startRow + 1, 1)
    .getValues()
    .map((r) => String(r[0] || "").trim())
    .filter(Boolean);

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

  // Si no hay cache -> recalcular
  return precargarProveedores();
}

function getProveedores() {
  return obtenerProveedores() || [];
}

function precargarViajes(proveedor, desdeISO, hastaISO) {
  const clave = `viajes_${proveedor}_${desdeISO}_${hastaISO}`;

  const cache = CacheService.getScriptCache();
  const cached = cache.get(clave);
  if (cached) return JSON.parse(cached);

  // Si no existe en cache -> calcular
  const viajes = obtenerViajesCandidatos(proveedor, desdeISO, hastaISO);

  cache.put(clave, JSON.stringify(viajes), 21600);

  return viajes;
}

function getCachedJson_(key) {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(key);
  if (!cached) return null;

  try {
    return JSON.parse(cached);
  } catch (_error) {
    return null;
  }
}

function putCachedJson_(key, value, ttlSeconds) {
  const cache = CacheService.getScriptCache();
  cache.put(key, JSON.stringify(value), ttlSeconds);
}
