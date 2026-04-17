import React, { useState, useEffect } from 'react'
import VerificationScreen from './components/verificacion'
import AsistenciaTable from './components/list_table_asistencia'
import { LayoutDashboard, UserCheck, Settings, LogOut as LogOutIcon, User } from 'lucide-react'

function App() {
  const [activeTab, setActiveTab] = useState('verificacion');
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchHoy = async () => {
    try {
      const response = await fetch('/api/asistencia/hoy');
      const data = await response.json();
      setRegistros(data);
    } catch (error) {
      console.error("Error al cargar registros:", error);
    }
  };

  useEffect(() => {
    fetchHoy();
    // Auto-actualizar cada 30 segundos si estamos en la tabla
    const interval = setInterval(fetchHoy, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarcarSalida = async (id) => {
    // Para simplificar, buscaremos la cédula del registro
    const reg = registros.find(r => r.id === id);
    if (!reg) return;
    
    try {
      const response = await fetch(`/api/asistencia/registrar?cedula=${reg.cedula_identidad}`, {
        method: 'POST'
      });
      if (response.ok) {
        fetchHoy();
      }
    } catch (error) {
      console.error("Error al marcar salida:", error);
    }
  };

  const handleDelete = async (id) => {
      // Endpoint de eliminación no existe aún en el backend, 
      // pero simulamos la actualización visual
      if(window.confirm("¿Está seguro de eliminar este registro?")) {
          setRegistros(prev => prev.filter(r => r.id !== id));
      }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF9] flex flex-col md:flex-row font-sans">
      
      {/* Sidebar Institucional */}
      <aside className="w-full md:w-72 bg-white border-r border-orange-50 p-8 flex flex-col gap-10">
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 bg-guanta-gradient rounded-3xl shadow-xl shadow-orange-500/20 flex items-center justify-center">
            <UserCheck className="text-white" size={40} />
          </div>
          <div className="text-center">
            <h1 className="font-black text-xl text-gray-900 tracking-tighter uppercase leading-none">Guanta</h1>
            <p className="text-[9px] font-black text-guanta-primary tracking-[0.3em] uppercase mt-1">Gestión de Acceso</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('verificacion')}
            className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'verificacion' ? 'bg-orange-50 text-guanta-primary shadow-inner' : 'text-gray-400 hover:bg-orange-50/50 hover:text-gray-600'}`}
          >
            <UserCheck size={18} /> Verificación
          </button>
          <button 
             onClick={() => { setActiveTab('tabla'); fetchHoy(); }}
             className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'tabla' ? 'bg-orange-50 text-guanta-primary shadow-inner' : 'text-gray-400 hover:bg-orange-50/50 hover:text-gray-600'}`}
          >
            <LayoutDashboard size={18} /> Registros Hoy
          </button>
          <button className="flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-400 hover:bg-orange-50/50 transition-all mt-4">
            <Settings size={18} /> Configuración
          </button>
        </nav>

        <div className="mt-auto">
          <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <User size={20} className="text-guanta-primary" />
              </div>
              <div>
                <div className="text-[10px] font-black text-gray-800 leading-none">Portero Central</div>
                <div className="text-[8px] font-bold text-guanta-primary uppercase mt-1">En Línea</div>
              </div>
            </div>
            <button className="w-full flex items-center justify-center gap-2 py-3 text-[10px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50 rounded-xl transition-all">
              <LogOutIcon size={14} /> Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Área de Contenido Principal */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto max-h-screen">
        <div className="max-w-6xl mx-auto h-full">
            {activeTab === 'verificacion' ? (
              <div className="h-full flex items-center justify-center animate-in fade-in zoom-in duration-500">
                <VerificationScreen onActionSuccess={fetchHoy} />
              </div>
            ) : (
              <div className="animate-in slide-in-from-right-8 duration-500">
                <div className="mb-10 flex justify-between items-end">
                  <div>
                    <h2 className="text-5xl font-black text-gray-900 tracking-tighter leading-none mb-2">Movimientos</h2>
                    <p className="text-guanta-primary font-black uppercase text-xs tracking-[0.4em] ml-1">Control de Tráfico Institucional</p>
                  </div>
                  <div className="bg-white px-6 py-3 rounded-2xl border border-orange-100 shadow-sm flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Total Registros</div>
                      <div className="text-xl font-black text-gray-900 leading-none">{registros.length}</div>
                    </div>
                    <div className="w-[1px] h-8 bg-orange-100"></div>
                    <button onClick={fetchHoy} className="p-2 hover:bg-orange-50 rounded-lg text-guanta-primary transition-all">
                        <UserCheck size={20} />
                    </button>
                  </div>
                </div>
                
                <AsistenciaTable 
                   registros={registros} 
                   onMarcarSalida={handleMarcarSalida}
                   onDelete={handleDelete}
                   onEdit={(reg) => console.log("Edit:", reg)}
                />
              </div>
            )}
        </div>
      </main>

    </div>
  )
}

export default App
