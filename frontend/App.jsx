import React, { useState, useEffect } from 'react'
import VerificationScreen from './components/verificacion'
import AsistenciaTable from './components/list_table_asistencia'
import GestionUsuarios from './components/gestion_usuarios'
import GestionPersonal from './components/gestion_personal'
import Login from './components/login'
import { LayoutDashboard, UserCheck, Settings, LogOut as LogOutIcon, User, X, Save, ShieldCheck, Users } from 'lucide-react'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userSession, setUserSession] = useState(null);
  const [activeTab, setActiveTab] = useState('verificacion');
  const [registros, setRegistros] = useState([]);
  const [errorHeader, setErrorHeader] = useState(null);

  // Estados para Modal de Edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEdit, setCurrentEdit] = useState(null);

  useEffect(() => {
    // Verificar si hay un token válido al cargar
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      setIsLoggedIn(true);
      setUserSession(JSON.parse(user));
    }
  }, []);

  const fetchHoy = async () => {
    if (!isLoggedIn) return;
    try {
      const response = await fetch('/api/asistencia/hoy', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        if (response.status === 401) handleLogout();
        const text = await response.text();
        throw new Error(`Error ${response.status}: ${text}`);
      }
      const data = await response.json();
      setRegistros(data);
      setErrorHeader(null);
    } catch (error) {
      console.error("Error al cargar registros:", error);
      setErrorHeader("No se pudieron cargar los registros. Revisa el servidor backend.");
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchHoy();
      const interval = setInterval(fetchHoy, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  const handleLoginSuccess = (username) => {
    setUserSession(username);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUserSession(null);
  };

  const handleMarcarSalida = async (cedula) => {
    try {
      const response = await fetch(`/api/asistencia/registrar?cedula=${cedula}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        fetchHoy();
      } else {
        const data = await response.json();
        alert(data.detail || "Error al marcar salida");
      }
    } catch (error) {
      console.error("Error al marcar salida:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Está seguro de eliminar este registro permanentemente?")) {
      try {
        const response = await fetch(`/api/asistencia/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          fetchHoy();
        } else {
          alert("Error al eliminar el registro");
        }
      } catch (error) {
        console.error("Error al eliminar:", error);
      }
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
      const response = await fetch(`/api/asistencia/${currentEdit.id}?${params.toString()}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        setIsEditModalOpen(false);
        fetchHoy();
      } else {
        alert("Error al actualizar el registro");
      }
    } catch (error) {
      console.error("Error al editar:", error);
    }
  };

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#FFFBF9] flex flex-col md:flex-row font-sans animate-in fade-in duration-700">

      {/* Sidebar Institucional Premium */}
      <aside className="w-full md:w-[320px] bg-white border-r border-orange-100/50 p-10 flex flex-col gap-12 relative">
        <div className="flex flex-col items-center gap-6">
          <div className="relative group p-1 bg-white rounded-full shadow-lg border border-orange-50">
            <div className="absolute inset-0 bg-guanta-primary blur-3xl opacity-5 group-hover:opacity-10 transition-opacity"></div>
            <img src="/img/logo_guanta.png" alt="Logo Guanta" className="w-24 h-24 relative z-10 transition-transform group-hover:scale-110 duration-500 rounded-full object-cover" />
          </div>
          <div className="text-center">
            <h1 className="font-black text-2xl text-gray-900 tracking-tighter uppercase leading-none mb-1">Guanta</h1>
            <p className="text-[10px] font-black text-guanta-primary tracking-[0.4em] uppercase">Control Institucional</p>
          </div>
        </div>

        <nav className="flex flex-col gap-3">
          <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-4 mb-2">Operaciones</div>
          <button
            onClick={() => setActiveTab('verificacion')}
            className={`flex items-center gap-4 px-6 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'verificacion' ? 'bg-orange-50 text-guanta-primary shadow-inner shadow-orange-500/5' : 'text-gray-400 hover:bg-orange-50/50 hover:text-gray-600'}`}
          >
            <UserCheck size={20} /> Verificación
          </button>
          <button
            onClick={() => { setActiveTab('personal'); }}
            className={`flex items-center gap-4 px-6 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'personal' ? 'bg-orange-50 text-guanta-primary shadow-inner shadow-orange-500/5' : 'text-gray-400 hover:bg-orange-50/50 hover:text-gray-600'}`}
          >
            <Users size={20} /> Personal
          </button>
          <button
            onClick={() => { setActiveTab('tabla'); fetchHoy(); }}
            className={`flex items-center gap-4 px-6 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'tabla' ? 'bg-orange-50 text-guanta-primary shadow-inner shadow-orange-500/5' : 'text-gray-400 hover:bg-orange-50/50 hover:text-gray-600'}`}
          >
            <LayoutDashboard size={20} /> Movimientos
          </button>

          <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-4 mt-6 mb-2">Administración</div>
          <button
            onClick={() => setActiveTab('usuarios')}
            className={`flex items-center gap-4 px-6 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'usuarios' ? 'bg-orange-50 text-guanta-primary shadow-inner shadow-orange-500/5' : 'text-gray-400 hover:bg-orange-50/50 hover:text-gray-600'}`}
          >
            <ShieldCheck size={20} /> Seguridad
          </button>
          <button className="flex items-center gap-4 px-6 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest text-gray-400 hover:bg-orange-50/50 transition-all">
            <Settings size={20} /> Perfil
          </button>
        </nav>

        <div className="mt-auto pt-10 border-t border-orange-50">
          <div className="bg-gradient-to-br from-orange-50 to-white p-6 rounded-[2rem] border border-orange-100 shadow-sm relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-guanta-primary/5 rounded-full blur-2xl group-hover:bg-guanta-primary/10 transition-all"></div>
            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/10 border border-orange-50">
                <User size={24} className="text-guanta-primary" />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="text-[11px] font-black text-gray-800 leading-none mb-1 truncate">
                  {userSession?.nombre || "Cargando..."}
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <div className="text-[9px] font-bold text-gray-400 uppercase truncate">
                    {userSession?.rol === 'admin' ? 'Administrador' : 'Oficial de Guardia'}
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 py-4 bg-white text-[10px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50 rounded-2xl transition-all border border-rose-50 shadow-sm relative z-10"
            >
              <LogOutIcon size={14} /> Salir del Sistema
            </button>
          </div>
        </div>
      </aside>

      {/* Área de Contenido Principal Premium */}
      <main className="flex-1 p-6 md:p-16 overflow-y-auto max-h-screen bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
        <div className="max-w-6xl mx-auto h-full relative">

          {errorHeader && (
            <div className="mb-8 p-5 bg-rose-50 border border-rose-100 rounded-[2rem] text-rose-600 text-[10px] font-black uppercase tracking-widest flex items-center justify-between shadow-xl shadow-rose-500/5 animate-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-3">
                <X size={18} /> {errorHeader}
              </div>
              <button onClick={() => setErrorHeader(null)} className="hover:bg-rose-100 p-1 rounded-lg transition-colors"><X size={14} /></button>
            </div>
          )}

          {activeTab === 'verificacion' ? (
            <div className="h-full flex items-center justify-center animate-in fade-in zoom-in-95 duration-700">
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
              <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h2 className="text-6xl font-black text-gray-900 tracking-tighter leading-none mb-3">Sistema de Control de Acceso</h2>
                  <p className="text-guanta-primary font-black uppercase text-xs tracking-[0.4em] ml-1 bg-orange-100/50 px-4 py-1.5 rounded-full inline-block">Control de Acceso del Edificio Administrativo</p>
                </div>

                <div className="bg-white p-2 rounded-[2rem] border border-orange-100 shadow-2xl shadow-orange-500/5 flex items-center gap-2">
                  <div className="bg-orange-50 px-6 py-4 rounded-[1.5rem] flex items-center gap-5">
                    <div className="text-center">
                      <div className="text-[9px] font-black text-guanta-primary uppercase tracking-widest mb-1 underline decoration-2 underline-offset-4">HOY</div>
                      <div className="text-3xl font-black text-gray-900 leading-none">{registros.length}</div>
                    </div>
                    <div className="w-[1px] h-10 bg-orange-200/50"></div>
                    <div className="text-left">
                      <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Registros</div>
                      <div className="text-[10px] font-bold text-gray-500">PROCESADOS</div>
                    </div>
                  </div>
                  <button onClick={fetchHoy} className="p-5 hover:bg-orange-50 rounded-[1.5rem] text-guanta-primary transition-all group active:scale-90">
                    <LayoutDashboard size={24} className="group-hover:rotate-12 transition-transform" />
                  </button>
                </div>
              </div>

              <div className="shadow-2xl shadow-orange-500/10 rounded-[2rem] overflow-hidden">
                <AsistenciaTable
                  registros={registros}
                  onMarcarSalida={handleMarcarSalida}
                  onDelete={handleDelete}
                  onEdit={handleOpenEdit}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL DE EDICIÓN PREMIUM */}
      {isEditModalOpen && currentEdit && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-12 shadow-2xl animate-in zoom-in-95 duration-300 border border-orange-100">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-orange-100 rounded-3xl text-guanta-primary shadow-lg shadow-orange-500/20">
                  <Save size={24} />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-gray-900 tracking-tighter leading-none mb-1">Editar Acceso</h3>
                  <p className="text-[10px] font-black text-guanta-primary uppercase tracking-widest">Gestión Manual de Movimiento</p>
                </div>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-3 bg-gray-50 text-gray-400 hover:text-gray-900 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-8">
              <div className="space-y-3 group">
                <label className="text-[11px] font-black text-gray-400 uppercase ml-3 tracking-[0.2em] group-focus-within:text-guanta-primary transition-colors">Nombre Completo</label>
                <input
                  type="text"
                  value={currentEdit.nombre}
                  onChange={(e) => setCurrentEdit({ ...currentEdit, nombre: e.target.value })}
                  className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-guanta-primary focus:bg-white rounded-2xl outline-none font-bold text-gray-800 transition-all shadow-inner"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3 group">
                  <label className="text-[11px] font-black text-gray-400 uppercase ml-3 tracking-[0.2em] group-focus-within:text-guanta-primary transition-colors">Ubicación / Piso</label>
                  <input
                    type="text"
                    value={currentEdit.piso}
                    onChange={(e) => setCurrentEdit({ ...currentEdit, piso: e.target.value })}
                    className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-guanta-primary focus:bg-white rounded-2xl outline-none font-bold text-gray-800 transition-all shadow-inner"
                  />
                </div>
                <div className="space-y-3 group">
                  <label className="text-[11px] font-black text-gray-400 uppercase ml-3 tracking-[0.2em]">Identificación</label>
                  <div className="w-full p-5 bg-gray-100 rounded-2xl font-black text-gray-400 border border-gray-200">
                    V-{currentEdit.cedula_identidad}
                  </div>
                </div>
              </div>

              <div className="space-y-3 group">
                <label className="text-[11px] font-black text-gray-400 uppercase ml-3 tracking-[0.2em] group-focus-within:text-guanta-primary transition-colors">Motivo Justificado</label>
                <textarea
                  rows="3"
                  value={currentEdit.motivo}
                  onChange={(e) => setCurrentEdit({ ...currentEdit, motivo: e.target.value })}
                  className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-guanta-primary focus:bg-white rounded-2xl outline-none font-bold text-gray-800 resize-none transition-all shadow-inner"
                />
              </div>

              <button
                onClick={handleSaveEdit}
                className="w-full py-6 bg-guanta-gradient text-white rounded-[2rem] font-black text-lg uppercase tracking-widest shadow-2xl shadow-orange-600/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 mt-4"
              >
                <Save size={22} /> Guardar Movimiento
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default App
