# Sistema de Control de Acceso - Alcaldía de Guanta

Sistema integral de gestión y control de asistencia diseñado para la Portería Central de la Alcaldía de Guanta. Permite la verificación rápida de personal institucional y el registro detallado de visitantes, utilizando una arquitectura moderna de alto rendimiento con soporte para escaneo QR yWebSocket en tiempo real.

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                     VPS / Servidor                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Backend    │  │   Frontend   │  │  SQLite DB   │  │
│  │  FastAPI     │  │  React+Vite  │  │  (local)     │  │
│  │  :8000       │  │  :5173       │  │              │  │
│  └──────┬───────┘  └──────────────┘  └──────────────┘  │
│         │                                                │
└─────────┼────────────────────────────────────────────────┘
          │
    ┌─────┴──────┐
    │  Internet   │
    └─────┬──────┘
          │
  ┌───────┴───────┐
  │ App Móvil     │
  │ (Expo APK)    │
  │ :8000          │
  └───────────────┘
```

- **Backend**: API REST + WebSockets con FastAPI (Python). Base de datos SQLite.
- **Frontend Web**: Dashboard administrativo en React + Vite + Tailwind CSS.
- **App Móvil**: Cliente de verificación y registro en React Native (Expo SDK 54).
- **Comunicación en tiempo real**: WebSocket para actualización instantánea entre dispositivos.

## Características Principales

- **Aplicación Móvil Premium**: App desarrollada en **React Native (Expo SDK 54)** con diseño institucional para dispositivos Android/iOS.
- **Escaneo QR**: Verificación de identidad mediante código QR de la cédula.
- **Inteligencia Horaria**: Lógica de salida automática después de las 5:00 PM para personal administrativo.
- **Seguridad Institucional**: Sistema de roles (Admin/Desarrollador/Portero) y reporte de vulnerabilidades auditado en `QA.md`.
- **Identidad Visual**: Interfaz "Guanta Style" con diseño moderno y estética de alto nivel.
- **Gestión Centralizada**: Dashboard para monitoreo en tiempo real de ingresos y egresos.
- **WebSocket en Tiempo Real**: Las pantallas se actualizan automáticamente cuando otro dispositivo registra un movimiento.
- **Sin Dependencia de Internet Externo**: Funciona completamente en red local o VPS con IP fija.

## Especificaciones Técnicas

| Componente | Tecnología | Versión |
|------------|-----------|---------|
| Backend API | FastAPI (Python) | 0.136.0 |
| Base de Datos | SQLite via SQLAlchemy | 2.0.49 |
| Autenticación | JWT (python-jose) + bcrypt | — |
| Tiempo Real | WebSocket | — |
| Frontend Web | React + Vite + Tailwind CSS | React 18 / Vite 4 |
| App Móvil | React Native (Expo) | SDK 54 |
| Cámara Móvil | expo-camera | ~17.0.10 |
| Iconos | Lucide (web) / Ionicons (móvil) | — |
| Reportes PDF | jsPDF + jsPDF-AutoTable | — |

---

## Guía de Instalación (Desarrollo Local)

### 1. Clonar el Repositorio

```bash
git clone https://github.com/Adrianmbt/asistenciaAlcaldiaGuanta.git
cd asistenciaAlcaldiaGuanta
```

### 2. Configuración del Backend (Python 3.10+)

**Entorno virtual e instalación:**

```bash
python -m venv venv
.\venv\Scripts\activate   # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

**Dependencias principales del Backend:**

| Paquete | Versión | Uso |
|---------|---------|-----|
| fastapi | 0.136.0 | Framework web ASGI |
| uvicorn | 0.44.0 | Servidor ASGI de alto rendimiento |
| sqlalchemy | 2.0.49 | ORM y gestión de base de datos |
| alembic | 1.18.4 | Migraciones de base de datos |
| passlib[bcrypt] | 1.7.4 | Hashing de contraseñas |
| python-jose[cryptography] | 3.5.0 | Manejo de JWT tokens |
| python-multipart | 0.0.26 | Parsing de formularios |
| pydantic[email] | 2.13.2 | Validación de datos y schemas |
| email-validator | 2.3.0 | Validación de correos electrónicos |

**Poblar base de datos con datos de prueba:**

```bash
python seed_test.py
```

> La semilla crea: 4 usuarios del sistema, 4 entes, 12 departamentos, 19 cargos, 20 empleados reales de Guanta y 20 registros de asistencia de prueba.

### 3. Configuración del Frontend (Web)

```bash
cd frontend
npm install
npm run dev
```

**Dependencias principales del Frontend:**

| Paquete | Versión | Uso |
|---------|---------|-----|
| react | 18.2.0 | Biblioteca UI |
| react-dom | 18.2.0 | Renderizado DOM |
| lucide-react | 0.284.0 | Iconografía moderna |
| jspdf | 4.2.1 | Generación de PDFs |
| jspdf-autotable | 5.0.7 | Tablas en PDF |
| sweetalert2 | 11.26.25 | Alertas interactivas |
| tailwindcss | 3.3.3 | Framework CSS utility-first |
| vite | 4.4.9 | Build tool y servidor de desarrollo |

### 4. Configuración de la App Móvil (Expo)

```bash
cd mobile
npm install
npx expo start -c
```

**Dependencias principales del Mobile:**

| Paquete | Versión | Uso |
|---------|---------|-----|
| expo | ~54.0.0 | Framework de desarrollo móvil |
| react-native | 0.81.5 | Framework UI móvil |
| expo-camera | ~17.0.10 | Acceso a cámara (lectura QR) |
| expo-secure-store | ~15.0.8 | Almacenamiento seguro de tokens |
| @react-navigation/native | 6.1.17 | Navegación entre pantallas |
| @react-navigation/bottom-tabs | 6.5.20 | Tabs de navegación inferior |
| @react-navigation/native-stack | 6.9.26 | Navegación en pila |
| @expo/vector-icons | ^15.0.3 | Iconografía Ionicons |

---

## Configuración de IP para la App Móvil (Desarrollo Local)

Para que la app móvil se conecte al backend, debes configurar la IP de tu servidor.

### Paso 1: Obtener la IP de tu PC

```bash
# Windows
ipconfig

# Linux/Mac
ipconfig
```

Busca la IPv4 de tu tarjeta de red (generalmente algo como `192.168.x.x`).

### Paso 2: Actualizar la IP en el cliente móvil

Abre el archivo `mobile/api/client.js` y cambia la `BASE_URL`:

```javascript
// Cambia esta línea con tu IP local
export const BASE_URL = 'http://TU_IP_LOCAL:8000';
```

**Ejemplo:**

```javascript
export const BASE_URL = 'http://192.168.1.105:8000';
```

### Paso 3: Verificar conectividad

1. Inicia el backend: `uvicorn main:app --reload --host 0.0.0.0 --port 8000`
2. Asegúrate de que el celular esté en la **misma red Wi-Fi** que el servidor
3. Abre Expo Go y escanea el QR

> **Nota:** Si usas el emulador Android, usa `10.0.2.2:8000` en lugar de tu IP local. Si usas iOS Simulator, usa `localhost:8000`.

---

## Cómo Ejecutar el Proyecto (Desarrollo)

**Servidor Backend (escuchando en toda la red):**

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend Web:** `http://localhost:5173`

**App Móvil:** Abre la app **Expo Go** en tu celular y escanea el código QR generado por la terminal. Asegúrate de que el celular esté en la misma red Wi-Fi que el servidor.

---

## Despliegue en Producción (VPS)

### Requisitos del Servidor

| Recurso | Mínimo | Recomendado |
|---------|--------|-------------|
| RAM | 512 MB | 1 GB |
| CPU | 1 core | 2 cores |
| Disco | 5 GB | 10 GB |
| SO | Ubuntu 20.04+ / Debian 11+ | Ubuntu 22.04 |
| Python | 3.10+ | 3.11 |
| Node.js | 18.x | 20.x LTS |

### 1. Conectarse a la VPS

```bash
ssh usuario@TU_IP_VPS
```

### 2. Instalar dependencias del sistema

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-pip python3-venv nodejs npm nginx git
```

### 3. Clonar y configurar el backend

```bash
git clone https://github.com/Adrianmbt/asistenciaAlcaldiaGuanta.git
cd asistenciaAlcaldiaGuanta

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn  # Para producción

# Poblar base de datos (primera vez)
python seed_test.py
```

### 4. Iniciar el backend con Gunicorn + Uvicorn

```bash
# Detener cualquier instancia previa
pkill gunicorn

# Iniciar en producción
cd ~/asistenciaAlcaldiaGuanta
source venv/bin/activate
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --daemon
```

Para mantenerlo corriendo incluso al cerrar la sesión SSH, usa **systemd**:

```bash
sudo nano /etc/systemd/system/guanta-backend.service
```

```ini
[Unit]
Description=Sistema Control Acceso Guanta - Backend
After=network.target

[Service]
User=tu_usuario
WorkingDirectory=/home/tu_usuario/asistenciaAlcaldiaGuanta
ExecStart=/home/tu_usuario/asistenciaAlcaldiaGuanta/venv/bin/gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable guanta-backend
sudo systemctl start guanta-backend
sudo systemctl status guanta-backend
```

### 5. Configurar Nginx como proxy inverso (opcional pero recomendado)

```bash
sudo nano /etc/nginx/sites-available/guanta
```

```nginx
server {
    listen 80;
    server_name TU_IP_VPS o tudominio.com;

    # Backend API
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/guanta /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

> ⚠️ La configuración de `proxy_set_header Upgrade` y `Connection "upgrade"` es **obligatoria** para que los WebSocket funcionen correctamente.

### 6. (Opcional) Configurar Frontend Web en la VPS

```bash
cd ~/asistenciaAlcaldiaGuanta/frontend
npm install
npm run build
```

Luego sirve la carpeta `dist/` con Nginx agregando un segundo bloque `server` o sirviéndola desde el mismo dominio en una ruta distinta.

---

## Conexión de la APK Móvil al Backend en la VPS

Una vez que el backend esté corriendo en la VPS, la app móvil necesita apuntar a la IP pública o dominio de la VPS.

### Paso 1: Configurar la URL del backend en la app

Abre `mobile/api/client.js` y cambia `BASE_URL`:

```javascript
// Para producción (VPS)
export const BASE_URL = 'http://TU_IP_VPS:8000';
// O si configuraste Nginx con dominio:
// export const BASE_URL = 'https://tudominio.com';
```

### Paso 2: Generar el APK de producción

```bash
cd mobile
npx expo install --fix

# Generar APK (Android)
npx expo build:android
# O para desarrollo:
npx expo run:android --variant release
```

> Necesitarás una cuenta en **Expo Application Services (EAS)** para builds en la nube, o puedes generar el APK localmente con Android Studio.

**Build local con EAS:**

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile production
```

### Paso 3: Configurar cortafuegos en la VPS

Asegúrate de que el puerto 8000 (o el que uses) esté abierto:

```bash
sudo ufw allow 8000/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp   # Si usas HTTPS
sudo ufw enable
```

### Paso 4: Consideraciones de seguridad para producción

1. **Usa HTTPS** en producción. Configura Let's Encrypt con Certbot para el dominio.
2. **Cambia las contraseñas por defecto** de los usuarios de prueba (admin, porteria1, porteria2).
3. **Revisa `QA.md`** antes de exponer el sistema a redes públicas.
4. **Configura un firewall** para restringir el acceso al puerto 8000 solo a IPs confiables si es posible.
5. **Realiza backups periódicos** de la base de datos (`verificacion.db`).

---

## Estructura del Proyecto

```
asistenciaAlcaldiaGuanta/
├── main.py                 # Punto de entrada FastAPI
├── database.py             # Configuración de SQLAlchemy + SQLite
├── models.py               # Modelos de BD (Empleados, Asistencia, etc.)
├── schemas.py              # Schemas Pydantic para validación
├── seed_test.py            # Semilla de datos de prueba
├── auth.py                 # Lógica de autenticación JWT
├── websocket_manager.py    # Gestor de conexiones WebSocket
├── requirements.txt        # Dependencias Python
├── QA.md                   # Informe de seguridad y auditoría
├── routes/
│   ├── auth_routes.py      # Endpoints de autenticación
│   ├── usuarios.py         # CRUD de usuarios del sistema
│   ├── personal.py         # Gestión de empleados
│   └── asistencia.py       # Control de ingreso/egreso
├── frontend/               # Interfaz web (React/Vite/Tailwind)
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   └── services/       # Llamadas API
│   └── package.json
├── mobile/                 # App móvil (Expo SDK 54)
│   ├── screens/            # Pantallas de la app
│   ├── api/                # Cliente HTTP + WebSocket
│   ├── components/         # Componentes reutilizables
│   ├── context/            # Contexto de autenticación
│   └── package.json
└── dump_empleados.sql      # Backup de la base de datos
```

---

## Credenciales y Datos de Prueba

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `admin` | `admin123` | Administrador |
| `admin_guanta` | `Guanta2026*` | Desarrollador |
| `porteria1` | `Acceso2026` | Portero |
| `porteria2` | `Acceso2026` | Portero |

**Test Biometría**: "Juan Carlos Pérez" (Cédula `V-12345678`) tiene un template de huella precargado para simulación.

---

## Endpoints de la API

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/login` | Autenticación de usuario |
| POST | `/verify` | Verificar cédula (personal o visitante) |
| POST | `/register` | Registrar entrada/salida |
| GET | `/asistencia/hoy` | Registros de asistencia del día |
| GET | `/personal` | Listar empleados |
| GET | `/personal/cargos` | Listar cargos |
| GET | `/personal/departamentos` | Listar departamentos |
| GET | `/personal/entes` | Listar entes |
| GET | `/usuarios` | Listar usuarios del sistema |
| POST | `/usuarios` | Crear usuario |
| PUT | `/usuarios/{id}` | Actualizar usuario |
| DELETE | `/usuarios/{id}` | Desactivar usuario |
| WS | `/ws` | WebSocket para actualizaciones en tiempo real |

---

> **Seguridad**: Consulte el archivo `QA.md` antes de exponer este sistema a redes públicas. Se recomienda configurar un Firewall para el puerto 8000.

*Desarrollado para la Gestión Digital de la Alcaldía de Guanta - 2026.*
