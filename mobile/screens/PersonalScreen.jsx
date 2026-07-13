import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getPersonal, getCargos, getDepartamentos, getEntes, addWsListener } from '../api/client';

const ORANGE = '#009fa1';
const ITEMS_PER_PAGE = 5;

export default function PersonalScreen() {
  const [personal, setPersonal] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [deptos, setDeptos] = useState([]);
  const [entes, setEntes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;
  const contentMaxWidth = isTablet ? 600 : undefined;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [emp, car, dep, ent] = await Promise.all([
        getPersonal(), getCargos(), getDepartamentos(), getEntes()
      ]);
      setPersonal(emp);
      setCargos(car);
      setDeptos(dep);
      setEntes(ent);
    } catch (e) {
      console.error('Error al cargar datos:', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  useEffect(() => {
    const unsubscribe = addWsListener((message) => {
      if (message.type === 'personal') {
        fetchData();
      }
    });
    return unsubscribe;
  }, []);

  const getCargoName = (id) => cargos.find(c => c.id === id)?.nombre || '';
  const getDeptoName = (id) => deptos.find(d => d.id === id)?.nombre || '';
  const getEnteName = (id) => entes.find(e => e.id === id)?.nombre || '';

  const filtered = useMemo(() =>
    personal.filter(
      (p) =>
        p.nombres?.toLowerCase().includes(filter.toLowerCase()) ||
        p.apellidos?.toLowerCase().includes(filter.toLowerCase()) ||
        p.cedula?.includes(filter)
    ), [filter, personal]
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const handleFilterChange = (text) => {
    setFilter(text);
    setCurrentPage(1);
  };

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <View style={[styles.avatar, { backgroundColor: 'rgba(0,159,161,0.08)' }]}>
        <Ionicons name="person" size={24} color={ORANGE} />
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowCedula}>V-{item.cedula}</Text>
        <Text style={styles.rowName}>{item.nombres} {item.apellidos}</Text>
        <View style={styles.rowMeta}>
          <View style={styles.badgeOrange}>
            <Text style={styles.badgeText}>{getEnteName(item.ente_id) || 'ALCALDÍA'}</Text>
          </View>
          {item.cargo_id ? <Text style={styles.cargoText}>• {getCargoName(item.cargo_id)}</Text> : null}
        </View>
      </View>
      <View style={styles.statusContainer}>
        <View style={[styles.statusDot, { backgroundColor: item.estatus_laboral === 'ACTIVO' ? '#10b981' : '#f43f5e' }]} />
        <Text style={[styles.statusText, { color: item.estatus_laboral === 'ACTIVO' ? '#10b981' : '#f43f5e' }]}>
          {item.estatus_laboral || 'ACTIVO'}
        </Text>
      </View>
    </View>
  );

  const renderPagination = () => {
    if (filtered.length === 0) return null;

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <TouchableOpacity
          key={i}
          style={[styles.pageBtn, currentPage === i && styles.pageBtnActive]}
          onPress={() => setCurrentPage(i)}
        >
          <Text style={[styles.pageBtnText, currentPage === i && styles.pageBtnTextActive]}>{i}</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.paginationContainer}>
        <Text style={styles.paginationInfo}>
          Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} de {filtered.length}
        </Text>
        <View style={styles.paginationControls}>
          <TouchableOpacity
            style={[styles.navBtn, currentPage === 1 && styles.navBtnDisabled]}
            onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <Ionicons name="chevron-back" size={18} color={currentPage === 1 ? '#d1d5db' : '#6b7280'} />
          </TouchableOpacity>
          {pages}
          <TouchableOpacity
            style={[styles.navBtn, currentPage === totalPages && styles.navBtnDisabled]}
            onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <Ionicons name="chevron-forward" size={18} color={currentPage === totalPages ? '#d1d5db' : '#6b7280'} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={[styles.toolbar, isTablet && { alignItems: 'center' }]}>
        <View style={[styles.searchWrapper, isTablet && { maxWidth: contentMaxWidth, width: '100%' }]}>
          <Ionicons name="search" size={20} color={ORANGE} style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por cédula, nombre..."
            placeholderTextColor="#d1d5db"
            value={filter}
            onChangeText={handleFilterChange}
          />
        </View>
        <View style={[styles.toolbarRow, isTablet && { maxWidth: contentMaxWidth, width: '100%' }]}>
          <View style={styles.countBadge}><Text style={styles.countText}>{personal.length}</Text></View>
          <Text style={styles.countLabel}>Empleados registrados</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={ORANGE} /></View>
      ) : (
        <FlatList
          data={paginatedData}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, isTablet && { maxWidth: contentMaxWidth, width: '100%', alignSelf: 'center' }]}
          ListFooterComponent={renderPagination}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}><Ionicons name="people" size={64} color="#e5e7eb" /></View>
              <Text style={styles.emptyText}>No se encontraron registros</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF7ED' },
  toolbar: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.4)',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 3,
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
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 15, fontWeight: '700', color: '#111' },
  toolbarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  countBadge: {
    backgroundColor: 'rgba(0,159,161,0.08)',
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,159,161,0.15)',
  },
  countText: { fontSize: 12, fontWeight: '900', color: ORANGE },
  countLabel: { fontSize: 11, fontWeight: '800', color: '#9ca3af', flex: 1 },
  list: { padding: 20, gap: 14, paddingBottom: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderRadius: 24,
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 15,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  avatar: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1 },
  rowCedula: { fontSize: 12, fontWeight: '900', color: '#9ca3af', letterSpacing: 1 },
  rowName: { fontSize: 16, fontWeight: '900', color: '#111', marginTop: 2, letterSpacing: -0.5 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  badgeOrange: { backgroundColor: 'rgba(0,159,161,0.08)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 9, fontWeight: '900', color: ORANGE, textTransform: 'uppercase' },
  cargoText: { fontSize: 10, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase' },
  statusContainer: { alignItems: 'flex-end', gap: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 20 },
  emptyIconCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
  },
  emptyText: { color: '#9ca3af', fontSize: 16, fontWeight: '700' },
  paginationContainer: {
    paddingHorizontal: 8, paddingVertical: 16,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.4)',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  paginationInfo: { fontSize: 11, fontWeight: '700', color: '#9ca3af' },
  paginationControls: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  navBtn: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  navBtnDisabled: { opacity: 0.4 },
  pageBtn: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  pageBtnActive: {
    backgroundColor: ORANGE,
    shadowColor: ORANGE, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  pageBtnText: { fontSize: 12, fontWeight: '800', color: '#6b7280' },
  pageBtnTextActive: { color: '#fff' },
});
