export const BASE_URL = 'http://192.168.1.102:8000';
export const WS_URL = 'ws://192.168.1.102:8000/ws';

let authToken = null;
let ws = null;
let wsListeners = [];
let wsRetryTimeout = null;
let wsRetryCount = 0;
const WS_MAX_RETRY = 10;
const WS_BASE_DELAY = 2000;

export const setToken = (token) => { authToken = token; };
export const clearToken = () => { authToken = null; };

export const connectWebSocket = () => {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

  try {
    ws = new WebSocket(WS_URL);
  } catch (e) {
    scheduleReconnect();
    return;
  }

  ws.onopen = () => {
    wsRetryCount = 0;
    console.log('WebSocket connected');
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
    scheduleReconnect();
  };

  ws.onerror = () => {
    // onclose will handle reconnection
  };
};

const scheduleReconnect = () => {
  if (wsRetryCount >= WS_MAX_RETRY) return;
  const delay = Math.min(WS_BASE_DELAY * Math.pow(1.5, wsRetryCount), 30000);
  wsRetryCount++;
  wsRetryTimeout = setTimeout(connectWebSocket, delay);
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
  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || `Error ${response.status}`);
  return data;
};

// ─── AUTH ────────────────────────────────────────────────────────────────────
export const login = async (username, password) => {
  const body = new URLSearchParams();
  body.append('username', username);
  body.append('password', password);
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Credenciales inválidas');
  return data;
};

// ─── EMPLEADOS ───────────────────────────────────────────────────────────────
export const getPersonal = () => request('/personal/');

export const crearPersonal = (data) =>
  request('/personal/', { method: 'POST', body: JSON.stringify(data) });

export const actualizarPersonal = (id, data) =>
  request(`/personal/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const eliminarPersonal = (id) =>
  request(`/personal/${id}`, { method: 'DELETE' });

// ─── REFERENCIAS ─────────────────────────────────────────────────────────────
export const getCargos = () => request('/personal/cargos');
export const getDepartamentos = () => request('/personal/departamentos');
export const getEntes = () => request('/personal/entes');

// ─── USUARIOS ─────────────────────────────────────────────────────────────────
export const getUsuarios = () => request('/usuarios/');

export const crearUsuario = (data) =>
  request('/usuarios/', { method: 'POST', body: JSON.stringify(data) });

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
