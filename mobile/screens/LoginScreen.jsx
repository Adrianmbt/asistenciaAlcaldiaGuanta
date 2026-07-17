import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Image,
  Keyboard,
  StatusBar,
  Dimensions,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const ORANGE = '#009fa1';
const CYAN = '#00B4B8';
const TABLET_BREAKPOINT = 600;

const { width: WIN_WIDTH } = Dimensions.get('window');
const IS_TABLET = WIN_WIDTH >= TABLET_BREAKPOINT;
const CONTENT_MAX_WIDTH = IS_TABLET ? 480 : undefined;

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isTablet = useRef(IS_TABLET).current;
  const contentMaxWidth = useRef(CONTENT_MAX_WIDTH).current;

  const handleLogin = async () => {
    Keyboard.dismiss();
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

  const centerWrapStyle = isTablet
    ? { maxWidth: contentMaxWidth, width: '100%' }
    : undefined;

  const cardStyle = isTablet ? { borderRadius: 36 } : undefined;

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#070b19" />
      <View style={styles.glowTop} pointerEvents="none" />
      <View style={styles.glowBottom} pointerEvents="none" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <View style={[styles.centerWrap, centerWrapStyle]}>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <View style={styles.logoRing} />
                <Image
                  source={require('../assets/logo_login.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>GUANTA</Text>
                <Text style={styles.headerSubtitle}>CONTROL INSTITUCIONAL</Text>
              </View>
            </View>

            <View style={[styles.card, cardStyle]}>
              <View style={styles.cardHeaderAccent} />

              <View style={styles.welcomeSection}>
                <View style={styles.statusIndicatorContainer}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>CONEXIÓN CIFRADA ACTIVA</Text>
                </View>
                <Text style={styles.welcomeTitle}>Bienvenido, Oficial</Text>
                <Text style={styles.welcomeSubtitle}>
                  Ingrese sus credenciales para iniciar la jornada de seguridad corporativa.
                </Text>
              </View>

              {error && (
                <View style={styles.errorBox}>
                  <View style={styles.errorIconCircle}>
                    <Ionicons name="alert-circle" size={14} color="#fff" />
                  </View>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>USUARIO DEL SISTEMA</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="person"
                    size={18}
                    color="#64748b"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="IDENTIFICADOR"
                    placeholderTextColor="#475569"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    blurOnSubmit={false}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>CONTRASEÑA SEGURA</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed"
                    size={18}
                    color="#64748b"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#475569"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={18}
                      color="#64748b"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.loginBtnText}>AUTENTICAR ACCESO</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
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
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#070b19',
  },
  glowTop: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(0, 180, 184, 0.08)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -150,
    right: -150,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(0, 122, 124, 0.08)',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  centerWrap: {
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    paddingBottom: 24,
    alignItems: 'center',
    gap: 12,
  },
  logoContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 64,
    height: 64,
    zIndex: 10,
  },
  logoRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 180, 184, 0.25)',
    backgroundColor: 'rgba(10, 22, 47, 0.65)',
    shadowColor: CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTextContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    fontSize: 9,
    fontWeight: '800',
    color: CYAN,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  card: {
    backgroundColor: 'rgba(10, 18, 36, 0.85)',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 184, 0.15)',
    shadowColor: CYAN,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  cardHeaderAccent: {
    width: 40,
    height: 3,
    backgroundColor: 'rgba(0, 180, 184, 0.4)',
    borderRadius: 1.5,
    alignSelf: 'center',
    marginBottom: 20,
  },
  statusIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  statusText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 8,
    color: 'rgba(0, 180, 184, 0.7)',
    fontWeight: '700',
    letterSpacing: 1,
  },
  welcomeSection: {
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
    lineHeight: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.2)',
  },
  errorIconCircle: {
    backgroundColor: '#f43f5e',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#f43f5e',
    fontSize: 10,
    fontWeight: '800',
    flex: 1,
    letterSpacing: 0.5,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1.5,
    marginBottom: 8,
    marginLeft: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(7, 11, 25, 0.75)',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 180, 184, 0.15)',
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    ...Platform.select({
      android: {
        textAlignVertical: 'center',
        paddingVertical: 0,
      },
      ios: {},
    }),
  },
  eyeBtn: {
    padding: 6,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: ORANGE,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 10,
    shadowColor: CYAN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  loginBtnDisabled: {
    backgroundColor: '#1e293b',
    shadowOpacity: 0,
    elevation: 0,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  footerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  footer: {
    color: '#475569',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
