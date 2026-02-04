const GAS_WEBAPP_URL = import.meta.env.VITE_GAS_WEBAPP_URL;
const CACHE_OPTIONS_KEY = "viajes_options_v1";
const CACHE_OPTIONS_TTL_MS = 10 * 60 * 1000;
const CACHE_SALIDAS_PREFIX = "salidas_by_cliente_v1_";
const CACHE_SALIDAS_TTL_MS = 5 * 60 * 1000;

async function requestApi(params) {
  if (!GAS_WEBAPP_URL) {
    throw new Error("Falta configurar VITE_GAS_WEBAPP_URL");
  }

  const searchParams = new URLSearchParams(params);

  const response = await fetch(`${GAS_WEBAPP_URL}?${searchParams.toString()}`, {
    method: "GET",
  });

  const rawBody = await response.text();
  let data = {};

  try {
    data = JSON.parse(rawBody);
  } catch (_error) {
    throw new Error("Respuesta invalida del servidor");
  }

  if (!response.ok || !data.ok) {
    throw new Error(data.message || "Error de servidor");
  }

  return data;
}

function getSessionCache(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.expiresAt) return null;
    if (Date.now() > parsed.expiresAt) {
      sessionStorage.removeItem(key);
      return null;
    }
    return parsed.value;
  } catch (_error) {
    return null;
  }
}

function setSessionCache(key, value, ttlMs) {
  try {
    const payload = {
      value,
      expiresAt: Date.now() + ttlMs,
    };
    sessionStorage.setItem(key, JSON.stringify(payload));
  } catch (_error) {
    // ignore quota/serialization errors
  }
}

export async function loginWithPin({ username, pin }) {
  return requestApi({
    action: "login",
    username: String(username || "").trim(),
    pin: String(pin || "").trim(),
  });
}

export async function fetchViajesFormOptions() {
  const cached = getSessionCache(CACHE_OPTIONS_KEY);
  if (cached) return cached;

  const data = await requestApi({ action: "viajes_options" });
  setSessionCache(CACHE_OPTIONS_KEY, data, CACHE_OPTIONS_TTL_MS);
  return data;
}

export async function fetchSalidasByCliente(cliente) {
  if (!cliente) {
    return { ok: true, salidas: [] };
  }

  const normalizedClient = String(cliente).trim();
  const cacheKey = `${CACHE_SALIDAS_PREFIX}${normalizedClient.toLowerCase()}`;
  const cached = getSessionCache(cacheKey);
  if (cached) return cached;

  const data = await requestApi({
    action: "salidas_by_cliente",
    cliente: normalizedClient,
  });
  setSessionCache(cacheKey, data, CACHE_SALIDAS_TTL_MS);
  return data;
}

export async function saveViaje(payload) {
  return requestApi({
    action: "save_viaje",
    fecha: payload.fecha,
    salida: payload.salida,
    cliente: payload.cliente,
    chofer: payload.chofer,
    remito: payload.remito || "",
  });
}

export async function saveGasto(payload) {
  return requestApi({
    action: "save_gasto",
    fecha: payload.fecha,
    cubiertas: payload.cubiertas || 0,
    adelantoOtros: payload.adelantoOtros || 0,
    ltsComb: payload.ltsComb || 0,
    montoComb: payload.montoComb || 0,
    remitoComb: payload.remitoComb || "",
  });
}
