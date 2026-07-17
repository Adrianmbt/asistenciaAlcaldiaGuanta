import React, { useState, useEffect, useRef } from 'react'
import VerificationScreen from './components/verificacion'
import AsistenciaTable from './components/list_table_asistencia'
import GestionUsuarios from './components/gestion_usuarios'
import GestionPersonal from './components/gestion_personal'
import Reportes from './components/reportes'
import Login from './components/login'
import { LayoutDashboard, UserCheck, LogOut as LogOutIcon, User, X, Save, ShieldCheck, Users, ChevronDown, FileText, List } from 'lucide-react'

function dispatchSessionClosed() {
  window.dispatchEvent(new CustomEvent('session-closed'))
}

const API_BASE = '/api'

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token')
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }
  const url = `${API_BASE}${path.startsWith('/') ? path : '/' + path}`
  const res = await fetch(url, { ...options, headers })
  const data = await res.json().catch(() => null)
  if (res.status === 401) {
    if (data?.detail?.includes?.('Sesión cerrada')) {
      dispatchSessionClosed()
    }
    throw new Error(data?.detail || `Error ${res.status}`)
  }
  if (!res.ok) {
    throw new Error(data?.detail || `Error ${res.status}`)
  }
  return data
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userSession, setUserSession] = useState(null);
  const [activeTab, setActiveTab] = useState('verificacion');
  const [registros, setRegistros] = useState([]);
  const [errorHeader, setErrorHeader] = useState(null);
  const wsRef = useRef(null);

  const justLoggedInRef = useRef(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEdit, setCurrentEdit] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [movimientosView, setMovimientosView] = useState('tabla');

  const parseTokenExp = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp ? payload.exp * 1000 : null;
    } catch { return null; }
  };

  const isTokenExpired = () => {
    const token = localStorage.getItem('token');
    if (!token) return true;
    const exp = parseTokenExp(token);
    return exp ? Date.now() >= exp : true;
  };

  const forceLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUserSession(null);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user && !isTokenExpired()) {
      setIsLoggedIn(true);
      setUserSession(JSON.parse(user));
    } else {
      forceLogout();
    }

    const handler = () => {
      forceLogout();
      alert('Tu sesión fue cerrada porque iniciaste sesión desde otro dispositivo.');
    };
    window.addEventListener('session-closed', handler);
    return () => window.removeEventListener('session-closed', handler);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = setInterval(() => {
      if (isTokenExpired()) forceLogout();
    }, 10000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const wsRetryRef = useRef(0);
  const wsTimerRef = useRef(null);

  const connectWebSocket = () => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) return;

    const wsUrl = `ws://${window.location.hostname}:8000/ws`;
    try {
      wsRef.current = new WebSocket(wsUrl);
    } catch (e) {
      scheduleWsReconnect();
      return;
    }

    wsRef.current.onopen = () => {
      wsRetryRef.current = 0;
      console.log('WebSocket connected');
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'asistencia') {
          fetchHoy();
        }
        if (data.type === 'session_closed' && data.username === userSession?.username) {
          if (justLoggedInRef.current) return;
          forceLogout();
        }
      } catch (e) {
        // silent
      }
    };

    wsRef.current.onclose = () => {
      scheduleWsReconnect();
    };

    wsRef.current.onerror = () => {};
  };

  const scheduleWsReconnect = () => {
    if (wsRetryRef.current >= 10) return;
    const delay = Math.min(2000 * Math.pow(1.5, wsRetryRef.current), 30000);
    wsRetryRef.current++;
    wsTimerRef.current = setTimeout(connectWebSocket, delay);
  };

  useEffect(() => {
    if (isLoggedIn) {
      connectWebSocket();
      return () => {
        if (wsTimerRef.current) clearTimeout(wsTimerRef.current);
        if (wsRef.current) wsRef.current.close();
      };
    }
  }, [isLoggedIn]);

  const fetchHoy = async () => {
    if (!isLoggedIn) return;
    try {
      const data = await apiFetch('/asistencia/hoy');
      setRegistros(data);
      setErrorHeader(null);
    } catch (error) {
      if (error.message?.includes?.('Sesión cerrada')) return;
      console.error("Error al cargar registros:", error);
      setErrorHeader("No se pudieron cargar los registros. Revisa el servidor backend.");
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchHoy();
    }
  }, [isLoggedIn]);

  const handleLoginSuccess = (username) => {
    justLoggedInRef.current = true;
    setTimeout(() => { justLoggedInRef.current = false; }, 3000);
    setUserSession(username);
    setIsLoggedIn(true);
  };

  const handleLogout = forceLogout;

  const handleMarcarSalida = async (cedula) => {
    try {
      await apiFetch(`/asistencia/registrar?cedula=${cedula}`, { method: 'POST' });
      fetchHoy();
    } catch (error) {
      if (error.message?.includes?.('Sesión cerrada')) return;
      alert(error.message || "Error al marcar salida");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Está seguro de eliminar este registro permanentemente?")) return;
    try {
      await apiFetch(`/asistencia/${id}`, { method: 'DELETE' });
      fetchHoy();
    } catch (error) {
      if (error.message?.includes?.('Sesión cerrada')) return;
      alert(error.message || "Error al eliminar el registro");
    }
  };

  const handleOpenEdit = (reg) => {
    setCurrentEdit({ ...reg });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      const params = new URLSearchParams({
        nombre: currentEdit.nombre,
        motivo: currentEdit.motivo,
        piso: currentEdit.piso
      });
      await apiFetch(`/asistencia/${currentEdit.id}?${params.toString()}`, { method: 'PUT' });
      setIsEditModalOpen(false);
      fetchHoy();
    } catch (error) {
      if (error.message?.includes?.('Sesión cerrada')) return;
      alert(error.message || "Error al actualizar el registro");
    }
  };

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/80 via-white to-orange-100/40 flex flex-col font-sans bg-cyber-overlay">

      {/* ─── TOP NAVBAR ─── */}
      <nav className="backdrop-blur-xl bg-white/60 border-b border-white/40 px-4 md:px-8 py-2.5 relative cyber-corners z-[100]">
        <div className="cyber-corner cyber-corner-tl"></div>
        <div className="cyber-corner cyber-corner-tr"></div>
        <div className="cyber-corner cyber-corner-bl"></div>
        <div className="cyber-corner cyber-corner-br"></div>

        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Left: Logo + Brand */}
          <div className="flex items-center gap-3">
            <div className="bg-guanta-primary/10 p-1.5 rounded-xl border border-white/50">
              <img src="/img/logo_guanta.webp" alt="Guanta" className="w-8 h-5 object-contain" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-black text-sm text-gray-900 tracking-tighter leading-none">GUANTA</span>
              <span className="text-[7px] font-black text-guanta-primary tracking-[0.3em] uppercase">Control Institucional</span>
            </div>
          </div>

          {/* Center: Nav Tabs */}
          <div className="flex items-center gap-0.5 md:gap-1">
            <button
              onClick={() => setActiveTab('verificacion')}
              className={`flex items-center gap-1.5 md:gap-2.5 px-3 md:px-5 py-2.5 rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all backdrop-blur-sm ${activeTab === 'verificacion' ? 'bg-guanta-primary/10 text-guanta-primary shadow-inner shadow-guanta-primary/5 border border-guanta-primary/20' : 'text-gray-400 hover:bg-white/40 hover:text-gray-600 border border-transparent'}`}
            >
              <UserCheck size={16} /> <span className="hidden md:inline">Verificación</span>
            </button>
            <button
              onClick={() => setActiveTab('personal')}
              className={`flex items-center gap-1.5 md:gap-2.5 px-3 md:px-5 py-2.5 rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all backdrop-blur-sm ${activeTab === 'personal' ? 'bg-guanta-primary/10 text-guanta-primary shadow-inner shadow-guanta-primary/5 border border-guanta-primary/20' : 'text-gray-400 hover:bg-white/40 hover:text-gray-600 border border-transparent'}`}
            >
              <Users size={16} /> <span className="hidden md:inline">Personal</span>
            </button>
            <button
              onClick={() => { setActiveTab('tabla'); fetchHoy(); }}
              className={`flex items-center gap-1.5 md:gap-2.5 px-3 md:px-5 py-2.5 rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all backdrop-blur-sm ${activeTab === 'tabla' ? 'bg-guanta-primary/10 text-guanta-primary shadow-inner shadow-guanta-primary/5 border border-guanta-primary/20' : 'text-gray-400 hover:bg-white/40 hover:text-gray-600 border border-transparent'}`}
            >
              <LayoutDashboard size={16} /> <span className="hidden md:inline">Movimientos</span>
            </button>
            <button
              onClick={() => setActiveTab('usuarios')}
              className={`flex items-center gap-1.5 md:gap-2.5 px-3 md:px-5 py-2.5 rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all backdrop-blur-sm ${activeTab === 'usuarios' ? 'bg-guanta-primary/10 text-guanta-primary shadow-inner shadow-guanta-primary/5 border border-guanta-primary/20' : 'text-gray-400 hover:bg-white/40 hover:text-gray-600 border border-transparent'}`}
            >
              <ShieldCheck size={16} /> <span className="hidden md:inline">Seguridad</span>
            </button>
          </div>

          {/* Right: User Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              onBlur={() => setTimeout(() => setShowUserMenu(false), 200)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/40 transition-all border border-transparent hover:border-white/40"
            >
              <div className="w-8 h-8 bg-guanta-primary/10 rounded-xl flex items-center justify-center">
                <User size={16} className="text-guanta-primary" />
              </div>
              <div className="hidden md:block text-left">
                <div className="text-[11px] font-black text-gray-800 leading-none truncate max-w-[120px]">
                  {userSession?.nombre || "Cargando..."}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="cyber-led cyber-led-active" style={{backgroundColor:'#10b981', boxShadow:'0 0 6px rgba(16,185,129,0.6)'}}></div>
                  <span className="text-[8px] font-bold text-gray-400 uppercase">
                    {userSession?.rol === 'admin' ? 'Admin' : 'Oficial'}
                  </span>
                </div>
              </div>
              <ChevronDown size={14} className={`text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 backdrop-blur-xl bg-white/70 rounded-2xl shadow-2xl border border-white/40 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                <div className="p-5 border-b border-white/40">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-guanta-primary/10 rounded-2xl flex items-center justify-center">
                      <User size={20} className="text-guanta-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-black text-gray-800 truncate">{userSession?.nombre || "Cargando..."}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="cyber-led cyber-led-active" style={{backgroundColor:'#10b981', boxShadow:'0 0 6px rgba(16,185,129,0.6)'}}></div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase">{userSession?.rol === 'admin' ? 'Administrador' : 'Oficial de Guardia'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-5 py-4 text-[10px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50/80 transition-all"
                >
                  <LogOutIcon size={14} /> Salir del Sistema
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-screen backdrop-blur-sm">
        <div className="max-w-7xl mx-auto h-full relative">

          {errorHeader && (
            <div className="mb-6 p-4 backdrop-blur-xl bg-rose-50/80 border border-rose-100/60 rounded-2xl text-rose-600 text-[10px] font-black uppercase tracking-widest flex items-center justify-between shadow-xl shadow-rose-500/5 animate-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-3">
                <X size={16} /> {errorHeader}
              </div>
              <button onClick={() => setErrorHeader(null)} className="hover:bg-rose-100/80 p-1 rounded-lg transition-colors"><X size={14} /></button>
            </div>
          )}

          {activeTab === 'verificacion' ? (
            <div className="animate-in fade-in zoom-in-95 duration-700">
              <VerificationScreen />
            </div>
          ) : activeTab === 'usuarios' ? (
            <div className="animate-in slide-in-from-bottom-12 duration-700">
              <GestionUsuarios />
            </div>
          ) : activeTab === 'personal' ? (
            <div className="animate-in slide-in-from-bottom-12 duration-700">
              <GestionPersonal />
            </div>
          ) : (
            <div className="animate-in slide-in-from-right-12 duration-700">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tighter leading-none">Control de Acceso</h2>
                  <p className="text-guanta-primary font-black uppercase text-[9px] tracking-[0.3em]">Alcaldia del Municipio Guanta</p>
                </div>
                <div className="flex bg-white/40 backdrop-blur-sm p-0.5 rounded-xl border border-white/60 shadow-sm">
                  <button onClick={() => setMovimientosView('tabla')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[9px] font-black tracking-widest transition-all backdrop-blur-sm ${movimientosView === 'tabla' ? 'bg-guanta-primary text-white shadow-lg shadow-guanta-primary/30' : 'text-gray-400 hover:text-guanta-primary'}`}>
                    <List size={13} /> Registros
                  </button>
                  <button onClick={() => setMovimientosView('reportes')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[9px] font-black tracking-widest transition-all backdrop-blur-sm ${movimientosView === 'reportes' ? 'bg-guanta-primary text-white shadow-lg shadow-guanta-primary/30' : 'text-gray-400 hover:text-guanta-primary'}`}>
                    <FileText size={13} /> Reportes
                  </button>
                </div>
              </div>

              {movimientosView === 'tabla' ? (
                <div className="shadow-2xl shadow-guanta-primary/10 rounded-2xl overflow-hidden">
                  <AsistenciaTable
                    registros={registros}
                    onMarcarSalida={handleMarcarSalida}
                    onDelete={handleDelete}
                    onEdit={handleOpenEdit}
                  />
                </div>
              ) : (
                <div className="backdrop-blur-xl bg-white/60 rounded-2xl shadow-2xl border border-white/40 p-4">
                  <Reportes registros={registros} apiFetch={apiFetch} />
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {isEditModalOpen && currentEdit && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="backdrop-blur-xl bg-white/60 w-full max-w-lg rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-300 border border-white/40">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-guanta-primary/10 backdrop-blur-sm rounded-2xl text-guanta-primary border border-guanta-primary/20">
                  <Save size={20} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tighter leading-none mb-0.5">Editar Acceso</h3>
                  <p className="text-[9px] font-black text-guanta-primary uppercase tracking-widest">Gestión Manual de Movimiento</p>
                </div>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 bg-white/40 backdrop-blur-sm text-gray-400 hover:text-gray-900 rounded-full transition-all border border-white/60">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2 group">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-[0.2em] group-focus-within:text-guanta-primary transition-colors">Nombre Completo</label>
                <input
                  type="text"
                  value={currentEdit.nombre}
                  onChange={(e) => setCurrentEdit({ ...currentEdit, nombre: e.target.value })}
                  className="w-full p-4 bg-white/40 border-2 border-white/60 focus:border-guanta-primary focus:bg-white/60 rounded-xl outline-none font-bold text-gray-800 transition-all shadow-inner backdrop-blur-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2 group">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-[0.2em] group-focus-within:text-guanta-primary transition-colors">Ubicación / Piso</label>
                  <input
                    type="text"
                    value={currentEdit.piso}
                    onChange={(e) => setCurrentEdit({ ...currentEdit, piso: e.target.value })}
                    className="w-full p-4 bg-white/40 border-2 border-white/60 focus:border-guanta-primary focus:bg-white/60 rounded-xl outline-none font-bold text-gray-800 transition-all shadow-inner backdrop-blur-sm"
                  />
                </div>
                <div className="space-y-2 group">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-[0.2em]">Identificación</label>
                  <div className="w-full p-4 bg-white/40 backdrop-blur-sm rounded-xl font-black text-gray-400 border border-white/60">
                    V-{currentEdit.cedula_identidad}
                  </div>
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-[0.2em] group-focus-within:text-guanta-primary transition-colors">Motivo Justificado</label>
                <textarea
                  rows="3"
                  value={currentEdit.motivo}
                  onChange={(e) => setCurrentEdit({ ...currentEdit, motivo: e.target.value })}
                  className="w-full p-4 bg-white/40 border-2 border-white/60 focus:border-guanta-primary focus:bg-white/60 rounded-xl outline-none font-bold text-gray-800 resize-none transition-all shadow-inner backdrop-blur-sm"
                />
              </div>

              <button
                onClick={handleSaveEdit}
                className="w-full py-5 bg-guanta-gradient text-white rounded-2xl font-black text-base uppercase tracking-widest shadow-2xl shadow-guanta-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <Save size={20} /> Guardar Movimiento
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default App
