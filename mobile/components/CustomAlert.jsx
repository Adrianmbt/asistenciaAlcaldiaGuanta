import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ORANGE = '#009fa1';

const TYPES = {
  success: { color: '#10b981', icon: 'checkmark-circle', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
  error: { color: '#f43f5e', icon: 'close-circle', bg: 'rgba(244,63,94,0.08)', border: 'rgba(244,63,94,0.2)' },
  warning: { color: '#f59e0b', icon: 'warning', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
  info: { color: ORANGE, icon: 'information-circle', bg: 'rgba(0,159,161,0.08)', border: 'rgba(0,159,161,0.2)' },
  confirm: { color: '#3b82f6', icon: 'help-circle', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)' },
};

export default function CustomAlert({ visible, type = 'info', title, message, onConfirm, onCancel, confirmText = 'Confirmar', cancelText = 'Cancelar', showCancel = false }) {
  if (!visible) return null;
  const t = TYPES[type] || TYPES.info;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.card, { borderColor: t.border }]}>
          <View style={[styles.iconCircle, { backgroundColor: t.bg }]}>
            <Ionicons name={t.icon} size={36} color={t.color} />
          </View>
          <Text style={styles.title}>{title}</Text>
          {message && <Text style={styles.message}>{message}</Text>}
          <View style={styles.btnRow}>
            {showCancel && (
              <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
                <Text style={styles.cancelText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: t.color }]} onPress={onConfirm} activeOpacity={0.8}>
              <Text style={styles.confirmText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 28,
    padding: 32,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 20,
  },
  iconCircle: { width: 72, height: 72, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '900', color: '#111', textAlign: 'center', letterSpacing: -0.5, marginBottom: 8 },
  message: { fontSize: 13, color: '#6b7280', textAlign: 'center', lineHeight: 18, marginBottom: 24 },
  btnRow: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, backgroundColor: '#f3f4f6', alignItems: 'center' },
  cancelText: { fontSize: 13, fontWeight: '800', color: '#6b7280', letterSpacing: 0.5 },
  confirmBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  confirmText: { fontSize: 13, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
});
