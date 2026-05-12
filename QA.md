# Informe de Aseguramiento de Calidad (QA) y Seguridad
**Proyecto:** Sistema de Control de Acceso - Alcaldía de Guanta  
**Fecha:** 12 de Mayo de 2026  
**Estado:** Evaluación de Modernización

## 1. Análisis de Lógica de Negocio (Punto Crítico)
### 1.1 El "Efecto de Sesión Abierta"
**Hallazgo:** Actualmente, el sistema busca registros filtrando por `hora_entrada >= hoy`. 
- **Escenario:** Un trabajador marca entrada a las 08:00 AM y olvida marcar salida. 
- **Comportamiento Actual:** El registro queda con `hora_salida = NULL`. Al día siguiente, como la búsqueda es solo por "hoy", el sistema crea una entrada nueva correctamente, pero la estadística del día anterior queda viciada (aparece como si nunca hubiera salido).
- **Riesgo:** Inconsistencia de datos y reportes de permanencia erróneos.
- **Recomendación:** Implementar una tarea automática que, al detectar un registro abierto de un día anterior, lo cierre automáticamente antes de permitir uno nuevo, o un script que corra a las 5:00 PM.

## 2. Vulnerabilidades de Seguridad Identificadas
### 2.1 Endpoints de Registro Desprotegidos
**Hallazgo:** Las rutas `/asistencia/registrar` y `/asistencia/verificar` no cuentan con validación de Token JWT en el Backend.
- **Riesgo:** **ALTO**. Cualquier persona conectada a la red Wi-Fi de la institución podría enviar peticiones POST al servidor y registrar entradas/salidas falsas de cualquier empleado si conoce su número de cédula.
- **Recomendación:** Exigir `Depends(get_current_user)` en todas las rutas de modificación de datos.

### 2.2 Enumeración de Personal
**Hallazgo:** El endpoint `/asistencia/verificar/{cedula}` devuelve datos personales (Nombre, Cargo, Ente) a cualquier consultante.
- **Riesgo:** **MEDIO**. Permite a un atacante obtener la lista completa de trabajadores probando números de cédula secuenciales.
- **Recomendación:** Limitar la consulta de verificación a usuarios autenticados.

### 2.3 Exposición de IPs en Cliente Mobile
**Hallazgo:** El archivo `client.js` tiene la IP estática.
- **Riesgo:** **BAJO**. Si la IP del servidor cambia, la app pierde conexión.

## 3. Pruebas de Stress y Robustez
### 3.1 Concurrencia en la Base de Datos
- **Hallazgo:** SQLite puede presentar bloqueos en escrituras simultáneas masivas. 
- **Estado:** Estable para la carga actual en Portería Central.

## 4. Conclusiones
El sistema es funcional y estéticamente premium, pero para un entorno de **Producción Institucional** es imperativo cerrar las brechas de autenticación en la API y corregir la lógica de cierre automático de jornada para garantizar la integridad de las estadísticas.

---
**Firmado:**  
*Antigravity QA System - Advanced Agentic Coding*
