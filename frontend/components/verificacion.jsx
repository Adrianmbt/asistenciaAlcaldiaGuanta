import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Briefcase, Clock, ArrowRight, UserPlus, CheckCircle, AlertCircle, ShieldCheck, Phone, Wifi, WifiOff, Cpu } from 'lucide-react';
import { FingerprintReader, detectarLectores } from '../services/fingerprintReader';
import Swal from 'sweetalert2';

const API_BASE_URL = '/api/asistencia';

const VerificationScreen = () => {
    const [cedula, setCedula] = useState('');
    const [personData, setPersonData] = useState(null);
    const [isVisitor, setIsVisitor] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState('cedula');
    const [isScanning, setIsScanning] = useState(false);
    const [readerStatus, setReaderStatus] = useState(null);
    const [lectoresDisponibles, setLectoresDisponibles] = useState([]);
    const [showBridgeModal, setShowBridgeModal] = useState(false);
    const [bridgeUrl, setBridgeUrl] = useState('ws://localhost:8765');
    const readerRef = useRef(null);

    const showAlert = (type, text, options = {}) => {
        const isSuccess = type === 'success';
        Swal.fire({
            icon: isSuccess ? 'success' : 'error',
            title: isSuccess ? '¡Operación Exitosa!' : 'Error',
            text: text,
            confirmButtonColor: '#009FA1',
            background: '#fff',
            color: '#1A1A1A',
            iconColor: isSuccess ? '#009FA1' : '#e74c3c',
            customClass: {
                popup: 'rounded-3xl shadow-2xl border border-gray-100',
                title: 'font-black text-lg uppercase tracking-tight',
                htmlContainer: 'font-bold text-sm text-gray-600',
                confirmButton: 'rounded-2xl font-black uppercase tracking-widest text-xs px-8 py-3',
            },
            showConfirmButton: true,
            timer: options.timer || (isSuccess ? 3000 : undefined),
            timerProgressBar: isSuccess,
            ...options,
        });
    };

    const showToast = (type, text) => {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            customClass: {
                popup: 'rounded-2xl shadow-lg',
            },
            didOpen: (toast) => {
                toast.onmouseenter = Swal.stopTimer;
                toast.onmouseleave = Swal.resumeTimer;
            }
        });
        Toast.fire({
            icon: type,
            title: text,
            iconColor: type === 'success' ? '#009FA1' : '#e74c3c',
        });
    };

    useEffect(() => {
        detectarLectores().then(setLectoresDisponibles);
    }, []);

    useEffect(() => {
        if (mode === 'biometric' && !readerRef.current) {
            const reader = new FingerprintReader();
            reader.onStatusChange(setReaderStatus);
            readerRef.current = reader;
        }
        return () => {
            if (mode !== 'biometric' && readerRef.current) {
                readerRef.current.desconectar();
                readerRef.current = null;
                setReaderStatus(null);
            }
        };
    }, [mode]);

    const conectarLector = async () => {
        const reader = readerRef.current;
        if (!reader) return;
        await reader.conectar();
        setLectoresDisponibles(await detectarLectores());
    };

    const conectarBridge = async () => {
        const reader = readerRef.current;
        if (!reader) return;
        try {
            await reader.conectarWebSocket(bridgeUrl);
            setShowBridgeModal(false);
        } catch {
            showAlert('error', 'No se pudo conectar al servicio biométrico');
        }
    };

    const [visitorData, setVisitorData] = useState({
        nombre: '',
        ente: '',
        piso: '',
        motivo: '',
        telefono: ''
    });

    const capturarHuella = async () => {
        const reader = readerRef.current;
        if (!reader) {
            showAlert('error', 'No hay lector biométrico configurado');
            return;
        }

        setIsScanning(true);

        try {
            const template = await reader.capturar();
            const response = await fetch(`${API_BASE_URL}/biometria/verificar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ template })
            });

            const data = await response.json();
            if (response.ok) {
                setCedula(data.cedula);
                setPersonData(data);
                setIsVisitor(false);
                showAlert('success', 'HUELLA RECONOCIDA: ' + data.nombre);
            } else {
                showAlert('error', data.detail || 'Huella no reconocida');
            }
        } catch (error) {
            showAlert('error', error.message || 'Error al leer la huella');
        } finally {
            setIsScanning(false);
        }
    };

    const simularCaptura = async () => {
        setIsScanning(true);

        setTimeout(async () => {
            try {
                const dummyTemplate = "HASH_EJEMPLO_JUAN_PEREZ";
                const response = await fetch(`${API_BASE_URL}/biometria/verificar`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ template: dummyTemplate })
                });

                const data = await response.json();
                if (response.ok) {
                    setCedula(data.cedula);
                    setPersonData(data);
                    setIsVisitor(false);
                    showAlert('success', 'HUELLA RECONOCIDA: ' + data.nombre);
                } else {
                    showAlert('error', data.detail);
                }
            } catch (error) {
                showAlert('error', 'Error al conectar con el sensor');
            } finally {
                setIsScanning(false);
            }
        }, 2000);
    };

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
                showToast('error', 'Error de conexión con el servidor');
            } finally {
                setLoading(false);
            }
        } else {
            setPersonData(null);
            setIsVisitor(false);
        }
    };

    const handleRegister = async () => {
        const confirmResult = await Swal.fire({
            title: isVisitor ? '¿Registrar Visita?' : '¿Confirmar Asistencia?',
            text: isVisitor
                ? `Se registrará la visita de ${visitorData.nombre || 'el visitante'} con cédula V-${cedula}`
                : `Se registrará la asistencia para cédula V-${cedula}`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#009FA1',
            cancelButtonColor: '#d1d5db',
            confirmButtonText: 'Sí, registrar',
            cancelButtonText: 'Cancelar',
            customClass: {
                popup: 'rounded-3xl shadow-2xl border border-gray-100',
                title: 'font-black text-lg uppercase tracking-tight',
                htmlContainer: 'font-bold text-sm text-gray-600',
                confirmButton: 'rounded-2xl font-black uppercase tracking-widest text-xs px-8 py-3',
                cancelButton: 'rounded-2xl font-black uppercase tracking-widest text-xs px-8 py-3',
            },
        });

        if (!confirmResult.isConfirmed) return;

        setLoading(true);
        try {
            let url = `${API_BASE_URL}/registrar?cedula=${cedula}`;
            
            if (isVisitor) {
                url += `&nombre=${encodeURIComponent(visitorData.nombre)}`;
                url += `&ente=${encodeURIComponent(visitorData.ente)}`;
                url += `&piso=${encodeURIComponent(visitorData.piso)}`;
                url += `&motivo=${encodeURIComponent(visitorData.motivo)}`;
                url += `&telefono=${encodeURIComponent(visitorData.telefono)}`;
            }

            const response = await fetch(url, {
                method: 'POST'
            });
            const data = await response.json();
            
            if (response.ok) {
                const action = data.hora_salida ? "SALIDA" : "ENTRADA";
                const hora = new Date(data.hora_salida || data.hora_entrada).toLocaleTimeString();
                
                showAlert('success', `${action} registrada exitosamente a las ${hora}`, {
                    timer: 4000,
                    title: `¡${action} Registrada!`,
                });
                
                setTimeout(() => {
                    setCedula('');
                    setPersonData(null);
                    setIsVisitor(false);
                    setVisitorData({
                        nombre: '',
                        ente: '',
                        piso: '',
                        motivo: '',
                        telefono: ''
                    });
                }, 3000);
            } else {
                showAlert('error', data.detail || 'Error al registrar');
            }
        } catch (error) {
            showAlert('error', 'Error de red al registrar. Verifique su conexión.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50/80 via-white to-orange-100/40 p-4 flex items-center justify-center font-sans backdrop-blur-sm">
            <div className="w-full max-w-4xl backdrop-blur-xl bg-white/50 rounded-[2.5rem] shadow-[0_20px_50px_rgba(240,84,56,0.15)] overflow-hidden border border-white/40">

                <div className="bg-guanta-gradient p-8 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                         <div className="absolute -top-10 -left-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
                         <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-black rounded-full blur-3xl"></div>
                    </div>
                    
                    <div className="relative z-10 flex items-center justify-center gap-4">
                        <div className="bg-white/20 p-2 rounded-2xl backdrop-blur-md border border-white/30">
                            <ShieldCheck size={28} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tighter uppercase leading-tight">Control de Asistencia</h1>
                            <p className="text-white/90 font-bold uppercase text-[10px] mt-1 tracking-[0.4em]">Alcaldía de Guanta</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 -mt-6 bg-white/40 backdrop-blur-xl rounded-t-[3rem] relative z-20 border-t border-white/60">

                    <div className="flex flex-col md:flex-row gap-6 mb-8">
                        <div className="flex md:flex-col p-1.5 bg-white/40 backdrop-blur-sm rounded-2xl gap-2 md:w-48 shrink-0 border border-white/60">
                            <button 
                                onClick={() => setMode('cedula')}
                                className={`flex-1 py-3 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all backdrop-blur-sm ${mode === 'cedula' ? 'bg-guanta-primary text-white shadow-lg shadow-guanta-primary/30' : 'text-gray-400 hover:text-gray-600 hover:bg-white/40'}`}
                            >
                                Cédula Identidad
                            </button>
                            <button 
                                onClick={() => setMode('biometric')}
                                className={`flex-1 py-3 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all backdrop-blur-sm ${mode === 'biometric' ? 'bg-guanta-primary text-white shadow-lg shadow-guanta-primary/30' : 'text-gray-400 hover:text-gray-600 hover:bg-white/40'}`}
                            >
                                Huella Dactilar
                            </button>
                        </div>

                        <div className="flex-1">
                            {mode === 'cedula' ? (
                                <div className="relative group h-full flex flex-col justify-center">
                                    <label className="block text-[11px] font-black text-guanta-primary mb-3 uppercase tracking-[0.2em] ml-2">Identificación del Ciudadano</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={cedula}
                                            onChange={(e) => handleSearch(e.target.value)}
                                            placeholder="INGRESE CÉDULA"
                                            className="w-full pl-14 pr-4 py-5 bg-white/40 border-2 border-white/60 focus:border-guanta-primary focus:bg-white/60 rounded-2xl outline-none transition-all text-2xl font-black tracking-tighter text-gray-800 shadow-inner backdrop-blur-sm group-hover:border-guanta-accent"
                                        />
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2">
                                            <Search className="text-guanta-primary opacity-50" size={26} />
                                        </div>
                                        {loading && (
                                            <div className="absolute right-5 top-1/2 -translate-y-1/2">
                                                <div className="animate-spin rounded-full h-6 w-6 border-[3px] border-guanta-primary border-t-transparent"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="animate-in fade-in zoom-in duration-300">
                                    {readerStatus && (
                                        <div className={`mb-4 p-3 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-wider backdrop-blur-sm ${
                                            readerStatus.tipo === 'conectado' ? 'bg-emerald-50/80 text-emerald-700 border border-emerald-200/60' :
                                            readerStatus.tipo === 'conectando' ? 'bg-blue-50/80 text-blue-700 border border-blue-200/60' :
                                            'bg-rose-50/80 text-rose-700 border border-rose-200/60'
                                        }`}>
                                            {readerStatus.tipo === 'conectado' ? <Wifi size={16} /> :
                                             readerStatus.tipo === 'conectando' ? <Cpu size={16} className="animate-spin" /> :
                                             <WifiOff size={16} />}
                                            <span>{readerStatus.mensaje}</span>
                                        </div>
                                    )}

                                    <div className={`p-8 rounded-[2rem] border-2 border-dashed flex items-center gap-6 transition-all backdrop-blur-sm ${isScanning ? 'bg-guanta-primary/10 border-guanta-primary animate-pulse' : 'bg-white/40 border-white/60'}`}>
                                        <div className={`p-6 rounded-full shrink-0 backdrop-blur-sm ${isScanning ? 'bg-guanta-primary shadow-2xl shadow-guanta-primary/50' : readerStatus?.tipo === 'conectado' ? 'bg-emerald-500' : 'bg-gray-200/60'}`}>
                                            <ShieldCheck size={40} className={isScanning || readerStatus?.tipo === 'conectado' ? 'text-white' : 'text-gray-400'} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-black text-gray-800 uppercase tracking-tighter mb-1">
                                                {isScanning ? 'Escaneando Huella...' :
                                                 readerStatus?.tipo === 'conectado' ? 'Coloque el dedo' :
                                                 'Esperando Lector...'}
                                            </h3>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                {isScanning ? 'Procesando identidad biométrica...' :
                                                 readerStatus?.tipo === 'conectado' ? 'Presione el botón para capturar la huella' :
                                                 'Conecte un lector biométrico para iniciar'}
                                            </p>
                                        </div>

                                        {!personData && !isScanning && (
                                            <div className="flex flex-wrap gap-2 shrink-0">
                                                {readerStatus?.tipo !== 'conectado' && navigator.usb && (
                                                    <button
                                                        onClick={conectarLector}
                                                        disabled={readerStatus?.tipo === 'conectando'}
                                                        className="flex items-center gap-2 bg-guanta-primary text-white px-4 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-guanta-pink transition-all shadow-md"
                                                    >
                                                        <Cpu size={14} />
                                                        USB
                                                    </button>
                                                )}

                                                {readerStatus?.tipo !== 'conectado' && (
                                                    <button
                                                        onClick={() => setShowBridgeModal(true)}
                                                        className="flex items-center gap-2 bg-white/60 backdrop-blur-sm border border-white/60 px-4 py-2 rounded-full text-[10px] font-black text-gray-500 hover:text-guanta-primary hover:border-guanta-primary transition-all"
                                                    >
                                                        <Wifi size={14} />
                                                        BRIDGE
                                                    </button>
                                                )}

                                                {readerStatus?.tipo === 'conectado' && (
                                                    <button
                                                        onClick={capturarHuella}
                                                        className="bg-guanta-primary text-white px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:bg-guanta-pink transition-all shadow-xl shadow-guanta-primary/30 active:scale-95"
                                                    >
                                                        CAPTURAR
                                                    </button>
                                                )}

                                                <button
                                                    onClick={simularCaptura}
                                                    className="bg-white/60 backdrop-blur-sm border border-white/60 px-4 py-2 rounded-full text-[10px] font-black text-gray-400 hover:text-guanta-primary hover:border-guanta-primary transition-all"
                                                >
                                                    SIMULAR
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {showBridgeModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                            <div className="backdrop-blur-xl bg-white/60 rounded-[2rem] p-8 max-w-md w-full mx-4 shadow-2xl border border-white/40 animate-in zoom-in-95 duration-200">
                                <h3 className="text-lg font-black text-gray-800 uppercase tracking-tighter mb-2">Bridge Biométrico</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">
                                    Conectar a servicio biométrico local vía WebSocket
                                </p>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">URL del servicio</label>
                                <input
                                    type="text"
                                    value={bridgeUrl}
                                    onChange={(e) => setBridgeUrl(e.target.value)}
                                    className="w-full p-4 rounded-2xl border-2 border-white/60 outline-none focus:border-guanta-primary font-bold text-sm mb-6 bg-white/40 backdrop-blur-sm"
                                />
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowBridgeModal(false)}
                                        className="flex-1 py-4 rounded-2xl border-2 border-white/60 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-white/40 transition-all backdrop-blur-sm"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={conectarBridge}
                                        className="flex-1 py-4 rounded-2xl bg-guanta-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-guanta-pink transition-all"
                                    >
                                        Conectar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {personData && (
                        <div className="animate-in fade-in zoom-in duration-500">
                            <div className="bg-gradient-to-br from-white/80 to-guanta-primary/5 border-2 border-guanta-primary/20 p-8 rounded-[2rem] shadow-xl shadow-guanta-primary/5 relative overflow-hidden group backdrop-blur-xl">
                                <div className="absolute top-0 right-0 p-4">
                                    <div className="h-2 w-12 bg-guanta-gradient rounded-full"></div>
                                </div>
                                
                                <div className="flex items-center gap-6 relative z-10">
                                    <div className="relative shrink-0">
                                        <div className="absolute inset-0 bg-guanta-gradient rounded-full blur-lg opacity-20 animate-pulse"></div>
                                        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-full shadow-2xl border border-white/60 relative">
                                            <User size={40} className="text-guanta-primary" />
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <span className="bg-guanta-primary text-white text-[9px] font-black px-3 py-1 rounded-full tracking-widest uppercase mb-2 inline-block shadow-lg shadow-guanta-primary/30">Personal Institucional</span>
                                        <h2 className="text-2xl font-black text-gray-900 leading-none mb-2 tracking-tighter truncate">{personData.nombre}</h2>
                                        <div className="flex flex-wrap gap-2 items-center">
                                            <div className="bg-guanta-primary/10 text-guanta-primary px-3 py-1 rounded-lg text-[11px] font-black uppercase flex items-center backdrop-blur-sm">
                                                <Briefcase size={12} className="mr-2" /> {personData.cargo}
                                            </div>
                                            <div className="bg-white/60 text-gray-600 px-3 py-1 rounded-lg text-[11px] font-bold uppercase backdrop-blur-sm">
                                                {personData.ente}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="shrink-0">
                                        {new Date().getHours() >= 17 && personData.ente_tipo === 'alcaldia' && (
                                            <div className="mb-3 bg-guanta-primary/10 p-3 rounded-xl border border-guanta-primary/20 flex items-center gap-2 backdrop-blur-sm">
                                                <div className="bg-guanta-primary p-1 rounded-lg">
                                                    <Clock size={14} className="text-white" />
                                                </div>
                                                <p className="text-[9px] font-black text-guanta-pink uppercase tracking-tight">Fuera de Horario</p>
                                            </div>
                                        )}
                                        <button 
                                            onClick={handleRegister}
                                            disabled={loading}
                                            className="flex items-center justify-center gap-3 bg-guanta-primary hover:bg-guanta-pink disabled:bg-gray-300 text-white font-black py-4 px-8 rounded-2xl transition-all active:scale-95 shadow-2xl shadow-guanta-primary/40 text-sm uppercase tracking-tighter whitespace-nowrap"
                                        >
                                            <Clock size={20} /> Confirmar Asistencia
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {isVisitor && (
                        <div className="animate-in slide-in-from-bottom-8 duration-500">
                            <div className="bg-gradient-to-br from-white/80 to-guanta-accent/5 border-2 border-guanta-accent/30 p-8 rounded-[2rem] shadow-xl shadow-guanta-primary/5 backdrop-blur-xl">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="bg-gradient-to-r from-guanta-primary to-guanta-pink p-3 rounded-2xl flex items-center gap-3 shadow-lg shadow-guanta-primary/30 flex-1">
                                        <div className="bg-white/20 p-1.5 rounded-xl">
                                            <ShieldCheck size={20} className="text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white text-[9px] font-black uppercase tracking-widest">Verificación Confirmada</p>
                                            <p className="text-white/90 text-xs font-bold mt-0.5">Cédula: <span className="text-white font-black text-base">V-{cedula}</span></p>
                                        </div>
                                        <div className="bg-white/20 px-2.5 py-1 rounded-full">
                                            <span className="text-white text-[9px] font-black uppercase tracking-widest">Válido</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <div className="bg-guanta-accent p-2.5 rounded-xl shadow-lg shadow-guanta-primary/20">
                                            <UserPlus size={22} className="text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-xl text-gray-800 tracking-tighter leading-none mb-0.5">Nueva Visita</h3>
                                            <p className="text-guanta-pink text-[9px] font-black uppercase tracking-[0.15em]">Registro Externo</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-guanta-pink uppercase ml-2 tracking-widest">Nombre Completo</label>
                                        <input 
                                            type="text" 
                                            placeholder="NOMBRE DEL VISITANTE" 
                                            value={visitorData.nombre}
                                            onChange={(e) => setVisitorData({...visitorData, nombre: e.target.value})}
                                            className="w-full p-3.5 rounded-xl border-2 border-white/60 outline-none focus:border-guanta-accent font-black placeholder:text-gray-300 text-gray-700 bg-white/40 backdrop-blur-sm text-sm" 
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-guanta-pink uppercase ml-2 tracking-widest">Teléfono / WhatsApp</label>
                                        <input 
                                            type="text" 
                                            placeholder="NÚMERO DE TELÉFONO" 
                                            value={visitorData.telefono}
                                            onChange={(e) => setVisitorData({...visitorData, telefono: e.target.value})}
                                            className="w-full p-3.5 rounded-xl border-2 border-white/60 outline-none focus:border-guanta-accent font-black bg-white/40 backdrop-blur-sm text-sm" 
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-guanta-pink uppercase ml-2 tracking-widest">Ente de Procedencia</label>
                                        <input 
                                            type="text" 
                                            placeholder="DIRECCIÓN / ENTE" 
                                            value={visitorData.ente}
                                            onChange={(e) => setVisitorData({...visitorData, ente: e.target.value})}
                                            className="w-full p-3.5 rounded-xl border-2 border-white/60 outline-none focus:border-guanta-accent font-black bg-white/40 backdrop-blur-sm text-sm" 
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row gap-4 items-end">
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-guanta-pink uppercase ml-2 tracking-widest">Ubicación</label>
                                            <input 
                                                type="text" 
                                                placeholder="PISO / OFICINA" 
                                                value={visitorData.piso}
                                                onChange={(e) => setVisitorData({...visitorData, piso: e.target.value})}
                                                className="w-full p-3.5 rounded-xl border-2 border-white/60 outline-none focus:border-guanta-accent font-black bg-white/40 backdrop-blur-sm text-sm" 
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-guanta-pink uppercase ml-2 tracking-widest">Observaciones</label>
                                            <input 
                                                type="text" 
                                                placeholder="MOTIVO DEL INGRESO" 
                                                value={visitorData.motivo}
                                                onChange={(e) => setVisitorData({...visitorData, motivo: e.target.value})}
                                                className="w-full p-3.5 rounded-xl border-2 border-white/60 outline-none focus:border-guanta-accent font-black bg-white/40 backdrop-blur-sm text-sm" 
                                            />
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleRegister}
                                        disabled={loading || !visitorData.nombre}
                                        className="bg-guanta-accent text-white font-black py-4 px-10 rounded-2xl hover:bg-guanta-pink transition-all shadow-2xl shadow-guanta-primary/30 uppercase tracking-widest text-sm disabled:bg-gray-200 whitespace-nowrap shrink-0 active:scale-95"
                                    >
                                        Registrar Visita
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white/30 backdrop-blur-xl p-5 border-t border-white/40 flex flex-col md:flex-row gap-4 justify-between items-center text-[9px] text-gray-400 font-black uppercase tracking-[0.3em]">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-guanta-primary rounded-full animate-ping"></div>
                        <span>Operativo: Portería Central</span>
                    </div>
                    <span>© {new Date().getFullYear()} Alcaldía de Guanta - Gestión Digital</span>
                </div>
            </div>
        </div>
    );
};

export default VerificationScreen;
