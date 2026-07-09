import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, UserPlus, Edit2, Trash2, User, Check, X, Save, Phone, Calendar, Briefcase, Building2, Mail, Hash } from 'lucide-react';

const API = '/api/personal';

const EMPTY_FORM = {
    cedula: '', nombres: '', apellidos: '', sexo: '',
    fecha_nacimiento: '', fecha_ingreso: '', fecha_egreso: '',
    cargo_id: '', departamento_id: '', ente_id: '',
    telefono: '', correo: '',
    estatus_laboral: 'ACTIVO', estado: 'ACTIVO',
    observaciones: ''
};

const GestionPersonal = () => {
    const [empleados, setEmpleados] = useState([]);
    const [cargos, setCargos] = useState([]);
    const [deptos, setDeptos] = useState([]);
    const [entes, setEntes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);

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

    const getNombreCargo = (id) => cargos.find(c => c.id === id)?.nombre || '';
    const getNombreDepto = (id) => deptos.find(d => d.id === id)?.nombre || '';
    const getNombreEnte = (id) => entes.find(e => e.id === id)?.nombre || '';

    const openCreate = () => { setForm(EMPTY_FORM); setIsEditing(false); setIsModalOpen(true); };
    const openEdit = (e) => {
        setForm({
            ...e,
            fecha_nacimiento: e.fecha_nacimiento ? e.fecha_nacimiento.slice(0, 10) : '',
            fecha_ingreso: e.fecha_ingreso ? e.fecha_ingreso.slice(0, 10) : '',
            fecha_egreso: e.fecha_egreso ? e.fecha_egreso.slice(0, 10) : '',
            cargo_id: e.cargo_id ?? '',
            departamento_id: e.departamento_id ?? '',
            ente_id: e.ente_id ?? '',
        });
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleSave = async (ev) => {
        ev.preventDefault();
        setLoading(true);
        try {
            const body = {
                cedula: form.cedula,
                nombres: form.nombres,
                apellidos: form.apellidos,
                sexo: form.sexo || null,
                fecha_nacimiento: form.fecha_nacimiento || null,
                fecha_ingreso: form.fecha_ingreso || null,
                fecha_egreso: form.fecha_egreso || null,
                cargo_id: form.cargo_id ? Number(form.cargo_id) : null,
                departamento_id: form.departamento_id ? Number(form.departamento_id) : null,
                ente_id: form.ente_id ? Number(form.ente_id) : null,
                telefono: form.telefono || null,
                correo: form.correo || null,
                estatus_laboral: form.estatus_laboral,
                estado: form.estado,
                observaciones: form.observaciones || null,
            };
            const url = isEditing ? `${API}/${form.id}` : API;
            const resp = await fetch(url, {
                method: isEditing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (resp.ok) {
                setIsModalOpen(false);
                fetchAll();
            } else {
                const err = await resp.json();
                alert(err.detail || 'Error al procesar');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, nombre) => {
        if (!window.confirm(`¿Desactivar a ${nombre}?`)) return;
        try {
            await fetch(`${API}/${id}`, { method: 'DELETE' });
            fetchAll();
        } catch (e) {
            console.error(e);
        }
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
                <button onClick={openCreate}
                    className="flex items-center gap-3 px-8 py-4 bg-guanta-gradient text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-teal-500/20">
                    <UserPlus size={20} /> Nuevo Empleado
                </button>
            </div>

            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-cyan-50 mb-8 flex items-center gap-4">
                <div className="relative flex-1 group">
                    <input type="text" placeholder="Buscar por cédula, nombre o apellido..."
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-guanta-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-700"
                        value={filter} onChange={e => setFilter(e.target.value)} />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-guanta-primary opacity-40" size={20} />
                </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-2xl shadow-teal-500/5 border border-cyan-50 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-cyan-50">
                            <th className="px-8 py-5">Cédula / Nombre</th>
                            <th className="px-8 py-5">Cargo / Depto.</th>
                            <th className="px-8 py-5">Ente</th>
                            <th className="px-8 py-5">Contacto</th>
                            <th className="px-8 py-5">Estatus</th>
                            <th className="px-8 py-5 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-cyan-50/30">
                        {filtered.map(e => (
                            <tr key={e.id} className="group hover:bg-cyan-50/20 transition-all">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-2xl bg-cyan-100 text-guanta-primary">
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
                                    <span className="text-[10px] font-black px-2 py-1 rounded-md bg-cyan-50 text-guanta-primary uppercase">
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
                                    <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                                        e.estatus_laboral === 'ACTIVO'
                                            ? 'bg-emerald-50 text-emerald-600'
                                            : 'bg-rose-50 text-rose-600'
                                    }`}>
                                        {e.estatus_laboral || 'ACTIVO'}
                                    </span>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                        <button onClick={() => openEdit(e)}
                                            className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(e.id, `${e.nombres} ${e.apellidos}`)}
                                            className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && (
                    <div className="p-20 text-center">
                        <div className="inline-flex p-6 bg-gray-50 rounded-full mb-4">
                            <User size={40} className="text-gray-200" />
                        </div>
                        <h3 className="text-xl font-black text-gray-400 uppercase tracking-widest">No se encontraron registros</h3>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 border border-cyan-100 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-3xl font-black text-gray-900 tracking-tighter">
                                    {isEditing ? 'Editar Empleado' : 'Nuevo Empleado'}
                                </h3>
                                <p className="text-[10px] font-black text-guanta-primary uppercase tracking-widest mt-1">
                                    Ficha Técnica Institucional
                                </p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)}
                                className="p-3 bg-gray-50 text-gray-400 hover:text-gray-900 rounded-full transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-5">
                            <div className="grid grid-cols-3 gap-4">
                                <Field label="Cédula" required>
                                    <input type="text" required
                                        value={form.cedula} onChange={e => setForm({...form, cedula: e.target.value})}
                                        className="w-full p-3 bg-gray-50 border-2 focus:border-guanta-primary focus:bg-white rounded-xl outline-none font-bold" />
                                </Field>
                                <Field label="Nombres" required>
                                    <input type="text" required
                                        value={form.nombres} onChange={e => setForm({...form, nombres: e.target.value})}
                                        className="w-full p-3 bg-gray-50 border-2 focus:border-guanta-primary focus:bg-white rounded-xl outline-none font-bold" />
                                </Field>
                                <Field label="Apellidos" required>
                                    <input type="text" required
                                        value={form.apellidos} onChange={e => setForm({...form, apellidos: e.target.value})}
                                        className="w-full p-3 bg-gray-50 border-2 focus:border-guanta-primary focus:bg-white rounded-xl outline-none font-bold" />
                                </Field>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <Field label="Sexo">
                                    <select value={form.sexo} onChange={e => setForm({...form, sexo: e.target.value})}
                                        className="w-full p-3 bg-gray-50 border-2 focus:border-guanta-primary rounded-xl outline-none font-bold cursor-pointer">
                                        <option value="">Seleccionar</option>
                                        <option value="M">Masculino</option>
                                        <option value="F">Femenino</option>
                                    </select>
                                </Field>
                                <Field label="Fecha Nacimiento">
                                    <input type="date"
                                        value={form.fecha_nacimiento} onChange={e => setForm({...form, fecha_nacimiento: e.target.value})}
                                        className="w-full p-3 bg-gray-50 border-2 focus:border-guanta-primary rounded-xl outline-none font-bold" />
                                </Field>
                                <Field label="Fecha Ingreso">
                                    <input type="date"
                                        value={form.fecha_ingreso} onChange={e => setForm({...form, fecha_ingreso: e.target.value})}
                                        className="w-full p-3 bg-gray-50 border-2 focus:border-guanta-primary rounded-xl outline-none font-bold" />
                                </Field>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <Field label="Cargo">
                                    <select value={form.cargo_id} onChange={e => setForm({...form, cargo_id: e.target.value})}
                                        className="w-full p-3 bg-gray-50 border-2 focus:border-guanta-primary rounded-xl outline-none font-bold cursor-pointer">
                                        <option value="">Seleccionar cargo</option>
                                        {cargos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                    </select>
                                </Field>
                                <Field label="Departamento">
                                    <select value={form.departamento_id} onChange={e => setForm({...form, departamento_id: e.target.value})}
                                        className="w-full p-3 bg-gray-50 border-2 focus:border-guanta-primary rounded-xl outline-none font-bold cursor-pointer">
                                        <option value="">Seleccionar departamento</option>
                                        {deptos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                                    </select>
                                </Field>
                                <Field label="Ente">
                                    <select value={form.ente_id} onChange={e => setForm({...form, ente_id: e.target.value})}
                                        className="w-full p-3 bg-gray-50 border-2 focus:border-guanta-primary rounded-xl outline-none font-bold cursor-pointer">
                                        <option value="">Seleccionar ente</option>
                                        {entes.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                                    </select>
                                </Field>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Teléfono">
                                    <input type="text"
                                        value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})}
                                        className="w-full p-3 bg-gray-50 border-2 focus:border-guanta-primary rounded-xl outline-none font-bold" placeholder="0424-0000000" />
                                </Field>
                                <Field label="Correo Electrónico">
                                    <input type="email"
                                        value={form.correo} onChange={e => setForm({...form, correo: e.target.value})}
                                        className="w-full p-3 bg-gray-50 border-2 focus:border-guanta-primary rounded-xl outline-none font-bold" placeholder="ejemplo@guanta.gob.ve" />
                                </Field>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Estatus Laboral">
                                    <select value={form.estatus_laboral} onChange={e => setForm({...form, estatus_laboral: e.target.value})}
                                        className="w-full p-3 bg-gray-50 border-2 focus:border-guanta-primary rounded-xl outline-none font-bold cursor-pointer">
                                        <option value="ACTIVO">Activo</option>
                                        <option value="EGRESADO">Egresado</option>
                                        <option value="JUBILADO">Jubilado</option>
                                        <option value="SUSPENDIDO">Suspendido</option>
                                        <option value="PERMISO">Permiso</option>
                                        <option value="REPOSO">Reposo</option>
                                    </select>
                                </Field>
                                <Field label="Estado">
                                    <select value={form.estado} onChange={e => setForm({...form, estado: e.target.value})}
                                        className="w-full p-3 bg-gray-50 border-2 focus:border-guanta-primary rounded-xl outline-none font-bold cursor-pointer">
                                        <option value="ACTIVO">Activo</option>
                                        <option value="INACTIVO">Inactivo</option>
                                    </select>
                                </Field>
                            </div>

                            <Field label="Observaciones">
                                <textarea rows={2}
                                    value={form.observaciones} onChange={e => setForm({...form, observaciones: e.target.value})}
                                    className="w-full p-3 bg-gray-50 border-2 focus:border-guanta-primary rounded-xl outline-none font-bold resize-none" />
                            </Field>

                            <button type="submit" disabled={loading}
                                className="w-full py-5 bg-guanta-gradient text-white rounded-[1.5rem] font-black text-lg uppercase tracking-widest shadow-xl shadow-teal-500/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
                                <Save size={20} /> {isEditing ? 'Actualizar Ficha' : 'Registrar Empleado'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

function Field({ label, children, required }) {
    return (
        <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">
                {label} {required && <span className="text-rose-500">*</span>}
            </label>
            {children}
        </div>
    );
}

export default GestionPersonal;
