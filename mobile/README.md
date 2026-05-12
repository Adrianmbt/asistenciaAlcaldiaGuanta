# 🏛️ Sistema de Control de Acceso - Alcaldía de Guanta (Móvil)

Aplicación React Native + Expo para la verificación de acceso y gestión de asistencia en la Portería Central de la Alcaldía de Guanta.

## ✨ Características

- **Verificación de Acceso**: Escaneo de cédula con detección automática de personal/visitante.
- **Registro de Asistencia**: Entrada/salida en tiempo real con confirmación visual.
- **Gestión de Personal**: CRUD completo para trabajadores institucionales.
- **Gestión de Usuarios**: Administra operadores del sistema (solo admin/dev).
- **Sincronización en Tiempo Real**: Conecta con el backend FastAPI.

## 📱 Requisitos

- Node.js 18+
- npm o yarn
- Expo CLI (`npm install -g expo-cli`)
- Cuenta de Expo (opcional para builds en la nube)

## 🚀 Instalación

```bash
cd mobile
npm install
```

## 🛠️ Configuración del Backend

Edita `api/client.js` y ajusta `BASE_URL` según tu entorno:

```javascript
// Para emulador Android
export const BASE_URL = 'http://10.0.2.2:8000';

// Para simulador iOS
export const BASE_URL = 'http://localhost:8000';

// Para dispositivo físico (reemplaza con IP de tu máquina)
export const BASE_URL = 'http://192.168.1.100:8000';
```

Asegúrate de que el backend FastAPI esté corriendo:

```bash
# En otra terminal, desde la raíz del proyecto
uvicorn main:app --reload
```

## ▶️ Ejecución

```bash
cd mobile
npm start
```

Opciones:
- `a` - Android (emulador o dispositivo conectado)
- `i` - iOS (simulador o dispositivo)
- `w` - Web

## 🔐 Credenciales de Prueba

- **Administrador**: `admin_guanta` / `Guanta2026*`
- **Operador de Guardia**: `porteria1` / `Acceso2026`
- **Cédula de prueba**: `12345678` (Juan Pérez)

## 📂 Estructura del Proyecto

```
mobile/
├── App.jsx                    # Navegación principal
├── api/
│   └── client.js              # Cliente API centralizado
├── context/
│   └── AuthContext.jsx        # Gestión de autenticación
├── screens/
│   ├── LoginScreen.jsx        # Pantalla de login
│   ├── VerificacionScreen.jsx # Verificación de cédula
│   ├── AsistenciaScreen.jsx   # Lista de asistencia
│   ├── PersonalScreen.jsx     # Gestión de personal
│   └── UsuariosScreen.jsx     # Gestión de usuarios
└── package.json
```

## 🎨 Diseño

- **Colores institucionales**: Naranja (#F05438), Dorado (#F59E0B)
- **Estilo**: Moderno, limpio, optimizado para móviles
- **Componentes**: React Native nativo + Expo

## 🔧 Build para Producción

### Android (APK/AAB)
```bash
npx expo build:android
```

### iOS (IPA)
```bash
npx expo build:ios
```

### EAS (Expo Application Services)
```bash
npm install -g eas-cli
eas build --platform android
eas build --platform ios
```

## 📝 Notas

- Los datos se guardan en memoria y se sincronizan con el backend.
- Para persistencia local, considera usar `expo-secure-store` para tokens y `AsyncStorage` para caché.
- El modo desarrollo usa `--reload` en el backend para recargar cambios automáticamente.

---

*Desarrollado para la Gestión Digital de la Alcaldía de Guanta.*
