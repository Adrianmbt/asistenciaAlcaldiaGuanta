import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  ScrollView,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAsistenciaRango } from '../api/client';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

const ORANGE = '#009fa1';

const getDateRange = (period) => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  switch (period) {
    case 'HOY': return { desde: new Date(y, m, d), hasta: now };
    case 'SEMANA': {
      const dow = now.getDay();
      const diff = dow === 0 ? 6 : dow - 1;
      const l = new Date(now); l.setDate(d - diff);
      return { desde: l, hasta: now };
    }
    case 'MES': return { desde: new Date(y, m, 1), hasta: now };
    case 'ANIO': return { desde: new Date(y, 0, 1), hasta: now };
    default: return { desde: new Date(y, m, d), hasta: now };
  }
};

const fmt = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

const fmtDisplay = (s) => {
  const d = new Date(s);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
};

const periodLabels = { HOY: 'Hoy', SEMANA: 'Semana', MES: 'Mes', ANIO: 'Año' };

export default function ReportesView() {
  const [period, setPeriod] = useState('HOY');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [exporting, setExporting] = useState(false);
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;

  const stats = useMemo(() => {
    const total = data.length;
    const personal = data.filter(r => r.tipo_persona === 'personal').length;
    const visitantes = data.filter(r => r.tipo_persona === 'visitante').length;
    const enSede = data.filter(r => !r.hora_salida).length;
    const completados = data.filter(r => r.hora_salida).length;
    return { total, personal, visitantes, enSede, completados };
  }, [data]);

  const fetchData = async (p) => {
    setPeriod(p);
    setLoading(true);
    try {
      const { desde, hasta } = getDateRange(p);
      const res = await getAsistenciaRango(fmt(desde), fmt(hasta));
      setData(res);
    } catch (e) {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    setExporting(true);
    try {
      const { desde, hasta } = getDateRange(period);
      const rows = data.map(r => `
        <tr>
          <td>${r.cedula_identidad}</td>
          <td>${r.nombre || 'N/A'}</td>
          <td>${r.tipo_persona === 'personal' ? 'PERSONAL' : 'VISITANTE'}</td>
          <td>${r.ente || 'N/A'}</td>
          <td>${new Date(r.hora_entrada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
          <td>${r.hora_salida ? new Date(r.hora_salida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'EN SEDE'}</td>
        </tr>
      `).join('');

      const html = `
        <html>
        <head><meta charset="utf-8"/><style>
          body { font-family: sans-serif; padding: 20px; }
          h1 { color: #009fa1; font-size: 18px; }
          .meta { color: #666; font-size: 11px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; }
          th { background: #009fa1; color: #fff; padding: 8px; text-align: center; }
          td { padding: 6px; text-align: center; border-bottom: 1px solid #eee; }
          .stats { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
          .stat { background: #f5f5f5; padding: 8px 14px; border-radius: 8px; font-size: 11px; }
          .stat strong { display: block; font-size: 18px; color: #009fa1; }
        </style></head>
        <body>
          <h1>REPORTE ${periodLabels[period].toUpperCase()} - ALCALDÍA DE GUANTA</h1>
          <div class="meta">Período: ${fmtDisplay(desde)} - ${fmtDisplay(hasta)} | Generado: ${new Date().toLocaleString('es-ES')}</div>
          <div class="stats">
            <div class="stat"><strong>${stats.total}</strong>Total</div>
            <div class="stat"><strong>${stats.personal}</strong>Personal</div>
            <div class="stat"><strong>${stats.visitantes}</strong>Visitantes</div>
            <div class="stat"><strong>${stats.enSede}</strong>En Sede</div>
            <div class="stat"><strong>${stats.completados}</strong>Completados</div>
          </div>
          <table>
            <thead><tr><th>Cédula</th><th>Nombre</th><th>Tipo</th><th>Ente</th><th>Entrada</th><th>Salida</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </body></html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      const fileName = `reporte_${period.toLowerCase()}_${fmt(new Date())}.pdf`;
      const dest = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.moveAsync({ from: uri, to: dest });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(dest, {
          mimeType: 'application/pdf',
          dialogTitle: 'Compartir Reporte',
          UTI: 'com.adobe.pdf',
        });
      }
    } catch (e) {
      console.error('PDF error:', e);
    } finally {
      setExporting(false);
    }
  };

  const periods = ['HOY', 'SEMANA', 'MES', 'ANIO'];

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName} numberOfLines={1}>{item.nombre || 'Acceso Externo'}</Text>
        <Text style={styles.rowCedula}>V-{item.cedula_identidad}</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.rowType}>{item.tipo_persona === 'personal' ? 'Personal' : 'Visitante'}</Text>
        <Text style={styles.rowTime}>
          {new Date(item.hora_entrada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        {item.hora_salida ? (
          <Text style={[styles.rowTime, item.auto_salida ? { color: '#d97706' } : { color: '#9ca3af' }]}>
            {new Date(item.hora_salida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {item.auto_salida ? ' (Auto)' : ''}
          </Text>
        ) : (
          <Text style={styles.activeText}>En Sede</Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      {/* Period Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodRow}>
        {periods.map(p => (
          <TouchableOpacity key={p} onPress={() => fetchData(p)}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}>
            <Text style={[styles.periodBtnText, period === p && styles.periodBtnTextActive]}>{periodLabels[p]}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity onPress={exportPDF} disabled={exporting || data.length === 0}
          style={[styles.exportBtn, (exporting || data.length === 0) && { opacity: 0.4 }]}>
          {exporting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="document-text" size={16} color="#fff" />
          )}
          <Text style={styles.exportBtnText}>PDF</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'Total', value: stats.total },
          { label: 'Personal', value: stats.personal, color: ORANGE },
          { label: 'Visitantes', value: stats.visitantes, color: '#d97706' },
          { label: 'En Sede', value: stats.enSede, color: '#10b981' },
          { label: 'Completados', value: stats.completados, color: '#3b82f6' },
        ].map(s => (
          <View key={s.label} style={styles.statCard}>
            <Text style={styles.statLabel}>{s.label}</Text>
            <Text style={[styles.statValue, s.color ? { color: s.color } : null]}>
              {loading ? '...' : s.value}
            </Text>
          </View>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={ORANGE} /></View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="document-text-outline" size={48} color="#e5e7eb" />
              <Text style={styles.emptyText}>Sin registros en este período</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  periodRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
    flexDirection: 'row',
  },
  periodBtn: {
    minWidth: 76,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodBtnActive: { backgroundColor: ORANGE, borderColor: ORANGE },
  periodBtnText: { fontSize: 10, fontWeight: '900', color: '#9ca3af', letterSpacing: 1 },
  periodBtnTextActive: { color: '#fff' },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    minWidth: 60,
    height: 36,
    backgroundColor: '#1f2937',
    borderRadius: 10,
  },
  exportBtnText: { fontSize: 10, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  statCard: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 12,
    padding: 10,
    flex: 1,
    minWidth: 60,
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  statLabel: { fontSize: 8, fontWeight: '900', color: '#9ca3af', letterSpacing: 1, textTransform: 'uppercase' },
  statValue: { fontSize: 20, fontWeight: '900', color: '#111', marginTop: 2 },
  list: { padding: 16, gap: 10, paddingBottom: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 16,
    padding: 14,
    minHeight: 60,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 14, fontWeight: '900', color: '#111', letterSpacing: -0.3 },
  rowCedula: { fontSize: 11, fontWeight: '700', color: '#9ca3af', marginTop: 2 },
  rowRight: { alignItems: 'flex-end', gap: 2 },
  rowType: { fontSize: 9, fontWeight: '900', color: ORANGE, textTransform: 'uppercase' },
  rowTime: { fontSize: 12, fontWeight: '800', color: '#111' },
  activeText: { fontSize: 9, fontWeight: '900', color: '#10b981', letterSpacing: 0.5 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 13, fontWeight: '700', color: '#9ca3af' },
});
