// ─── CONFIGURACIÓN DE RED ─────────────────────────────────────────────────────
// IMPORTANTE: La PC y el teléfono deben estar en la MISMA red WiFi.
// Para obtener la IP correcta de tu PC:
//   Windows:   abre cmd y ejecuta:  ipconfig    (buscar IPv4 en tu adaptador activo)
//   Mac/Linux: abre terminal y ejecuta:  ifconfig  o  ip addr
// Luego reemplaza la IP de abajo (192.168.x.x) con la IP de tu PC.
//
// El backend debe iniciarse con:
//   uvicorn main:app --host 0.0.0.0 --port 8000
//
export const BASE_URL = 'http://192.168.100.93:8000';
export const WS_URL = 'ws://192.168.100.93:8000/ws';

// Normaliza paths: elimina dobles slashes y garantiza formato limpio
const normalizePath = (path) => {
  let p = path.startsWith('/') ? path : `/${path}`;
  return p;
};

let authToken = null;
let ws = null;
let wsListeners = [];
let wsRetryTimeout = null;
let wsRetryCount = 0;
let onSessionClosed = null;
const WS_MAX_RETRY = 10;
const WS_BASE_DELAY = 2000;

export const setToken = (token) => { authToken = token; };
export const clearToken = () => { authToken = null; };
export const setSessionClosedCallback = (fn) => { onSessionClosed = fn; };

export const connectWebSocket = (timeoutMs = 5000) => {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

  try {
    ws = new WebSocket(WS_URL);
  } catch (e) {
    scheduleReconnect();
    return;
  }

  const failTimer = setTimeout(() => {
    if (ws && ws.readyState !== WebSocket.OPEN) {
      ws.close();
      ws = null;
      scheduleReconnect();
    }
  }, timeoutMs);

  ws.onopen = () => {
    clearTimeout(failTimer);
    wsRetryCount = 0;
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      wsListeners.forEach(listener => listener(data));
    } catch (e) {
      // silent
    }
  };

  ws.onclose = () => {
    clearTimeout(failTimer);
    scheduleReconnect();
  };

  ws.onerror = () => {
    clearTimeout(failTimer);
    // onclose will handle reconnection
  };
};

const scheduleReconnect = () => {
  if (wsRetryCount >= WS_MAX_RETRY) return;
  const delay = Math.min(WS_BASE_DELAY * Math.pow(1.5, wsRetryCount), 30000);
  wsRetryCount++;
  wsRetryTimeout = setTimeout(() => connectWebSocket(3000), delay);
};

export const disconnectWebSocket = () => {
  if (wsRetryTimeout) clearTimeout(wsRetryTimeout);
  if (ws) ws.close();
  ws = null;
};

export const addWsListener = (listener) => {
  wsListeners.push(listener);
  return () => {
    wsListeners = wsListeners.filter(l => l !== listener);
  };
};

const request = async (path, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...options.headers,
  };
  const cleanPath = normalizePath(path);
  const url = `${BASE_URL}${cleanPath}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, { ...options, headers, signal: controller.signal });
    clearTimeout(timeoutId);
    const data = await response.json();
    if (!response.ok) {
      if (data.detail?.includes?.('Sesión cerrada') && onSessionClosed) {
        onSessionClosed();
      }
      throw new Error(data.detail || `Error ${response.status}`);
    }
    return data;
  } catch (e) {
    clearTimeout(timeoutId);
    if (e.name === 'AbortError') throw new Error('Tiempo de espera agotado. Verifica que el servidor esté encendido y la IP sea correcta.');
    if (e.message === 'Network request failed' || e.message.includes('fetch')) {
      throw new Error('No se puede conectar al servidor. Verifica que:\n1. La IP en api/client.js sea la de tu PC\n2. El backend esté iniciado con: uvicorn main:app --host 0.0.0.0 --port 8000\n3. Ambos dispositivos estén en la misma red WiFi');
    }
    throw e;
  }
};

// ─── AUTH ────────────────────────────────────────────────────────────────────
export const login = async (username, password) => {
  const body = new URLSearchParams();
  body.append('username', username);
  body.append('password', password);
  const cleanPath = normalizePath('/auth/login');
  const url = `${BASE_URL}${cleanPath}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Credenciales inválidas');
    return data;
  } catch (e) {
    clearTimeout(timeoutId);
    if (e.name === 'AbortError') throw new Error('Tiempo de espera agotado. Verifica la conexión al servidor.');
    if (e.message === 'Network request failed' || e.message.includes('fetch')) {
      throw new Error('No se puede conectar al servidor. Verifica:\n1. IP correcta en api/client.js\n2. Backend activo con: uvicorn main:app --host 0.0.0.0 --port 8000\n3. Misma red WiFi');
    }
    throw e;
  }
};

// ─── EMPLEADOS ───────────────────────────────────────────────────────────────
export const getPersonal = () => request('/personal');

export const crearPersonal = (data) =>
  request('/personal', { method: 'POST', body: JSON.stringify(data) });

export const actualizarPersonal = (id, data) =>
  request(`/personal/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const eliminarPersonal = (id) =>
  request(`/personal/${id}`, { method: 'DELETE' });

// ─── REFERENCIAS ─────────────────────────────────────────────────────────────
export const getCargos = () => request('/personal/cargos');
export const getDepartamentos = () => request('/personal/departamentos');
export const getEntes = () => request('/personal/entes');

// ─── USUARIOS ─────────────────────────────────────────────────────────────────
export const getUsuarios = () => request('/usuarios');

export const crearUsuario = (data) =>
  request('/usuarios', { method: 'POST', body: JSON.stringify(data) });

export const actualizarUsuario = (id, data) =>
  request(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const eliminarUsuario = (id) =>
  request(`/usuarios/${id}`, { method: 'DELETE' });

// ─── ASISTENCIA ───────────────────────────────────────────────────────────────
export const verificarCedula = (cedula) =>
  request(`/asistencia/verificar/${cedula}`);

export const registrarMovimiento = (params) => {
  const query = new URLSearchParams(params).toString();
  return request(`/asistencia/registrar?${query}`, { method: 'POST' });
};

export const getAsistenciaHoy = () => request('/asistencia/hoy');

export const marcarSalida = (cedula) =>
  request(`/asistencia/registrar?cedula=${cedula}`, { method: 'POST' });

export const eliminarAsistencia = (id) =>
  request(`/asistencia/${id}`, { method: 'DELETE' });

export const getAsistenciaRango = (desde, hasta) =>
  request(`/asistencia/rango?desde=${desde}&hasta=${hasta}`);
