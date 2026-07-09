# Sistema Campolargo — Gestión Veterinaria Bovina

> **Última actualización:** Módulo de Alertas completo + Vista por finca en GPS

> **Trabajo de Grado · Ingeniería en Informática**  
> María Fernanda Suárez Delfin · Universidad Católica Andrés Bello (UCAB) · 2026

Sistema de gestión veterinaria integral para la empresa ganadera **Sucesión Joao Campolargo**, que administra tres fincas ubicadas en el estado Yaracuy, Venezuela. El sistema permite registrar, consultar y analizar toda la información clínica, reproductiva y operacional del hato bovino.

---

## Tabla de contenido

1. [Descripción del proyecto](#descripción-del-proyecto)
2. [Tecnologías utilizadas](#tecnologías-utilizadas)
3. [Arquitectura del sistema](#arquitectura-del-sistema)
4. [Estructura de directorios](#estructura-de-directorios)
5. [Módulos del sistema](#módulos-del-sistema)
6. [Base de datos](#base-de-datos)
7. [Variables de entorno](#variables-de-entorno)
8. [Instalación y puesta en marcha](#instalación-y-puesta-en-marcha)
9. [Credenciales de prueba](#credenciales-de-prueba)
10. [API REST](#api-rest)
11. [Roles y permisos](#roles-y-permisos)
12. [Reportes en PDF](#reportes-en-pdf)

---

## Descripción del proyecto

El **Sistema Campolargo** digitaliza y centraliza la gestión operativa de las tres fincas bovinas de la empresa:

- **La Esperanza**
- **San Antonio**
- **El Palmar**

Reemplaza los registros físicos dispersos con un sistema web moderno que permite a administradores, veterinarios y técnicos de campo consultar y actualizar información en tiempo real desde cualquier dispositivo con navegador.

### Objetivos del sistema

- Centralizar el historial clínico y sanitario de cada animal
- Automatizar la programación de vacunaciones y desparasitaciones
- Dar trazabilidad reproductiva completa (celos, inseminaciones, gestaciones, partos)
- Emitir alertas automáticas ante eventos críticos (vacunas vencidas, partos próximos, días abiertos excedidos)
- Generar reportes PDF para auditoría veterinaria y toma de decisiones
- Llevar un registro de auditoría completo de todas las acciones del sistema

---

## Tecnologías utilizadas

### Backend

| Tecnología | Versión | Uso |
|---|---|---|
| Node.js | 24+ | Entorno de ejecución |
| TypeScript | 5.x | Tipado estático |
| Express | 4.x | Framework HTTP |
| Prisma ORM | 6.x | Acceso a base de datos |
| PostgreSQL | 18 | Base de datos relacional |
| PostGIS | 3.6 | Extensión geoespacial para GPS |
| JWT (jsonwebtoken) | 9.x | Autenticación con tokens |
| Zod | 3.x | Validación de esquemas |
| PDFKit | 0.15+ | Generación de reportes PDF |
| bcryptjs | — | Hash de contraseñas |
| Nodemailer | — | Envío de correos electrónicos |

### Frontend

| Tecnología | Versión | Uso |
|---|---|---|
| React | 18.x | Librería de interfaz |
| TypeScript | 5.x | Tipado estático |
| Vite | 5.x | Bundler y servidor de desarrollo |
| TailwindCSS | 3.x | Estilos utilitarios |
| Framer Motion | 11.x | Animaciones |
| TanStack Query | 5.x | Gestión de estado servidor |
| React Router | 6.x | Enrutamiento SPA |
| Axios | 1.x | Cliente HTTP |
| react-hot-toast | — | Notificaciones toast |
| Material Symbols | — | Iconografía (Google Icons) |

---

## Arquitectura del sistema

```
┌──────────────────────────────────────┐
│           Navegador Web              │
│   React + Vite  (puerto 5173)        │
└──────────────┬───────────────────────┘
               │ HTTP/REST (Axios)
               ▼
┌──────────────────────────────────────┐
│        API REST Express              │
│   Node.js + TypeScript (puerto 3001) │
│   Autenticación JWT                  │
│   Validación Zod                     │
│   Prisma ORM                         │
└──────────────┬───────────────────────┘
               │ Prisma Client
               ▼
┌──────────────────────────────────────┐
│        PostgreSQL 18                 │
│   Base de datos: campolargo          │
│   Extensiones: PostGIS, unaccent,    │
│                pg_trgm               │
└──────────────────────────────────────┘
```

El backend sigue una arquitectura en capas:

```
Rutas (Router)
  └─► Middleware de autenticación / auditoría
       └─► Controlador (validación Zod)
            └─► Servicio (lógica de negocio)
                 └─► Repositorio (consultas Prisma)
                      └─► Base de datos
```

---

## Estructura de directorios

```
Tesis/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          ← Esquema completo de la base de datos
│   │   ├── seed.ts                ← Datos iniciales (fincas, razas, usuarios)
│   │   └── migrations/            ← Historial de migraciones Prisma
│   ├── src/
│   │   ├── compartido/
│   │   │   ├── middlewares/       ← autenticacion.ts, auditoria.ts, errores.ts
│   │   │   ├── prisma/            ← clientePrisma.ts (singleton)
│   │   │   ├── tipos/             ← respuesta.ts (clases de error)
│   │   │   └── utilidades/        ← paginacion.ts, respuestaHttp.ts
│   │   ├── modulos/
│   │   │   ├── alertas/
│   │   │   ├── analytics/
│   │   │   ├── animales/
│   │   │   ├── auditoria/
│   │   │   ├── autenticacion/
│   │   │   ├── fincas/
│   │   │   ├── geolocalizacion/
│   │   │   ├── historialMedico/
│   │   │   ├── inseminacion/
│   │   │   ├── lotes/
│   │   │   ├── notificaciones/
│   │   │   ├── reportes/
│   │   │   ├── reproduccion/
│   │   │   ├── usuarios/
│   │   │   └── vacunacion/
│   │   └── app.ts / servidor.ts   ← Punto de entrada Express
│   ├── .env                       ← Variables de entorno (NO subir a Git)
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── componentes/
│   │   │   └── ui/                ← Badge, Tabla, Modal, Icono, Paginacion, BuscadorAnimal
│   │   ├── hooks/                 ← useAutenticacion, useDebounce
│   │   ├── paginas/
│   │   │   ├── alertas/
│   │   │   ├── animales/
│   │   │   ├── auditoria/
│   │   │   ├── autenticacion/
│   │   │   ├── dashboard/
│   │   │   ├── fincas/
│   │   │   ├── geolocalizacion/
│   │   │   ├── historialMedico/
│   │   │   ├── inseminacion/
│   │   │   ├── lotes/
│   │   │   ├── reportes/
│   │   │   ├── reproduccion/
│   │   │   ├── seguridad/
│   │   │   └── vacunacion/
│   │   ├── servicios/
│   │   │   └── clienteAxios.ts    ← Cliente HTTP con interceptores JWT
│   │   └── main.tsx / App.tsx
│   ├── .env                       ← Variables de entorno frontend (NO subir a Git)
│   ├── package.json
│   ├── tailwind.config.ts
│   └── vite.config.ts
│
├── .env.ejemplo                   ← Plantilla de variables de entorno
├── COMO_CORRER_EL_SISTEMA.txt     ← Guía de instalación y arranque
└── README.md                      ← Este archivo
```

---

## Módulos del sistema

### 1. Dashboard

Pantalla principal con indicadores clave del hato:

- Total de animales activos, distribuidos por finca
- Animales en tratamiento / cuarentena
- Próximos partos (próximos 30 días)
- Alertas activas sin resolver
- Acceso rápido a las secciones más usadas

### 2. Fincas

Gestión de las propiedades ganaderas:

- Listado de fincas con contadores (animales, lotes, potreros, hectáreas)
- **Panel de detalle lateral**: al hacer clic en una finca se despliega un panel que muestra:
  - Información general (superficie, dirección, coordenadas GPS, fecha de registro)
  - Lotes de la finca como filtros interactivos
  - Lista completa de animales con búsqueda, filtro por lote y filtro por estado
  - Cada animal es clickeable y redirige a su ficha completa
- Crear, editar y eliminar fincas (solo administrador)
- Validación: no se puede eliminar una finca con animales asociados

### 3. Animales

Gestión del hato bovino completo:

- Tabla paginada con búsqueda y filtros (finca, raza, sexo, estado)
- Ficha detallada de cada animal: datos básicos, genealogía, peso, estado sanitario
- Registro de nuevos animales con validación de número de arete único
- Edición y seguimiento histórico de cambios de estado
- Enlace directo al historial médico y vacunaciones de cada animal

### 4. Historial Médico

Consultas y registros veterinarios:

- Listado de consultas con búsqueda por animal, fecha o diagnóstico
- **Panel de detalle completo** con todos los campos clínicos:
  - Anamnesis e historia del caso
  - Examen físico: temperatura, frecuencia cardíaca/respiratoria, tiempo llenado capilar, mucosas, condición corporal
  - Estado reproductivo al momento de la consulta
  - Diagnóstico presuntivo y definitivo
  - Plan diagnóstico, observaciones de pruebas oficiales
  - Información epidemiológica
  - Ayudas diagnósticas (hemograma, ecografía, etc.)
  - Enfermedades diagnosticadas y tratamientos
  - Desparasitaciones (con auto-sincronización al módulo de vacunación)
  - Observaciones generales
- **Auto-prefill de desparasitación**: al seleccionar un animal en una nueva consulta, se pre-cargan los datos de su última desparasitación registrada
- Generación de PDF por consulta individual o por historial completo de un animal

### 5. Vacunación

Calendarios y registros de vacunación:

- Calendarios de vacunación con protocolos y medicamentos asociados
- Registro de aplicaciones con fecha, dosis, vía, lote de vacuna
- Panel lateral de detalle al seleccionar un registro
- Edición y eliminación de registros (con confirmación)
- **Auto-sincronización**: cuando se guarda una desparasitación en el historial médico, el sistema crea automáticamente un registro en el primer calendario cuyo nombre contenga "desparasit"
- Indicadores por cantidad de dosis aplicadas y próxima aplicación

### 6. Reproducción

Gestión del ciclo reproductivo:

- Eventos reproductivos: detección de celo, monta natural, diagnóstico de gestación, parto, aborto, destete
- Seguimiento de gestaciones activas
- Alertas de partos próximos (próximos 30 días)
- Registro de crías nacidas con vinculación genealógica automática

### 7. Inseminación

Laboratorio de inseminación artificial:

- Catálogo de sementales con datos genéticos y de performance
- Registro de inseminaciones (clasificación IA, técnica de deposición, operador)
- Seguimiento del inventario de pajillas de semen
- Alertas de inventario bajo

### 8. Mapa GPS

Rastreo de dispositivos y animales:

- **Pestaña "Dispositivos GPS"**: lista de todos los trackers con estado, animal asignado y última conexión
- **Pestaña "Mapa en vivo"**: vista global con todos los animales posicionados sobre OpenStreetMap
- **Pestaña "Vista por finca"** *(nueva)*:
  - Selector de finca (La Esperanza, San Antonio, El Palmar)
  - Mapa centrado y escalado automáticamente a la finca seleccionada
  - Círculo delimitador de la finca con su color característico
  - Solo los marcadores de animales de esa finca
  - Indicador de cobertura GPS (% animales con dispositivo)
  - Lista detallada de dispositivos de la finca con enlace a historial de movilidad
- **Pestaña "Historial movilidad"**: trayectoria de un animal con estadísticas (distancia, velocidad, duración)
- Todos los datos son simulados hasta instalar los dispositivos IoT reales en campo

### 9. Alertas

Motor de alertas automáticas con panel de gestión completo:

- **Tarjetas de resumen** por prioridad (crítica, alta, media, baja) clickeables como filtros
- **Panel de urgentes**: resalta las alertas críticas/altas no leídas en la parte superior
- **Tipos de alerta implementados:**
  - `VACUNA_VENCIDA` / `VACUNA_PROXIMA` — evaluadas cada 12 h, umbral configurable
  - `PARTO_PROXIMO` — evaluado cada 6 h, genera alerta crítica cuando faltan ≤ 3 días
  - `DESPARASITACION` — calcula próxima fecha (90 días desde la última) y alerta 15 días antes
  - `ENFERMEDAD_ACTIVA_SIN_RESOLUCION` — alerta si la enfermedad sigue activa pasado el umbral (def. 14 días)
  - `DIAS_ABIERTOS_EXCEDIDOS` — vacas sin nueva gestación tras el parto (def. 90 días)
  - `INTERVALO_REPRODUCTIVO_PROLONGADO` — intervalo entre partos mayor al umbral (def. 365 días)
  - `AUSENCIA_CONTROL_VETERINARIO` — animales sin consulta veterinaria en N días (def. 60)
  - `CONTROL_PESO_PENDIENTE` — animales sin peso registrado pasado el umbral (def. 30 días)
  - `INVENTARIO_SEMEN_BAJO` — stock de pajillas por debajo del umbral
- **Anti-duplicados**: no genera más de una notificación por entidad en 24 h
- **Evaluación manual**: botón "Evaluar ahora" disponible para admin/veterinario
- **Pestaña de reglas**: CRUD completo de reglas, activar/desactivar, ver fecha de última evaluación
- **Filtros**: por prioridad, por tipo de entidad, solo no leídas
- Prioridades: BAJA, MEDIA, ALTA, CRÍTICA

### 10. Reportes

Exportación de datos:

- **Reporte de Historial Médico por Animal**: PDF con todas las consultas, diagnósticos y tratamientos de un animal
- **Reporte de Consulta Individual**: PDF con el detalle completo de una consulta específica
- Generados con PDFKit, con encabezado institucional y datos de la empresa

### 11. Seguridad

Gestión de usuarios y acceso:

- CRUD de usuarios del sistema
- Asignación de roles: ADMINISTRADOR, VETERINARIO, TÉCNICO
- Cambio de contraseña con validación de contraseña actual
- Activación/desactivación de cuentas
- Tokens JWT con expiración configurable y refresh token

### 12. Auditoría

Trazabilidad completa:

- Registro automático de todas las operaciones críticas (crear, actualizar, eliminar, exportar)
- Datos almacenados: usuario, acción, entidad, ID del registro, IP, timestamp
- Consulta filtrada por usuario, módulo o rango de fechas

---

## Base de datos

La base de datos PostgreSQL contiene las siguientes tablas principales:

| Tabla | Descripción |
|---|---|
| `fincas` | Propiedades ganaderas |
| `lotes` | Subdivisiones de una finca |
| `potreros` | Subdivisiones de un lote |
| `razas` | Catálogo de razas bovinas |
| `medicamentos` | Catálogo de fármacos y vacunas |
| `animales` | Hato bovino completo |
| `historiales_medicos` | Consultas veterinarias |
| `tratamientos` | Tratamientos prescritos por consulta |
| `enfermedades_diagnosticadas` | Diagnósticos registrados en consulta |
| `programas_desparasitacion` | Desparasitaciones registradas |
| `calendarios_vacunacion` | Programas de vacunación |
| `registros_vacunacion` | Aplicaciones individuales de vacuna |
| `eventos_reproductivos` | Celos, montas, diagnósticos de gestación, partos |
| `gestaciones` | Gestaciones activas o cerradas |
| `partos` | Partos registrados con datos de la cría |
| `sementales` | Toros y material genético disponible |
| `inseminaciones` | Registros de IA por animal |
| `dispositivos_gps` | Rastreadores GPS instalados en animales |
| `alertas` | Reglas de alerta configuradas |
| `notificaciones` | Alertas generadas por el motor de reglas |
| `usuarios` | Cuentas de acceso al sistema |
| `registros_auditoria` | Log de operaciones del sistema |

---

## Variables de entorno

El sistema requiere dos archivos `.env`: uno para el backend y otro para el frontend. Existe una plantilla en `.env.ejemplo` con todos los valores documentados.

### `backend/.env`

```env
# Conexión a la base de datos (URL completa para Prisma)
DATABASE_URL="postgresql://USUARIO:CONTRASEÑA@localhost:5432/campolargo"

# Puerto del servidor Express
BACKEND_PUERTO=3001

# Clave secreta JWT (mínimo 32 caracteres, completamente aleatoria)
JWT_SECRETO=reemplazar_por_clave_aleatoria_segura_minimo_32_chars

# Clave para el refresh token (diferente a la anterior)
JWT_SECRETO_REFRESH=reemplazar_por_otra_clave_aleatoria_diferente_32_chars

# Tiempo de expiración del token de acceso
JWT_EXPIRACION=15m

# Tiempo de expiración del refresh token
JWT_EXPIRACION_REFRESH=7d

# Configuración de correo (opcional, para notificaciones por email)
EMAIL_SERVIDOR=smtp.gmail.com
EMAIL_PUERTO=587
EMAIL_USUARIO=tu_correo@gmail.com
EMAIL_CLAVE=clave_de_aplicacion_de_gmail
EMAIL_REMITENTE=noreply@campolargo.com

# Entorno de ejecución
NODE_ENV=development
```

> **Cómo generar claves JWT seguras** (ejecutar en terminal):
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### `frontend/.env`

```env
# URL base de la API del backend
VITE_API_URL=http://localhost:3001/api
```

> Las variables del frontend DEBEN comenzar con `VITE_` para que Vite las exponga al código del navegador.

### Reglas importantes

- **Nunca subir los archivos `.env` al repositorio Git.** Están incluidos en `.gitignore`.
- Para un nuevo despliegue, copiar `.env.ejemplo` como punto de partida y rellenar los valores reales.
- En producción, `JWT_SECRETO` y `JWT_SECRETO_REFRESH` deben ser valores completamente distintos y aleatorios.
- La variable `DATABASE_URL` sigue el formato: `postgresql://usuario:contraseña@host:puerto/nombre_base_datos`

---

## Instalación y puesta en marcha

### Requisitos previos

- Node.js v24 o superior (`node --version`)
- PostgreSQL corriendo localmente en el puerto 5432
- Base de datos `campolargo` creada:
  ```sql
  CREATE DATABASE campolargo;
  ```

### Paso 1 — Crear los archivos `.env`

**Backend** — crear `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:30015773@localhost:5432/campolargo"
BACKEND_PUERTO=3001
JWT_SECRETO=clave_secreta_minimo_32_caracteres_cambiar_esto
JWT_SECRETO_REFRESH=otra_clave_diferente_minimo_32_caracteres
JWT_EXPIRACION=15m
JWT_EXPIRACION_REFRESH=7d
NODE_ENV=development
```

**Frontend** — crear `frontend/.env`:
```env
VITE_API_URL=http://localhost:3001/api
```

### Paso 2 — Instalar dependencias

```powershell
# Raíz del proyecto
npm install --legacy-peer-deps

# Backend
cd backend
npx prisma generate

# Frontend
cd ..\frontend
npm install --legacy-peer-deps
```

### Paso 3 — Crear tablas en la base de datos

```powershell
cd backend
npx prisma migrate dev --name inicio
```

### Paso 4 — Cargar datos iniciales

```powershell
npm run db:seed
```

Carga las 3 fincas, razas bovinas, usuarios de prueba, calendarios de vacunación y reglas de alerta.

### Paso 5 — Iniciar el sistema

En una terminal para el **backend**:
```powershell
cd backend
npm run dev
# → Servidor iniciado en el puerto 3001
```

En otra terminal para el **frontend**:
```powershell
cd frontend
npm run dev
# → Local: http://localhost:5173
```

### Paso 6 — Abrir en el navegador

```
http://localhost:5173
```

---

## Credenciales de prueba

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@campolargo.com | Campolargo2026! |
| Veterinario | veterinario@campolargo.com | Campolargo2026! |
| Técnico | tecnico@campolargo.com | Campolargo2026! |

---

## API REST

La API está disponible en `http://localhost:3001/api/v1`.

### Endpoints principales

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/autenticacion/login` | Iniciar sesión |
| POST | `/autenticacion/refresh` | Renovar token JWT |
| GET | `/fincas` | Listar fincas |
| GET | `/fincas/:id` | Detalle de una finca |
| GET | `/fincas/:id/animales` | Animales de una finca (con filtros) |
| GET | `/alertas/resumen` | Resumen de alertas por prioridad del usuario autenticado |
| POST | `/alertas/evaluar` | Dispara evaluación inmediata de todas las reglas activas |
| DELETE | `/alertas/:id` | Eliminar una regla de alerta |
| GET | `/animales` | Listar animales (paginado, con filtros) |
| GET | `/animales/:id` | Detalle de un animal |
| GET | `/animales/razas` | Catálogo de razas |
| GET | `/historial-medico` | Listar consultas veterinarias |
| POST | `/historial-medico` | Registrar consulta |
| GET | `/historial-medico/prefill` | Pre-cargar datos de última desparasitación |
| GET | `/vacunacion/calendarios` | Listar calendarios |
| GET | `/vacunacion/registros` | Listar registros de vacunación |
| PATCH | `/vacunacion/:id` | Editar un registro de vacunación |
| DELETE | `/vacunacion/:id` | Eliminar un registro de vacunación |
| GET | `/reproduccion/eventos` | Eventos reproductivos |
| GET | `/reportes/historial-animal/:id` | PDF historial médico de un animal |
| GET | `/reportes/consulta/:id` | PDF de una consulta |
| GET | `/alertas/reglas` | Reglas de alerta configuradas |
| GET | `/notificaciones` | Notificaciones del usuario autenticado |
| GET | `/auditoria` | Registros de auditoría |
| GET | `/usuarios` | Listar usuarios (solo admin) |
| GET | `/health` | Estado del servidor |

### Formato de respuesta

Todas las respuestas siguen la misma estructura:

```json
{
  "exito": true,
  "datos": { ... },
  "mensaje": "Operación exitosa"
}
```

Los errores devuelven:

```json
{
  "exito": false,
  "mensaje": "Descripción del error",
  "errores": [{ "campo": "nombre", "mensaje": "El campo es requerido" }]
}
```

---

## Roles y permisos

| Acción | Administrador | Veterinario | Técnico |
|---|---|---|---|
| Ver fincas, animales, historial | ✅ | ✅ | ✅ |
| Crear / editar animales | ✅ | ✅ | ❌ |
| Registrar consultas médicas | ✅ | ✅ | ❌ |
| Editar / eliminar vacunaciones | ✅ | ✅ | ❌ |
| Registrar eventos reproductivos | ✅ | ✅ | ❌ |
| Crear / eliminar fincas | ✅ | ❌ | ❌ |
| Gestionar usuarios | ✅ | ❌ | ❌ |
| Ver auditoría | ✅ | ❌ | ❌ |
| Descargar reportes PDF | ✅ | ✅ | ✅ |

---

## Reportes en PDF

El módulo de reportes genera documentos PDF usando PDFKit:

- **Historial Médico por Animal** (`GET /api/v1/reportes/historial-animal/:animalId`): incluye datos del animal, todas sus consultas con diagnósticos, tratamientos y desparasitaciones, ordenadas cronológicamente.
- **Reporte de Consulta** (`GET /api/v1/reportes/consulta/:consultaId`): detalle completo de una consulta específica, incluyendo examen físico, diagnóstico y plan de tratamiento.

Los PDF se envían directamente al navegador con el encabezado `Content-Disposition: attachment` para descarga automática.

---

*Desarrollado por María Fernanda Suárez Delfin — UCAB Ingeniería en Informática — 2026*
