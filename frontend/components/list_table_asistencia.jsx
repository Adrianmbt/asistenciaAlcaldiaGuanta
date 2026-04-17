import React, { useState, useMemo } from 'react';
import { Search, Edit2, Trash2, LogOut, Filter, UserCheck, UserPlus, Clock, User, Download, FileText, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

    const exportToPDF = (type) => {
        try {
            const doc = new jsPDF();
            
            // Configuración de Colores Guanta
            const primaryColor = [240, 84, 56]; // #F05438
            
            let reportData = [];
            let title = "";

            if (type === 'PERSONAL') {
                title = "LISTADO DE PERSONAL - ALCALDÍA DE GUANTA";
                reportData = registros.filter(r => r.tipo_persona === 'personal');
            } else if (type === 'VISITANTE') {
                title = "LISTADO DE VISITANTES - ALCALDÍA DE GUANTA";
                reportData = registros.filter(r => r.tipo_persona === 'visitante');
            } else {
                title = "CONTROL DE ASISTENCIA DIARIO - ALCALDÍA DE GUANTA";
                reportData = registros;
            }

            // Encabezado
            doc.setFontSize(18);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text(title, 14, 20);
            
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Fecha del Reporte: ${new Date().toLocaleDateString()}`, 14, 28);
            doc.text(`Generado por: Sistema de Control de Acceso v1.0`, 14, 33);
            
            const tableColumn = ["Cédula", "Nombre", "Teléfono", "Ente/Dirección", "Entrada", "Salida", "Motivo"];
            const tableRows = reportData.map(reg => [
                reg.cedula_identidad,
                reg.nombre || "N/A",
                reg.telefono || "N/A",
                reg.ente || "N/A",
                new Date(reg.hora_entrada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                reg.hora_salida ? new Date(reg.hora_salida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "EN SEDE",
                reg.motivo || "N/A"
            ]);

            autoTable(doc, {
                startY: 40,
                head: [tableColumn],
                body: tableRows,
                headStyles: { 
                    fillColor: primaryColor, 
                    textColor: [255, 255, 255], 
                    fontSize: 9, 
                    fontStyle: 'bold',
                    halign: 'center'
                },
                bodyStyles: { fontSize: 8, halign: 'center' },
                alternateRowStyles: { fillColor: [250, 250, 250] },
                margin: { top: 40 },
            });

            const fileName = `${type.toLowerCase()}_reporte_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);
        } catch (error) {
            console.error("Error al generar PDF:", error);
            alert("No se pudo generar el PDF. Verifica la consola.");
        }
    };

    return (
        <div className="bg-white rounded-[2rem] shadow-2xl shadow-orange-500/5 border border-orange-50 overflow-hidden font-sans">
            {/* Barra de Herramientas Superior */}
            <div className="p-8 border-b border-orange-50 bg-orange-50/20 flex flex-col gap-6">
                
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
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
                            onClick={() => setFilterType("personal")}
                            className={`px-5 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${filterType === 'personal' ? 'bg-guanta-primary text-white shadow-lg shadow-orange-500/30' : 'text-gray-400 hover:text-guanta-primary'}`}
                        >EMPLEADOS</button>
                        <button
                            onClick={() => setFilterType("visitante")}
                            className={`px-5 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${filterType === 'visitante' ? 'bg-guanta-accent text-white shadow-lg shadow-amber-500/30' : 'text-gray-400 hover:text-guanta-accent'}`}
                        >VISITANTES</button>
                    </div>
                </div>

                {/* Botones de Reportes PDF */}
                <div className="flex flex-wrap gap-3 items-center border-t border-orange-50 pt-6">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2">Exportar Reportes:</span>
                    <button 
                        onClick={() => exportToPDF('COMPLETO')}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-xl text-[10px] font-black tracking-widest hover:bg-black transition-all shadow-lg shadow-gray-200"
                    >
                        <FileText size={14} /> COMPLETO
                    </button>
                    <button 
                        onClick={() => exportToPDF('PERSONAL')}
                        className="flex items-center gap-2 px-4 py-2 bg-guanta-primary text-white rounded-xl text-[10px] font-black tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-orange-200"
                    >
                        <UserCheck size={14} /> PERSONAL
                    </button>
                    <button 
                        onClick={() => exportToPDF('VISITANTE')}
                        className="flex items-center gap-2 px-4 py-2 bg-guanta-accent text-white rounded-xl text-[10px] font-black tracking-widest hover:bg-amber-500 transition-all shadow-lg shadow-amber-200"
                    >
                        <UserPlus size={14} /> VISITANTES
                    </button>
                </div>
            </div>

            {/* Tabla Estilo Guanta */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-orange-50">
                            <th className="px-8 py-5">Identificación / Nombre</th>
                            <th className="px-8 py-5">Origen / Ente</th>
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
                                        <div className={`p-2 rounded-xl ${reg.tipo_persona === 'personal' ? 'bg-orange-100' : 'bg-amber-100'}`}>
                                             {reg.tipo_persona === 'personal' ? <User size={18} className="text-guanta-primary"/> : <UserPlus size={18} className="text-guanta-accent"/>}
                                        </div>
                                        <div>
                                            <div className="font-black text-gray-800 text-lg tracking-tighter leading-none mb-1 group-hover:text-guanta-primary transition-colors">{reg.nombre || "Acceso Externo"}</div>
                                            <div className="text-[10px] font-black text-gray-400 tracking-widest flex items-center">
                                                V-{reg.cedula_identidad} {reg.telefono ? `| TEL: ${reg.telefono}` : ''}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex flex-col">
                                        <span className={`inline-flex items-center w-max px-3 py-1 rounded-full text-[9px] font-black tracking-tighter uppercase mb-1 ${reg.tipo_persona === 'personal' ? 'bg-orange-100 text-guanta-primary' : 'bg-amber-100 text-amber-700'}`}>
                                            {reg.tipo_persona === 'personal' ? 'Institucional' : 'Visitante'}
                                        </span>
                                        <span className="text-[11px] font-bold text-gray-500 uppercase">{reg.ente || 'Sin Ente'}</span>
                                    </div>
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
                                                onClick={() => onMarcarSalida(reg.cedula_identidad)}
                                                className="p-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20" 
                                                title="Marcar Salida"
                                            >
                                                <LogOut size={16} />
                                            </button>
                                        )}
                                        <button onClick={() => onEdit(reg)} className="p-3 bg-orange-100 text-guanta-primary rounded-xl hover:bg-guanta-primary hover:text-white transition-all" title="Editar">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => onDelete(reg.id)} className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all" title="Eliminar">
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