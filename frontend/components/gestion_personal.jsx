import React, { useState, useEffect, useMemo } from 'react';
import { Search, User, ChevronLeft, ChevronRight } from 'lucide-react';

const API = '/api/personal';
const ITEMS_PER_PAGE = 5;

const GestionPersonal = () => {
    const [empleados, setEmpleados] = useState([]);
    const [cargos, setCargos] = useState([]);
    const [deptos, setDeptos] = useState([]);
    const [entes, setEntes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [emp, car, dep, ent] = await Promise.all([
                fetch(API).then(r => r.json()),
                fetch(`${API}/cargos`).then(r => r.json()),
                fetch(`${API}/departamentos`).then(r => r.json()),
                fetch(`${API}/entes`).then(r => r.json()),
            ]);
            setEmpleados(emp);
            setCargos(car);
            setDeptos(dep);
            setEntes(ent);
        } catch (e) {
            console.error("Error al cargar datos:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const filtered = useMemo(() =>
        empleados.filter(e =>
            e.nombres?.toLowerCase().includes(filter.toLowerCase()) ||
            e.apellidos?.toLowerCase().includes(filter.toLowerCase()) ||
            e.cedula?.toLowerCase().includes(filter.toLowerCase())
        ), [filter, empleados]
    );

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filtered.slice(start, start + ITEMS_PER_PAGE);
    }, [filtered, currentPage]);

    const getNombreCargo = (id) => cargos.find(c => c.id === id)?.nombre || '';
    const getNombreDepto = (id) => deptos.find(d => d.id === id)?.nombre || '';
    const getNombreEnte = (id) => entes.find(e => e.id === id)?.nombre || '';

    const handleFilterChange = (e) => {
        setFilter(e.target.value);
        setCurrentPage(1);
    };

    return (
        <div className="w-full max-w-6xl mx-auto animate-in fade-in duration-500">
            <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h2 className="text-5xl font-black text-gray-900 tracking-tighter leading-none mb-2">Personal</h2>
                    <p className="text-guanta-primary font-black uppercase text-xs tracking-[0.4em] ml-1">
                        {empleados.length} trabajadores registrados
                    </p>
                </div>
            </div>

            <div className="backdrop-blur-xl bg-white/60 p-6 rounded-[2rem] shadow-lg border border-white/40 mb-8 flex items-center gap-4">
                <div className="relative flex-1 group">
                    <input type="text" placeholder="Buscar por cédula, nombre o apellido..."
                        className="w-full pl-12 pr-4 py-3 bg-white/40 border-2 border-white/60 focus:border-guanta-primary focus:bg-white/80 rounded-2xl outline-none transition-all font-bold text-gray-700 backdrop-blur-sm"
                        value={filter} onChange={handleFilterChange} />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-guanta-primary opacity-40" size={20} />
                </div>
            </div>

            <div className="backdrop-blur-xl bg-white/60 rounded-[2rem] shadow-2xl shadow-guanta-primary/5 border border-white/40 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/40 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/40">
                            <th className="px-8 py-5">Cédula / Nombre</th>
                            <th className="px-8 py-5">Cargo / Depto.</th>
                            <th className="px-8 py-5">Ente</th>
                            <th className="px-8 py-5">Contacto</th>
                            <th className="px-8 py-5">Estatus</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/30">
                        {paginatedData.map(e => (
                            <tr key={e.id} className="group hover:bg-white/40 transition-all backdrop-blur-sm">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-2xl bg-guanta-primary/10 text-guanta-primary backdrop-blur-sm">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <div className="font-black text-gray-800 tracking-tighter">V-{e.cedula}</div>
                                            <div className="text-[11px] font-bold text-gray-500 uppercase mt-1">
                                                {e.nombres} {e.apellidos}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="text-sm font-bold text-gray-700">{getNombreCargo(e.cargo_id) || '—'}</div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase mt-1">
                                        {getNombreDepto(e.departamento_id) || '—'}
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <span className="text-[10px] font-black px-2 py-1 rounded-md bg-guanta-primary/10 text-guanta-primary uppercase backdrop-blur-sm">
                                        {getNombreEnte(e.ente_id) || '—'}
                                    </span>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex flex-col gap-1 text-xs font-bold text-gray-500">
                                        <span>{e.telefono || '—'}</span>
                                        <span className="text-gray-400">{e.correo || ''}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm ${
                                        e.estatus_laboral === 'ACTIVO'
                                            ? 'bg-emerald-50/80 text-emerald-600'
                                            : 'bg-rose-50/80 text-rose-600'
                                    }`}>
                                        {e.estatus_laboral || 'ACTIVO'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && (
                    <div className="p-20 text-center">
                        <div className="inline-flex p-6 bg-white/40 rounded-full mb-4 backdrop-blur-sm">
                            <User size={40} className="text-gray-200" />
                        </div>
                        <h3 className="text-xl font-black text-gray-400 uppercase tracking-widest">No se encontraron registros</h3>
                    </div>
                )}
                {filtered.length > 0 && (
                    <div className="px-8 py-5 border-t border-white/40 flex items-center justify-between bg-white/30 backdrop-blur-sm">
                        <span className="text-xs font-bold text-gray-400">
                            Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} de {filtered.length}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg hover:bg-white/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all backdrop-blur-sm"
                            >
                                <ChevronLeft size={18} className="text-gray-600" />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all backdrop-blur-sm ${
                                        currentPage === page
                                            ? 'bg-guanta-primary text-white shadow-lg shadow-guanta-primary/30'
                                            : 'hover:bg-white/60 text-gray-600'
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg hover:bg-white/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all backdrop-blur-sm"
                            >
                                <ChevronRight size={18} className="text-gray-600" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GestionPersonal;
