import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getPersonal, crearPersonal, actualizarPersonal, eliminarPersonal, getCargos, getDepartamentos, getEntes } from '../api/client';

const ORANGE = '#F05438';
const ORANGE_LIGHT = '#FFF7ED';

const EMPTY_FORM = {
  cedula: '', nombres: '', apellidos: '', sexo: '',
  fecha_nacimiento: '', fecha_ingreso: '',
  cargo_id: null, departamento_id: null, ente_id: null,
  telefono: '', correo: '',
  estatus_laboral: 'ACTIVO', estado: 'ACTIVO', observaciones: '',
};

export default function PersonalScreen() {
  const [personal, setPersonal] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [deptos, setDeptos] = useState([]);
  const [entes, setEntes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

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
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const getCargoName = (id) => cargos.find(c => c.id === id)?.nombre || '';
  const getDeptoName = (id) => deptos.find(d => d.id === id)?.nombre || '';
  const getEnteName = (id) => entes.find(e => e.id === id)?.nombre || '';

  const filtered = personal.filter(
    (p) =>
      p.nombres?.toLowerCase().includes(filter.toLowerCase()) ||
      p.apellidos?.toLowerCase().includes(filter.toLowerCase()) ||
      p.cedula?.includes(filter)
  );

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setIsEditing(false);
    setModalVisible(true);
  };

  const openEdit = (p) => {
    setForm({
      ...p,
      fecha_nacimiento: p.fecha_nacimiento ? p.fecha_nacimiento.slice(0, 10) : '',
      fecha_ingreso: p.fecha_ingreso ? p.fecha_ingreso.slice(0, 10) : '',
      cargo_id: p.cargo_id ?? null,
      departamento_id: p.departamento_id ?? null,
      ente_id: p.ente_id ?? null,
    });
    setIsEditing(true);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.cedula.trim() || !form.nombres.trim() || !form.apellidos.trim()) {
      Alert.alert('Campos requeridos', 'Cédula, nombres y apellidos son obligatorios.');
      return;
    }
    setSaving(true);
    try {
      const body = {
        ...form,
        cargo_id: form.cargo_id ? Number(form.cargo_id) : null,
        departamento_id: form.departamento_id ? Number(form.departamento_id) : null,
        ente_id: form.ente_id ? Number(form.ente_id) : null,
      };
      if (isEditing) {
        await actualizarPersonal(form.id, body);
      } else {
        await crearPersonal(body);
      }
      setModalVisible(false);
      fetchData();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id, nombre) => {
    Alert.alert('Desactivar Empleado', `¿Desactivar a ${nombre}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Desactivar', style: 'destructive',
        onPress: async () => { try { await eliminarPersonal(id); fetchData(); } catch (e) { Alert.alert('Error', e.message); } },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <View style={[styles.avatar, { backgroundColor: ORANGE_LIGHT }]}>
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
      <View style={styles.actions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)} activeOpacity={0.7}>
          <Ionicons name="create" size={18} color="#3b82f6" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id, `${item.nombres} ${item.apellidos}`)} activeOpacity={0.7}>
          <Ionicons name="trash" size={18} color="#f43f5e" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.toolbar}>
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={20} color={ORANGE} style={{ marginRight: 10 }} />
          <TextInput style={styles.searchInput} placeholder="Buscar por cédula, nombre..." placeholderTextColor="#d1d5db" value={filter} onChangeText={setFilter} />
        </View>
        <View style={styles.toolbarRow}>
          <View style={styles.countBadge}><Text style={styles.countText}>{personal.length}</Text></View>
          <Text style={styles.countLabel}>Empleados registrados</Text>
          <TouchableOpacity style={styles.addBtn} onPress={openCreate} activeOpacity={0.8}>
            <Ionicons name="person-add" size={18} color="#fff" />
            <Text style={styles.addBtnText}>NUEVO</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={ORANGE} /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}><Ionicons name="people" size={64} color="#e5e7eb" /></View>
              <Text style={styles.emptyText}>No se encontraron registros</Text>
            </View>
          }
        />
      )}

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
              <View style={styles.modalHeader}>
                <View style={styles.modalIconBox}><Ionicons name="person-add" size={28} color={ORANGE} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>{isEditing ? 'Editar Empleado' : 'Nuevo Ingreso'}</Text>
                  <Text style={styles.modalSubtitle}>FICHA TÉCNICA INSTITUCIONAL</Text>
                </View>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGrid}>
                <FormField label="CÉDULA" value={form.cedula} onChangeText={(v) => setForm({ ...form, cedula: v })} placeholder="20111222" keyboardType="numeric" />
                <FormField label="TELÉFONO" value={form.telefono} onChangeText={(v) => setForm({ ...form, telefono: v })} placeholder="0424-0000000" keyboardType="phone-pad" />
              </View>
              <View style={styles.formGrid}>
                <FormField label="NOMBRES" value={form.nombres} onChangeText={(v) => setForm({ ...form, nombres: v })} placeholder="Nombres" />
                <FormField label="APELLIDOS" value={form.apellidos} onChangeText={(v) => setForm({ ...form, apellidos: v })} placeholder="Apellidos" />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>CARGO</Text>
                <View style={styles.pickerRow}>
                  <PickerSelect items={cargos} value={form.cargo_id} onChange={(v) => setForm({ ...form, cargo_id: v })} placeholder="Seleccionar cargo" />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>DEPARTAMENTO</Text>
                <View style={styles.pickerRow}>
                  <PickerSelect items={deptos} value={form.departamento_id} onChange={(v) => setForm({ ...form, departamento_id: v })} placeholder="Seleccionar departamento" />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>ENTE</Text>
                <View style={styles.pickerRow}>
                  <PickerSelect items={entes} value={form.ente_id} onChange={(v) => setForm({ ...form, ente_id: v })} placeholder="Seleccionar ente" />
                </View>
              </View>

              <FormField label="CORREO ELECTRÓNICO" value={form.correo} onChangeText={(v) => setForm({ ...form, correo: v })} placeholder="ejemplo@guanta.gob.ve" keyboardType="email-address" />

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>ESTATUS LABORAL</Text>
                <View style={styles.pickerRow}>
                  {['ACTIVO', 'EGRESADO', 'JUBILADO', 'SUSPENDIDO', 'PERMISO', 'REPOSO'].map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.segmentBtn, form.estatus_laboral === s && styles.segmentBtnActive]}
                      onPress={() => setForm({ ...form, estatus_laboral: s })}
                    >
                      <Text style={[styles.segmentBtnText, form.estatus_laboral === s && styles.segmentBtnTextActive]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving} activeOpacity={0.9}>
                {saving ? <ActivityIndicator color="#fff" /> : (
                  <><Ionicons name="cloud-upload" size={22} color="#fff" /><Text style={styles.saveBtnText}>{isEditing ? 'ACTUALIZAR DATOS' : 'REGISTRAR EMPLEADO'}</Text></>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function FormField({ label, value, onChangeText, placeholder, keyboardType }) {
  return (
    <View style={ffStyles.group}>
      <Text style={ffStyles.label}>{label}</Text>
      <TextInput style={ffStyles.input} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#d1d5db" keyboardType={keyboardType || 'default'} />
    </View>
  );
}

function PickerSelect({ items, value, onChange, placeholder }) {
  const [expanded, setExpanded] = useState(false);
  const selected = items.find(i => i.id === value);
  return (
    <View>
      <TouchableOpacity style={ffStyles.input} onPress={() => setExpanded(!expanded)}>
        <Text style={{ fontWeight: '800', color: selected ? '#111' : '#d1d5db' }}>{selected ? selected.nombre : placeholder}</Text>
      </TouchableOpacity>
      {expanded && (
        <View style={{ backgroundColor: '#fff', borderRadius: 12, marginTop: 4, borderWidth: 1, borderColor: '#f3f4f6' }}>
          <TouchableOpacity style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }} onPress={() => { onChange(null); setExpanded(false); }}>
            <Text style={{ fontWeight: '800', color: '#9ca3af' }}>{placeholder}</Text>
          </TouchableOpacity>
          {items.map(item => (
            <TouchableOpacity key={item.id} style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }} onPress={() => { onChange(item.id); setExpanded(false); }}>
              <Text style={{ fontWeight: '800', color: '#111' }}>{item.nombre}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const ffStyles = StyleSheet.create({
  group: { flex: 1, marginBottom: 20 },
  label: { fontSize: 9, fontWeight: '900', color: '#9ca3af', letterSpacing: 1.5, marginBottom: 8, marginLeft: 4, textTransform: 'uppercase' },
  input: { backgroundColor: '#f9fafb', borderWidth: 2, borderColor: '#f3f4f6', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, fontWeight: '800', color: '#111' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFBF9' },
  toolbar: { backgroundColor: '#fff', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', gap: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 3 },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 18, paddingHorizontal: 16, borderWidth: 2, borderColor: '#fed7aa' },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 15, fontWeight: '700', color: '#111' },
  toolbarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  countBadge: { backgroundColor: ORANGE_LIGHT, width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#fed7aa' },
  countText: { fontSize: 12, fontWeight: '900', color: ORANGE },
  countLabel: { fontSize: 11, fontWeight: '800', color: '#9ca3af', flex: 1 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: ORANGE, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14, shadowColor: ORANGE, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  addBtnText: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  list: { padding: 20, gap: 14, paddingBottom: 40 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 24, padding: 16, gap: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.04, shadowRadius: 15, elevation: 3, borderWidth: 1, borderColor: '#fff1ec' },
  avatar: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1 },
  rowCedula: { fontSize: 12, fontWeight: '900', color: '#9ca3af', letterSpacing: 1 },
  rowName: { fontSize: 16, fontWeight: '900', color: '#111', marginTop: 2, letterSpacing: -0.5 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  badgeOrange: { backgroundColor: '#fff7ed', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 9, fontWeight: '900', color: ORANGE, textTransform: 'uppercase' },
  cargoText: { fontSize: 10, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase' },
  actions: { gap: 10 },
  editBtn: { backgroundColor: '#eff6ff', borderRadius: 12, padding: 10 },
  deleteBtn: { backgroundColor: '#fff1f2', borderRadius: 12, padding: 10 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 20 },
  emptyIconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#f9fafb', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#f3f4f6' },
  emptyText: { color: '#9ca3af', fontSize: 16, fontWeight: '700' },
  modalSafe: { flex: 1, backgroundColor: '#fff' },
  modalScroll: { padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 32 },
  modalIconBox: { backgroundColor: '#fff7ed', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#fed7aa', shadowColor: ORANGE, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 15 },
  modalTitle: { fontSize: 26, fontWeight: '900', color: '#111', letterSpacing: -1 },
  modalSubtitle: { fontSize: 10, fontWeight: '900', color: ORANGE, letterSpacing: 2, marginTop: 4 },
  closeBtn: { backgroundColor: '#f3f4f6', borderRadius: 24, padding: 10 },
  formGrid: { flexDirection: 'row', gap: 16 },
  fieldGroup: { marginBottom: 20 },
  fieldLabel: { fontSize: 9, fontWeight: '900', color: '#9ca3af', letterSpacing: 1.5, marginBottom: 10, marginLeft: 4, textTransform: 'uppercase' },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  segmentBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#f3f4f6' },
  segmentBtnActive: { backgroundColor: ORANGE },
  segmentBtnText: { fontSize: 10, fontWeight: '800', color: '#9ca3af' },
  segmentBtnTextActive: { color: '#fff' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: ORANGE, borderRadius: 20, paddingVertical: 20, marginTop: 12, shadowColor: ORANGE, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.35, shadowRadius: 15, elevation: 8 },
  saveBtnDisabled: { backgroundColor: '#d1d5db', shadowOpacity: 0, elevation: 0 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1.5 },
});
