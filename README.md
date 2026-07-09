# Sistema de Control de Acceso - Alcaldia de Guanta

Sistema integral de gestion y control de asistencia disenado para la Porteria Central de la Alcaldia de Guanta. Permite la verificacion rapida de personal institucional y el registro detallado de visitantes, utilizando una arquitectura moderna de alto rendimiento y soporte para biometria.

## Caracteristicas Principales

- **Aplicacion Movil Premium**: App desarrollada en **React Native (Expo SDK 54)** con diseno institucional para dispositivos Android/iOS.
- **Validacion Biometrica**: Soporte para verificacion mediante huella dactilar (Frontend y Mobile).
- **Inteligencia Horaria**: Logica de salida automatica despues de las 5:00 PM para personal administrativo.
- **Seguridad Institucional**: Sistema de roles (Admin/Portero) y reporte de vulnerabilidades auditado en `QA.md`.
- **Identidad Visual**: Interfaz "Guanta Style" con gradientes modernos, modo oscuro y estetica de alto nivel.
- **Gestion Centralizada**: Dashboard para monitoreo en tiempo real de ingresos y egresos.

---

## Guia de Instalacion

### 1. Clonar el Repositorio
```bash
git clone https://github.com/Adrianmbt/asistenciaAlcaldiaGuanta.git
cd asistenciaAlcaldiaGuanta
```

### 2. Configuracion del Backend (Python 3.10+)

**Entorno virtual e instalacion:**
```bash
python -m venv venv
.\venv\Scripts\activate   # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

**Dependencias principales del Backend:**

| Paquete | Version | Uso |
|---------|---------|-----|
| fastapi | 0.136.0 | Framework web ASGI |
| uvicorn | 0.44.0 | Servidor ASGI de alto rendimiento |
| sqlalchemy | 2.0.49 | ORM y gestion de base de datos |
| alembic | 1.18.4 | Migraciones de base de datos |
| passlib[bcrypt] | 1.7.4 | Hashing de contrasenas |
| python-jose[cryptography] | 3.5.0 | Manejo de JWT tokens |
| python-multipart | 0.0.26 | Parsing de formularios |
| pydantic[email] | 2.13.2 | Validacion de datos y schemas |
| email-validator | 2.3.0 | Validacion de correos electronicos |

**Poblar base de datos con datos de prueba:**
```bash
python seed_test.py
```

> La semilla crea: 4 usuarios del sistema, 4 entes, 12 departamentos, 19 cargos, 20 empleados reales de Guanta y 20 registros de asistencia de prueba.

### 3. Configuracion del Frontend (Web)

```bash
cd frontend
npm install
npm run dev
```

**Dependencias principales del Frontend:**

| Paquete | Version | Uso |
|---------|---------|-----|
| react | 18.2.0 | Bibliologia UI |
| react-dom | 18.2.0 | Renderizado DOM |
| axios | 1.5.1 | Cliente HTTP para peticiones API |
| framer-motion | 10.16.4 | Animaciones y transiciones |
| lucide-react | 0.284.0 | Iconografia moderna |
| jspdf | 4.2.1 | Generacion de PDFs |
| jspdf-autotable | 5.0.7 | Tablas en PDF |
| tailwindcss | 3.3.3 | Framework CSS utility-first |
| vite | 4.4.9 | Build tool y servidor de desarrollo |

### 4. Configuracion de la App Movil (Expo)

```bash
cd mobile
npm install
npx expo start -c
```

**Dependencias principales del Mobile:**

| Paquete | Version | Uso |
|---------|---------|-----|
| expo | ~54.0.0 | Framework de desarrollo movil |
| react-native | 0.81.5 | Framework UI movil |
| expo-camera | ~17.0.10 | Acceso a camara (biometria) |
| expo-secure-store | ~15.0.8 | Almacenamiento seguro de tokens |
| @react-navigation/native | 6.1.17 | Navegacion entre pantallas |
| @react-navigation/bottom-tabs | 6.5.20 | Tabs de navegacion inferior |
| @react-navigation/native-stack | 6.9.26 | Navegacion en pila |

---

## Configuracion de IP para la App Movil

Para que la app movil se conecte al backend, debes configurar la IP de tu servidor.

### Paso 1: Obtener la IP de tu PC

```bash
# Windows
ipconfig

# Linux/Mac
ifconfig
```

Busca la IPv4 de tu tarjeta de red (generalmente algo como `192.168.x.x`).

### Paso 2: Actualizar la IP en el cliente movil

Abre el archivo `mobile/api/client.js` y cambia la `BASE_URL`:

```javascript
// Cambia esta linea con tu IP local
export const BASE_URL = 'http://TU_IP_LOCAL:8000';
```

**Ejemplo:**
```javascript
export const BASE_URL = 'http://192.168.1.105:8000';
```

### Paso 3: Verificar conectividad

1. Inicia el backend: `uvicorn main:app --reload --host 0.0.0.0 --port 8000`
2. Asegurate de que el celular este en la **misma red Wi-Fi** que el servidor
3. Abre Expo Go y escanea el QR

> **Nota:** Si usas el emulador Android, usa `10.0.2.2:8000` en lugar de tu IP local. Si usas iOS Simulator, usa `localhost:8000`.

---

## Como Ejecutar el Proyecto

**Servidor Backend (Escuchando en toda la red):**
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend Web:** `http://localhost:3000`

**App Movil:** Abre la app **Expo Go** en tu celular y escanea el codigo QR generado por la terminal. Asegurate de que el celular este en la misma red Wi-Fi que el servidor.

---

## Estructura del Proyecto

```
asistenciaAlcaldiaGuanta/
├── main.py                 # Punto de entrada FastAPI
├── database.py             # Configuracion de SQLAlchemy + SQLite
├── models.py               # Modelos de BD (Empleados, Asistencia, etc.)
├── schemas.py              # Schemas Pydantic para validacion
├── seed_test.py            # Semilla de datos de prueba
├── requirements.txt        # Dependencias Python
├── QA.md                   # Informe de seguridad y auditoria
├── routes/
│   ├── auth.py             # Endpoints de autenticacion
│   ├── usuarios.py         # CRUD de usuarios del sistema
│   ├── personal.py         # Gestion de empleados
│   └── asistencia.py       # Control de ingreso/egreso
├── frontend/               # Interfaz web (React/Vite/Tailwind)
│   ├── components/
│   ├── services/
│   └── package.json
├── mobile/                 # App movil (Expo SDK 54)
│   ├── screens/
│   ├── api/
│   └── package.json
└── dump_empleados.sql      # Backup de la base de datos
```

---

## Credenciales y Datos de Prueba

| Usuario | Contrasena | Rol |
|---------|------------|-----|
| `admin` | `admin123` | Administrador |
| `admin_guanta` | `Guanta2026*` | Desarrollador |
| `porteria1` | `Acceso2026` | Portero |
| `porteria2` | `Acceso2026` | Portero |

**Test Biometria**: "Juan Carlos Perez" (Cedula `V-12345678`) tiene un template de huella precargado para simulacion.

---

> **Seguridad**: Consulte el archivo `QA.md` antes de exponer este sistema a redes publicas. Se recomienda configurar un Firewall para el puerto 8000.

*Desarrollado para la Gestion Digital de la Alcaldia de Guanta - 2026.*
