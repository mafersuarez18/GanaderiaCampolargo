# Sistema Campolargo — Gestión Veterinaria Bovina

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

- **El Paraíso**
- **Campo Alegre**
- **Las Peñas**

Reemplaza los registros físicos dispersos con un sistema web moderno que permite a administradores, veterinarios y técnicos de campo consultar y actualizar información en tiempo real desde cualquier dispositivo con navegador.

### Objetivos del sistema

- Centralizar el historial clínico y sanitario de cada animal
- Automatizar la programación de vacunaciones y desparasitaciones
- Dar trazabilidad reproductiva completa (celos, inseminaciones, gestaciones, partos)
- Emitir alertas automáticas ante eventos críticos (vacunas vencidas, partos próximos, días abiertos excedidos, entre otros)
- Ubicar al hato en tiempo real mediante collares GPS, con el sistema ya preparado para recibir datos de dispositivos reales
- Generar reportes en PDF y Excel para auditoría veterinaria y toma de decisiones
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
| PostGIS | 3.6 | Extensión geoespacial habilitada para el módulo de geolocalización |
| JWT (jsonwebtoken) | 9.x | Autenticación con tokens |
| Zod | 3.x | Validación de esquemas |
| PDFKit | 0.15+ | Generación de reportes en PDF |
| ExcelJS | — | Generación de reportes en Excel e importación de reportes GPS (CSV/XLS) |
| Multer | — | Carga de archivos (importación de reportes de dispositivos GPS) |
| bcryptjs | — | Hash de contraseñas |
| Nodemailer | — | Envío de correos electrónicos |
| node-cron | — | Motor de alertas (evaluación periódica de reglas) |

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
| React Leaflet | — | Mapas del módulo de geolocalización |
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

Los módulos más simples (lotes, inseminación) resuelven controlador y servicio directamente en el archivo de rutas, sin separar esas capas; el resto sigue la cadena completa.

---

## Estructura de directorios

```
GanaderiaCampolargo/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          ← Esquema completo de la base de datos
│   │   ├── seed.ts                ← Datos iniciales (fincas, razas, usuarios, dispositivos GPS)
│   │   └── migrations/            ← Historial de migraciones Prisma
│   ├── src/
│   │   ├── compartido/
│   │   │   ├── middlewares/       ← autenticacion.ts, auditoria.ts, manejarErrores.ts
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
│   │   │   ├── roles/
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
│   │   │   ├── layout/             ← BarraLateral, BarraSuperior, LayoutPrincipal, RutaProtegida
│   │   │   └── ui/                 ← Badge, Tabla, Modal, Icono, Paginacion, BuscadorAnimal
│   │   ├── hooks/                  ← useAutenticacion, useDebounce, useOnline
│   │   ├── stores/                 ← autenticacionStore.ts (sesión persistida)
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
│   │   └── principal.tsx / App.tsx
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

Pantalla principal con indicadores clave del hato, calculados por el módulo de analítica (`/api/analytics`):

- Total de animales activos, distribuidos por finca y por raza
- Animales en tratamiento / cuarentena
- Próximos partos (próximos 30 días)
- Alertas activas y críticas sin resolver
- Indicadores reproductivos (tasa de preñez, natalidad, mortalidad de crías, días abiertos promedio)
- Acceso rápido a las secciones más usadas

### 2. Fincas

Gestión de las propiedades ganaderas:

- Listado de fincas con contadores (animales, lotes, hectáreas)
- Panel de detalle: información general (superficie, dirección, coordenadas GPS), lotes de la finca y lista completa de animales con búsqueda y filtros
- Crear, editar y eliminar fincas (solo administrador)
- Validación: no se puede eliminar una finca con animales asociados

### 3. Lotes

Subdivisión de cada finca en agrupaciones de animales (potreros de manejo):

- CRUD de lotes, con nombre único dentro de cada finca
- Filtro por finca y contador de animales por lote
- Validación: no se puede eliminar un lote con animales asignados

### 4. Animales

Gestión del hato bovino completo:

- Tabla paginada con búsqueda y filtros (finca, lote, raza, sexo, estado)
- Ficha detallada de cada animal: datos básicos, genealogía, peso, estado sanitario
- Registro de nuevos animales con validación de número de arete único
- Selector de raza con patrón "buscar o crear": si la raza no existe en el catálogo, se registra ahí mismo desde el formulario
- Edición y seguimiento histórico de cambios de estado
- Enlace directo al historial médico, vacunación y reproducción de cada animal

### 5. Historial Médico

Consultas y registros veterinarios:

- Listado de consultas con búsqueda por animal, fecha o diagnóstico
- Registro completo por consulta: anamnesis, examen físico (temperatura, frecuencia cardíaca/respiratoria, tiempo de llenado capilar, movimientos ruminales, condición corporal), estado reproductivo, diagnóstico y plan
- Enfermedades diagnosticadas y sus tratamientos, cada uno con su propio detalle diagnóstico (diagnóstico, pronóstico, síntomas, pruebas)
- Resultados de pruebas de rutina no ligadas a una enfermedad específica
- Información epidemiológica del entorno (vectores presentes: garrapatas, mosquitos, murciélagos, moscas)
- Desparasitaciones, con selector de medicamento en el mismo patrón "buscar o crear", y auto-sincronización con el calendario de vacunación
- Auto-prefill: al seleccionar un animal en una nueva consulta, se pre-cargan los datos de su última desparasitación y sus enfermedades activas
- Generación de PDF por consulta individual o por historial completo de un animal

### 6. Vacunación y desparasitación

Calendarios y registros de aplicación:

- Calendarios de vacunación con intervalo de reaplicación, edad mínima y sexo al que aplican
- Registro de aplicaciones con fecha, dosis, vía y lote de producto; próxima fecha calculada automáticamente
- Selector de medicamento con patrón "buscar o crear"
- Auto-sincronización: al registrar una desparasitación desde el historial médico, se crea automáticamente el registro correspondiente en el calendario de vacunación
- Indicador de cumplimiento del calendario por lote

### 7. Reproducción

Gestión del ciclo reproductivo:

- Eventos reproductivos: detección de celo, monta natural, inseminación artificial, diagnóstico de gestación, parto, aborto
- Seguimiento de gestaciones activas, con cierre por parto, aborto o pérdida
- Alertas de partos próximos, clasificadas por urgencia (urgente / próximo / futuro) según los días restantes
- Indicadores: tasa de preñez, natalidad, aborto, mortalidad de crías, repetición de celo, intervalo entre partos y efectividad de inseminación artificial por semental

### 8. Inseminación

Laboratorio de inseminación artificial:

- Catálogo de sementales con datos genéticos y de origen
- Inventario de dosis de semen, con descuento automático al registrar una inseminación
- Registro de inseminaciones con clasificación, técnica de deposición y factores biológicos (patologías, balance energético, temperatura uterina, manejo del hato)
- Alertas de inventario de semen bajo

### 9. Geolocalización

Rastreo GPS de animales, listo para operar con collares satelitales reales (p. ej. Digitanimal SAT) además de datos simulados:

- **Dispositivos GPS**: catálogo de collares, su animal asignado, nivel de batería y estado de conexión
- **Mapa en vivo**: posición actual de todos los animales sobre OpenStreetMap, con el área de cada finca delimitada según sus hectáreas registradas
- **Vista por finca**: mapa centrado en una finca, con sus dispositivos y cobertura GPS
- **Historial de movilidad**: distancia recorrida, tiempo de actividad y velocidad promedio de un animal, calculados en el backend a partir de su historial de posiciones
- **Filtros por finca y por lote** en la vista de dispositivos
- **Importación de reportes**: los collares satelitales no envían posiciones directamente a este sistema — reportan a la plataforma del fabricante, desde donde se exporta un archivo (CSV o Excel) que se sube en la ficha del dispositivo; el sistema detecta automáticamente las columnas de fecha, latitud, longitud y velocidad, sin importar el idioma del encabezado ni si usan coma o punto decimal
- También expone un endpoint de ingesta directa (`POST /api/geolocalizacion/dispositivos/:apiKey/ubicacion`) para dispositivos que puedan integrarse en tiempo real

### 10. Alertas

Motor de alertas automáticas con panel de gestión completo:

- Tarjetas de resumen por prioridad (crítica, alta, media, baja), usables como filtros
- Panel de urgentes que resalta las alertas críticas/altas no leídas
- Tipos de alerta: vacuna vencida/próxima, parto próximo, días abiertos excedidos, enfermedad activa sin resolución, intervalo reproductivo prolongado, ausencia de control veterinario, control de peso pendiente, inventario de semen bajo, además de reglas personalizadas de disparo manual
- Evaluación periódica automática (motor basado en `node-cron`) y evaluación manual bajo demanda
- Cada regla puede notificar a usuarios específicos o, por defecto, a administradores y veterinarios; evita duplicar avisos de una misma entidad en 24 horas
- CRUD de reglas: crear, activar/desactivar, editar umbrales y destinatarios
- Filtros por prioridad, tipo de entidad y estado de lectura

### 11. Reportes

Exportación de datos en PDF y Excel:

- Reportes de inventario, estado sanitario, vacunación y reproducción, filtrables por año, finca y estado
- Historial médico completo de un animal, o el detalle de una consulta puntual
- Documentos con encabezado institucional y estilo corporativo consistente

### 12. Seguridad

Gestión de usuarios y acceso:

- CRUD de usuarios del sistema y autoservicio de perfil (cada usuario edita sus propios datos y contraseña)
- Roles con privilegios configurables: el catálogo de privilegios es la fuente de verdad que verifica cada ruta del backend
- Bloqueo temporal de cuenta tras varios intentos fallidos de inicio de sesión
- Tokens JWT de corta duración con renovación automática vía refresh token

### 13. Auditoría

Trazabilidad completa:

- Registro automático de operaciones críticas (crear, actualizar, eliminar, exportar) y de intentos de inicio de sesión
- Datos almacenados: usuario, acción, módulo, entidad afectada, IP, agente de usuario y resultado
- Consulta filtrada por usuario, tipo de acción, módulo o rango de fechas

---

## Base de datos

La base de datos PostgreSQL contiene, entre otras, las siguientes tablas:

| Tabla | Descripción |
|---|---|
| `finca` | Propiedades ganaderas |
| `lote` | Subdivisiones de una finca |
| `potrero` | Subdivisiones de un lote |
| `raza` | Catálogo de razas bovinas |
| `medicamento` | Catálogo de fármacos y vacunas |
| `animal` | Hato bovino completo |
| `registro_medico` | Consultas veterinarias |
| `detalle_diagnostico` | Enfermedades diagnosticadas por consulta, con su propio diagnóstico/pronóstico/pruebas |
| `tratamiento` | Tratamientos prescritos por consulta |
| `informacion_epidemiologica` | Entorno y vectores relevados en una consulta |
| `programa_desparasitacion` | Desparasitaciones registradas |
| `calendario_vacunacion` | Programas de vacunación y desparasitación |
| `registro_vacunacion` | Aplicaciones individuales de vacuna o desparasitante |
| `evento_reproductivo` | Celos, montas, inseminaciones, diagnósticos de gestación, partos |
| `inseminacion_artificial` | Datos específicos de un evento de inseminación |
| `diagnostico_gestacion` | Diagnósticos de gestación asociados a un evento |
| `gestacion` | Gestaciones activas o cerradas |
| `nacimiento` | Partos registrados con datos de la cría |
| `semental` | Toros y material genético disponible |
| `inventario_semen` | Dosis de semen por semental |
| `dispositivo_gps` | Collares GPS asignados a animales |
| `registro_ubicacion` | Posiciones históricas de cada dispositivo |
| `rol` / `privilegio` / `rol_privilegio` | Roles del sistema y sus privilegios asignados |
| `usuario` | Cuentas de acceso al sistema |
| `regla_alerta` / `regla_usuario` | Reglas del motor de alertas y sus destinatarios |
| `notificacion` | Alertas generadas por el motor de reglas |
| `registro_auditoria` | Log de operaciones del sistema |

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

Carga las 3 fincas, razas bovinas, usuarios de prueba, calendarios de vacunación, reglas de alerta y dispositivos GPS de prueba.

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

La API está disponible en `http://localhost:3001/api`.

### Endpoints principales

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/iniciar-sesion` | Iniciar sesión |
| POST | `/auth/renovar-token` | Renovar token JWT |
| GET | `/auth/perfil` | Perfil del usuario autenticado |
| GET | `/fincas` | Listar fincas |
| GET | `/fincas/:id` | Detalle de una finca |
| GET | `/fincas/:id/animales` | Animales de una finca (con filtros) |
| GET | `/lotes?fincaId=` | Listar lotes (opcionalmente por finca) |
| GET | `/animales` | Listar animales (paginado, con filtros) |
| GET | `/animales/:id` | Detalle de un animal |
| GET | `/animales/razas` | Catálogo de razas |
| GET | `/historial-medico` | Listar consultas veterinarias |
| POST | `/historial-medico` | Registrar consulta |
| GET | `/historial-medico/prefill?animalId=` | Pre-cargar datos de última desparasitación y enfermedades activas |
| GET | `/vacunacion/calendarios` | Listar calendarios de vacunación |
| GET | `/vacunacion` | Listar registros de vacunación |
| PATCH | `/vacunacion/:id` | Editar un registro de vacunación |
| DELETE | `/vacunacion/:id` | Eliminar un registro de vacunación |
| GET | `/reproduccion/partos-proximos` | Gestaciones con parto próximo |
| GET | `/reproduccion/gestaciones` | Gestaciones activas |
| PATCH | `/reproduccion/gestaciones/:id/cerrar` | Cerrar una gestación (parto/aborto/pérdida) |
| GET | `/reproduccion/indicadores` | Indicadores reproductivos del período |
| GET | `/inseminacion/sementales` | Catálogo de sementales |
| GET | `/inseminacion/inventario` | Inventario de dosis de semen |
| GET | `/geolocalizacion/dispositivos` | Catálogo de dispositivos GPS |
| GET | `/geolocalizacion/animales?fincaId=&loteId=` | Posiciones actuales de los animales |
| GET | `/geolocalizacion/movilidad/:animalId` | Distancia, tiempo de actividad y velocidad promedio |
| POST | `/geolocalizacion/dispositivos/:id/importar` | Importar reporte de posiciones (CSV/XLS) |
| POST | `/geolocalizacion/dispositivos/:apiKey/ubicacion` | Ingesta de posición en tiempo real desde un dispositivo |
| GET | `/alertas` | Reglas de alerta configuradas |
| GET | `/alertas/resumen` | Resumen de alertas por prioridad del usuario autenticado |
| POST | `/alertas/evaluar` | Disparo manual de evaluación de todas las reglas activas |
| GET | `/notificaciones` | Notificaciones del usuario autenticado |
| GET | `/reportes/historial-animal/:animalId` | PDF con el historial médico de un animal |
| GET | `/reportes/consulta/:consultaId` | PDF con el detalle de una consulta |
| GET | `/analytics/dashboard` | Resumen ejecutivo para el dashboard |
| GET | `/auditoria` | Registros de auditoría |
| GET | `/usuarios` | Listar usuarios (solo admin) |
| GET | `/roles` | Listar roles y sus privilegios (solo admin) |
| GET | `/health` | Estado del servidor (fuera del prefijo `/api`) |

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
| Gestionar dispositivos GPS | ✅ | ✅ | ❌ |
| Crear / eliminar fincas | ✅ | ❌ | ❌ |
| Gestionar usuarios y roles | ✅ | ❌ | ❌ |
| Ver auditoría | ✅ | ❌ | ❌ |
| Descargar reportes | ✅ | ✅ | ✅ |

Cada privilegio individual (p. ej. `animales.crear`, `vacunacion.registrar`) se asigna a un rol desde el módulo de Seguridad; la tabla anterior resume el criterio con el que están configurados los tres roles por defecto, no una restricción fija del código.

---

## Reportes en PDF

El módulo de reportes genera documentos usando PDFKit (PDF) y ExcelJS (Excel):

- **Historial Médico por Animal** (`GET /api/reportes/historial-animal/:animalId`): incluye datos del animal, todas sus consultas con diagnósticos, tratamientos y desparasitaciones, ordenadas cronológicamente.
- **Reporte de Consulta** (`GET /api/reportes/consulta/:consultaId`): detalle completo de una consulta específica, incluyendo examen físico, diagnóstico y plan de tratamiento.
- **Inventario, sanitario, vacunación y reproductivo** (`GET /api/reportes/{inventario|sanitario|vacunacion|reproductivo}`): reportes agregados filtrables por año, finca y estado, disponibles en PDF o Excel según el parámetro `formato`.

Los documentos se envían directamente al navegador con el encabezado `Content-Disposition: attachment` para descarga automática, y cada exportación queda registrada en la auditoría.

---

*Desarrollado por María Fernanda Suárez Delfin — UCAB Ingeniería en Informática — 2026*
