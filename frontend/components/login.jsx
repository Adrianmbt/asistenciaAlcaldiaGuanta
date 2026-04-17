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
            // Preparar datos para OAuth2PasswordRequestForm (form-data)
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
                // Guardar token y notificar éxito
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
        <div className="min-h-screen bg-[#FFFBF9] flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
            <div className="w-full max-w-[1100px] bg-white rounded-[3rem] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-orange-50 animate-in fade-in zoom-in-95 duration-700">
                
                {/* Panel Izquierdo: Visual & Branding */}
                <div className="hidden md:flex md:w-1/2 bg-guanta-gradient p-16 flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                        <div className="absolute top-20 -left-20 w-80 h-80 bg-white rounded-full blur-3xl"></div>
                        <div className="absolute bottom-20 -right-20 w-80 h-80 bg-black rounded-full blur-3xl"></div>
                    </div>
                    
                    <div className="relative z-10">
                        <img src="/img/logo_guanta.png" alt="Logo Guanta" className="w-32 h-32 mb-8 drop-shadow-2xl brightness-0 invert" />
                        <h1 className="text-6xl font-black text-white tracking-tighter leading-none mb-4">
                            SISTEMA DE<br />CONTROL<br />DE ACCESO
                        </h1>
                        <p className="text-orange-100 font-bold uppercase tracking-[0.4em] text-xs bg-white/10 py-2 px-4 rounded-full inline-block border border-white/20">
                            Alcaldía de Guanta 2026
                        </p>
                    </div>

                    <div className="relative z-10 flex items-center gap-4 text-white/60">
                         <div className="h-px flex-1 bg-white/20"></div>
                         <ShieldCheck size={24} />
                         <div className="h-px flex-1 bg-white/20"></div>
                    </div>
                </div>

                {/* Panel Derecho: Formulario */}
                <div className="w-full md:w-1/2 p-12 md:p-20 flex flex-col justify-center">
                    <div className="mb-10 block md:hidden text-center">
                        <img src="/img/logo_guanta.png" alt="Logo Guanta" className="w-24 h-24 mx-auto mb-4" />
                        <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">Login de Guardia</h2>
                    </div>

                    <div className="mb-12 hidden md:block">
                        <h2 className="text-4xl font-black text-gray-900 tracking-tighter mb-2">Bienvenido, Oficial</h2>
                        <p className="text-gray-400 font-bold text-sm">Ingrese sus credenciales para iniciar la jornada de seguridad corporativa.</p>
                    </div>

                    {error && (
                        <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 animate-in slide-in-from-top-4 duration-300">
                            <AlertCircle size={20} />
                            <span className="text-xs font-black uppercase tracking-widest">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2 group">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 group-focus-within:text-guanta-primary transition-colors">Usuario del Sistema</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-14 pr-4 py-5 bg-gray-50 border-2 border-transparent focus:border-guanta-primary focus:bg-white rounded-2xl outline-none font-bold text-gray-800 transition-all text-lg"
                                    placeholder="IDENTIFICADOR"
                                />
                                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-guanta-primary transition-colors" size={24} />
                            </div>
                        </div>

                        <div className="space-y-2 group">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 group-focus-within:text-guanta-primary transition-colors">Contraseña Segura</label>
                            <div className="relative">
                                <input 
                                    type="password" 
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-14 pr-4 py-5 bg-gray-50 border-2 border-transparent focus:border-guanta-primary focus:bg-white rounded-2xl outline-none font-bold text-gray-800 transition-all text-lg"
                                    placeholder="••••••••"
                                />
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-guanta-primary transition-colors" size={24} />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-6 bg-guanta-gradient text-white rounded-2xl font-black text-lg uppercase tracking-widest shadow-2xl shadow-orange-500/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group disabled:bg-gray-400"
                        >
                            {loading ? (
                                <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    Autenticar Acceso
                                    <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="mt-12 text-center text-[9px] font-black text-gray-300 uppercase tracking-[0.3em]">
                        Soporte Técnico: sistemas@guanta.gob.ve
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
