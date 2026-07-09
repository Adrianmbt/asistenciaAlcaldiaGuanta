export const BASE_URL = 'http://192.168.1.102:8000';

let authToken = null;

export const setToken = (token) => { authToken = token; };
export const clearToken = () => { authToken = null; };

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
