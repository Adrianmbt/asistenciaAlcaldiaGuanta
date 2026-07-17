import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, UserPlus, Edit2, Trash2, Shield, Mail, User, Check, X, Save, ShieldAlert, Key, ChevronLeft, ChevronRight } from 'lucide-react';

const API_BASE_URL = '/api/usuarios';
const ITEMS_PER_PAGE = 10;

const GestionUsuarios = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
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

    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
    const paginatedUsers = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredUsers, currentPage]);

    useEffect(() => { setCurrentPage(1); }, [filter]);

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
            <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-3">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tighter leading-none">Seguridad</h2>
                    <p className="text-guanta-primary font-black uppercase text-[9px] tracking-[0.3em]">Gestión de Usuarios del Sistema</p>
                </div>
                <button onClick={handleOpenCreate} className="flex items-center gap-2 px-5 py-2.5 bg-guanta-gradient text-white rounded-xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-guanta-primary/20 text-[10px]">
                    <UserPlus size={14} /> Nuevo
                </button>
            </div>

            <div className="backdrop-blur-xl bg-white/60 p-3 rounded-xl shadow-lg border border-white/40 mb-4 flex items-center gap-3">
                <div className="relative flex-1 group">
                    <input type="text" placeholder="Buscar por nombre, usuario o email..."
                        className="w-full pl-9 pr-3 py-2 bg-white/40 border-2 border-white/60 focus:border-guanta-primary focus:bg-white/80 rounded-lg outline-none transition-all font-bold text-gray-700 backdrop-blur-sm text-xs"
                        value={filter} onChange={(e) => setFilter(e.target.value)} />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-guanta-primary opacity-40 group-focus-within:opacity-100 transition-opacity" size={14} />
                </div>
                <div className="hidden md:flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-wider">
                    <Shield size={12} /> {usuarios.length} activos
                </div>
            </div>

            <div className="backdrop-blur-xl bg-white/60 rounded-xl shadow-2xl shadow-guanta-primary/5 border border-white/40 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/40 text-gray-400 text-[9px] font-black uppercase tracking-[0.15em] border-b border-white/40">
                            <th className="px-4 py-2">Usuario / Nombre</th>
                            <th className="px-4 py-2">Email</th>
                            <th className="px-4 py-2">Rol</th>
                            <th className="px-4 py-2">Estatus</th>
                            <th className="px-4 py-2 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/30">
                        {paginatedUsers.map((user) => (
                            <tr key={user.id} className={`group hover:bg-white/40 transition-all backdrop-blur-sm ${user.activo === 0 ? 'opacity-50' : ''}`}>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`p-1.5 rounded-lg backdrop-blur-sm ${user.rol === 'admin' ? 'bg-guanta-primary/10 text-guanta-primary' : 'bg-blue-100/80 text-blue-600'}`}>
                                            <User size={14} />
                                        </div>
                                        <div>
                                            <div className="font-black text-gray-800 text-sm tracking-tighter leading-none group-hover:text-guanta-primary transition-colors">@{user.username}</div>
                                            <div className="text-[10px] font-bold text-gray-500 uppercase">{user.nombre_completo}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-1.5 text-gray-600 font-bold text-xs">
                                        <Mail size={11} className="text-gray-300 shrink-0" />
                                        <span className="truncate">{user.email || 'N/A'}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black tracking-wider uppercase backdrop-blur-sm ${user.rol === 'admin' ? 'bg-guanta-primary/10 text-guanta-primary' : 'bg-blue-100/80 text-blue-600'}`}>
                                        {user.rol}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    {user.activo === 1 ? (
                                        <div className="flex items-center gap-1.5">
                                            <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></div>
                                            <span className="text-[9px] font-black text-emerald-600 uppercase">Activo</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5">
                                            <div className="h-1.5 w-1.5 bg-rose-400 rounded-full"></div>
                                            <span className="text-[9px] font-black text-rose-400 uppercase">Inactivo</span>
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                        <button onClick={() => handleOpenEdit(user)} className="p-2 bg-guanta-primary/10 backdrop-blur-sm text-guanta-primary rounded-lg hover:bg-guanta-primary hover:text-white transition-all">
                                            <Edit2 size={13} />
                                        </button>
                                        {user.activo === 1 && (
                                            <button onClick={() => handleDelete(user.id)} className="p-2 bg-rose-50/80 backdrop-blur-sm text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all">
                                                <Trash2 size={13} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredUsers.length > 0 && (
                    <div className="px-4 py-3 border-t border-white/40 flex items-center justify-between bg-white/30 backdrop-blur-sm">
                        <span className="text-[10px] font-bold text-gray-400">
                            {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} de {filteredUsers.length}
                        </span>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg hover:bg-white/60 disabled:opacity-30 transition-all">
                                <ChevronLeft size={14} className="text-gray-600" />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button key={page} onClick={() => setCurrentPage(page)} className={`w-7 h-7 rounded-lg text-[10px] font-bold transition-all backdrop-blur-sm ${
                                    currentPage === page ? 'bg-guanta-primary text-white shadow-lg shadow-guanta-primary/30' : 'hover:bg-white/60 text-gray-600'
                                }`}>{page}</button>
                            ))}
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg hover:bg-white/60 disabled:opacity-30 transition-all">
                                <ChevronRight size={14} className="text-gray-600" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="backdrop-blur-xl bg-white/60 w-full max-w-lg rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-white/40">
                        <div className="flex justify-between items-center mb-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-guanta-primary/10 backdrop-blur-sm rounded-xl text-guanta-primary shadow-lg shadow-guanta-primary/20 border border-guanta-primary/20">
                                    <UserPlus size={18} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 tracking-tighter leading-none">{isEditing ? 'Editar' : 'Nuevo Acceso'}</h3>
                                    <p className="text-[9px] font-black text-guanta-primary uppercase tracking-wider">Credenciales de Sistema</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white/40 backdrop-blur-sm text-gray-400 hover:text-gray-900 rounded-full transition-all border border-white/60">
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-gray-400 uppercase ml-1 tracking-widest">Username</label>
                                    <input type="text" required value={currentUser.username} onChange={(e) => setCurrentUser({...currentUser, username: e.target.value})}
                                        className="w-full p-2.5 bg-white/40 border-2 border-white/60 focus:border-guanta-primary focus:bg-white/60 rounded-lg outline-none font-bold text-gray-800 transition-all backdrop-blur-sm text-xs"
                                        placeholder="ej: j.perez" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-gray-400 uppercase ml-1 tracking-widest">Contraseña</label>
                                    <div className="relative">
                                        <input type="password" required={!isEditing} value={currentUser.password}
                                            onChange={(e) => setCurrentUser({...currentUser, password: e.target.value})}
                                            className="w-full p-2.5 bg-white/40 border-2 border-white/60 focus:border-guanta-primary focus:bg-white/60 rounded-lg outline-none font-bold text-gray-800 transition-all backdrop-blur-sm text-xs"
                                            placeholder={isEditing ? "(Sin cambios)" : "*******"} />
                                        <Key className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-gray-400 uppercase ml-1 tracking-widest">Nombre Completo</label>
                                <input type="text" required value={currentUser.nombre_completo} onChange={(e) => setCurrentUser({...currentUser, nombre_completo: e.target.value})}
                                    className="w-full p-2.5 bg-white/40 border-2 border-white/60 focus:border-guanta-primary focus:bg-white/60 rounded-lg outline-none font-bold text-gray-800 transition-all backdrop-blur-sm text-xs" />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-gray-400 uppercase ml-1 tracking-widest">Correo Electrónico</label>
                                <input type="email" value={currentUser.email} onChange={(e) => setCurrentUser({...currentUser, email: e.target.value})}
                                    className="w-full p-2.5 bg-white/40 border-2 border-white/60 focus:border-guanta-primary focus:bg-white/60 rounded-lg outline-none font-bold text-gray-800 transition-all backdrop-blur-sm text-xs"
                                    placeholder="ejemplo@guanta.gob.ve" />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-gray-400 uppercase ml-1 tracking-widest">Rol de Sistema</label>
                                <select value={currentUser.rol} onChange={(e) => setCurrentUser({...currentUser, rol: e.target.value})}
                                    className="w-full p-2.5 bg-white/40 border-2 border-white/60 focus:border-guanta-primary focus:bg-white/60 rounded-lg outline-none font-bold text-gray-800 transition-all appearance-none cursor-pointer backdrop-blur-sm text-xs">
                                    <option value="portero">Oficial de Seguridad (Portero)</option>
                                    <option value="admin">Administrador del Sistema</option>
                                </select>
                            </div>

                            <button type="submit" disabled={loading}
                                className="w-full py-3 bg-guanta-gradient text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-guanta-primary/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                                <Save size={14} /> {isEditing ? 'Actualizar Usuario' : 'Crear Acceso'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestionUsuarios;
