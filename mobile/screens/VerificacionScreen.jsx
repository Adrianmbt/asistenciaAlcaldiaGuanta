import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { verificarCedula, registrarMovimiento } from '../api/client';

const ORANGE = '#F05438';
const AMBER = '#F59E0B';

export default function VerificacionScreen() {
  const [cedula, setCedula] = useState('');
  const [personData, setPersonData] = useState(null);
  const [isVisitor, setIsVisitor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [visitorData, setVisitorData] = useState({
    nombre: '',
    ente: '',
    piso: '',
    motivo: '',
    telefono: '',
  });

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const searchTimeout = useRef(null);

  const handleCedulaChange = (value) => {
    setCedula(value);
    setPersonData(null);
    setIsVisitor(false);
    setMessage(null);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (value.length > 5) {
      searchTimeout.current = setTimeout(() => buscarCedula(value), 500);
    }
  };

  const buscarCedula = async (value) => {
    setLoading(true);
    try {
      const data = await verificarCedula(value);
      if (data.encontrado) {
        setPersonData(data.datos);
        setIsVisitor(false);
      } else {
        setPersonData(null);
        setIsVisitor(true);
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'ERROR DE CONEXIÓN CON EL SERVIDOR' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      const params = { cedula };
      if (isVisitor) {
        if (!visitorData.nombre.trim()) {
          setMessage({ type: 'error', text: 'EL NOMBRE DEL VISITANTE ES REQUERIDO' });
          setLoading(false);
          return;
        }
        params.nombre = visitorData.nombre;
        params.ente = visitorData.ente;
        params.piso = visitorData.piso;
        params.motivo = visitorData.motivo;
        params.telefono = visitorData.telefono;
      }

      const data = await registrarMovimiento(params);
      const action = data.hora_salida ? 'SALIDA' : 'ENTRADA';
      const time = new Date(data.hora_salida || data.hora_entrada).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      setMessage({ type: 'success', text: `${action} REGISTRADA: ${time}` });

      setTimeout(() => {
        setCedula('');
        setPersonData(null);
        setIsVisitor(false);
        setVisitorData({ nombre: '', ente: '', piso: '', motivo: '', telefono: '' });
        setMessage(null);
      }, 3000);
    } catch (e) {
      setMessage({ type: 'error', text: e.message || 'ERROR AL REGISTRAR' });
    } finally {
      setLoading(false);
    }
  };

  const handleBarCodeScanned = ({ data }) => {
    setScanned(true);
    setShowScanner(false);
    const cedulaLimpia = data.trim();
    setCedula(cedulaLimpia);
    buscarCedula(cedulaLimpia);
  };

  const abrirScanner = async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        setMessage({ type: 'error', text: 'PERMISO DE CÁMARA DENEGADO' });
        return;
      }
    }
    setScanned(false);
    setShowScanner(true);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Modal escáner QR */}
        <Modal visible={showScanner} animationType="slide" presentationStyle="fullScreen">
          <View style={styles.scannerContainer}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            />
            <View style={styles.scannerOverlay}>
              <View style={styles.scannerFrame}>
                <Ionicons name="qr-code" size={40} color="#fff" />
              </View>
              <Text style={styles.scannerText}>Apunte al código QR de la cédula</Text>
            </View>
            <TouchableOpacity
              style={styles.scannerClose}
              onPress={() => setShowScanner(false)}
            >
              <Ionicons name="close-circle" size={48} color="#fff" />
            </TouchableOpacity>
          </View>
        </Modal>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Institucional */}
          <View style={styles.premiumHeader}>
             <View style={styles.headerBadge}>
                <Ionicons name="shield-checkmark" size={32} color="#fff" />
             </View>
             <Text style={styles.headerTitle}>CONTROL DE ACCESO</Text>
             <Text style={styles.headerSubtitle}>ALCALDÍA DE GUANTA</Text>
          </View>

          <View style={styles.content}>
            {/* Mensaje de estado */}
            {message && (
              <View
                style={[
                  styles.messageBox,
                  message.type === 'success' ? styles.messageSuccess : styles.messageError,
                ]}
              >
                <Ionicons
                  name={message.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
                  size={24}
                  color={message.type === 'success' ? '#10b981' : '#f43f5e'}
                />
                <Text
                  style={[
                    styles.messageText,
                    { color: message.type === 'success' ? '#065f46' : '#9f1239' },
                  ]}
                >
                  {message.text}
                </Text>
              </View>
            )}

            {/* Campo de cédula + QR */}
            <View style={styles.searchSection}>
              <Text style={styles.searchLabel}>IDENTIFICACIÓN DEL CIUDADANO</Text>
              <View style={styles.searchWrapper}>
                <Ionicons name="search" size={28} color={ORANGE} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="CÉDULA"
                  placeholderTextColor="#d1d5db"
                  value={cedula}
                  onChangeText={handleCedulaChange}
                  keyboardType="numeric"
                  maxLength={10}
                />
                {loading && (
                  <ActivityIndicator color={ORANGE} style={{ marginRight: 8 }} />
                )}
                <TouchableOpacity
                  style={styles.qrButton}
                  onPress={abrirScanner}
                  activeOpacity={0.7}
                >
                  <Ionicons name="qr-code" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Ficha de Personal */}
            {personData && (
              <View style={styles.personalCard}>
                <View style={styles.personalCardHeader}>
                  <View style={styles.avatarCircle}>
                    <Ionicons name="person" size={48} color={ORANGE} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.badgePersonal}>
                      <Text style={styles.badgePersonalText}>Personal Institucional</Text>
                    </View>
                    <Text style={styles.personalName}>{personData.nombre}</Text>
                    <View style={styles.personalTags}>
                      <View style={styles.tagOrange}>
                        <Ionicons name="briefcase" size={11} color={ORANGE} />
                        <Text style={styles.tagOrangeText}>{personData.cargo || 'Funcionario'}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.confirmBtn, loading && styles.confirmBtnDisabled]}
                  onPress={handleRegister}
                  disabled={loading}
                  activeOpacity={0.9}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="time" size={24} color="#fff" />
                      <Text style={styles.confirmBtnText}>CONFIRMAR ASISTENCIA</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Formulario Visitante */}
            {isVisitor && (
              <View style={styles.visitorCard}>
                <View style={styles.visitorHeader}>
                  <View style={styles.visitorIconBox}>
                    <Ionicons name="person-add" size={28} color="#fff" />
                  </View>
                  <View>
                    <Text style={styles.visitorTitle}>Nueva Visita</Text>
                    <Text style={styles.visitorSubtitle}>REGISTRO DE TRÁMITE EXTERNO</Text>
                  </View>
                </View>

                <View style={styles.visitorFields}>
                  <VisitorField
                    label="NOMBRE COMPLETO DEL VISITANTE"
                    placeholder="NOMBRE Y APELLIDO"
                    value={visitorData.nombre}
                    onChangeText={(v) => setVisitorData({ ...visitorData, nombre: v })}
                  />
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <VisitorField
                        label="WhatsApp / TELÉFONO"
                        placeholder="NÚMERO"
                        value={visitorData.telefono}
                        onChangeText={(v) => setVisitorData({ ...visitorData, telefono: v })}
                        keyboardType="phone-pad"
                      />
                    </View>
                    <View style={{ width: 12 }} />
                    <View style={{ flex: 1 }}>
                      <VisitorField
                        label="ENTE / PROCEDENCIA"
                        placeholder="ENTIDAD"
                        value={visitorData.ente}
                        onChangeText={(v) => setVisitorData({ ...visitorData, ente: v })}
                      />
                    </View>
                  </View>
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <VisitorField
                        label="PISO / OFICINA"
                        placeholder="DESTINO"
                        value={visitorData.piso}
                        onChangeText={(v) => setVisitorData({ ...visitorData, piso: v })}
                      />
                    </View>
                    <View style={{ width: 12 }} />
                    <View style={{ flex: 1 }}>
                      <VisitorField
                        label="MOTIVO"
                        placeholder="MOTIVO"
                        value={visitorData.motivo}
                        onChangeText={(v) => setVisitorData({ ...visitorData, motivo: v })}
                      />
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.visitorBtn,
                    (!visitorData.nombre.trim() || loading) && styles.visitorBtnDisabled,
                  ]}
                  onPress={handleRegister}
                  disabled={!visitorData.nombre.trim() || loading}
                  activeOpacity={0.9}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.visitorBtnText}>REGISTRAR VISITA</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Estado vacío */}
            {!personData && !isVisitor && !loading && cedula.length === 0 && (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="id-card" size={56} color="#d1d5db" />
                </View>
                <Text style={styles.emptyText}>Ingrese una cédula o escanee el código QR</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function VisitorField({ label, placeholder, value, onChangeText, keyboardType }) {
  return (
    <View style={vfStyles.group}>
      <Text style={vfStyles.label}>{label}</Text>
      <TextInput
        style={vfStyles.input}
        placeholder={placeholder}
        placeholderTextColor="#d1d5db"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || 'default'}
      />
    </View>
  );
}

const vfStyles = StyleSheet.create({
  group: { marginBottom: 16 },
  label: {
    fontSize: 9,
    fontWeight: '900',
    color: AMBER,
    letterSpacing: 1.5,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#fef3c7',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    fontWeight: '800',
    color: '#111',
  },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  scroll: { flexGrow: 1 },
  premiumHeader: {
    backgroundColor: ORANGE,
    paddingTop: 40,
    paddingBottom: 60,
    alignItems: 'center',
    gap: 12,
  },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: -40,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 24,
    paddingTop: 40,
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  messageSuccess: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  messageError: { backgroundColor: '#fff1f2', borderColor: '#fecdd3' },
  messageText: { fontSize: 13, fontWeight: '900', textTransform: 'uppercase', flex: 1, letterSpacing: -0.2 },
  searchSection: { marginBottom: 32 },
  searchLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: ORANGE,
    letterSpacing: 2,
    marginBottom: 12,
    marginLeft: 4,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#fed7aa',
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  searchIcon: { marginLeft: 20, marginRight: 12 },
  searchInput: {
    flex: 1,
    paddingVertical: 24,
    fontSize: 32,
    fontWeight: '900',
    color: '#111',
    letterSpacing: -1.5,
  },
  qrButton: {
    backgroundColor: ORANGE,
    borderRadius: 16,
    padding: 14,
    marginRight: 8,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  // Personal card
  personalCard: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 24,
    borderWidth: 2,
    borderColor: 'rgba(240,84,56,0.1)',
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 10,
    marginBottom: 24,
  },
  personalCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 24 },
  avatarCircle: {
    backgroundColor: '#fff',
    borderRadius: 40,
    padding: 16,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  badgePersonal: {
    backgroundColor: ORANGE,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  badgePersonalText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  personalName: { fontSize: 28, fontWeight: '900', color: '#111', letterSpacing: -1, marginBottom: 10 },
  personalTags: { flexDirection: 'row', gap: 8 },
  tagOrange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff7ed',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffedd5',
  },
  tagOrangeText: { color: ORANGE, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: ORANGE,
    borderRadius: 20,
    paddingVertical: 20,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 8,
  },
  confirmBtnDisabled: { backgroundColor: '#d1d5db', shadowOpacity: 0, elevation: 0 },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1.5 },
  // Visitor card
  visitorCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 32,
    padding: 24,
    borderWidth: 2,
    borderColor: '#fef3c7',
    shadowColor: AMBER,
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 5,
    marginBottom: 24,
  },
  visitorHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  visitorIconBox: {
    backgroundColor: AMBER,
    borderRadius: 20,
    padding: 16,
    shadowColor: AMBER,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 5,
  },
  visitorTitle: { fontSize: 24, fontWeight: '900', color: '#1f2937', letterSpacing: -0.8 },
  visitorSubtitle: { fontSize: 10, fontWeight: '900', color: AMBER, letterSpacing: 1.5, marginTop: 4, textTransform: 'uppercase' },
  visitorFields: { marginBottom: 24 },
  row: { flexDirection: 'row' },
  visitorBtn: {
    backgroundColor: AMBER,
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: AMBER,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  visitorBtnDisabled: { backgroundColor: '#d1d5db', shadowOpacity: 0, elevation: 0 },
  visitorBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  // Empty state
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 20 },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  emptyText: { color: '#9ca3af', fontSize: 15, fontWeight: '700', textAlign: 'center', maxWidth: '80%' },
  // Scanner modal
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  scannerFrame: {
    width: 220,
    height: 220,
    borderWidth: 3,
    borderColor: ORANGE,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(240,84,56,0.15)',
  },
  scannerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  scannerClose: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    opacity: 0.8,
  },
});
