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
    const [errors, setErrors] = useState({});

    const validations = {
        cedula: (v) => {
            const num = v.replace(/\D/g, '');
            if (num.length < 6 || num.length > 9) return 'Debe tener entre 6 y 9 dígitos';
            if (/^0{6,9}$/.test(num)) return 'Número de cédula inválido';
            return '';
        },
        nombre: (v) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(v) ? '' : 'Solo se permiten letras y espacios',
        telefono: (v) => {
            const num = v.replace(/\D/g, '');
            if (num.length !== 11) return 'Debe tener 11 dígitos';
            if (!/^04(12|22|14|24|16|26)\d{7}$/.test(num)) return 'Debe comenzar por 0412/0422/0414/0424/0416/0426';
            if (/(\d)\1{3,}/.test(num)) return 'Número inválido (secuencia repetitiva)';
            return '';
        },
        ente: (v) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(v) ? '' : 'Solo se permiten letras y espacios',
        piso: (v) => /^\d$/.test(v) ? '' : 'Solo 1 dígito numérico',
        motivo: (v) => v.length <= 200 ? '' : 'Máximo 200 caracteres',
    };

    const sanitize = {
        cedula: (v) => v.replace(/\D/g, ''),
        nombre: (v) => v.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''),
        telefono: (v) => v.replace(/\D/g, '').slice(0, 11),
        ente: (v) => v.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''),
        piso: (v) => v.replace(/\D/g, '').slice(0, 1),
        motivo: (v) => v.slice(0, 200),
    };

    const validate = (field, value) => {
        const msg = validations[field] ? validations[field](value) : '';
        setErrors(prev => ({ ...prev, [field]: msg }));
        return !msg;
    };

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
        const raw = value.replace(/\D/g, '');
        setCedula(raw);
        validate('cedula', raw);
        if (raw.length >= 6 && !validations.cedula(raw)) {
            setLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/verificar/${raw}`);
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
        if (isVisitor) {
            const fields = ['nombre', 'ente', 'telefono', 'piso', 'motivo'];
            let valid = true;
            fields.forEach(f => { if (!validate(f, visitorData[f])) valid = false; });
            if (!valid) { showToast('error', 'Corrige los campos en rojo antes de registrar'); return; }
        }
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
        <div className="w-full flex items-center justify-center font-sans py-4">
            <div className="w-full max-w-4xl backdrop-blur-xl bg-white/50 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,159,161,0.06)] overflow-hidden border border-white/60 relative cyber-corners bg-cyber-overlay">
                {/* Esquinas cibernéticas delgadas */}
                <div className="cyber-corner cyber-corner-tl"></div>
                <div className="cyber-corner cyber-corner-tr"></div>
                <div className="cyber-corner cyber-corner-bl"></div>
                <div className="cyber-corner cyber-corner-br"></div>

                <div className="bg-guanta-gradient p-4 text-white text-center relative overflow-hidden">
                    <div className="relative z-10 flex items-center justify-center gap-3">
                        <div className="bg-white/20 p-1.5 rounded-xl backdrop-blur-md border border-white/30">
                            <ShieldCheck size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-base font-black tracking-tighter uppercase leading-tight">Control de Asistencia</h1>
                            <p className="text-white/90 font-bold uppercase text-[8px] mt-0.5 tracking-[0.3em]">Alcaldía de Guanta</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 -mt-3 bg-white/40 backdrop-blur-xl rounded-t-[2rem] relative z-20 border-t border-white/60">

                    <div className="flex flex-col md:flex-row gap-3 mb-4">
                        <div className="flex md:flex-col p-1 bg-white/40 backdrop-blur-sm rounded-xl gap-1 md:w-36 shrink-0 border border-white/60">
                            <button 
                                onClick={() => setMode('cedula')}
                                className={`flex-1 py-2 px-3 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all backdrop-blur-sm ${mode === 'cedula' ? 'bg-guanta-primary text-white shadow-lg shadow-guanta-primary/30' : 'text-gray-400 hover:text-gray-600 hover:bg-white/40'}`}
                            >
                                Cédula
                            </button>
                            <button 
                                onClick={() => setMode('biometric')}
                                className={`flex-1 py-2 px-3 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all backdrop-blur-sm ${mode === 'biometric' ? 'bg-guanta-primary text-white shadow-lg shadow-guanta-primary/30' : 'text-gray-400 hover:text-gray-600 hover:bg-white/40'}`}
                            >
                                Huella
                            </button>
                        </div>

                        <div className="flex-1">
                            {mode === 'cedula' ? (
                                <div className="relative group h-full flex flex-col justify-center">
                                    <label className="block text-[9px] font-black text-guanta-primary mb-1.5 uppercase tracking-[0.15em] ml-1">Identificación</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={cedula}
                                            onChange={(e) => handleSearch(e.target.value)}
                                            placeholder="CÉDULA"
                                            className={`w-full pl-10 pr-4 py-3 bg-white/40 border-2 focus:bg-white/60 rounded-xl outline-none transition-all text-lg font-black tracking-tighter text-gray-800 shadow-inner backdrop-blur-sm group-hover:border-guanta-accent ${errors.cedula ? 'border-red-400 focus:border-red-500' : 'border-white/60 focus:border-guanta-primary focus:shadow-[0_0_15px_rgba(0,159,161,0.15)]'}`}
                                        />
                                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                                            <Search className="text-guanta-primary opacity-50" size={18} />
                                        </div>
                                        {errors.cedula && <div className="text-[8px] font-black text-red-500 uppercase tracking-wider mt-1 ml-1">{errors.cedula}</div>}
                                        {loading && (
                                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-guanta-primary border-t-transparent"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="animate-in fade-in zoom-in duration-300">
                                    {readerStatus && (
                                        <div className={`mb-2 p-2 rounded-xl flex items-center gap-2 text-[9px] font-black uppercase tracking-wider backdrop-blur-sm ${
                                            readerStatus.tipo === 'conectado' ? 'bg-emerald-50/80 text-emerald-700 border border-emerald-200/60' :
                                            readerStatus.tipo === 'conectando' ? 'bg-blue-50/80 text-blue-700 border border-blue-200/60' :
                                            'bg-rose-50/80 text-rose-700 border border-rose-200/60'
                                        }`}>
                                            {readerStatus.tipo === 'conectado' ? <Wifi size={12} /> :
                                             readerStatus.tipo === 'conectando' ? <Cpu size={12} className="animate-spin" /> :
                                             <WifiOff size={12} />}
                                            <span>{readerStatus.mensaje}</span>
                                        </div>
                                    )}

                                    <div className={`p-4 rounded-xl border-2 border-dashed flex items-center gap-3 transition-all backdrop-blur-sm ${isScanning ? 'bg-guanta-primary/10 border-guanta-primary animate-pulse' : 'bg-white/40 border-white/60'}`}>
                                        <div className={`p-3 rounded-full shrink-0 backdrop-blur-sm ${isScanning ? 'bg-guanta-primary shadow-2xl shadow-guanta-primary/50' : readerStatus?.tipo === 'conectado' ? 'bg-emerald-500' : 'bg-gray-200/60'}`}>
                                            <ShieldCheck size={22} className={isScanning || readerStatus?.tipo === 'conectado' ? 'text-white' : 'text-gray-400'} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-black text-gray-800 uppercase tracking-tighter mb-0.5">
                                                {isScanning ? 'Escaneando...' :
                                                 readerStatus?.tipo === 'conectado' ? 'Coloque el dedo' :
                                                 'Esperando Lector...'}
                                            </h3>
                                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                                                {isScanning ? 'Procesando identidad...' :
                                                 readerStatus?.tipo === 'conectado' ? 'Presione el botón para capturar' :
                                                 'Conecte un lector biométrico'}
                                            </p>
                                        </div>

                                        {!personData && !isScanning && (
                                            <div className="flex flex-wrap gap-1.5 shrink-0">
                                                {readerStatus?.tipo !== 'conectado' && navigator.usb && (
                                                    <button
                                                        onClick={conectarLector}
                                                        disabled={readerStatus?.tipo === 'conectando'}
                                                        className="flex items-center gap-1.5 bg-guanta-primary text-white px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest hover:bg-guanta-pink transition-all shadow-md"
                                                    >
                                                        <Cpu size={10} />
                                                        USB
                                                    </button>
                                                )}

                                                {readerStatus?.tipo !== 'conectado' && (
                                                    <button
                                                        onClick={() => setShowBridgeModal(true)}
                                                        className="flex items-center gap-1.5 bg-white/60 backdrop-blur-sm border border-white/60 px-3 py-1.5 rounded-full text-[8px] font-black text-gray-500 hover:text-guanta-primary hover:border-guanta-primary transition-all"
                                                    >
                                                        <Wifi size={10} />
                                                        BRIDGE
                                                    </button>
                                                )}

                                                {readerStatus?.tipo === 'conectado' && (
                                                    <button
                                                        onClick={capturarHuella}
                                                        className="bg-guanta-primary text-white px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-guanta-pink transition-all shadow-xl shadow-guanta-primary/30 active:scale-95"
                                                    >
                                                        CAPTURAR
                                                    </button>
                                                )}

                                                <button
                                                    onClick={simularCaptura}
                                                    className="bg-white/60 backdrop-blur-sm border border-white/60 px-3 py-1.5 rounded-full text-[8px] font-black text-gray-400 hover:text-guanta-primary hover:border-guanta-primary transition-all"
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
                            <div className="bg-gradient-to-br from-white/80 to-guanta-primary/5 border border-guanta-primary/20 p-4 rounded-xl shadow-xl shadow-guanta-primary/5 relative overflow-hidden group backdrop-blur-xl">
                                <div className="flex items-center gap-3 relative z-10">
                                    <div className="relative shrink-0">
                                        <div className="bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-lg border border-white/60 relative">
                                            <User size={22} className="text-guanta-primary" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="bg-guanta-primary text-white text-[8px] font-black px-2 py-0.5 rounded-full tracking-widest uppercase mb-1 inline-block">Personal Institucional</span>
                                        <h2 className="text-base font-black text-gray-900 leading-none mb-1 tracking-tighter truncate">{personData.nombre}</h2>
                                        <div className="flex flex-wrap gap-1.5 items-center">
                                            <div className="bg-guanta-primary/10 text-guanta-primary px-2 py-0.5 rounded-lg text-[9px] font-black uppercase flex items-center backdrop-blur-sm">
                                                <Briefcase size={10} className="mr-1" /> {personData.cargo}
                                            </div>
                                            <div className="bg-white/60 text-gray-600 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase backdrop-blur-sm">
                                                {personData.ente}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="shrink-0">
                                        <button 
                                            onClick={handleRegister}
                                            disabled={loading}
                                            className="flex items-center justify-center gap-2 bg-guanta-primary hover:bg-guanta-pink disabled:bg-gray-300 text-white font-black py-2.5 px-5 rounded-xl transition-all active:scale-95 shadow-lg shadow-guanta-primary/30 text-[10px] uppercase tracking-tighter whitespace-nowrap"
                                        >
                                            <Clock size={14} /> Confirmar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {isVisitor && (
                        <div className="animate-in slide-in-from-bottom-8 duration-500">
                            <div className="bg-gradient-to-br from-white/80 to-guanta-accent/5 border border-guanta-accent/30 p-4 rounded-xl shadow-xl shadow-guanta-primary/5 backdrop-blur-xl">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="bg-gradient-to-r from-guanta-primary to-guanta-pink p-2 rounded-xl flex items-center gap-2 shadow-lg shadow-guanta-primary/30 flex-1">
                                        <div className="bg-white/20 p-1 rounded-lg">
                                            <ShieldCheck size={14} className="text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white text-[8px] font-black uppercase tracking-widest">Verificación Confirmada</p>
                                            <p className="text-white/90 text-[10px] font-bold mt-0.5">Cédula: <span className="text-white font-black text-sm">V-{cedula}</span></p>
                                        </div>
                                        <div className="bg-white/20 px-2 py-0.5 rounded-full">
                                            <span className="text-white text-[8px] font-black uppercase tracking-widest">Válido</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <div className="bg-guanta-accent p-1.5 rounded-lg">
                                            <UserPlus size={16} className="text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-base text-gray-800 tracking-tighter leading-none mb-0">Nueva Visita</h3>
                                            <p className="text-guanta-pink text-[8px] font-black uppercase tracking-[0.1em]">Registro Externo</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                                    <div className="space-y-0.5">
                                        <label className="text-[8px] font-black text-guanta-pink uppercase ml-1 tracking-widest">Nombre Completo</label>
                                        <input 
                                            type="text" 
                                            placeholder="NOMBRE" 
                                            value={visitorData.nombre}
                                            onChange={(e) => { const v = sanitize.nombre(e.target.value); setVisitorData(prev => ({...prev, nombre: v})); validate('nombre', v); }}
                                            className={`w-full p-2.5 rounded-lg border-2 outline-none font-black placeholder:text-gray-300 text-gray-700 bg-white/40 backdrop-blur-sm text-xs ${errors.nombre ? 'border-red-400 focus:border-red-500' : 'border-white/60 focus:border-guanta-accent'}`} 
                                        />
                                        {errors.nombre && <div className="text-[7px] font-black text-red-500 uppercase tracking-wider mt-0.5 ml-1">{errors.nombre}</div>}
                                    </div>
                                    <div className="space-y-0.5">
                                        <label className="text-[8px] font-black text-guanta-pink uppercase ml-1 tracking-widest">Teléfono</label>
                                        <input 
                                            type="text" 
                                            inputMode="numeric"
                                            placeholder="TELÉFONO" 
                                            value={visitorData.telefono}
                                            onChange={(e) => { const v = sanitize.telefono(e.target.value); setVisitorData(prev => ({...prev, telefono: v})); validate('telefono', v); }}
                                            className={`w-full p-2.5 rounded-lg border-2 outline-none font-black bg-white/40 backdrop-blur-sm text-xs ${errors.telefono ? 'border-red-400 focus:border-red-500' : 'border-white/60 focus:border-guanta-accent'}`} 
                                        />
                                        {errors.telefono && <div className="text-[7px] font-black text-red-500 uppercase tracking-wider mt-0.5 ml-1">{errors.telefono}</div>}
                                    </div>
                                    <div className="space-y-0.5">
                                        <label className="text-[8px] font-black text-guanta-pink uppercase ml-1 tracking-widest">Ubicación</label>
                                        <input 
                                            type="text" 
                                            inputMode="numeric"
                                            placeholder="PISO" 
                                            value={visitorData.piso}
                                            onChange={(e) => { const v = sanitize.piso(e.target.value); setVisitorData(prev => ({...prev, piso: v})); validate('piso', v); }}
                                            className={`w-full p-2.5 rounded-lg border-2 outline-none font-black bg-white/40 backdrop-blur-sm text-xs ${errors.piso ? 'border-red-400 focus:border-red-500' : 'border-white/60 focus:border-guanta-accent'}`} 
                                        />
                                        {errors.piso && <div className="text-[7px] font-black text-red-500 uppercase tracking-wider mt-0.5 ml-1">{errors.piso}</div>}
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row gap-2 items-end">
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                                        <div className="space-y-0.5">
                                            <label className="text-[8px] font-black text-guanta-pink uppercase ml-1 tracking-widest">Ente</label>
                                            <input 
                                                type="text" 
                                                placeholder="ENTE" 
                                                value={visitorData.ente}
                                                onChange={(e) => { const v = sanitize.ente(e.target.value); setVisitorData(prev => ({...prev, ente: v})); validate('ente', v); }}
                                                className={`w-full p-2.5 rounded-lg border-2 outline-none font-black bg-white/40 backdrop-blur-sm text-xs ${errors.ente ? 'border-red-400 focus:border-red-500' : 'border-white/60 focus:border-guanta-accent'}`} 
                                            />
                                            {errors.ente && <div className="text-[7px] font-black text-red-500 uppercase tracking-wider mt-0.5 ml-1">{errors.ente}</div>}
                                        </div>
                                        <div className="space-y-0.5">
                                            <label className="text-[8px] font-black text-guanta-pink uppercase ml-1 tracking-widest">Motivo</label>
                                            <textarea 
                                                placeholder="MOTIVO DEL INGRESO" 
                                                rows="2"
                                                value={visitorData.motivo}
                                                onChange={(e) => { const v = sanitize.motivo(e.target.value); setVisitorData(prev => ({...prev, motivo: v})); validate('motivo', v); }}
                                                className={`w-full p-2.5 rounded-lg border-2 outline-none font-black bg-white/40 backdrop-blur-sm text-xs resize-none ${errors.motivo ? 'border-red-400 focus:border-red-500' : 'border-white/60 focus:border-guanta-accent'}`}
                                            ></textarea>
                                            <div className="flex justify-between items-center mt-0.5 px-1">
                                                {errors.motivo && <div className="text-[7px] font-black text-red-500 uppercase tracking-wider">{errors.motivo}</div>}
                                                <div className="text-[7px] font-bold text-gray-400 ml-auto">{visitorData.motivo.length}/200</div>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleRegister}
                                        disabled={loading || !visitorData.nombre}
                                        className="bg-guanta-accent text-white font-black py-2.5 px-6 rounded-xl hover:bg-guanta-pink transition-all shadow-lg shadow-guanta-primary/30 uppercase tracking-widest text-[10px] disabled:bg-gray-200 whitespace-nowrap shrink-0 active:scale-95"
                                    >
                                        Registrar Visita
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white/30 backdrop-blur-xl p-3 border-t border-white/40 flex flex-col md:flex-row gap-2 justify-between items-center text-[8px] text-gray-400 font-black uppercase tracking-[0.2em]">
                    <div className="flex items-center gap-1.5">
                        <div className="cyber-led cyber-led-active"></div>
                        <span>Portería Central</span>
                    </div>
                    <span>© {new Date().getFullYear()} Alcaldía de Guanta</span>
                </div>
            </div>
        </div>
    );
};

export default VerificationScreen;
