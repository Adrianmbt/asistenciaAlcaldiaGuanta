# 🏛️ Sistema de Control de Acceso - Alcaldía de Guanta

Este es un sistema integral de gestión y control de asistencia diseñado para la Portería Central de la Alcaldía de Guanta. Permite la verificación rápida de personal institucional y el registro detallado de visitantes, utilizando una arquitectura moderna de alto rendimiento y soporte para biometría.

## ✨ Características Principales

- **📱 Aplicación Móvil Premium**: App desarrollada en **React Native (Expo SDK 54)** con diseño institucional para dispositivos Android/iOS.
- **🆔 Validación Biométrica**: Soporte para verificación mediante huella dactilar (Frontend y Mobile).
- **🕰️ Inteligencia Horaria**: Lógica de salida automática después de las 5:00 PM para personal administrativo.
- **🛡️ Seguridad Institucional**: Sistema de roles (Admin/Portero) y reporte de vulnerabilidades auditado en `QA.md`.
- **🎨 Identidad Visual**: Interfaz "Guanta Style" con gradientes modernos, modo oscuro y estética de alto nivel.
- **📊 Gestión Centralizada**: Dashboard para monitoreo en tiempo real de ingresos y egresos.

---

## 🚀 Guía de Instalación (Para desarrollo o despliegue)

### 1. Clonar el Repositorio
```bash
git clone https://github.com/Adrianmbt/asistenciaAlcaldiaGuanta.git
cd asistenciaAlcaldiaGuanta
```

### 2. Configuración del Backend (Python 3.10+)
1.  **Entorno virtual e instalación:**
    ```bash
    python -m venv venv
    .\venv\Scripts\activate
    pip install fastapi uvicorn sqlalchemy alembic passlib[bcrypt] python-jose[cryptography] python-multipart
    ```
2.  **Preparar Base de Datos:**
    ```bash
    # Aplicar esquema actual
    python patch_db.py
    # Cargar usuarios y personal de prueba
    python seed_test.py
    ```

### 3. Configuración del Frontend (Web)
```bash
cd frontend
npm install
npm run dev
```

### 4. Configuración de la App Móvil (Expo)
```bash
cd mobile
npm install
# Para iniciar el servidor de desarrollo
npx expo start -c
```

---

## 🛠️ Cómo Ejecutar el Proyecto

Para que el sistema funcione integralmente en la red local:

**Servidor Backend (Escuchando en toda la red):**
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend Web:** `http://localhost:3000`

**App Móvil:** Abre la app **Expo Go** en tu celular y escanea el código QR generado por la terminal. Asegúrate de que el celular esté en la misma red Wi-Fi que el servidor.

---

## 📂 Estructura del Proyecto

- `/mobile`: Código fuente de la aplicación móvil (Expo SDK 54).
- `/frontend`: Interfaz web para la PC de portería (React/Vite).
- `/routes`: Endpoints de la API (Asistencia, Usuarios, Auth).
- `models.py`: Modelos de base de datos (Soporta Biometría).
- `QA.md`: Informe detallado de seguridad y puntos de mejora.
- `patch_db.py`: Script para actualizar el esquema de la BD sin pérdida de datos.

---

## 🔐 Credenciales y Datos de Prueba
- **Admin**: `admin` / `admin123`
- **Admin Sistemas**: `admin_guanta` / `Guanta2026*`
- **Portero**: `portero` / `portero123`
- **Test Biometría**: "Juan Pérez" (Cédula `12345678`) tiene un template de huella precargado para simulación.

---
> [!WARNING]
> **Seguridad**: Consulte el archivo `QA.md` antes de exponer este sistema a redes públicas. Se recomienda configurar un Firewall para el puerto 8000.

*Desarrollado para la Gestión Digital de la Alcaldía de Guanta - 2026.*