import React, { useState } from 'react';
import { User, Lock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

const Login = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('user', JSON.stringify(data.user));
                onLoginSuccess(data.user);
            } else {
                setError(data.detail || "Credenciales inválidas");
            }
        } catch (err) {
            console.error(err);
            setError("Error de conexión con el servidor institucional");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#070b19] flex items-center justify-center p-4 md:p-6 overflow-hidden relative bg-cyber-grid font-sans">
            {/* Orbes de luz ambiental de fondo */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#00B4B8]/10 rounded-full blur-[120px] pointer-events-none animate-cyber-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#007A7C]/15 rounded-full blur-[150px] pointer-events-none animate-cyber-pulse" style={{ animationDelay: '-2s' }}></div>
            
            {/* Línea de escaneo láser */}
            <div className="laser-scanner"></div>

            <div className="w-full max-w-[1050px] min-h-[580px] backdrop-blur-md bg-[#0a1224]/75 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,180,184,0.15)] flex flex-col md:flex-row overflow-hidden border border-cyan-500/20 animate-in fade-in zoom-in-95 duration-700 relative">
                
                {/* Esquinas cibernéticas decorativas */}
                <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-cyan-500/30 pointer-events-none"></div>
                <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-cyan-500/30 pointer-events-none"></div>
                <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-cyan-500/30 pointer-events-none"></div>
                <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-cyan-500/30 pointer-events-none"></div>

                {/* Panel Izquierdo: HUD de Seguridad y Animación */}
                <div className="hidden md:flex md:w-[45%] bg-gradient-to-b from-[#0b162f] to-[#040914] p-12 flex-col justify-between relative overflow-hidden border-r border-cyan-500/10">
                    <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#00B4B8_1px,transparent_1px)] [background-size:16px_16px]"></div>
                    
                    <div className="relative z-10 flex flex-col items-center mt-4">
                        {/* Núcleo Holográfico */}
                        <div className="relative flex items-center justify-center h-44 w-44 mx-auto mb-8">
                            {/* Anillo externo */}
                            <div className="absolute inset-0 rounded-full border border-dashed border-cyan-500/30 animate-spin-slow"></div>
                            {/* Anillo medio */}
                            <div className="absolute inset-4 rounded-full border border-double border-teal-500/20 animate-spin-reverse-slow"></div>
                            {/* Núcleo central con logo */}
                            <div className="absolute inset-8 rounded-full bg-cyan-950/40 border border-cyan-500/40 shadow-neon-cyan flex items-center justify-center">
                                <img src="/img/logo_login.png" alt="Logo Guanta" className="w-45 h-24 object-contain drop-shadow-[0_0_8px_rgba(0,180,184,0.5)] transition-transform hover:scale-105 duration-300" />
                            </div>
                            {/* Línea de pulso HUD */}
                            <div className="absolute w-full h-[1px] bg-cyan-400/40 shadow-[0_0_8px_#00B4B8] animate-pulse"></div>
                        </div>

                        <div className="text-center">
                            <h1 className="text-3xl font-extrabold text-white tracking-tighter leading-none mb-3 text-neon-cyan">
                                SISTEMA SICA
                            </h1>
                            <p className="text-cyan-400 font-mono text-[9px] tracking-[0.3em] uppercase bg-cyan-950/60 py-1.5 px-4 rounded-md border border-cyan-500/20 inline-block">
                                ALCALDÍA DE GUANTA • 2026
                            </p>
                        </div>
                    </div>

                    {/* HUD Stats */}
                    <div className="relative z-10 space-y-2.5 font-mono text-[9px] text-cyan-500/60 bg-[#060c18]/50 p-5 rounded-2xl border border-cyan-500/10 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">
                        <div className="flex justify-between items-center">
                            <span>ESTADO DEL SISTEMA:</span>
                            <span className="text-emerald-400 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> ONLINE
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>ENCRIPTACIÓN PORTAL:</span>
                            <span className="text-white">SSL / AES-256</span>
                        </div>
                        <div className="flex justify-between">
                            <span>ESTACIÓN:</span>
                            <span className="text-white">CONTROL_ACCESO_#01</span>
                        </div>
                        <div className="flex justify-between">
                            <span>FIRMA DIGITAL:</span>
                            <span className="text-cyan-400">GUANTA-SEC-OK</span>
                        </div>
                    </div>
                </div>

                {/* Panel Derecho: Formulario de Acceso */}
                <div className="w-full md:w-[55%] p-10 md:p-16 flex flex-col justify-center bg-[#070e1c]/45 relative z-10">
                    {/* Header para Mobile */}
                    <div className="mb-8 block md:hidden text-center">
                        <img src="/img/logo_login.png" alt="Logo Guanta" className="w-24 h-16 mx-auto mb-2 object-contain drop-shadow-[0_0_8px_rgba(0,180,184,0.4)]" />
                        <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none text-neon-cyan">SICA ACCESS</h2>
                    </div>

                    {/* Header para Desktop */}
                    <div className="mb-10 hidden md:block">
                        <div className="flex items-center gap-2 mb-3 text-cyan-400 font-mono text-[9px] tracking-[0.25em] uppercase">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-led-blink"></span>
                            AUTENTICACIÓN DE SEGURIDAD
                        </div>
                        <h2 className="text-4xl font-extrabold text-white tracking-tighter mb-2">Bienvenido, Oficial</h2>
                        <p className="text-slate-400 text-xs">Ingrese sus credenciales de guardia para establecer enlace de seguridad.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 backdrop-blur-xl bg-rose-950/40 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-400 animate-in slide-in-from-top-4 duration-300">
                            <AlertCircle size={18} className="shrink-0" />
                            <span className="text-[10px] font-mono uppercase tracking-widest">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Usuario */}
                        <div className="space-y-2 group relative">
                            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-[0.15em] ml-1 group-focus-within:text-cyan-400 transition-colors">Usuario del Sistema</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-[#0a1224]/80 border border-cyan-500/20 focus:border-cyan-400 focus:bg-[#0c162b] rounded-xl outline-none font-bold text-white transition-all text-sm backdrop-blur-sm shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)] focus:shadow-[0_0_15px_rgba(6,182,212,0.15)] placeholder-slate-600"
                                    placeholder="IDENTIFICADOR"
                                />
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                                {/* Línea decorativa neón inferior */}
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1.5px] bg-cyan-400 transition-all duration-300 group-focus-within:w-full"></div>
                            </div>
                        </div>

                        {/* Contraseña */}
                        <div className="space-y-2 group relative">
                            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-[0.15em] ml-1 group-focus-within:text-cyan-400 transition-colors">Contraseña Segura</label>
                            <div className="relative">
                                <input 
                                    type="password" 
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-[#0a1224]/80 border border-cyan-500/20 focus:border-cyan-400 focus:bg-[#0c162b] rounded-xl outline-none font-bold text-white transition-all text-sm backdrop-blur-sm shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)] focus:shadow-[0_0_15px_rgba(6,182,212,0.15)] placeholder-slate-600"
                                    placeholder="••••••••"
                                />
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                                {/* Línea decorativa neón inferior */}
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1.5px] bg-cyan-400 transition-all duration-300 group-focus-within:w-full"></div>
                            </div>
                        </div>

                        {/* Botón */}
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-4.5 bg-gradient-to-r from-[#00B4B8] via-[#009FA1] to-[#007A7C] text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-cyan-500/10 hover:shadow-cyan-400/25 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 group disabled:from-slate-700 disabled:to-slate-800 disabled:shadow-none min-h-[52px]"
                        >
                            {loading ? (
                                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    Establecer Enlace
                                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="mt-8 text-center font-mono text-[8px] text-slate-500 tracking-[0.25em]">
                        SOPORTE TÉCNICO: <span className="text-cyan-500/60 hover:text-cyan-400 transition-colors cursor-pointer">SISTEMAS@GUANTA.GOB.VE</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
