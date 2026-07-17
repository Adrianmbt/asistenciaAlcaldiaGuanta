import React, { useState, useMemo, useEffect } from 'react';
import { Search, Edit2, Trash2, LogOut, Filter, UserCheck, UserPlus, Clock, User, Download, FileText, Printer, ChevronLeft, ChevronRight } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ITEMS_PER_PAGE = 10;

const AsistenciaTable = ({ registros, onEdit, onDelete, onMarcarSalida }) => {
    const [filter, setFilter] = useState("");
    const [filterType, setFilterType] = useState("TODOS");
    const [currentPage, setCurrentPage] = useState(1);

    const filteredData = useMemo(() => {
        return registros.filter(item => {
            const matchesSearch =
                item.cedula_identidad.includes(filter) ||
                (item.nombre && item.nombre.toLowerCase().includes(filter.toLowerCase()));

            const matchesType = filterType === "TODOS" || item.tipo_persona === filterType;

            return matchesSearch && matchesType;
        });
    }, [filter, filterType, registros]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredData, currentPage]);

    useEffect(() => { setCurrentPage(1); }, [filter, filterType]);

    const exportToPDF = (type) => {
        try {
            const doc = new jsPDF();
            
            const primaryColor = [0, 159, 161]; // #009FA1
            
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
                alternateRowStyles: { fillColor: [255, 250, 248] },
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
        <div className="backdrop-blur-xl bg-white/60 rounded-[2rem] shadow-2xl shadow-guanta-primary/5 border border-white/40 overflow-hidden font-sans relative cyber-corners bg-cyber-overlay">
            <div className="cyber-corner cyber-corner-tl"></div>
            <div className="cyber-corner cyber-corner-tr"></div>
            <div className="cyber-corner cyber-corner-bl"></div>
            <div className="cyber-corner cyber-corner-br"></div>
            <div className="p-4 border-b border-white/40 bg-white/30 backdrop-blur-xl flex flex-col gap-3">
                
                <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                    <div className="relative w-full md:w-[20rem] group">
                        <input
                            type="text"
                            placeholder="Buscar por cédula o nombre..."
                            className="w-full pl-9 pr-3 py-2 bg-white/40 border-2 border-white/60 focus:border-guanta-primary rounded-xl shadow-sm backdrop-blur-sm outline-none transition-all font-bold text-gray-700 text-xs"
                            onChange={(e) => setFilter(e.target.value)}
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-guanta-primary opacity-40 group-focus-within:opacity-100 transition-opacity" size={14} />
                    </div>

                    <div className="flex bg-white/40 backdrop-blur-sm p-0.5 rounded-xl border border-white/60 shadow-sm">
                        <button onClick={() => setFilterType("TODOS")} className={`px-3 py-1.5 rounded-lg text-[9px] font-black tracking-widest transition-all backdrop-blur-sm ${filterType === 'TODOS' ? 'bg-guanta-primary text-white shadow-lg shadow-guanta-primary/30' : 'text-gray-400 hover:text-guanta-primary hover:bg-white/40'}`}>TODOS</button>
                        <button onClick={() => setFilterType("personal")} className={`px-3 py-1.5 rounded-lg text-[9px] font-black tracking-widest transition-all backdrop-blur-sm ${filterType === 'personal' ? 'bg-guanta-primary text-white shadow-lg shadow-guanta-primary/30' : 'text-gray-400 hover:text-guanta-primary hover:bg-white/40'}`}>EMPLEADOS</button>
                        <button onClick={() => setFilterType("visitante")} className={`px-3 py-1.5 rounded-lg text-[9px] font-black tracking-widest transition-all backdrop-blur-sm ${filterType === 'visitante' ? 'bg-guanta-accent text-white shadow-lg shadow-guanta-primary/30' : 'text-gray-400 hover:text-guanta-accent hover:bg-white/40'}`}>VISITANTES</button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mr-1">Exportar:</span>
                    <button onClick={() => exportToPDF('COMPLETO')} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800/90 backdrop-blur-sm text-white rounded-lg text-[8px] font-black tracking-widest hover:bg-gray-800 transition-all"><FileText size={11} /> COMPLETO</button>
                    <button onClick={() => exportToPDF('PERSONAL')} className="flex items-center gap-1.5 px-3 py-1.5 bg-guanta-primary/90 backdrop-blur-sm text-white rounded-lg text-[8px] font-black tracking-widest hover:bg-guanta-primary transition-all"><UserCheck size={11} /> PERSONAL</button>
                    <button onClick={() => exportToPDF('VISITANTE')} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/90 backdrop-blur-sm text-white rounded-lg text-[8px] font-black tracking-widest hover:bg-amber-500 transition-all"><UserPlus size={11} /> VISITANTES</button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/40 text-gray-400 text-[9px] font-black uppercase tracking-[0.15em] border-b border-white/40">
                            <th className="px-4 py-2">Identificación / Nombre</th>
                            <th className="px-4 py-2">Origen / Ente</th>
                            <th className="px-4 py-2 text-center">Registro</th>
                            <th className="px-4 py-2">Estatus</th>
                            <th className="px-4 py-2 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/30">
                        {paginatedData.map((reg) => (
                            <tr key={reg.id} className="group hover:bg-white/40 transition-all backdrop-blur-sm">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`p-1.5 rounded-lg backdrop-blur-sm ${reg.tipo_persona === 'personal' ? 'bg-guanta-primary/10' : 'bg-guanta-accent/10'}`}>
                                             {reg.tipo_persona === 'personal' ? <User size={14} className="text-guanta-primary"/> : <UserPlus size={14} className="text-guanta-accent"/>}
                                        </div>
                                        <div>
                                            <div className="font-black text-gray-800 text-sm tracking-tighter leading-none group-hover:text-guanta-primary transition-colors">{reg.nombre || "Acceso Externo"}</div>
                                            <div className="text-[9px] font-black text-gray-400 tracking-wider flex items-center">
                                                V-{reg.cedula_identidad} {reg.telefono ? `| TEL: ${reg.telefono}` : ''}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col">
                                        <span className={`inline-flex items-center w-max px-2 py-0.5 rounded-full text-[8px] font-black tracking-tighter uppercase backdrop-blur-sm ${reg.tipo_persona === 'personal' ? 'bg-guanta-primary/10 text-guanta-primary' : 'bg-guanta-accent/10 text-guanta-pink'}`}>
                                            {reg.tipo_persona === 'personal' ? 'Institucional' : 'Visitante'}
                                        </span>
                                        <span className="text-[10px] font-bold text-gray-500 uppercase mt-0.5">{reg.ente || 'Sin Ente'}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <div className="flex flex-col items-center">
                                        <div className="flex items-center gap-1 text-gray-700 font-black text-xs">
                                            <Clock size={11} className="text-guanta-primary" />
                                            {new Date(reg.hora_entrada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div className="text-[7px] font-bold text-gray-400 uppercase">Entrada</div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    {reg.hora_salida ? (
                                        <div className="flex items-center gap-1.5">
                                            <div className={`h-1.5 w-1.5 rounded-full ${reg.auto_salida ? 'bg-amber-400' : 'bg-gray-300'}`}></div>
                                            <span className={`text-[10px] font-black uppercase tracking-tighter ${reg.auto_salida ? 'text-amber-500' : 'text-gray-400'}`}>
                                                {new Date(reg.hora_salida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {reg.auto_salida && ' (Auto)'}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5">
                                            <div className="cyber-led" style={{backgroundColor:'#10b981', boxShadow:'0 0 6px rgba(16,185,129,0.6)'}}></div>
                                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">En Sede</span>
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                        {!reg.hora_salida && (
                                            <button onClick={() => onMarcarSalida(reg.cedula_identidad)} className="p-2 bg-emerald-500/90 backdrop-blur-sm text-white rounded-lg hover:bg-emerald-500 transition-all" title="Marcar Salida">
                                                <LogOut size={13} />
                                            </button>
                                        )}
                                        <button onClick={() => onEdit(reg)} className="p-2 bg-guanta-primary/10 backdrop-blur-sm text-guanta-primary rounded-lg hover:bg-guanta-primary hover:text-white transition-all" title="Editar">
                                            <Edit2 size={13} />
                                        </button>
                                        <button onClick={() => onDelete(reg.id)} className="p-2 bg-rose-50/80 backdrop-blur-sm text-rose-600 rounded-lg hover:bg-rose-500 hover:text-white transition-all" title="Eliminar">
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filteredData.length === 0 && (
                <div className="p-10 text-center flex flex-col items-center">
                    <div className="bg-white/40 backdrop-blur-sm p-4 rounded-full inline-block mb-3 border border-white/60">
                        <Search className="text-gray-200" size={32} />
                    </div>
                    <div className="text-gray-400 font-bold uppercase text-[9px] tracking-widest max-w-[12rem]">
                        Sin resultados
                    </div>
                </div>
            )}
            {filteredData.length > 0 && (
                <div className="px-4 py-3 border-t border-white/40 flex items-center justify-between bg-white/30 backdrop-blur-sm">
                    <span className="text-[10px] font-bold text-gray-400">
                        {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} de {filteredData.length}
                    </span>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg hover:bg-white/60 disabled:opacity-30 transition-all">
                            <ChevronLeft size={14} className="text-gray-600" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button key={page} onClick={() => setCurrentPage(page)} className={`w-7 h-7 rounded-lg text-[10px] font-bold transition-all backdrop-blur-sm ${
                                currentPage === page ? 'bg-guanta-primary text-white shadow-lg shadow-guanta-primary/30' : 'hover:bg-white/60 text-gray-600'
                            }`}>{page}</button>
                        ))}
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg hover:bg-white/60 disabled:opacity-30 transition-all">
                            <ChevronRight size={14} className="text-gray-600" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AsistenciaTable;
