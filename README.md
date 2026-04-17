# 🏛️ Sistema de Control de Acceso - Alcaldía de Guanta

Este es un sistema integral de gestión y control de asistencia diseñado para la Portería Central de la Alcaldía de Guanta. Permite la verificación rápida de personal institucional y el registro detallado de visitantes, utilizando una arquitectura moderna de alto rendimiento.

## ✨ Características Principales

- **Identidad Institucional**: Diseño premium alineado con la paleta de colores oficial (Naranja, Dorado, Rosa).
- **Verificación Dual**: Diferenciación automática entre Personal de Nómina y Visitantes Externos.
- **Dashboard en Tiempo Real**: Tabla de gestión dinámica para monitorear ingresos y marcar salidas.
- **Arquitectura Robusta**: Backend en FastAPI con base de datos persistente y migraciones mediante Alembic.
- **Interfaz Reactiva**: Frontend construido con React + Vite, Tailwind CSS y Lucide Icons.

---

## 🚀 Guía de Instalación (Para trabajar desde otro equipo)

Si deseas continuar el desarrollo o instalar el sistema en una nueva máquina, sigue estos pasos:

### 1. Clonar el Repositorio
```bash
git clone https://github.com/Adrianmbt/asistenciaAlcaldiaGuanta.git
cd asistenciaAlcaldiaGuanta
```

### 2. Configuración del Backend (Python 3.10+)
1.  **Crear entorno virtual:**
    ```bash
    python -m venv venv
    ```
2.  **Activar entorno:**
    - Windows: `.\venv\Scripts\activate`
    - Linux/Mac: `source venv/bin/activate`
3.  **Instalar dependencias:**
    ```bash
    pip install -r requirements.txt
    ```
    *(Si no existe requirements.txt, instalar manualmente: fastapi, uvicorn, sqlalchemy, alembic, passlib[bcrypt], python-jose[cryptography], python-multipart)*
4.  **Inicializar Base de Datos:**
    ```bash
    # Ejecutar las migraciones
    alembic upgrade head
    # Cargar datos de prueba (Personal y Usuarios)
    python seed_test.py
    ```

### 3. Configuración del Frontend (Node.js)
1.  **Entrar a la carpeta frontend:**
    ```bash
    cd frontend
    ```
2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

---

## 🛠️ Cómo Ejecutar el Proyecto

Debes tener dos terminales abiertas:

**Terminal 1 (Backend):**
```bash
# Desde la raíz del proyecto
uvicorn main:app --reload
```
*El API estará disponible en `http://localhost:8000`*

**Terminal 2 (Frontend):**
```bash
# Desde la carpeta /frontend
npm run dev
```
*La aplicación estará disponible en `http://localhost:3000`*

---

## 📂 Estructura del Proyecto

- `/routes`: Endpoints de la API (Asistencia, Usuarios, Auth).
- `/migrations`: Historial de cambios en la base de datos (Alembic).
- `/frontend/components`: Componentes modulares de la interfaz (Verificación, Tablas).
- `models.py`: Definición de tablas de la base de datos.
- `schemas.py`: Validaciones de datos Pydantic.
- `seed_test.py`: Script para poblar la base de datos inicial.

---

## 🔐 Credenciales de Prueba (Seed)

- **Administrador**: `admin_guanta` / `Guanta2026*`
- **Operador de Guardia**: `porteria1` / `Acceso2026`
- **Cédula de prueba**: `12345678` (Juan Pérez)

---
*Desarrollado para la Gestión Digital de la Alcaldía de Guanta.*