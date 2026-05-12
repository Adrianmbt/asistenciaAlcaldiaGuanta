# 📱 Guía Rápida de Configuración Mobile

## 1. Instalar Dependencias

```bash
cd mobile
npm install
```

## 2. Configurar Backend (si no está corriendo)

En otra terminal, desde la raíz del proyecto:

```bash
uvicorn main:app --reload
```

El backend estará en `http://localhost:8000`

## 3. Configurar BASE_URL en mobile/api/client.js

Edita el archivo `mobile/api/client.js` y ajusta la línea:

```javascript
export const BASE_URL = 'http://10.0.2.2:8000'; // Emulador Android
// O
export const BASE_URL = 'http://localhost:8000'; // Simulador iOS
// O
export const BASE_URL = 'http://192.168.X.X:8000'; // Dispositivo físico (IP de tu máquina)
```

### Para dispositivos físicos:
1. Asegúrate de que tu móvil y computadora estén en la misma red Wi-Fi
2. Busca la IP local de tu computadora:
   - Windows: `ipconfig` (busca IPv4 de tu adaptador Wi-Fi)
   - Mac/Linux: `ifconfig` o `ip addr`
3. Reemplaza `10.0.2.2` con esa IP

## 4. Ejecutar la App

```bash
cd mobile
npm start
```

Escanea el QR con tu móvil (necesitas Expo Go instalado) o usa:
- `a` para Android
- `i` para iOS

## 5. Credenciales de Prueba

- **Admin**: `admin_guanta` / `Guanta2026*`
- **Portero**: `porteria1` / `Acceso2026`
- **Cédula**: `12345678` (Juan Pérez)

## Solución de Problemas

### Error de conexión
- Verifica que el backend esté corriendo: `http://localhost:8000`
- Verifica que `BASE_URL` en `api/client.js` sea correcto
- Si usas dispositivo físico, asegúrate de estar en la misma red Wi-Fi

### Error de CORS
- El backend ya tiene CORS habilitado con `allow_origins=["*"]`
- No deberías tener problemas

### App no carga
- Borra `node_modules` y ejecuta `npm install` de nuevo
- Limpia la caché de Metro: `npx expo start --clear`

---

**Soporte**: sistemas@guanta.gob.ve
