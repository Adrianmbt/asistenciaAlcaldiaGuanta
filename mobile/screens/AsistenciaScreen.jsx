import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getAsistenciaHoy, marcarSalida, eliminarAsistencia, addWsListener } from '../api/client';
import CustomAlert from '../components/CustomAlert';
import ReportesView from './ReportesView';

const ORANGE = '#009fa1';
const ORANGE_LIGHT = '#FFF7ED';
const AMBER = '#F59E0B';

export default function AsistenciaScreen() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('');
  const [filterType, setFilterType] = useState('TODOS');
  const [viewMode, setViewMode] = useState('registros');
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;
  const contentMaxWidth = isTablet ? 600 : undefined;

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ type: 'info', title: '', message: '' });
  const [pendingAction, setPendingAction] = useState(null);

  const showAlert = (type, title, message, action = null) => {
    setAlertConfig({ type, title, message });
    setPendingAction(() => action);
    setAlertVisible(true);
  };

  const handleAlertConfirm = () => {
    setAlertVisible(false);
    if (pendingAction) pendingAction();
    setPendingAction(null);
  };

  const handleAlertCancel = () => {
    setAlertVisible(false);
    setPendingAction(null);
  };

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await getAsistenciaHoy();
      setRegistros(data);
    } catch (e) {
      showAlert('error', 'Error', e.message || 'No se pudo cargar la asistencia');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Recargar al enfocar la pantalla
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  useEffect(() => {
    const unsubscribe = addWsListener((message) => {
      if (message.type === 'asistencia') {
        fetchData();
      }
    });
    return unsubscribe;
  }, []);

  const handleMarcarSalida = async (cedula) => {
    showAlert('confirm', 'Confirmar Salida', `¿Marcar salida para cédula ${cedula}?`, async () => {
      try {
        await marcarSalida(cedula);
        showAlert('success', 'Éxito', 'Salida registrada correctamente');
        fetchData();
      } catch (e) {
        showAlert('error', 'Error', e.message);
      }
    });
  };

  const handleEliminar = async (id) => {
    showAlert('confirm', 'Eliminar Registro', '¿Está seguro de eliminar este registro?', async () => {
      try {
        await eliminarAsistencia(id);
        showAlert('success', 'Éxito', 'Registro eliminado correctamente');
        fetchData();
      } catch (e) {
        showAlert('error', 'Error', e.message);
      }
    });
  };

  const filteredData = registros.filter((item) => {
    const matchSearch =
      item.cedula_identidad.includes(filter) ||
      (item.nombre && item.nombre.toLowerCase().includes(filter.toLowerCase()));
    const matchType =
      filterType === 'TODOS' || item.tipo_persona === filterType;
    return matchSearch && matchType;
  });

  const renderItem = ({ item }) => {
    const isPersonal = item.tipo_persona === 'personal';
    const entradaTime = new Date(item.hora_entrada).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const salidaTime = item.hora_salida
      ? new Date(item.hora_salida).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      : null;

    const isActive = !item.hora_salida;
    return (
      <View style={[styles.row, !isTablet && styles.rowCompact, styles.cyberCornerContainer]}>
        {/* Corner brackets */}
        <View style={[styles.cyberCorner, { top: 6, left: 6, borderTopWidth: 1, borderLeftWidth: 1, borderTopLeftRadius: 2 }]} />
        <View style={[styles.cyberCorner, { top: 6, right: 6, borderTopWidth: 1, borderRightWidth: 1, borderTopRightRadius: 2 }]} />
        <View style={[styles.cyberCorner, { bottom: 6, left: 6, borderBottomWidth: 1, borderLeftWidth: 1, borderBottomLeftRadius: 2 }]} />
        <View style={[styles.cyberCorner, { bottom: 6, right: 6, borderBottomWidth: 1, borderRightWidth: 1, borderBottomRightRadius: 2 }]} />
        {/* LED indicator */}
        {isActive && <View style={[styles.cyberLed, { position: 'absolute', top: 8, right: 8 }]} />}
        {/* Icono Tipo Premium */}
        <View style={[styles.typeIcon, isPersonal ? styles.typeIconOrange : styles.typeIconAmber, !isTablet && styles.typeIconCompact]}>
          <Ionicons
            name={isPersonal ? 'person' : 'person-add'}
            size={isTablet ? 22 : 16}
            color={isPersonal ? ORANGE : AMBER}
          />
        </View>

        {/* Info Principal */}
        <View style={styles.rowInfo}>
          <Text style={[styles.rowName, !isTablet && styles.rowNameCompact]} numberOfLines={1}>
            {item.nombre || 'Acceso Externo'}
          </Text>
          <Text style={styles.rowCedula}>V-{item.cedula_identidad}</Text>
          
          <View style={[styles.rowMeta, !isTablet && styles.rowMetaCompact]}>
            <View style={[styles.badge, isPersonal ? styles.badgeOrange : styles.badgeAmber]}>
              <View style={[styles.badgeDot, { backgroundColor: isPersonal ? ORANGE : AMBER }]} />
              <Text style={[styles.badgeText, { color: isPersonal ? ORANGE : AMBER }]}>
                {isPersonal ? 'Institucional' : 'Visitante'}
              </Text>
            </View>
            {item.ente ? (
              <Text style={styles.rowEnte} numberOfLines={1}>
                • {item.ente}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Tiempos y Acciones */}
        <View style={styles.rowRight}>
          <View style={styles.timeContainer}>
            <View style={styles.timeRow}>
              <Ionicons name="log-in" size={14} color={ORANGE} />
              <Text style={[styles.timeText, !isTablet && styles.timeTextCompact]}>{entradaTime}</Text>
            </View>
            {salidaTime ? (
              <View style={styles.timeRow}>
                <Ionicons name="log-out" size={14} color={item.auto_salida ? '#d97706' : '#9ca3af'} />
                <Text style={[styles.timeText, !isTablet && styles.timeTextCompact, { color: item.auto_salida ? '#d97706' : '#9ca3af' }]}>
                  {salidaTime}{item.auto_salida ? ' (Auto)' : ''}
                </Text>
              </View>
            ) : (
              <View style={styles.activeBadge}>
                <Text style={styles.activeText}>EN SEDE</Text>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            {!item.hora_salida && (
              <TouchableOpacity
                style={[styles.actionBtnGreen, !isTablet && styles.actionBtnCompact]}
                onPress={() => handleMarcarSalida(item.cedula_identidad)}
                activeOpacity={0.7}
              >
                <Ionicons name="exit" size={isTablet ? 18 : 14} color="#fff" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionBtnRed, !isTablet && styles.actionBtnCompact]}
              onPress={() => handleEliminar(item.id)}
              activeOpacity={0.7}
            >
              <Ionicons name="trash" size={isTablet ? 18 : 14} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Cyber top accent line */}
      <View style={styles.cyberTopAccent} />
      {/* Sub-tabs */}
      <View style={styles.subTabRow}>
        <TouchableOpacity onPress={() => setViewMode('registros')}
          style={[styles.subTab, viewMode === 'registros' && styles.subTabActive]}>
          <Ionicons name="list" size={14} color={viewMode === 'registros' ? '#fff' : '#9ca3af'} />
          <Text style={[styles.subTabText, viewMode === 'registros' && styles.subTabTextActive]}>Registros</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setViewMode('reportes')}
          style={[styles.subTab, viewMode === 'reportes' && styles.subTabActive]}>
          <Ionicons name="document-text" size={14} color={viewMode === 'reportes' ? '#fff' : '#9ca3af'} />
          <Text style={[styles.subTabText, viewMode === 'reportes' && styles.subTabTextActive]}>Reportes</Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'registros' ? (<>
      {/* Barra de Herramientas Premium */}
      <View style={[styles.toolbar, !isTablet && styles.toolbarCompact, isTablet && { alignItems: 'center' }]}>
        <View style={[styles.searchContainer, !isTablet && styles.searchContainerCompact, isTablet && { maxWidth: contentMaxWidth, width: '100%' }]}>
          <View style={styles.searchWrapper}>
            <Ionicons name="search" size={20} color={ORANGE} style={{ marginRight: 10 }} />
            <TextInput
              style={[styles.searchInput, !isTablet && styles.searchInputCompact]}
              placeholder="Buscar por cédula o nombre..."
              placeholderTextColor="#d1d5db"
              value={filter}
              onChangeText={setFilter}
            />
          </View>
        </View>

        <View style={[styles.filtersSection, !isTablet && styles.filtersSectionCompact, isTablet && { maxWidth: contentMaxWidth, width: '100%' }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {['TODOS', 'personal', 'visitante'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterBtn,
                  !isTablet && styles.filterBtnCompact,
                  filterType === type && styles.filterBtnActive,
                ]}
                onPress={() => setFilterType(type)}
              >
                <Text
                  style={[
                    styles.filterBtnText,
                    !isTablet && styles.filterBtnTextCompact,
                    filterType === type && styles.filterBtnTextActive,
                  ]}
                >
                  {type === 'TODOS' ? 'TODOS' : type === 'personal' ? 'EMPLEADOS' : 'VISITANTES'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filteredData.length}</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={ORANGE} />
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, !isTablet && styles.listCompact, isTablet && { maxWidth: contentMaxWidth, width: '100%', alignSelf: 'center' }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchData(true)}
              tintColor={ORANGE}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="clipboard" size={64} color="#e5e7eb" />
              </View>
              <Text style={styles.emptyText}>Sin registros para hoy</Text>
            </View>
          }
        />
      )}</>) : (
        <View style={{ flex: 1, paddingTop: 8 }}>
          <ReportesView />
        </View>
      )}

      <CustomAlert
        visible={alertVisible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onConfirm={handleAlertConfirm}
        onCancel={handleAlertCancel}
        showCancel={alertConfig.type === 'confirm'}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF7ED' },
  subTabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.4)',
  },
  subTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  subTabActive: { backgroundColor: ORANGE, borderColor: ORANGE },
  subTabText: { fontSize: 10, fontWeight: '900', color: '#9ca3af', letterSpacing: 1 },
  subTabTextActive: { color: '#fff' },
  cyberTopAccent: {
    height: 2,
    backgroundColor: ORANGE,
    width: '30%',
    borderRadius: 1,
    marginLeft: 20,
    marginBottom: 0,
    opacity: 0.3,
  },
  cyberCornerContainer: {
    position: 'relative',
    overflow: 'visible',
  },
  cyberCorner: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderColor: 'rgba(0,159,161,0.2)',
  },
  cyberLed: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ORANGE,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 2,
  },
  toolbar: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.4)',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 3,
  },
  toolbarCompact: {
    paddingBottom: 10,
    gap: 8,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  searchContainerCompact: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 18,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
  },
  searchInputCompact: {
    paddingVertical: 10,
    fontSize: 14,
  },
  filtersSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
  filtersSectionCompact: {
    paddingHorizontal: 12,
    gap: 8,
  },
  filterRow: { gap: 8 },
  filterBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  filterBtnCompact: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  filterBtnActive: { backgroundColor: ORANGE, borderColor: ORANGE },
  filterBtnText: { fontSize: 10, fontWeight: '900', color: '#9ca3af', letterSpacing: 1 },
  filterBtnTextCompact: { fontSize: 9, letterSpacing: 0.5 },
  filterBtnTextActive: { color: '#fff' },
  countBadge: {
    backgroundColor: ORANGE_LIGHT,
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  countText: { fontSize: 12, fontWeight: '900', color: ORANGE },
  list: { padding: 20, gap: 16, paddingBottom: 40 },
  listCompact: { padding: 12, gap: 10, paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderRadius: 24,
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  rowCompact: {
    borderRadius: 18,
    padding: 12,
    gap: 10,
  },
  typeIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIconCompact: {
    width: 42,
    height: 42,
    borderRadius: 14,
  },
  typeIconOrange: { backgroundColor: 'rgba(0,159,161,0.08)' },
  typeIconAmber: { backgroundColor: 'rgba(0,159,161,0.08)' },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 16, fontWeight: '900', color: '#111', letterSpacing: -0.5 },
  rowNameCompact: { fontSize: 14 },
  rowCedula: { fontSize: 12, fontWeight: '700', color: '#9ca3af', marginTop: 2, letterSpacing: 0.5 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  rowMetaCompact: { marginTop: 4, gap: 4 },
  badge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 5, 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 8 
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeOrange: { backgroundColor: 'rgba(0,159,161,0.08)' },
  badgeAmber: { backgroundColor: 'rgba(0,159,161,0.08)' },
  badgeText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  rowEnte: { fontSize: 10, fontWeight: '700', color: '#9ca3af', flex: 1, textTransform: 'uppercase' },
  rowRight: { alignItems: 'flex-end', gap: 10 },
  timeContainer: { alignItems: 'flex-end', gap: 4 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeText: { fontSize: 13, fontWeight: '900', color: ORANGE, letterSpacing: -0.2 },
  timeTextCompact: { fontSize: 11 },
  activeBadge: { 
    backgroundColor: '#f0fdf4', 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  activeText: { fontSize: 8, fontWeight: '900', color: '#10b981', letterSpacing: 1 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtnGreen: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  actionBtnRed: {
    backgroundColor: '#f43f5e',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#f43f5e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  actionBtnCompact: {
    borderRadius: 8,
    padding: 8,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 20 },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  emptyText: { color: '#9ca3af', fontSize: 16, fontWeight: '700' },
});
