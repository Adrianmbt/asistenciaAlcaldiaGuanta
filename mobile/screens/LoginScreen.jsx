import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const ORANGE = '#009fa1';
const AMBER = '#F59E0B';

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;
  const contentMaxWidth = isTablet ? 480 : undefined;

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('INGRESE USUARIO Y CONTRASEÑA');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(username.trim(), password);
    } catch (e) {
      setError(e.message || 'ERROR DE CONEXIÓN CON EL SERVIDOR');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, isTablet && { alignItems: 'center' }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Institucional Premium */}
          <View style={[styles.header, isTablet && { maxWidth: contentMaxWidth, width: '100%' }]}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../assets/logo_guanta.png')} 
                style={styles.logo}
                resizeMode="cover"
              />
              <View style={styles.logoRing} />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>GUANTA</Text>
              <Text style={styles.headerSubtitle}>CONTROL INSTITUCIONAL</Text>
            </View>
          </View>

          {/* Formulario Elevado */}
          <View style={[styles.card, isTablet && { maxWidth: contentMaxWidth, width: '100%', borderRadius: 48 }]}>
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>Bienvenido, Oficial</Text>
              <Text style={styles.welcomeSubtitle}>
                Ingrese sus credenciales para iniciar la jornada de seguridad corporativa.
              </Text>
            </View>

            {error && (
              <View style={styles.errorBox}>
                <View style={styles.errorIconCircle}>
                  <Ionicons name="alert-circle" size={16} color="#fff" />
                </View>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Campo Usuario */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>USUARIO DEL SISTEMA</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="person"
                  size={20}
                  color={ORANGE}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="IDENTIFICADOR"
                  placeholderTextColor="#d1d5db"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Campo Contraseña */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>CONTRASEÑA SEGURA</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed"
                  size={20}
                  color={ORANGE}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="••••••••"
                  placeholderTextColor="#d1d5db"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="#d1d5db"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Botón Login Premium */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.loginBtnText}>AUTENTICAR ACCESO</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.footerContainer}>
              <View style={styles.footerLine} />
              <Text style={styles.footer}>
                Soporte: sistemas@guanta.gob.ve
              </Text>
              <View style={styles.footerLine} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFF7ED',
  },
  scroll: {
    flexGrow: 1,
  },
  header: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 20,
  },
  logoContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 45,
    zIndex: 10,
  },
  logoRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'rgba(255,255,255,0.5)',
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  headerTextContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#111',
    letterSpacing: -1.5,
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '900',
    color: ORANGE,
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  card: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderTopLeftRadius: 48,
    borderTopRightRadius: 48,
    padding: 32,
    paddingTop: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -20 },
    shadowOpacity: 0.05,
    shadowRadius: 30,
    elevation: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  welcomeSection: {
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#111',
    letterSpacing: -1,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '600',
    lineHeight: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(0,159,161,0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,159,161,0.15)',
  },
  errorIconCircle: {
    backgroundColor: '#f43f5e',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#f43f5e',
    fontSize: 11,
    fontWeight: '900',
    flex: 1,
    letterSpacing: 0.5,
  },
  fieldGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    color: '#9ca3af',
    letterSpacing: 2,
    marginBottom: 10,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
    opacity: 0.3,
  },
  input: {
    flex: 1,
    paddingVertical: 18,
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  eyeBtn: {
    padding: 8,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: ORANGE,
    borderRadius: 20,
    paddingVertical: 20,
    marginTop: 12,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  loginBtnDisabled: {
    backgroundColor: '#d1d5db',
    shadowOpacity: 0,
    elevation: 0,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    gap: 10,
  },
  footerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  footer: {
    color: '#d1d5db',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
