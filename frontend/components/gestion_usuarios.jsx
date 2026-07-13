import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, UserPlus, Edit2, Trash2, Shield, Mail, User, Check, X, Save, ShieldAlert, Key } from 'lucide-react';

const API_BASE_URL = '/api/usuarios';

const GestionUsuarios = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState("");
    const wsRef = useRef(null);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentUser, setCurrentUser] = useState({
        username: '',
        email: '',
        nombre_completo: '',
        password: '',
        rol: 'portero'
    });

    const fetchUsuarios = async () => {
        setLoading(true);
        try {
            const response = await fetch(API_BASE_URL);
            const data = await response.json();
            setUsuarios(data);
        } catch (error) {
            console.error("Error al cargar usuarios:", error);
        } finally {
            setLoading(false);
        }
    };

    const wsRetryRef = useRef(0);
    const wsTimerRef = useRef(null);

    const connectWebSocket = () => {
        if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) return;

        const wsUrl = `ws://${window.location.hostname}:8000/ws`;
        try {
            wsRef.current = new WebSocket(wsUrl);
        } catch (e) {
            scheduleReconnect();
            return;
        }

        wsRef.current.onopen = () => {
            wsRetryRef.current = 0;
        };

        wsRef.current.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'usuarios') {
                    fetchUsuarios();
                }
            } catch (e) {}
        };

        wsRef.current.onclose = () => {
            scheduleReconnect();
        };

        wsRef.current.onerror = () => {};
    };

    const scheduleReconnect = () => {
        if (wsRetryRef.current >= 10) return;
        const delay = Math.min(2000 * Math.pow(1.5, wsRetryRef.current), 30000);
        wsRetryRef.current++;
        wsTimerRef.current = setTimeout(connectWebSocket, delay);
    };

    useEffect(() => {
        fetchUsuarios();
        connectWebSocket();
        return () => {
            if (wsTimerRef.current) clearTimeout(wsTimerRef.current);
            if (wsRef.current) wsRef.current.close();
        };
    }, []);

    const filteredUsers = useMemo(() => {
        return usuarios.filter(user => 
            user.nombre_completo.toLowerCase().includes(filter.toLowerCase()) ||
            user.username.toLowerCase().includes(filter.toLowerCase()) ||
            user.email.toLowerCase().includes(filter.toLowerCase())
        );
    }, [filter, usuarios]);

    const handleOpenCreate = () => {
        setCurrentUser({ username: '', email: '', nombre_completo: '', password: '', rol: 'portero' });
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (user) => {
        setCurrentUser({ ...user, password: '' });
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const url = isEditing ? `${API_BASE_URL}/${currentUser.id}` : API_BASE_URL;
            const method = isEditing ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentUser)
            });

            if (response.ok) {
                setIsModalOpen(false);
                fetchUsuarios();
            } else {
                const err = await response.json();
                alert(err.detail || "Error al procesar la solicitud");
            }
        } catch (error) {
            console.error("Error al guardar usuario:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("¿Está seguro de desactivar a este usuario?")) {
            try {
                const response = await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
                if (response.ok) {
                    fetchUsuarios();
                }
            } catch (error) {
                console.error("Error al eliminar:", error);
            }
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto animate-in fade-in duration-500">
            <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h2 className="text-5xl font-black text-gray-900 tracking-tighter leading-none mb-2">Seguridad</h2>
                    <p className="text-guanta-primary font-black uppercase text-xs tracking-[0.4em] ml-1">Gestión de Usuarios del Sistema</p>
                </div>
                
                <button 
                    onClick={handleOpenCreate}
                    className="flex items-center gap-3 px-8 py-4 bg-guanta-gradient text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-guanta-primary/20"
                >
                    <UserPlus size={20} /> Nuevo Usuario
                </button>
            </div>

            <div className="backdrop-blur-xl bg-white/60 p-6 rounded-[2rem] shadow-lg border border-white/40 mb-8 flex items-center gap-4">
                <div className="relative flex-1 group">
                    <input
                        type="text"
                        placeholder="Buscar por nombre, usuario o email..."
                        className="w-full pl-12 pr-4 py-3 bg-white/40 border-2 border-white/60 focus:border-guanta-primary focus:bg-white/80 rounded-2xl outline-none transition-all font-bold text-gray-700 backdrop-blur-sm"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-guanta-primary opacity-40 group-focus-within:opacity-100 transition-opacity" size={20} />
                </div>
                <div className="hidden md:flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <Shield size={16} /> Total: {usuarios.length} activos
                </div>
            </div>

            <div className="backdrop-blur-xl bg-white/60 rounded-[2rem] shadow-2xl shadow-guanta-primary/5 border border-white/40 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/40 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/40">
                            <th className="px-8 py-5">Usuario / Nombre</th>
                            <th className="px-8 py-5">Email Corporativo</th>
                            <th className="px-8 py-5">Rol / Permisos</th>
                            <th className="px-8 py-5">Estatus</th>
                            <th className="px-8 py-5 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/30">
                        {filteredUsers.map((user) => (
                            <tr key={user.id} className={`group hover:bg-white/40 transition-all backdrop-blur-sm ${user.activo === 0 ? 'opacity-50' : ''}`}>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-2xl backdrop-blur-sm ${user.rol === 'admin' ? 'bg-guanta-primary/10 text-guanta-primary' : 'bg-blue-100/80 text-blue-600'}`}>
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <div className="font-black text-gray-800 tracking-tighter leading-none group-hover:text-guanta-primary transition-colors">@{user.username}</div>
                                            <div className="text-[11px] font-bold text-gray-500 uppercase mt-1">{user.nombre_completo}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2 text-gray-600 font-bold text-sm">
                                        <Mail size={14} className="text-gray-300" />
                                        {user.email || 'N/A'}
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase backdrop-blur-sm ${user.rol === 'admin' ? 'bg-guanta-primary/10 text-guanta-primary' : 'bg-blue-100/80 text-blue-600'}`}>
                                        {user.rol}
                                    </span>
                                </td>
                                <td className="px-8 py-6">
                                    {user.activo === 1 ? (
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 bg-emerald-500 rounded-full"></div>
                                            <span className="text-[10px] font-black text-emerald-600 uppercase">Activo</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 bg-rose-400 rounded-full"></div>
                                            <span className="text-[10px] font-black text-rose-400 uppercase">Inactivo</span>
                                        </div>
                                    )}
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                        <button 
                                            onClick={() => handleOpenEdit(user)}
                                            className="p-3 bg-guanta-primary/10 backdrop-blur-sm text-guanta-primary rounded-xl hover:bg-guanta-primary hover:text-white transition-all shadow-sm"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        {user.activo === 1 && (
                                            <button 
                                                onClick={() => handleDelete(user.id)}
                                                className="p-3 bg-rose-50/80 backdrop-blur-sm text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="backdrop-blur-xl bg-white/60 w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200 border border-white/40">
                        <div className="flex justify-between items-center mb-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-guanta-primary/10 backdrop-blur-sm rounded-2xl text-guanta-primary shadow-lg shadow-guanta-primary/20 border border-guanta-primary/20">
                                    <UserPlus size={24} />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter leading-none">{isEditing ? 'Editar Perfil' : 'Nuevo Acceso'}</h3>
                                    <p className="text-[10px] font-black text-guanta-primary uppercase tracking-widest mt-1">Configuración de Credenciales de Sistema</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white/40 backdrop-blur-sm text-gray-400 hover:text-gray-900 rounded-full transition-all border border-white/60">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Username</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={currentUser.username}
                                        onChange={(e) => setCurrentUser({...currentUser, username: e.target.value})}
                                        className="w-full p-4 bg-white/40 border-2 border-white/60 focus:border-guanta-primary focus:bg-white/60 rounded-2xl outline-none font-bold text-gray-800 transition-all backdrop-blur-sm"
                                        placeholder="ej: j.perez"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Contraseña</label>
                                    <div className="relative">
                                        <input 
                                            type="password" 
                                            required={!isEditing}
                                            value={currentUser.password}
                                            onChange={(e) => setCurrentUser({...currentUser, password: e.target.value})}
                                            className="w-full p-4 bg-white/40 border-2 border-white/60 focus:border-guanta-primary focus:bg-white/60 rounded-2xl outline-none font-bold text-gray-800 transition-all backdrop-blur-sm"
                                            placeholder={isEditing ? "(Sin cambios)" : "*******"}
                                        />
                                        <Key className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Nombre Completo del Servidor</label>
                                <input 
                                    type="text" 
                                    required
                                    value={currentUser.nombre_completo}
                                    onChange={(e) => setCurrentUser({...currentUser, nombre_completo: e.target.value})}
                                    className="w-full p-4 bg-white/40 border-2 border-white/60 focus:border-guanta-primary focus:bg-white/60 rounded-2xl outline-none font-bold text-gray-800 transition-all backdrop-blur-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Correo Electrónico</label>
                                <input 
                                    type="email" 
                                    value={currentUser.email}
                                    onChange={(e) => setCurrentUser({...currentUser, email: e.target.value})}
                                    className="w-full p-4 bg-white/40 border-2 border-white/60 focus:border-guanta-primary focus:bg-white/60 rounded-2xl outline-none font-bold text-gray-800 transition-all backdrop-blur-sm"
                                    placeholder="ejemplo@guanta.gob.ve"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Rol de Sistema</label>
                                <select 
                                    value={currentUser.rol}
                                    onChange={(e) => setCurrentUser({...currentUser, rol: e.target.value})}
                                    className="w-full p-4 bg-white/40 border-2 border-white/60 focus:border-guanta-primary focus:bg-white/60 rounded-2xl outline-none font-bold text-gray-800 transition-all appearance-none cursor-pointer backdrop-blur-sm"
                                >
                                    <option value="portero">Oficial de Seguridad (Portero)</option>
                                    <option value="admin">Administrador del Sistema</option>
                                </select>
                            </div>

                            <button 
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 bg-guanta-gradient text-white rounded-[1.5rem] font-black text-lg uppercase tracking-widest shadow-xl shadow-guanta-primary/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 mt-4"
                            >
                                <Save size={20} /> {isEditing ? 'Actualizar Usuario' : 'Crear Acceso'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestionUsuarios;
