import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { AuthProvider, useAuth } from './context/AuthContext';
import LoginScreen from './screens/LoginScreen';
import VerificacionScreen from './screens/VerificacionScreen';
import AsistenciaScreen from './screens/AsistenciaScreen';
import PersonalScreen from './screens/PersonalScreen';
import UsuariosScreen from './screens/UsuariosScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

  
const ORANGE = '#009fa1';
const ORANGE_LIGHT = 'rgba(0,159,161,0.08)';

function MainTabs() {
  const { user, logout } = useAuth();
  const isAdmin = user?.rol === 'admin' || user?.rol === 'dev';
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: 'rgba(255,247,237,0.7)' },
        headerTitleStyle: { 
          fontWeight: '900', 
          color: '#111', 
          fontSize: 18,
          letterSpacing: -0.5,
        },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderTopColor: 'rgba(255,255,255,0.6)',
          borderTopWidth: 1,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
          height: 65 + Math.max(insets.bottom, 8),
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
        },
        tabBarActiveTintColor: ORANGE,
        tabBarInactiveTintColor: '#9ca3af',
        tabBarLabelStyle: { 
          fontSize: isTablet ? 12 : 10, 
          fontWeight: '900', 
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Verificación: focused ? 'shield-checkmark' : 'shield-checkmark-outline',
            Asistencia: focused ? 'list' : 'list-outline',
            Personal: focused ? 'people' : 'people-outline',
            Usuarios: focused ? 'shield' : 'shield-outline',
          };
          return (
            <View style={{ 
              backgroundColor: focused ? ORANGE_LIGHT : 'transparent',
              paddingHorizontal: 16,
              paddingVertical: 4,
              borderRadius: 14,
            }}>
              <Ionicons name={icons[route.name] || 'ellipse'} size={22} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="Verificación"
        component={VerificacionScreen}
        options={{
          title: 'VERIFICACIÓN',
          headerTitle: () => (
            <View style={headerStyles.titleContainer}>
              <View style={headerStyles.iconCircle}>
                <Ionicons name="shield-checkmark" size={18} color={ORANGE} />
              </View>
              <Text style={headerStyles.title}>Control de Acceso</Text>
            </View>
          ),
          headerRight: () => (
            <View style={headerStyles.userBadge}>
              <Text style={headerStyles.userText}>{user?.nombre?.split(' ')[0]}</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Asistencia"
        component={AsistenciaScreen}
        options={{
          title: 'MOVIMIENTOS',
          headerTitle: () => (
            <View style={headerStyles.titleContainer}>
              <View style={headerStyles.iconCircle}>
                <Ionicons name="swap-horizontal" size={18} color={ORANGE} />
              </View>
              <Text style={headerStyles.title}>Registro del Día</Text>
            </View>
          ),
        }}
      />
      {isAdmin && (
        <Tab.Screen
          name="Personal"
          component={PersonalScreen}
          options={{
            title: 'PERSONAL',
            headerTitle: () => (
              <View style={headerStyles.titleContainer}>
                <View style={headerStyles.iconCircle}>
                  <Ionicons name="people" size={18} color={ORANGE} />
                </View>
                <Text style={headerStyles.title}>Gestión de Personal</Text>
              </View>
            ),
          }}
        />
      )}
      {isAdmin && (
        <Tab.Screen
          name="Usuarios"
          component={UsuariosScreen}
          options={{
            title: 'SEGURIDAD',
            headerTitle: () => (
              <View style={headerStyles.titleContainer}>
                <View style={headerStyles.iconCircle}>
                  <Ionicons name="shield-half" size={18} color={ORANGE} />
                </View>
                <Text style={headerStyles.title}>Configuración</Text>
              </View>
            ),
            headerRight: () => (
              <TouchableOpacity 
                style={headerStyles.logoutBtnContainer}
                onPress={logout}
              >
                <Ionicons name="log-out-outline" size={20} color="#f43f5e" />
              </TouchableOpacity>
            ),
          }}
        />
      )}
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.splash}>
        <Ionicons name="shield-checkmark" size={56} color={ORANGE} />
        <ActivityIndicator color={ORANGE} style={{ marginTop: 24 }} />
        <Text style={styles.splashText}>ALCALDÍA DE GUANTA</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const headerStyles = StyleSheet.create({
  titleContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconCircle: {
    backgroundColor: ORANGE_LIGHT,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,159,161,0.15)',
  },
  title: { fontSize: 18, fontWeight: '900', color: '#111', letterSpacing: -0.5 },
  userBadge: {
    backgroundColor: ORANGE_LIGHT,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,159,161,0.15)',
  },
  userText: { fontSize: 11, fontWeight: '900', color: ORANGE, textTransform: 'uppercase' },
  logoutBtnContainer: {
    backgroundColor: 'rgba(244,63,94,0.08)',
    padding: 10,
    borderRadius: 12,
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(244,63,94,0.15)',
  },
});

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  splashText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#d1d5db',
    letterSpacing: 3,
    marginTop: 12,
  },
});
