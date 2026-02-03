const GAS_WEBAPP_URL = import.meta.env.VITE_GAS_WEBAPP_URL;

export async function loginWithPin({ username, pin }) {
  if (!GAS_WEBAPP_URL) {
    throw new Error("Falta configurar VITE_GAS_WEBAPP_URL");
  }

  const payload = {
    action: "login",
    username: String(username || "").trim(),
    pin: String(pin || "").trim(),
  };

  const response = await fetch(GAS_WEBAPP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(payload),
  });

  const rawBody = await response.text();
  let data = {};

  try {
    data = JSON.parse(rawBody);
  } catch (_error) {
    throw new Error("Respuesta invalida del servidor");
  }

  if (!response.ok || !data.ok) {
    throw new Error(data.message || "Credenciales invalidas");
  }

  return data;
}
