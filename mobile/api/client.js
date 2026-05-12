/**
 * Cliente API centralizado para el backend FastAPI.
 * Cambia BASE_URL a la IP de tu máquina en la red local cuando uses un dispositivo físico.
 * Ejemplo: 'http://192.168.1.100:8000'
 * Para emulador Android usa: 'http://10.0.2.2:8000'
 * Para simulador iOS usa: 'http://localhost:8000'
 */
export const BASE_URL = 'http://192.168.1.6:8000'; // IP de la PC en la red Wi-Fi local

let authToken = null;

export const setToken = (token) => {
  authToken = token;
};

export const clearToken = () => {
  authToken = null;
};

const request = async (path, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || `Error ${response.status}`);
  }

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

// ─── PERSONAL ─────────────────────────────────────────────────────────────────
export const getPersonal = () => request('/personal/');

export const crearPersonal = (data) =>
  request('/personal/', { method: 'POST', body: JSON.stringify(data) });

export const actualizarPersonal = (id, data) =>
  request(`/personal/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const eliminarPersonal = (id) =>
  request(`/personal/${id}`, { method: 'DELETE' });

// ─── USUARIOS ─────────────────────────────────────────────────────────────────
export const getUsuarios = () => request('/usuarios/');

export const crearUsuario = (data) =>
  request('/usuarios/', { method: 'POST', body: JSON.stringify(data) });

export const actualizarUsuario = (id, data) =>
  request(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const eliminarUsuario = (id) =>
  request(`/usuarios/${id}`, { method: 'DELETE' });
