import React, { useState, useMemo } from 'react';
import { FileText, Calendar, Users, UserCheck, UserPlus, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
const ITEMS_PER_PAGE = 5;

const getDateRange = (period) => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();

    switch (period) {
        case 'HOY':
            return { desde: new Date(y, m, d), hasta: now };
        case 'SEMANA': {
            const dayOfWeek = now.getDay();
            const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            const lunes = new Date(now);
            lunes.setDate(d - diff);
            return { desde: lunes, hasta: now };
        }
        case 'MES':
            return { desde: new Date(y, m, 1), hasta: now };
        case 'ANIO':
            return { desde: new Date(y, 0, 1), hasta: now };
        default:
            return { desde: new Date(y, m, d), hasta: now };
    }
};

const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const formatDateDisplay = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
};

const periodLabels = {
    HOY: 'Hoy',
    SEMANA: 'Esta Semana',
    MES: 'Este Mes',
    ANIO: 'Este Año'
};

const Reportes = ({ registros: initialRegistros, apiFetch }) => {
    const [period, setPeriod] = useState('HOY');
    const [loading, setLoading] = useState(false);
    const [allRegistros, setAllRegistros] = useState(initialRegistros || []);
    const [currentPage, setCurrentPage] = useState(1);

    const fetchPeriod = async (p) => {
        setLoading(true);
        setPeriod(p);
        setCurrentPage(1);
        try {
            const { desde, hasta } = getDateRange(p);
            const desdeStr = formatDate(desde);
            const hastaStr = formatDate(hasta);
            const data = await apiFetch(`/asistencia/rango?desde=${desdeStr}&hasta=${hastaStr}`);
            setAllRegistros(data);
        } catch (e) {
            if (e.message?.includes?.('Sesión cerrada')) return;
            console.error('Error fetching report:', e);
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        const total = allRegistros.length;
        const personal = allRegistros.filter(r => r.tipo_persona === 'personal').length;
        const visitantes = allRegistros.filter(r => r.tipo_persona === 'visitante').length;
        const enSede = allRegistros.filter(r => !r.hora_salida).length;
        const completados = allRegistros.filter(r => r.hora_salida).length;
        return { total, personal, visitantes, enSede, completados };
    }, [allRegistros]);

    const totalPages = Math.ceil(allRegistros.length / ITEMS_PER_PAGE);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return allRegistros.slice(start, start + ITEMS_PER_PAGE);
    }, [allRegistros, currentPage]);

    const exportToPDF = () => {
        try {
            const doc = new jsPDF();
            const primaryColor = [0, 159, 161];

            const title = `REPORTE ${periodLabels[period].toUpperCase()} - ALCALDÍA DE GUANTA`;
            doc.setFontSize(16);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text(title, 14, 20);

            doc.setFontSize(9);
            doc.setTextColor(100);
            const { desde, hasta } = getDateRange(period);
            doc.text(`Período: ${formatDateDisplay(desde)} - ${formatDateDisplay(hasta)}`, 14, 28);
            doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, 14, 33);

            doc.setFontSize(10);
            doc.setTextColor(50);
            doc.text(`Total: ${stats.total} | Personal: ${stats.personal} | Visitantes: ${stats.visitantes} | En Sede: ${stats.enSede}`, 14, 40);

            const tableColumn = ["Cédula", "Nombre", "Tipo", "Ente", "Entrada", "Salida", "Motivo"];
            const tableRows = allRegistros.map(reg => [
                reg.cedula_identidad,
                reg.nombre || "N/A",
                reg.tipo_persona === 'personal' ? 'PERSONAL' : 'VISITANTE',
                reg.ente || "N/A",
                new Date(reg.hora_entrada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                reg.hora_salida ? new Date(reg.hora_salida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "EN SEDE",
                reg.motivo || "N/A"
            ]);

            autoTable(doc, {
                startY: 47,
                head: [tableColumn],
                body: tableRows,
                headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold', halign: 'center' },
                bodyStyles: { fontSize: 7, halign: 'center' },
                alternateRowStyles: { fillColor: [255, 250, 248] },
                margin: { top: 47 },
            });

            const fileName = `reporte_${period.toLowerCase()}_${formatDate(new Date())}.pdf`;
            doc.save(fileName);
        } catch (error) {
            console.error("Error al generar PDF:", error);
            alert("No se pudo generar el PDF.");
        }
    };

    const periods = [
        { key: 'HOY', icon: Clock },
        { key: 'SEMANA', icon: Calendar },
        { key: 'MES', icon: Calendar },
        { key: 'ANIO', icon: Calendar },
    ];

    return (
        <div className="space-y-4">
            {/* Period Selector */}
            <div className="flex flex-wrap gap-2 items-center">
                {periods.map(p => {
                    const Icon = p.icon;
                    return (
                        <button key={p.key} onClick={() => fetchPeriod(p.key)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all backdrop-blur-sm border ${
                                period === p.key
                                    ? 'bg-guanta-primary text-white shadow-lg shadow-guanta-primary/30 border-guanta-primary'
                                    : 'bg-white/40 text-gray-500 hover:text-guanta-primary border-white/60 hover:border-guanta-primary/30'
                            }`}>
                            <Icon size={13} /> {periodLabels[p.key]}
                        </button>
                    );
                })}
                <div className="flex-1"></div>
                <button onClick={exportToPDF}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gray-800/90 backdrop-blur-sm text-white rounded-xl text-[9px] font-black tracking-widest hover:bg-gray-800 transition-all shadow-lg">
                    <FileText size={13} /> Exportar PDF
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                    { label: 'Total', value: stats.total, color: 'text-gray-900', bg: 'bg-white/40' },
                    { label: 'Personal', value: stats.personal, color: 'text-guanta-primary', bg: 'bg-guanta-primary/5' },
                    { label: 'Visitantes', value: stats.visitantes, color: 'text-amber-600', bg: 'bg-amber-50/50' },
                    { label: 'En Sede', value: stats.enSede, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
                    { label: 'Completados', value: stats.completados, color: 'text-blue-600', bg: 'bg-blue-50/50' },
                ].map(s => (
                    <div key={s.label} className={`${s.bg} backdrop-blur-sm rounded-xl p-3 border border-white/40 text-center`}>
                        <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{s.label}</div>
                        <div className={`text-2xl font-black ${s.color} leading-none mt-1`}>{loading ? '...' : s.value}</div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="backdrop-blur-xl bg-white/60 rounded-xl shadow-2xl border border-white/40 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/40 text-gray-400 text-[9px] font-black uppercase tracking-[0.15em] border-b border-white/40">
                                <th className="px-4 py-2">Cédula / Nombre</th>
                                <th className="px-4 py-2">Tipo</th>
                                <th className="px-4 py-2">Ente</th>
                                <th className="px-4 py-2 text-center">Entrada</th>
                                <th className="px-4 py-2 text-center">Salida</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/30">
                            {paginatedData.map(reg => (
                                <tr key={reg.id} className="group hover:bg-white/40 transition-all backdrop-blur-sm">
                                    <td className="px-4 py-3">
                                        <div className="font-black text-gray-800 text-sm tracking-tighter leading-none">{reg.nombre || 'Acceso Externo'}</div>
                                        <div className="text-[9px] font-black text-gray-400 tracking-wider">V-{reg.cedula_identidad}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase backdrop-blur-sm ${reg.tipo_persona === 'personal' ? 'bg-guanta-primary/10 text-guanta-primary' : 'bg-amber-500/10 text-amber-600'}`}>
                                            {reg.tipo_persona === 'personal' ? 'Personal' : 'Visitante'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase">{reg.ente || '—'}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-1 text-gray-700 font-black text-xs">
                                            <Clock size={11} className="text-guanta-primary" />
                                            {new Date(reg.hora_entrada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div className="text-[7px] font-bold text-gray-400 uppercase">{formatDateDisplay(reg.hora_entrada)}</div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {reg.hora_salida ? (
                                            <div className={`text-xs font-black ${reg.auto_salida ? 'text-amber-500' : 'text-gray-600'}`}>
                                                {new Date(reg.hora_salida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {reg.auto_salida && <span className="text-[8px] block">Auto</span>}
                                            </div>
                                        ) : (
                                            <span className="text-[9px] font-black text-emerald-600 uppercase">En Sede</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {allRegistros.length > 0 && (
                    <div className="px-4 py-3 border-t border-white/40 flex items-center justify-between bg-white/30 backdrop-blur-sm">
                        <span className="text-[10px] font-bold text-gray-400">
                            {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, allRegistros.length)} de {allRegistros.length}
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
                {allRegistros.length === 0 && !loading && (
                    <div className="p-10 text-center">
                        <div className="text-gray-400 font-bold uppercase text-[9px] tracking-widest">Sin registros en este período</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Reportes;
