# Plan de Evolución: De Invitación Única a Plataforma Multi-Evento

> **Autor:** Juan (Desarrollador)
> **Fecha:** Febrero 2026
> **Estado:** Borrador - En planificación
> **Versión actual del proyecto:** `virtual-wedding-invitation-v2`

---

## Tabla de Contenidos

1. [Visión General](#1-visión-general)
2. [Estado Actual](#2-estado-actual)
3. [Arquitectura Objetivo](#3-arquitectura-objetivo)
4. [Las Tres Capas del Sistema](#4-las-tres-capas-del-sistema)
5. [Rediseño de Base de Datos](#5-rediseño-de-base-de-datos)
6. [Plan de Features por Capa](#6-plan-de-features-por-capa)
7. [Diseño de la Invitación](#7-diseño-de-la-invitación)
8. [Sistema de Autenticación](#8-sistema-de-autenticación)
9. [Seguridad](#9-seguridad)
10. [Roadmap de Implementación](#10-roadmap-de-implementación)
11. [Stack Técnico](#11-stack-técnico)
12. [Estructura de Carpetas Objetivo](#12-estructura-de-carpetas-objetivo)
13. [Consideraciones de Negocio](#13-consideraciones-de-negocio)
14. [Deuda Técnica Actual a Resolver](#14-deuda-técnica-actual-a-resolver)

---

## 1. Visión General

### De esto...
Una invitación digital hardcodeada para una boda específica (Jimena y Juan), con un panel admin básico y sin autenticación real.

### ...a esto
Una **plataforma multi-tenant de invitaciones digitales** donde:

- **Tú (el desarrollador/creador)** tienes un panel maestro para crear, configurar y gestionar invitaciones para distintos clientes.
- **Cada cliente** (los novios, el organizador del evento) tiene su propio panel privado para manejar sus invitados, ver confirmaciones y analytics, sin poder ver otras invitaciones.
- **Cada invitado** accede a *su* invitación personalizada usando su código único, con RSVP y toda la experiencia actual.

### Principio clave
> Cada invitación es un mundo aparte: su propia URL, sus propios invitados, su propio diseño, sus propios admins. Tú como creador ves y controlas todo.

---

## 2. Estado Actual

### Lo que ya funciona bien (conservar y reusar)
- Componentes de secciones de invitación (`InvitationSection1-9.tsx`) — **base para el sistema de templates**
- Validación de código de invitado (`GuestCodeEntry.tsx`)
- Pantalla de información del invitado (`GuestInfo.tsx`)
- Panel admin del cliente (`GuestManager.tsx`, `AnalyticsDashboard.tsx`)
- Hooks de React Query (`useGuests.ts`) — reusables con multi-tenant
- Servicio de API (`guest-service.ts`)
- Tracking de accesos (`GuestAccess`)
- Schema de DB (base, necesita expansión)

### Lo que hay que migrar/adaptar
| Componente | Problema actual | Solución |
|-----------|----------------|---------|
| Datos hardcodeados (nombre, fecha, lugar) | Solo sirve para 1 boda | Cargar desde DB por `eventId` |
| Fotos estáticas en `/public` | No customizable | Storage por evento (Vercel Blob / S3) |
| `.env` con datos del evento | Deben estar en DB | Modelo `Event` en schema |
| Admin sin auth | Cualquiera puede entrar | JWT + roles |
| 1 sola URL `/` | No distingue entre eventos | Rutas por slug: `/invitacion/[slug]` |

### Lo que hay que construir desde cero
- Panel maestro del desarrollador (tú)
- Sistema de templates de invitación
- Multi-tenancy en DB y API
- Autenticación real (JWT)
- Editor de configuración de eventos
- Sistema de storage para assets por evento

---

## 3. Arquitectura Objetivo

```
┌─────────────────────────────────────────────────────────────────┐
│                      PLATAFORMA                                  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           CAPA 1: PANEL MAESTRO (Solo tú)                │   │
│  │    /master  →  ver/crear/editar todos los eventos        │   │
│  │    Gestión de templates, clientes, configuraciones        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                     │
│              ┌─────────────┼─────────────┐                      │
│              ▼             ▼             ▼                       │
│  ┌─────────────────┐ ┌──────────┐ ┌──────────────────┐         │
│  │   Evento #1     │ │ Evento#2 │ │   Evento #N      │         │
│  │  Jimena & Juan  │ │ Ana&Pedro│ │   ...            │         │
│  └─────────────────┘ └──────────┘ └──────────────────┘         │
│         │                                                        │
│   ┌─────┴─────────────────────────────────┐                     │
│   │      CAPA 2: PANEL CLIENTE            │                     │
│   │  /admin/[slug]  →  solo sus invitados │                     │
│   │  GuestManager, Analytics, RSVP status │                     │
│   └───────────────────────────────────────┘                     │
│         │                                                        │
│   ┌─────┴─────────────────────────────────┐                     │
│   │      CAPA 3: INVITACIÓN PÚBLICA       │                     │
│   │  /[slug]  →  la invitación en sí      │                     │
│   │  GuestCodeEntry → GuestInfo → Secciones│                    │
│   └───────────────────────────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

### Rutas del sistema

```
# Público
/                          → Landing page de la plataforma (o redirect)
/[slug]                    → Invitación del evento (ej: /jimena-juan)
/[slug]/admin              → Panel del cliente para ese evento

# Privado (solo tú)
/master                    → Dashboard maestro
/master/events             → Lista de todos los eventos
/master/events/new         → Crear nuevo evento
/master/events/[id]        → Editar evento
/master/events/[id]/guests → Gestionar invitados del evento
/master/templates          → Gestión de templates de diseño
/master/clients            → Gestión de cuentas de cliente
```

---

## 4. Las Tres Capas del Sistema

### Capa 1 — Master Panel (Desarrollador)

**Quién accede:** Solo tú, con credenciales propias en una ruta diferente.

**Funcionalidades:**
- Ver todos los eventos activos/inactivos en un tablero
- Crear un nuevo evento: nombre de pareja, fecha, lugar, slug, template elegido
- Subir o asignar fotos y assets del evento
- Configurar textos (vows, citas, mensajes)
- Configurar secciones activas (qué secciones mostrar/ocultar)
- Configurar colores y tipografías base del template
- Crear credenciales de cliente (email + password) para el panel admin de ese evento
- Ver analytics globales (cuántos accesos totales, confirmados, etc.)
- Activar/desactivar eventos
- Clonar configuración de un evento a otro

**Vista de un evento en el master panel:**
```
┌─────────────────────────────────────────────────────┐
│ Jimena & Juan   |  /jimena-juan  |  ● Activo        │
│ Fecha: Nov 22, 2025  |  Template: Flores Blancas    │
│ Invitados: 120  |  Confirmados: 87  |  Accesos: 234 │
│ [ Editar ] [ Ver Admin ] [ Ver Invitación ] [Clonar] │
└─────────────────────────────────────────────────────┘
```

---

### Capa 2 — Panel Admin del Cliente

**Quién accede:** El cliente (los novios / el organizador), con sus propias credenciales. Solo puede ver *su* evento.

**Funcionalidades (conservar las actuales + mejoras):**
- ✅ Gestión CRUD de invitados (GuestManager actual)
- ✅ Gestión de acompañantes
- ✅ Ver confirmaciones y estado RSVP
- ✅ Analytics de accesos (quién entró, cuándo)
- ✅ Copiar código de invitado al clipboard
- ✅ Buscar y filtrar invitados
- 🆕 Exportar lista de invitados a CSV/Excel
- 🆕 Enviar recordatorio de confirmación (WhatsApp / Email)
- 🆕 Ver preview de cómo ve un invitado específico la invitación
- 🆕 Cambiar deadline de confirmación
- 🆕 Agregar nota interna a un invitado

**Lo que el cliente NO puede hacer:**
- Cambiar el diseño/template de la invitación
- Ver otros eventos
- Crear otros admins
- Acceder a la gestión de templates o configuración técnica

---

### Capa 3 — La Invitación (Invitado Final)

**Quién accede:** Los invitados, con su código único.

**Flujo actual (conservar):**
1. Llegan a `/[slug]` → GuestCodeEntry
2. Ingresan código → validación → GuestInfo
3. Recorren la invitación sección por sección
4. Confirman asistencia en la sección RSVP
5. Contacto con los novios por WhatsApp

**Mejoras al flujo:**
- 🆕 URL personalizada por invitado (QR code por invitado → `/[slug]?code=AYP001`)
- 🆕 Saltar pantalla de código si viene con el parámetro en URL
- 🆕 Recordatorio de RSVP si ya confirmó (mostrar estado)
- 🆕 Página de "gracias por confirmar" más elaborada

---

## 5. Rediseño de Base de Datos

### Schema actual (simplificado)
```
Guest → Companion
Admin
GuestAccess
```

### Schema objetivo (multi-tenant)

```prisma
// ─────────────────────────────────────────────
// PLATAFORMA
// ─────────────────────────────────────────────

model MasterAdmin {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // bcrypt hash
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@map("master_admins")
}

model Template {
  id          String   @id @default(cuid())
  name        String   // ej: "Flores Blancas", "Minimalista", "Jardín"
  description String?
  thumbnail   String?  // URL imagen preview
  sections    Json     // configuración de secciones disponibles
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  events      Event[]
  @@map("templates")
}

// ─────────────────────────────────────────────
// EVENTOS (cada invitación es un evento)
// ─────────────────────────────────────────────

model Event {
  id          String      @id @default(cuid())
  slug        String      @unique // ej: "jimena-juan" → URL /jimena-juan
  templateId  String
  template    Template    @relation(fields: [templateId], references: [id])

  // Datos del evento
  groomName   String      // Nombre del novio
  brideName   String      // Nombre de la novia
  eventDate   DateTime    // Fecha y hora de la boda
  rsvpDeadline DateTime?  // Fecha límite confirmación
  venueName   String?     // Nombre del lugar
  venueAddress String?
  ceremonyTime String?
  receptionTime String?
  dressCode   String?

  // Configuración de la invitación
  config      Json        // textos custom, colores, secciones activas
  isActive    Boolean     @default(true)

  // Assets
  heroPhotoUrl  String?   // Foto principal
  photo2Url     String?
  audioUrl      String?   // Canción de fondo

  // WhatsApp
  groomPhone  String?
  bridePhone  String?
  groomWAMessage String?
  brideWAMessage String?

  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  // Relaciones
  clientAdmins ClientAdmin[]
  guests       Guest[]
  guestAccesses GuestAccess[]

  @@map("events")
}

// ─────────────────────────────────────────────
// ADMINS DE CLIENTE (por evento)
// ─────────────────────────────────────────────

model ClientAdmin {
  id        String   @id @default(cuid())
  eventId   String
  event     Event    @relation(fields: [eventId], references: [id])
  email     String   @unique
  password  String   // bcrypt hash
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@map("client_admins")
}

// ─────────────────────────────────────────────
// INVITADOS (vinculados a un evento)
// ─────────────────────────────────────────────

model Guest {
  id          String    @id @default(cuid())
  eventId     String    // FK al evento
  event       Event     @relation(fields: [eventId], references: [id])
  code        String    // Código único DENTRO del evento
  name        String
  email       String?
  phone       String?
  maxGuests   Int       @default(1)
  confirmed   Boolean   @default(false)
  confirmedAt DateTime?
  notes       String?   // Notas internas del admin
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  companions  Companion[]

  @@unique([eventId, code]) // código único por evento, no global
  @@map("guests")
}

model Companion {
  id          String    @id @default(cuid())
  guestId     String
  guest       Guest     @relation(fields: [guestId], references: [id], onDelete: Cascade)
  name        String
  confirmed   Boolean   @default(false)
  confirmedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  @@map("companions")
}

// ─────────────────────────────────────────────
// TRACKING
// ─────────────────────────────────────────────

model GuestAccess {
  id          String   @id @default(cuid())
  eventId     String
  event       Event    @relation(fields: [eventId], references: [id])
  guestCode   String
  ipAddress   String?
  userAgent   String?
  accessedAt  DateTime @default(now())
  @@map("guest_accesses")
}
```

### Cambios clave en el schema
1. **`Event`** — modelo central que agrupa todo
2. **`Guest.eventId`** — cada invitado pertenece a un evento
3. **`Guest.code` es único por evento**, no globalmente (permite reusar códigos entre eventos)
4. **`ClientAdmin`** — separado de `MasterAdmin`, vinculado a un evento
5. **`GuestAccess.eventId`** — el tracking también es por evento
6. **`Template`** — modelo para templates de diseño reutilizables
7. **`Event.config`** — JSON flexible para configuración custom sin romper schema

---

## 6. Plan de Features por Capa

### 6.1 Master Panel — Features Detalladas

#### Dashboard de eventos
```
┌─────────────────────────────────────────────────────┐
│ PANEL MAESTRO                          [+ Nuevo]    │
│                                                      │
│ Eventos activos (3)                                  │
│ ┌──────────────────────────────────────────────┐    │
│ │ Jimena & Juan    /jimena-juan   ● Activo      │    │
│ │ Nov 22, 2025   120 inv   87 conf   234 acc   │    │
│ │ [Editar] [Admin] [Invitación] [Analytics]    │    │
│ └──────────────────────────────────────────────┘    │
│ ┌──────────────────────────────────────────────┐    │
│ │ Ana & Pedro      /ana-pedro     ● Activo      │    │
│ │ Ene 15, 2026    85 inv   12 conf   45 acc    │    │
│ │ [Editar] [Admin] [Invitación] [Analytics]    │    │
│ └──────────────────────────────────────────────┘    │
│                                                      │
│ Eventos pasados (1)                                  │
│ ┌──────────────────────────────────────────────┐    │
│ │ Carlos & María   /carlos-maria  ◉ Inactivo   │    │
│ └──────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

#### Crear/Editar evento — Wizard de 4 pasos
```
Paso 1: Datos básicos
  - Nombre pareja (novio / novia)
  - Slug de URL (auto-generado, editable)
  - Fecha y hora de ceremonia
  - Fecha y hora de recepción
  - Lugar (nombre + dirección)
  - Dress code
  - Fecha límite RSVP

Paso 2: Template y diseño
  - Elegir template (galería visual)
  - Colores principales (primario, acento, fondo)
  - Tipografía (serif, sans-serif)
  - Secciones activas (toggle por sección)

Paso 3: Assets y multimedia
  - Foto principal (portrait 9:16)
  - Foto secundaria
  - Canción de fondo (MP3)
  - Fotos adicionales

Paso 4: Configuración de contacto
  - Teléfono novio (WhatsApp)
  - Teléfono novia (WhatsApp)
  - Mensajes de WhatsApp predefinidos
  - Crear credenciales de admin para el cliente
    (email + contraseña temporal)
```

#### Template Manager
```
Templates disponibles:
  [Flores Blancas]  ← Template base (el actual Jimena & Juan)
  [Minimalista]     ← Por crear
  [Jardín Verde]    ← Por crear
  [Moderno Oscuro]  ← Por crear

Por template se configura:
  - Paleta de colores por defecto
  - Tipografías
  - Decoraciones (flores, rasgados, etc.)
  - Qué secciones incluye
  - Preview screenshot
```

---

### 6.2 Panel Admin del Cliente — Features Detalladas

#### Autenticación
- Login con email + contraseña (no más `?super_admin=true`)
- Token JWT almacenado en httpOnly cookie
- Sesión de 7 días, renovable
- Si la sesión expira → redirect al login

#### Dashboard principal
```
┌─────────────────────────────────────────────────────┐
│ Boda de Jimena & Juan   [Vista previa] [Cerrar sesión]│
│                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │   120    │ │    87    │ │    33    │ │  234   │ │
│  │ Invitados│ │Confirmado│ │Pendientes│ │Accesos │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
│                                                      │
│  [GuestManager] [Analytics] [Configuración básica]  │
└─────────────────────────────────────────────────────┘
```

#### Mejoras al GuestManager actual
- Exportar a CSV con un click
- Generar QR por invitado (URL con código prerellenado)
- Enviar recordatorio vía WhatsApp (abrir WA con mensaje prefabricado)
- Marcar invitados como VIP o con necesidades especiales
- Notas internas por invitado
- Vista de "mesa asignada" (futuro)

---

### 6.3 La Invitación Pública — Mejoras

#### URL con código precargado
```
/jimena-juan?code=AYP001
→ Salta pantalla de ingreso de código
→ Va directo a GuestInfo
```

Esto permite generar QR únicos por invitado que se pueden imprimir o enviar por WhatsApp con un solo link.

#### Template dinámico
```typescript
// En lugar de componentes hardcodeados:
<InvitationSection5 /> // tiene los datos quemados

// Pasan a recibir datos del evento:
<InvitationSection5 event={eventData} />
```

Todos los textos, fotos, fechas y teléfonos se cargan desde la BD basándose en el `slug` de la URL.

#### Secciones configurables
El master admin puede activar/desactivar secciones desde el panel:
```
✅ Sección 1: Portada
✅ Sección 2: Foto principal
✅ Sección 3: Nombre novio
✅ Sección 4: Foto secundaria
✅ Sección 5: Detalles y countdown
✅ Sección 6: Lugar y horarios
✅ Sección 7: Itinerario
✅ Sección 8: RSVP y regalos
✅ Sección 9: Contacto WhatsApp
⬜ Sección 10: Galería de fotos  ← futuro
⬜ Sección 11: Mapa              ← futuro
```

---

## 7. Diseño de la Invitación

### Sistema de Templates

Cada template define:
- **Paleta de colores**: Primary, Secondary, Accent, Background, Text
- **Tipografías**: Heading font, Body font
- **Decoraciones**: Los assets visuales (flores, bordes rasgados, etc.)
- **Layout de secciones**: Orden y componentes internos

```typescript
// Ejemplo de configuración de template en DB (JSON)
{
  "colors": {
    "primary": "#8B7355",
    "secondary": "#C4A882",
    "accent": "#F5E6D3",
    "background": "#FFFEF7",
    "text": "#2C2C2C"
  },
  "fonts": {
    "heading": "Playfair Display",
    "body": "Lato"
  },
  "decorations": {
    "cornerFlower": "/templates/flores-blancas/flor-esquina.png",
    "tornEdge": "/templates/flores-blancas/hoja-rasgada.png",
    "divider": "/templates/flores-blancas/flores.png"
  },
  "sections": ["portada", "foto1", "novios", "detalles", "lugar", "itinerario", "rsvp", "contacto"]
}
```

### Customización por Evento (sobre el template)

```typescript
// Configuración del evento (override del template base)
{
  "sections": {
    "portada": {
      "active": true,
      "verse": "Proverbios 18:22",
      "verseText": "El que halla esposa halla el bien..."
    },
    "detalles": {
      "active": true,
      "showAudio": true,
      "showCountdown": true
    },
    "rsvp": {
      "active": true,
      "giftInfo": "Si deseas hacernos un regalo...",
      "showBankInfo": true
    }
  }
}
```

---

## 8. Sistema de Autenticación

### Roles y accesos

```
┌─────────────────┬──────────────────────────────────┐
│ Rol             │ Acceso                           │
├─────────────────┼──────────────────────────────────┤
│ master_admin    │ Todo: /master/**                 │
│                 │ Ver/editar todos los eventos     │
│                 │ Gestionar templates y clientes   │
├─────────────────┼──────────────────────────────────┤
│ client_admin    │ Solo su evento: /[slug]/admin    │
│                 │ GuestManager de su evento        │
│                 │ Analytics de su evento           │
├─────────────────┼──────────────────────────────────┤
│ guest (público) │ Solo /[slug] (su invitación)     │
│                 │ Accede con código de invitación  │
└─────────────────┴──────────────────────────────────┘
```

### Flujo de JWT

```
1. Login (POST /auth/master o /auth/client)
   → Verifica email + password (bcrypt)
   → Genera JWT con { userId, role, eventId? }
   → Guarda token en httpOnly cookie (7 días)

2. Requests autenticadas
   → Middleware lee cookie → verifica JWT
   → Adjunta user al request (req.user)
   → Si inválido/expirado → 401

3. Middleware de roles
   → requireMaster: solo master_admin pasa
   → requireClientAdmin: client_admin de ese evento específico pasa
```

### Endpoints de auth

```
POST /auth/login          → Login genérico (detecta rol por email)
POST /auth/logout         → Borra cookie
GET  /auth/me             → Devuelve usuario actual
POST /auth/change-password → Cambiar contraseña
```

---

## 9. Seguridad

### Problemas actuales a resolver (todos en Fase 0)

| Problema | Solución |
|---------|---------|
| `?super_admin=true` como auth | JWT con roles + cookies httpOnly |
| `/api/admin/*` sin protección | Middleware `requireClientAdmin` |
| `cors()` abierto | Whitelist de dominios permitidos |
| `.env` con credenciales | Variables de Vercel (secretas) |
| Sin rate limiting | `express-rate-limit` en auth endpoints |
| IP logging sin hash | Hashear IPs antes de guardar |
| Password en seed sin hash | Usar `bcrypt.hashSync()` en seed |

### Medidas adicionales nuevas

- **CSRF protection**: Tokens CSRF para formularios
- **Helmet.js**: Headers de seguridad HTTP
- **Input sanitization**: Zod validation en todos los endpoints (ya instalado)
- **Audit log**: Registrar acciones críticas (crear/borrar invitados)
- **Brute force**: Rate limit específico en login (5 intentos / 15 min)

### Variables de entorno por entorno

```bash
# Producción (Vercel Secrets)
DATABASE_URL=...
JWT_SECRET=...             # 64 chars random
MASTER_ADMIN_EMAIL=...
MASTER_ADMIN_PASSWORD=...  # Solo para seed inicial

# Desarrollo (.env.local — NO en git)
DATABASE_URL=postgresql://localhost...
JWT_SECRET=dev-secret-only
```

---

## 10. Roadmap de Implementación

### Fase 0 — Seguridad (1-2 días) 🔴 CRÍTICO
*Antes de cualquier nuevo feature, esto debe estar resuelto*

- [ ] Implementar JWT (instalar `jsonwebtoken`, `cookie-parser`)
- [ ] Crear endpoint `POST /auth/login` que verifica `ClientAdmin`
- [ ] Crear middleware `requireAuth` y `requireMaster`
- [ ] Proteger todos los endpoints `/api/admin/*` con `requireAuth`
- [ ] Reemplazar `?super_admin=true` por verificación de JWT en frontend
- [ ] Configurar CORS con whitelist
- [ ] Agregar `helmet` y `express-rate-limit`
- [ ] Mover credenciales a variables de Vercel
- [ ] Hashear contraseña en `seed.ts`

### Fase 1 — Multi-tenancy en DB (2-3 días)
*El corazón del nuevo sistema*

- [ ] Diseñar y aplicar migración de schema (Event, Template, ClientAdmin, MasterAdmin)
- [ ] Migrar datos actuales de Jimena & Juan a `Event` id específico
- [ ] Actualizar todos los endpoints para filtrar por `eventId`
- [ ] Crear seed con data de ejemplo en el nuevo schema
- [ ] Actualizar `guest-service.ts` para incluir `eventId` en requests

### Fase 2 — Invitación dinámica (3-4 días)
*Hacer que la invitación cargue desde DB*

- [ ] Crear endpoint `GET /api/events/[slug]` → devuelve configuración completa del evento
- [ ] Refactorizar `App.tsx` para leer el slug de la URL
- [ ] Pasar `eventData` como props a todos los `InvitationSection*`
- [ ] Reemplazar todos los textos/fotos hardcodeados por props dinámicas
- [ ] Implementar URL con código: `/[slug]?code=AYP001`
- [ ] Probar con los datos de Jimena & Juan migrados a la nueva arquitectura

### Fase 3 — Panel Admin del Cliente (2-3 días)
*Mejorar el admin actual + agregar auth*

- [ ] Crear página de login para clientes (`/[slug]/admin/login`)
- [ ] Adaptar `GuestManager` y `AnalyticsDashboard` al nuevo `eventId`
- [ ] Agregar exportación a CSV
- [ ] Agregar generación de QR por invitado
- [ ] Agregar notas internas por invitado
- [ ] Mejorar UI del dashboard del cliente

### Fase 4 — Panel Maestro (4-5 días)
*El panel de control del desarrollador*

- [ ] Crear ruta `/master` con auth de MasterAdmin
- [ ] Dashboard: lista de todos los eventos con KPIs
- [ ] Wizard de creación de evento (4 pasos)
- [ ] Formulario de edición de evento
- [ ] Gestión de templates (CRUD básico)
- [ ] Crear credenciales de ClientAdmin desde el master panel
- [ ] Analytics globales (todos los eventos)

### Fase 5 — Sistema de Templates (3-4 días)
*Hacer el diseño configurable*

- [ ] Definir estructura JSON del template
- [ ] Crear sistema de CSS variables por template (colores, tipografías)
- [ ] Adaptar componentes `InvitationSection*` para recibir tema
- [ ] Crear al menos 2 templates: "Flores Blancas" (actual) + "Minimalista"
- [ ] Preview en tiempo real en el master panel

### Fase 6 — Storage de Assets (2-3 días)
*Subir fotos y audio por evento*

- [ ] Integrar Vercel Blob o Cloudinary
- [ ] Endpoint de upload de imágenes (`POST /api/assets/upload`)
- [ ] Interfaz de upload en el master panel
- [ ] Manejo de tamaños y formatos (WebP conversion)
- [ ] Limitar assets por evento

### Fase 7 — Polish y Optimización (2-3 días)
*Calidad de código y performance*

- [ ] Dividir `GuestManager.tsx` en sub-componentes
- [ ] Extraer hook de preload de imágenes (reemplazar repetición)
- [ ] Crear `constants.ts` para magic numbers
- [ ] Agregar Zod validation en todos los endpoints
- [ ] Agregar error boundaries en React
- [ ] Agregar tests básicos (vitest) para lógica crítica
- [ ] Optimizar imágenes (WebP, lazy loading, srcset)
- [ ] Ajustar React Query staleTime (reducir polling agresivo)
- [ ] Arreglar memory leaks en Image preloading

---

## 11. Stack Técnico

### Lo que se mantiene
- Vite + React 19 + TypeScript
- Tailwind CSS + shadcn/ui + Radix UI
- Framer Motion
- React Query
- Express 5
- Prisma 6 + PostgreSQL (Neon)
- Vercel Deploy
- pnpm

### Lo que se agrega
- `jsonwebtoken` — generación/verificación de JWT
- `cookie-parser` — leer httpOnly cookies en Express
- `helmet` — headers de seguridad HTTP
- `express-rate-limit` — rate limiting
- `@vercel/blob` o `cloudinary` — storage de assets
- `qrcode` o `qrcode.react` — generación de QR por invitado
- `papaparse` — exportación a CSV
- `vitest` + `@testing-library/react` — tests unitarios

---

## 12. Estructura de Carpetas Objetivo

```
virtual-wedding-invitation-v2/
├── src/
│   ├── pages/
│   │   ├── InvitationPage.tsx       ← /[slug] (antes App.tsx)
│   │   ├── ClientAdminPage.tsx      ← /[slug]/admin
│   │   ├── MasterDashboard.tsx      ← /master
│   │   ├── MasterEventEditor.tsx    ← /master/events/[id]
│   │   ├── MasterTemplates.tsx      ← /master/templates
│   │   └── LoginPage.tsx            ← /[slug]/admin/login y /master/login
│   ├── components/
│   │   ├── invitation/              ← Secciones de la invitación
│   │   │   ├── InvitationSection1.tsx
│   │   │   ├── ...
│   │   │   └── InvitationSection9.tsx
│   │   ├── admin/                   ← Panel del cliente
│   │   │   ├── GuestManager/
│   │   │   │   ├── GuestManager.tsx
│   │   │   │   ├── GuestTable.tsx
│   │   │   │   ├── GuestForm.tsx
│   │   │   │   └── CompanionList.tsx
│   │   │   └── AnalyticsDashboard.tsx
│   │   ├── master/                  ← Panel maestro (nuevo)
│   │   │   ├── EventList.tsx
│   │   │   ├── EventWizard/
│   │   │   │   ├── Step1BasicInfo.tsx
│   │   │   │   ├── Step2Template.tsx
│   │   │   │   ├── Step3Assets.tsx
│   │   │   │   └── Step4Contact.tsx
│   │   │   ├── TemplateManager.tsx
│   │   │   └── GlobalAnalytics.tsx
│   │   └── ui/                      ← Componentes shadcn (sin cambios)
│   ├── hooks/
│   │   ├── useGuests.ts             ← Actualizar con eventId
│   │   ├── useEvent.ts              ← Nuevo: cargar datos del evento
│   │   ├── useAuth.ts               ← Nuevo: estado de autenticación
│   │   ├── useImagePreload.ts       ← Refactorizado (no repetir)
│   │   └── useLazyImage.ts
│   ├── services/
│   │   ├── guest-service.ts         ← Actualizar con eventId
│   │   ├── event-service.ts         ← Nuevo
│   │   └── auth-service.ts          ← Nuevo
│   ├── context/
│   │   ├── AuthContext.tsx          ← Nuevo: estado global de auth
│   │   └── EventContext.tsx         ← Nuevo: datos del evento actual
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── query-client.ts
│   │   ├── utils.ts
│   │   └── constants.ts             ← Nuevo: magic numbers y constantes
│   └── types/
│       └── index.ts                 ← Expandir con nuevos tipos
├── server/
│   ├── index.js
│   ├── middleware/
│   │   ├── auth.js                  ← Nuevo: requireAuth, requireMaster
│   │   ├── rateLimit.js             ← Nuevo
│   │   └── validate.js              ← Nuevo: Zod validation middleware
│   ├── routes/
│   │   ├── auth.js                  ← Nuevo
│   │   ├── events.js                ← Nuevo: CRUD de eventos (master)
│   │   ├── guests.js                ← Actualizar con eventId
│   │   ├── admin.js                 ← Actualizar con auth
│   │   ├── templates.js             ← Nuevo
│   │   └── assets.js                ← Nuevo: upload de archivos
│   └── api/                         ← Serverless functions Vercel
├── prisma/
│   ├── schema.prisma                ← Reescribir con nuevo schema
│   ├── migrations/
│   └── seed.ts                      ← Actualizar con datos del evento
├── public/
│   └── templates/                   ← Assets por template (no por evento)
│       ├── flores-blancas/
│       └── minimalista/
└── PLAN_PLATAFORMA.md               ← Este archivo
```

---

## 13. Consideraciones de Negocio

### Posibles modelos de trabajo (para futuro)

**Opción A — Servicio freelance por evento**
- Cobras por cada invitación que creas
- Precio fijo o por cantidad de invitados
- El cliente tiene acceso al admin durante el evento

**Opción B — SaaS con planes**
- Plan Básico: hasta 100 invitados, 1 template
- Plan Premium: invitados ilimitados, templates premium, QR codes
- El cliente hace self-service

**Opción C — Híbrido**
- Tú creas y configuras la invitación (servicio)
- El cliente gestiona sus invitados (self-service)
- Cobras por setup + mantenimiento

### Funcionalidades futuras de valor

- **Dominio personalizado**: invitacion.jimenayjuan.com
- **Múltiples idiomas**: inglés, español, portugués
- **Modo offline**: la invitación funciona sin internet (PWA)
- **Notificaciones push**: recordatorio a invitados
- **Mesa asignada**: visualización de distribución de mesas
- **Galería colaborativa**: los invitados suben fotos del evento
- **Libro de firmas digital**: mensajes para los novios
- **Livestream embed**: para invitados remotos
- **Integración con calendario**: "Añadir a Google Calendar"

---

## 14. Deuda Técnica Actual a Resolver

Lista de problemas encontrados en la revisión del código actual, ordenados por impacto:

| # | Problema | Archivos | Impacto | Fase |
|---|---------|---------|---------|------|
| 1 | Sin auth en admin | `server/routes/admin.js`, `App.tsx` | 🔴 Crítico | 0 |
| 2 | CORS abierto | `server/index.js` | 🔴 Crítico | 0 |
| 3 | Fecha mismatch (Nov 15 vs Nov 22) | `Countdown.tsx`, `.env` | 🟠 Alto | 0 |
| 4 | Credenciales en `.env` | `.env` | 🔴 Crítico | 0 |
| 5 | Sin rate limiting | `server/index.js` | 🟠 Alto | 0 |
| 6 | Password sin hash en seed | `prisma/seed.ts` | 🟠 Alto | 0 |
| 7 | `GuestManager.tsx` monolítico | `src/components/admin/GuestManager.tsx` | 🟡 Medio | 7 |
| 8 | Image preload sin cleanup | `InvitationSection3-8.tsx` | 🟡 Medio | 7 |
| 9 | React Query refetch muy agresivo | `useGuests.ts` | 🟡 Medio | 7 |
| 10 | Código repetido de preload | Múltiples secciones | 🟡 Medio | 7 |
| 11 | Sin tests | Todo el proyecto | 🟡 Medio | 7 |
| 12 | Magic numbers sin constantes | Varios | 🟢 Bajo | 7 |
| 13 | Sin error boundaries | `App.tsx` | 🟢 Bajo | 7 |
| 14 | Sin validación Zod en endpoints | `server/routes/*.js` | 🟠 Alto | 0/1 |

---

## Resumen Ejecutivo

| Aspecto | Hoy | Objetivo |
|---------|-----|---------|
| Invitaciones | 1 (hardcodeada) | N (dinámicas) |
| Auth admin | URL param (`?super_admin=true`) | JWT + roles |
| Configuración | Archivos `.env` + código | Panel maestro + DB |
| Clientes | 1 (los novios) | N (por evento) |
| Templates | 1 (Flores Blancas) | N (configurable) |
| Assets | Carpeta `/public` estática | Storage por evento |
| URLs | `/` → 1 invitación | `/[slug]` → N invitaciones |
| Seguridad | Inexistente | JWT, CORS, Rate limiting, Helmet |
| Tests | 0% | Mínimo lógica crítica |

**Tiempo estimado total:** 6-8 semanas de desarrollo enfocado
**Prioridad inmediata:** Fase 0 (seguridad) → Fase 1 (multi-tenancy) → Fase 2 (invitación dinámica)

---

*Este documento es un plan vivo. Se debe actualizar conforme avance la implementación.*
