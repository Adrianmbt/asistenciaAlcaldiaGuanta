import React, { useState } from 'react';
import { Search, User, Briefcase, Clock, ArrowRight, UserPlus, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';

const API_BASE_URL = '/api/asistencia';

const VerificationScreen = () => {
    const [cedula, setCedula] = useState('');
    const [personData, setPersonData] = useState(null);
    const [isVisitor, setIsVisitor] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const handleSearch = async (value) => {
        setCedula(value);
        if (value.length > 5) {
            setLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/verificar/${value}`);
                const data = await response.json();
                
                if (data.encontrado) {
                    setPersonData(data.datos);
                    setIsVisitor(false);
                } else {
                    setPersonData(null);
                    setIsVisitor(true);
                }
            } catch (error) {
                console.error("Error al buscar cédula:", error);
                setMessage({ type: 'error', text: 'Error de conexión con el servidor' });
            } finally {
                setLoading(false);
            }
        } else {
            setPersonData(null);
            setIsVisitor(false);
            setMessage(null);
        }
    };

    const handleRegister = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/registrar?cedula=${cedula}`, {
                method: 'POST'
            });
            const data = await response.json();
            
            if (response.ok) {
                const action = data.hora_salida ? "SALIDA" : "ENTRADA";
                setMessage({ 
                    type: 'success', 
                    text: `${action} REGISTRADA: ${new Date(data.hora_salida || data.hora_entrada).toLocaleTimeString()}` 
                });
                setTimeout(() => {
                    setCedula('');
                    setPersonData(null);
                    setMessage(null);
                }, 3000);
            } else {
                setMessage({ type: 'error', text: data.detail || 'Error al registrar' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error de red al registrar' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-orange-50/30 p-4 flex items-center justify-center font-sans">
            <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(240,84,56,0.15)] overflow-hidden border border-orange-100">

                {/* Header con Gradiente del Logo */}
                <div className="bg-guanta-gradient p-10 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                         <div className="absolute -top-10 -left-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
                         <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-black rounded-full blur-3xl"></div>
                    </div>
                    
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="bg-white/20 p-2 rounded-2xl backdrop-blur-md mb-4 border border-white/30">
                            <ShieldCheck size={32} className="text-white" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase leading-tight">Control de Asistencia</h1>
                        <p className="text-white/90 font-bold uppercase text-[10px] mt-2 tracking-[0.4em] bg-black/10 px-4 py-1 rounded-full border border-white/10">Alcaldía de Guanta</p>
                    </div>
                </div>

                <div className="p-10 -mt-6 bg-white rounded-t-[3rem] relative z-20">
                    {/* Alertas Elevadas */}
                    {message && (
                        <div className={`mb-8 p-5 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-500 shadow-sm ${
                            message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                            <div className={`p-2 rounded-full ${message.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                                {message.type === 'success' ? <CheckCircle size={18} className="text-white" /> : <AlertCircle size={18} className="text-white" />}
                            </div>
                            <p className="font-extrabold text-xs uppercase tracking-tight">{message.text}</p>
                        </div>
                    )}

                    {/* Input Neon Estilo Guanta */}
                    <div className="relative mb-10 group">
                        <label className="block text-[11px] font-black text-guanta-primary mb-3 uppercase tracking-[0.2em] ml-2">Identificación del Ciudadano</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={cedula}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="INGRESE CÉDULA"
                                className="w-full pl-16 pr-4 py-6 bg-gray-50 border-2 border-transparent focus:border-guanta-primary focus:bg-white rounded-3xl outline-none transition-all text-3xl font-black tracking-tighter text-gray-800 shadow-inner group-hover:border-orange-200"
                            />
                            <div className="absolute left-6 top-1/2 -translate-y-1/2">
                                <Search className="text-guanta-primary opacity-50" size={32} />
                            </div>
                            {loading && (
                                <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                    <div className="animate-spin rounded-full h-7 w-7 border-[3px] border-guanta-primary border-t-transparent"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* FICHA DE TRABAJADOR (Premium Orange) */}
                    {personData && (
                        <div className="animate-in fade-in zoom-in duration-500">
                            <div className="bg-gradient-to-br from-white to-orange-50 border-2 border-guanta-primary/20 p-10 rounded-[2.5rem] shadow-xl shadow-orange-500/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4">
                                    <div className="h-2 w-12 bg-guanta-gradient rounded-full"></div>
                                </div>
                                
                                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10 text-center md:text-left">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-guanta-gradient rounded-full blur-lg opacity-20 animate-pulse"></div>
                                        <div className="bg-white p-6 rounded-full shadow-2xl border border-orange-50 relative">
                                            <User size={64} className="text-guanta-primary" />
                                        </div>
                                    </div>

                                    <div className="flex-1">
                                        <span className="bg-guanta-primary text-white text-[10px] font-black px-3 py-1.5 rounded-full tracking-widest uppercase mb-4 inline-block shadow-lg shadow-orange-500/30">Personal Institucional</span>
                                        <h2 className="text-4xl font-black text-gray-900 leading-none mb-3 tracking-tighter">{personData.nombre}</h2>
                                        <div className="flex flex-wrap gap-2 items-center justify-center md:justify-start">
                                            <div className="bg-orange-100 text-guanta-primary px-3 py-1 rounded-lg text-[11px] font-black uppercase flex items-center">
                                                <Briefcase size={12} className="mr-2" /> {personData.cargo}
                                            </div>
                                            <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-[11px] font-bold uppercase">
                                                {personData.entidad}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-10">
                                    <button 
                                        onClick={handleRegister}
                                        disabled={loading}
                                        className="w-full flex items-center justify-center gap-4 bg-guanta-primary hover:bg-orange-600 disabled:bg-gray-300 text-white font-black py-6 rounded-[1.5rem] transition-all active:scale-95 shadow-2xl shadow-guanta-primary/40 text-xl uppercase tracking-tighter"
                                    >
                                        <Clock size={28} /> Confirmar Asistencia
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* FORMULARIO VISITANTE (Estilo Amarillo/Dorado) */}
                    {isVisitor && (
                        <div className="animate-in slide-in-from-bottom-8 duration-500">
                            <div className="bg-gradient-to-br from-white to-amber-50 border-2 border-guanta-accent/30 p-10 rounded-[2.5rem] shadow-xl shadow-amber-500/5">
                                <div className="flex items-center gap-5 mb-8">
                                    <div className="bg-guanta-accent p-3 rounded-2xl shadow-lg shadow-amber-500/20">
                                        <UserPlus size={28} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-2xl text-gray-800 tracking-tighter leading-none mb-1">Nueva Visita</h3>
                                        <p className="text-amber-600 text-[10px] font-black uppercase tracking-[0.2em]">Registro de Trámite Externo</p>
                                    </div>
                                </div>
                                <div className="space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-amber-500 uppercase ml-2 tracking-widest">Información Personal</label>
                                        <input type="text" placeholder="NOMBRE COMPLETO DEL VISITANTE" className="w-full p-4 rounded-2xl border-2 border-amber-100 outline-none focus:border-guanta-accent font-black placeholder:text-gray-300 text-gray-700 bg-white" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-amber-500 uppercase ml-2 tracking-widest">Destino</label>
                                            <input type="text" placeholder="DIRECCIÓN / ENTE" className="w-full p-4 rounded-2xl border-2 border-amber-100 outline-none focus:border-guanta-accent font-black bg-white" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-amber-500 uppercase ml-2 tracking-widest">Ubicación</label>
                                            <input type="text" placeholder="PISO / OFICINA" className="w-full p-4 rounded-2xl border-2 border-amber-100 outline-none focus:border-guanta-accent font-black bg-white" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-amber-500 uppercase ml-2 tracking-widest">Observaciones</label>
                                        <textarea placeholder="MOTIVO DEL INGRESO" className="w-full p-4 rounded-2xl border-2 border-amber-100 outline-none focus:border-guanta-accent font-black bg-white resize-none" rows="3"></textarea>
                                    </div>
                                    <button 
                                        onClick={handleRegister}
                                        className="w-full bg-guanta-accent text-white font-black py-6 rounded-[1.5rem] hover:bg-amber-600 transition-all shadow-2xl shadow-amber-500/30 uppercase tracking-widest text-lg"
                                    >
                                        Registrar Visita
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Institucional Super Elegante */}
                <div className="bg-gray-50/80 backdrop-blur-md p-6 border-t border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center text-[9px] text-gray-400 font-black uppercase tracking-[0.3em]">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-guanta-primary rounded-full animate-ping"></div>
                        <span>Operativo: Portería Central</span>
                    </div>
                    <span>© {new Date().getFullYear()} Alcatdía de Guanta - Gestión Digital</span>
                </div>
            </div>
        </div>
    );
};

export default VerificationScreen;