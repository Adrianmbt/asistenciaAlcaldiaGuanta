import React, { useState, useMemo } from 'react';
import { Search, Edit2, Trash2, LogOut, Filter, UserCheck, UserPlus, Clock, User } from 'lucide-react';

const AsistenciaTable = ({ registros, onEdit, onDelete, onMarcarSalida }) => {
    const [filter, setFilter] = useState("");
    const [filterType, setFilterType] = useState("TODOS");

    const filteredData = useMemo(() => {
        return registros.filter(item => {
            const matchesSearch =
                item.cedula_identidad.includes(filter) ||
                (item.nombre && item.nombre.toLowerCase().includes(filter.toLowerCase()));

            const matchesType = filterType === "TODOS" || item.tipo_persona === filterType;

            return matchesSearch && matchesType;
        });
    }, [filter, filterType, registros]);

    return (
        <div className="bg-white rounded-[2rem] shadow-2xl shadow-orange-500/5 border border-orange-50 overflow-hidden font-sans">
            {/* Barra de Herramientas Superior */}
            <div className="p-8 border-b border-orange-50 bg-orange-50/20 flex flex-col md:flex-row gap-6 justify-between items-center">
                <div className="relative w-full md:w-[28rem] group">
                    <input
                        type="text"
                        placeholder="Buscar por cédula o nombre..."
                        className="w-full pl-12 pr-4 py-3 bg-white border-2 border-transparent focus:border-guanta-primary rounded-2xl shadow-sm focus:shadow-orange-200/50 outline-none transition-all font-bold text-gray-700"
                        onChange={(e) => setFilter(e.target.value)}
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-guanta-primary opacity-40 group-focus-within:opacity-100 transition-opacity" size={20} />
                </div>

                <div className="flex bg-white p-1 rounded-2xl border border-orange-100 shadow-sm">
                    <button
                        onClick={() => setFilterType("TODOS")}
                        className={`px-5 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${filterType === 'TODOS' ? 'bg-guanta-primary text-white shadow-lg shadow-orange-500/30' : 'text-gray-400 hover:text-guanta-primary'}`}
                    >TODOS</button>
                    <button
                        onClick={() => setFilterType("PERSONAL")}
                        className={`px-5 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${filterType === 'PERSONAL' ? 'bg-guanta-primary text-white shadow-lg shadow-orange-500/30' : 'text-gray-400 hover:text-guanta-primary'}`}
                    >EMPLEADOS</button>
                    <button
                        onClick={() => setFilterType("VISITANTE")}
                        className={`px-5 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${filterType === 'VISITANTE' ? 'bg-guanta-accent text-white shadow-lg shadow-amber-500/30' : 'text-gray-400 hover:text-guanta-accent'}`}
                    >VISITANTES</button>
                </div>
            </div>

            {/* Tabla Estilo Guanta */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-orange-50">
                            <th className="px-8 py-5">Identificación / Nombre</th>
                            <th className="px-8 py-5">Origen</th>
                            <th className="px-8 py-5 text-center">Registro</th>
                            <th className="px-8 py-5">Estatus</th>
                            <th className="px-8 py-5 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-50/50">
                        {filteredData.map((reg) => (
                            <tr key={reg.id} className="group hover:bg-orange-50/30 transition-all duration-300">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-xl ${reg.tipo_persona === 'PERSONAL' ? 'bg-orange-100' : 'bg-amber-100'}`}>
                                             {reg.tipo_persona === 'PERSONAL' ? <User size={18} className="text-guanta-primary"/> : <UserPlus size={18} className="text-guanta-accent"/>}
                                        </div>
                                        <div>
                                            <div className="font-black text-gray-800 text-lg tracking-tighter leading-none mb-1 group-hover:text-guanta-primary transition-colors">{reg.nombre || "Acceso Externo"}</div>
                                            <div className="text-[10px] font-black text-gray-400 tracking-widest flex items-center">
                                                CÉDULA: V-{reg.cedula_identidad}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black tracking-tighter uppercase ${reg.tipo_persona === 'PERSONAL' ? 'bg-orange-100 text-guanta-primary' : 'bg-amber-100 text-amber-700'}`}>
                                        {reg.tipo_persona === 'PERSONAL' ? 'Institucional' : 'Visitante'}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <div className="flex flex-col items-center">
                                        <div className="flex items-center gap-1.5 text-gray-700 font-black text-sm">
                                            <Clock size={14} className="text-guanta-primary" />
                                            {new Date(reg.hora_entrada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div className="text-[8px] font-bold text-gray-400 uppercase mt-0.5">Entrada Registrada</div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    {reg.hora_salida ? (
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
                                            <span className="text-xs font-black text-gray-400 uppercase tracking-tighter">
                                                Salida: {new Date(reg.hora_salida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                            <span className="text-xs font-black text-emerald-600 uppercase tracking-tighter animate-pulse">En Instalaciones</span>
                                        </div>
                                    )}
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                        {!reg.hora_salida && (
                                            <button
                                                onClick={() => onMarcarSalida(reg.id)}
                                                className="p-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20" 
                                                title="Marcar Salida"
                                            >
                                                <LogOut size={16} />
                                            </button>
                                        )}
                                        <button onClick={() => onEdit(reg)} className="p-3 bg-orange-100 text-guanta-primary rounded-xl hover:bg-guanta-primary hover:text-white transition-all">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => onDelete(reg.id)} className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filteredData.length === 0 && (
                <div className="p-20 text-center flex flex-col items-center">
                    <div className="bg-gray-50 p-6 rounded-full inline-block mb-4">
                        <Search className="text-gray-200" size={48} />
                    </div>
                    <div className="text-gray-400 font-bold uppercase text-[10px] tracking-widest max-w-[15rem]">
                        Sin resultados activos para los criterios seleccionados
                    </div>
                </div>
            )}
        </div>
    );
};

export default AsistenciaTable;