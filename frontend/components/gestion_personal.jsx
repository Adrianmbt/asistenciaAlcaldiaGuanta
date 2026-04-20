import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, UserPlus, Edit2, Trash2, User, Check, X, Save, FileText, Upload, Building2, Phone } from 'lucide-react';

const API_BASE_URL = '/api/personal';

const GestionPersonal = () => {
    const [personal, setPersonal] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState("");
    const fileInputRef = useRef(null);
    
    // Estados para Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentPersona, setCurrentPersona] = useState({
        cedula: '',
        nombre: '',
        apellido: '',
        entidad: 'alcaldia',
        nombre_instituto: '',
        cargo: '',
        telefono: ''
    });

    const fetchPersonal = async () => {
        setLoading(true);
        try {
            const response = await fetch(API_BASE_URL);
            const data = await response.json();
            setPersonal(data);
        } catch (error) {
            console.error("Error al cargar personal:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPersonal();
    }, []);

    const filteredPersonal = useMemo(() => {
        return personal.filter(p => 
            p.nombre.toLowerCase().includes(filter.toLowerCase()) ||
            p.apellido.toLowerCase().includes(filter.toLowerCase()) ||
            p.cedula.toLowerCase().includes(filter.toLowerCase()) ||
            (p.cargo && p.cargo.toLowerCase().includes(filter.toLowerCase()))
        );
    }, [filter, personal]);

    const handleOpenCreate = () => {
        setCurrentPersona({ cedula: '', nombre: '', apellido: '', entidad: 'alcaldia', nombre_instituto: '', cargo: '', telefono: '' });
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (p) => {
        setCurrentPersona({ ...p });
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const url = isEditing ? `${API_BASE_URL}/${currentPersona.id}` : API_BASE_URL;
            const method = isEditing ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentPersona)
            });

            if (response.ok) {
                setIsModalOpen(false);
                fetchPersonal();
            } else {
                const err = await response.json();
                alert(err.detail || "Error al procesar la solicitud");
            }
        } catch (error) {
            console.error("Error al guardar personal:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("¿Está seguro de eliminar a este trabajador del sistema?")) {
            try {
                const response = await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
                if (response.ok) {
                    fetchPersonal();
                }
            } catch (error) {
                console.error("Error al eliminar:", error);
            }
        }
    };

    const handleImportCSV = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/import-csv`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                alert(`Importación exitosa: ${result.nuevos} nuevos, ${result.actualizados} actualizados.`);
                fetchPersonal();
            } else {
                const err = await response.json();
                alert(err.detail || "Error al importar CSV");
            }
        } catch (error) {
            console.error("Error al importar:", error);
            alert("No se pudo procesar el archivo CSV.");
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto animate-in fade-in duration-500">
            {/* Cabecera de Sección */}
            <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h2 className="text-5xl font-black text-gray-900 tracking-tighter leading-none mb-2">Personal</h2>
                    <p className="text-guanta-primary font-black uppercase text-xs tracking-[0.4em] ml-1">Censo y Registro de Trabajadores</p>
                </div>
                
                <div className="flex gap-4">
                    <input 
                        type="file" 
                        accept=".csv" 
                        className="hidden" 
                        ref={fileInputRef} 
                        onChange={handleImportCSV} 
                    />
                    <button 
                        onClick={() => fileInputRef.current.click()}
                        className="flex items-center gap-3 px-6 py-4 bg-white text-guanta-primary border-2 border-orange-100 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-orange-50 transition-all shadow-lg"
                    >
                        <Upload size={20} /> Cargar CSV
                    </button>
                    <button 
                        onClick={handleOpenCreate}
                        className="flex items-center gap-3 px-8 py-4 bg-guanta-gradient text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-orange-500/20"
                    >
                        <UserPlus size={20} /> Nuevo Personal
                    </button>
                </div>
            </div>

            {/* Filtros y Buscador */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-orange-50 mb-8 flex items-center gap-4">
                <div className="relative flex-1 group">
                    <input
                        type="text"
                        placeholder="Buscar por cédula, nombre, apellido o cargo..."
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-guanta-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-700"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-guanta-primary opacity-40 group-focus-within:opacity-100 transition-opacity" size={20} />
                </div>
                <div className="hidden md:flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <User size={16} /> Total: {personal.length} trabajadores
                </div>
            </div>

            {/* Listado de Personal */}
            <div className="bg-white rounded-[2rem] shadow-2xl shadow-orange-500/5 border border-orange-50 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-orange-50">
                            <th className="px-8 py-5">Identificación / Nombre</th>
                            <th className="px-8 py-5">Dependencia / Cargo</th>
                            <th className="px-8 py-5">Contacto</th>
                            <th className="px-8 py-5 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-50/30">
                        {filteredPersonal.map((p) => (
                            <tr key={p.id} className="group hover:bg-orange-50/20 transition-all">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-2xl ${p.entidad === 'alcaldia' ? 'bg-orange-100 text-guanta-primary' : 'bg-emerald-100 text-emerald-600'}`}>
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <div className="font-black text-gray-800 tracking-tighter leading-none group-hover:text-guanta-primary transition-colors">V-{p.cedula}</div>
                                            <div className="text-[11px] font-bold text-gray-500 uppercase mt-1">{p.nombre} {p.apellido}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex flex-col">
                                        <span className={`w-fit px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest uppercase mb-1 ${p.entidad === 'alcaldia' ? 'bg-orange-50 text-guanta-primary' : 'bg-emerald-50 text-emerald-600'}`}>
                                            {p.entidad === 'alcaldia' ? 'ALCALDÍA' : (p.nombre_instituto || 'INSTITUTO')}
                                        </span>
                                        <div className="text-sm font-bold text-gray-600 uppercase tracking-tight">{p.cargo || 'Sin Cargo'}</div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2 text-gray-500 font-bold text-xs">
                                        <Phone size={14} className="text-gray-300" />
                                        {p.telefono || 'Sin teléfono'}
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                        <button 
                                            onClick={() => handleOpenEdit(p)}
                                            className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(p.id)}
                                            className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredPersonal.length === 0 && (
                     <div className="p-20 text-center">
                        <div className="inline-flex p-6 bg-gray-50 rounded-full mb-4">
                            <User size={40} className="text-gray-200" />
                        </div>
                        <h3 className="text-xl font-black text-gray-400 uppercase tracking-widest">No se encontraron registros</h3>
                     </div>
                )}
            </div>

            {/* Modal CRUD Personal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200 border border-orange-100">
                        <div className="flex justify-between items-center mb-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-orange-100 rounded-2xl text-guanta-primary shadow-lg shadow-orange-500/20">
                                    <UserPlus size={24} />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter leading-none">{isEditing ? 'Editar Personal' : 'Nuevo Ingreso'}</h3>
                                    <p className="text-[10px] font-black text-guanta-primary uppercase tracking-widest mt-1">Registro de Datos Institucionales</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 bg-gray-50 text-gray-400 hover:text-gray-900 rounded-full transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Cédula</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={currentPersona.cedula}
                                        onChange={(e) => setCurrentPersona({...currentPersona, cedula: e.target.value})}
                                        className="w-full p-3.5 bg-gray-50 border-2 border-transparent focus:border-guanta-primary focus:bg-white rounded-xl outline-none font-bold text-gray-800 transition-all"
                                        placeholder="Ej: 20111222"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Teléfono</label>
                                    <input 
                                        type="text" 
                                        value={currentPersona.telefono}
                                        onChange={(e) => setCurrentPersona({...currentPersona, telefono: e.target.value})}
                                        className="w-full p-3.5 bg-gray-50 border-2 border-transparent focus:border-guanta-primary focus:bg-white rounded-xl outline-none font-bold text-gray-800 transition-all"
                                        placeholder="0424-0000000"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Nombre</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={currentPersona.nombre}
                                        onChange={(e) => setCurrentPersona({...currentPersona, nombre: e.target.value})}
                                        className="w-full p-3.5 bg-gray-50 border-2 border-transparent focus:border-guanta-primary focus:bg-white rounded-xl outline-none font-bold text-gray-800 transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Apellido</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={currentPersona.apellido}
                                        onChange={(e) => setCurrentPersona({...currentPersona, apellido: e.target.value})}
                                        className="w-full p-3.5 bg-gray-50 border-2 border-transparent focus:border-guanta-primary focus:bg-white rounded-xl outline-none font-bold text-gray-800 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Dependencia</label>
                                <select 
                                    value={currentPersona.entidad}
                                    onChange={(e) => setCurrentPersona({...currentPersona, entidad: e.target.value})}
                                    className="w-full p-3.5 bg-gray-50 border-2 border-transparent focus:border-guanta-primary focus:bg-white rounded-xl outline-none font-bold text-gray-800 transition-all cursor-pointer"
                                >
                                    <option value="alcaldia">Alcaldía de Guanta (Sede Central)</option>
                                    <option value="instituto_autonomo">Instituto Autónomo</option>
                                </select>
                            </div>

                            {currentPersona.entidad === 'instituto_autonomo' && (
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Nombre del Instituto (Siglas)</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ej: IAMDE or IAMTUR"
                                        value={currentPersona.nombre_instituto}
                                        onChange={(e) => setCurrentPersona({...currentPersona, nombre_instituto: e.target.value})}
                                        className="w-full p-3.5 bg-gray-50 border-2 border-transparent focus:border-guanta-primary focus:bg-white rounded-xl outline-none font-bold text-gray-800 transition-all"
                                    />
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Cargo / Función</label>
                                <input 
                                    type="text" 
                                    value={currentPersona.cargo}
                                    onChange={(e) => setCurrentPersona({...currentPersona, cargo: e.target.value})}
                                    className="w-full p-3.5 bg-gray-50 border-2 border-transparent focus:border-guanta-primary focus:bg-white rounded-xl outline-none font-bold text-gray-800 transition-all"
                                    placeholder="Ej: Analista de RRHH"
                                />
                            </div>

                            <button 
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 bg-guanta-gradient text-white rounded-[1.5rem] font-black text-lg uppercase tracking-widest shadow-xl shadow-orange-500/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 mt-4"
                            >
                                <Save size={20} /> {isEditing ? 'Actualizar Ficha' : 'Registrar Trabajador'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestionPersonal;
