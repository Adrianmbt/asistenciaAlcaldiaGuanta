import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario, addWsListener } from '../api/client';
import { useAuth } from '../context/AuthContext';
import CustomAlert from '../components/CustomAlert';

const ORANGE = '#009fa1';
const ORANGE_LIGHT = '#FFF7ED';

const EMPTY_FORM = {
  username: '',
  email: '',
  nombre_completo: '',
  password: '',
  rol: 'portero',
};

export default function UsuariosScreen() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getUsuarios();
      setUsuarios(data);
    } catch (e) {
      showAlert('error', 'Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  useEffect(() => {
    const unsubscribe = addWsListener((message) => {
      if (message.type === 'usuarios') {
        fetchData();
      }
    });
    return unsubscribe;
  }, []);

  const filteredUsuarios = usuarios.filter(
    (u) =>
      u.nombre_completo.toLowerCase().includes(filter.toLowerCase()) ||
      u.username.toLowerCase().includes(filter.toLowerCase()) ||
      u.email.toLowerCase().includes(filter.toLowerCase())
  );

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setIsEditing(false);
    setShowPassword(false);
    setModalVisible(true);
  };

  const openEdit = (u) => {
    setForm({ ...u, password: '' });
    setIsEditing(true);
    setShowPassword(false);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.username.trim() || !form.nombre_completo.trim()) {
      showAlert('warning', 'Campos requeridos', 'Usuario y nombre completo son obligatorios.');
      return;
    }
    if (!isEditing && !form.password.trim()) {
      showAlert('warning', 'Contraseña requerida', 'Debe ingresar una contraseña para el nuevo usuario.');
      return;
    }
    setSaving(true);
    try {
      if (isEditing) {
        await actualizarUsuario(form.id, form);
      } else {
        await crearUsuario(form);
      }
      setModalVisible(false);
      showAlert('success', 'Éxito', isEditing ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente');
      fetchData();
    } catch (e) {
      showAlert('error', 'Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDesactivar = (id, nombre) => {
    showAlert('confirm', 'Desactivar Usuario', `¿Desactivar a ${nombre}?`, async () => {
      try {
        await eliminarUsuario(id);
        showAlert('success', 'Éxito', 'Usuario desactivado correctamente');
        fetchData();
      } catch (e) {
        showAlert('error', 'Error', e.message);
      }
    });
  };

  const getRolColor = (rol) => {
    if (typeof rol === 'object') rol = rol?.value || 'portero';
    switch (rol) {
      case 'admin': return { bg: '#fff7ed', text: ORANGE, dot: ORANGE };
      case 'dev': return { bg: '#f0fdf4', text: '#16a34a', dot: '#16a34a' };
      default: return { bg: '#eff6ff', text: '#3b82f6', dot: '#3b82f6' };
    }
  };

  const getRolLabel = (rol) => {
    if (typeof rol === 'object') rol = rol?.value || 'portero';
    switch (rol) {
      case 'admin': return 'ADMINISTRADOR';
      case 'dev': return 'DESARROLLADOR';
      default: return 'PORTERÍA';
    }
  };

  const renderItem = ({ item }) => {
    const rolColors = getRolColor(item.rol);
    const isAdmin = item.rol === 'admin' || item.rol?.value === 'admin';
    const isActive = item.activo === 1;

    return (
      <View style={[styles.row, !isActive && styles.rowInactive]}>
        <View style={[styles.avatar, isAdmin ? styles.avatarOrange : styles.avatarBlue]}>
          <Ionicons name={isAdmin ? "shield-checkmark" : "person"} size={24} color={isAdmin ? ORANGE : '#3b82f6'} />
        </View>
        <View style={styles.rowInfo}>
          <Text style={styles.rowUsername}>@{item.username}</Text>
          <Text style={styles.rowName}>{item.nombre_completo}</Text>
          <View style={styles.rowMeta}>
            <View style={[styles.badge, { backgroundColor: rolColors.bg }]}>
              <View style={[styles.badgeDot, { backgroundColor: rolColors.dot }]} />
              <Text style={[styles.badgeText, { color: rolColors.text }]}>
                {getRolLabel(item.rol)}
              </Text>
            </View>
            <View style={[styles.statusBadge, isActive ? styles.statusActive : styles.statusInactive]}>
              <Text style={[styles.statusText, isActive ? styles.statusTextActive : styles.statusTextInactive]}>
                {isActive ? 'ACTIVO' : 'INACTIVO'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)} activeOpacity={0.7}>
            <Ionicons name="create" size={18} color="#3b82f6" />
          </TouchableOpacity>
          {isActive && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDesactivar(item.id, item.nombre_completo)}
              activeOpacity={0.7}
            >
              <Ionicons name="person-remove" size={18} color="#f43f5e" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Solo admins y devs pueden gestionar usuarios
  const canManage = user?.rol === 'admin' || user?.rol === 'dev';

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Toolbar Premium */}
      <View style={[styles.toolbar, isTablet && { alignItems: 'center' }]}>
        <View style={[styles.searchWrapper, isTablet && { maxWidth: contentMaxWidth, width: '100%' }]}>
          <Ionicons name="search" size={20} color={ORANGE} style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, usuario o email..."
            placeholderTextColor="#d1d5db"
            value={filter}
            onChangeText={setFilter}
          />
        </View>
        <View style={[styles.toolbarRow, isTablet && { maxWidth: contentMaxWidth, width: '100%' }]}>
           <View style={styles.countBadge}>
             <Text style={styles.countText}>{usuarios.length}</Text>
          </View>
          <Text style={styles.countLabel}>Usuarios en el sistema</Text>
          {canManage && (
            <TouchableOpacity style={styles.addBtn} onPress={openCreate} activeOpacity={0.8}>
              <Ionicons name="shield-checkmark" size={18} color="#fff" />
              <Text style={styles.addBtnText}>NUEVO</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={ORANGE} />
        </View>
      ) : (
        <FlatList
          data={filteredUsuarios}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, isTablet && { maxWidth: contentMaxWidth, width: '100%', alignSelf: 'center' }]}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="shield" size={64} color="#e5e7eb" />
              </View>
              <Text style={styles.emptyText}>No se encontraron usuarios</Text>
            </View>
          }
        />
      )}

      {/* Modal CRUD Premium */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
              <View style={styles.modalHeader}>
                <View style={styles.modalIconBox}>
                  <Ionicons name="lock-closed" size={28} color={ORANGE} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>
                    {isEditing ? 'Editar Usuario' : 'Nuevo Acceso'}
                  </Text>
                  <Text style={styles.modalSubtitle}>CREDENCIALES DE SEGURIDAD</Text>
                </View>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGrid}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>USUARIO (LOGIN)</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={form.username}
                    onChangeText={(v) => setForm({ ...form, username: v })}
                    placeholder="j.perez"
                    placeholderTextColor="#d1d5db"
                    autoCapitalize="none"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>CONTRASEÑA</Text>
                  <View style={styles.passwordWrapper}>
                    <TextInput
                      style={[styles.fieldInput, { flex: 1, borderWidth: 0, backgroundColor: 'transparent' }]}
                      value={form.password}
                      onChangeText={(v) => setForm({ ...form, password: v })}
                      placeholder={isEditing ? '(Sin cambios)' : '*******'}
                      placeholderTextColor="#d1d5db"
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 10 }}>
                      <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#9ca3af" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <Text style={styles.fieldLabel}>NOMBRE COMPLETO DEL OPERADOR</Text>
              <TextInput
                style={[styles.fieldInput, { marginBottom: 20 }]}
                value={form.nombre_completo}
                onChangeText={(v) => setForm({ ...form, nombre_completo: v })}
                placeholder="Nombre y Apellido"
                placeholderTextColor="#d1d5db"
              />

              <Text style={styles.fieldLabel}>CORREO ELECTRÓNICO INSTITUCIONAL</Text>
              <TextInput
                style={[styles.fieldInput, { marginBottom: 20 }]}
                value={form.email}
                onChangeText={(v) => setForm({ ...form, email: v })}
                placeholder="ejemplo@guanta.gob.ve"
                placeholderTextColor="#d1d5db"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.fieldLabel}>NIVEL DE ACCESO (ROL)</Text>
              <View style={styles.segmentRow}>
                {[
                  { value: 'portero', label: 'Portería' },
                  { value: 'admin', label: 'Administrador' },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.segmentBtn, form.rol === opt.value && styles.segmentBtnActive]}
                    onPress={() => setForm({ ...form, rol: opt.value })}
                  >
                    <Text style={[styles.segmentBtnText, form.rol === opt.value && styles.segmentBtnTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.9}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="key" size={22} color="#fff" />
                    <Text style={styles.saveBtnText}>
                      {isEditing ? 'ACTUALIZAR ACCESO' : 'GENERAR CREDENCIALES'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

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
  countLabel: { fontSize: 11, fontWeight: '800', color: '#9ca3af', flex: 1 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: ORANGE,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  addBtnText: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  list: { padding: 20, gap: 14, paddingBottom: 40 },
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
  rowInactive: { opacity: 0.5 },
  avatar: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarOrange: { backgroundColor: 'rgba(0,159,161,0.08)' },
  avatarBlue: { backgroundColor: 'rgba(59,130,246,0.08)' },
  rowInfo: { flex: 1 },
  rowUsername: { fontSize: 13, fontWeight: '900', color: ORANGE, letterSpacing: 0.5 },
  rowName: { fontSize: 16, fontWeight: '900', color: '#111', marginTop: 2, letterSpacing: -0.5 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  statusActive: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  statusInactive: { backgroundColor: '#fff1f2', borderColor: '#fecdd3' },
  statusText: { fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  statusTextActive: { color: '#10b981' },
  statusTextInactive: { color: '#f43f5e' },
  actions: { gap: 10 },
  editBtn: { backgroundColor: '#eff6ff', borderRadius: 12, padding: 10 },
  deleteBtn: { backgroundColor: '#fff1f2', borderRadius: 12, padding: 10 },
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
  // Modal
  modalSafe: { flex: 1, backgroundColor: 'rgba(255,255,255,0.9)' },
  modalScroll: { padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 32 },
  modalIconBox: {
    backgroundColor: '#fff7ed',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fed7aa',
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  modalTitle: { fontSize: 26, fontWeight: '900', color: '#111', letterSpacing: -1 },
  modalSubtitle: { fontSize: 10, fontWeight: '900', color: ORANGE, letterSpacing: 2, marginTop: 4 },
  closeBtn: { backgroundColor: '#f3f4f6', borderRadius: 24, padding: 10 },
  formGrid: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  fieldLabel: { fontSize: 9, fontWeight: '900', color: '#9ca3af', letterSpacing: 1.5, marginBottom: 10, marginLeft: 4, textTransform: 'uppercase' },
  fieldInput: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    fontWeight: '800',
    color: '#111',
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 16,
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  segmentRow: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 16, padding: 6, gap: 6, marginBottom: 24 },
  segmentBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  segmentBtnActive: { backgroundColor: ORANGE, shadowColor: ORANGE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  segmentBtnText: { fontSize: 13, fontWeight: '800', color: '#9ca3af' },
  segmentBtnTextActive: { color: '#fff' },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: ORANGE,
    borderRadius: 20,
    paddingVertical: 20,
    marginTop: 12,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 8,
  },
  saveBtnDisabled: { backgroundColor: '#d1d5db', shadowOpacity: 0, elevation: 0 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1.5 },
});
