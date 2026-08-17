# Fase C — Multi-Ocasión (Diseño e Implementación)
> Ago 2026 · Convierte la plataforma de "solo bodas" a "cualquier ocasión"
> Estado: **fundación implementada · migración de DB pendiente de aprobación**

---

## 1. Objetivo

Que el mismo sistema sirva para **boda, XV años, bautizo, primera comunión, cumpleaños y corporativo** — sin que aparezca "novio/novia" donde no corresponde, y sin duplicar código.

Principio: **`EventType` = qué se muestra** (semántica) · **`Template` = cómo se ve** (estética, Fase D). Ortogonales.

---

## 2. Modelo de datos

### 2.1 Concepto central: `honorees` (protagonistas genéricos)

Se reemplaza el par boda-específico `groomName`/`brideName` por un array flexible:

```jsonc
// Boda
[ { "role": "bride", "label": "Novia", "name": "Jimena" },
  { "role": "groom", "label": "Novio", "name": "Juan" } ]

// XV Años
[ { "role": "celebrant", "label": "Quinceañera", "name": "Laura Sofía" } ]

// Bautizo
[ { "role": "baby", "label": "Bautizado/a", "name": "Mateo" } ]

// Corporativo
[ { "role": "host", "label": "Organiza", "name": "Acme Corp" } ]
```

### 2.2 Catálogo de tipos de evento

Ya implementado en [`src/lib/honorees.ts`](src/lib/honorees.ts) (`EVENT_TYPES`):

| `eventType` | Nombre | Protagonistas (roles) |
|---|---|---|
| `wedding` | Boda | Novia + Novio |
| `quinceanera` | XV Años | Quinceañera |
| `baptism` | Bautizo | Bautizado/a |
| `communion` | Primera Comunión | Homenajeado/a |
| `birthday` | Cumpleaños | Cumpleañero/a |
| `corporate` | Corporativo | Organiza |
| `other` | Otro | Anfitrión |

---

## 3. Decisión de almacenamiento — SIN migración (actualizado)

> **Cambio de plan (mejor):** en vez de añadir columnas nuevas (`eventType`, `honorees`, `eventTitle`) y arriesgar una migración en Neon, estos datos se guardan dentro de la **columna `config` (Json) que YA existe** y ya fluye por todas las rutas (`select` explícito, lectura y escritura).

**Por qué:**
- La DB Neon no era alcanzable desde el entorno de desarrollo (P1001) y el proyecto evoluciona el schema con `prisma db push` (solo existe la migración `init`), no con migraciones versionadas. Introducir una migración habría sido frágil.
- `config` es `Json @default("{}")`: agregar claves no requiere `ALTER TABLE`, no rompe prod, y funciona de inmediato.
- El helper `getHonorees`/`getEventType` lee en orden: columna futura → `config.honorees`/`config.eventType` → derivación legacy de `bride/groomName`. Retrocompatible al 100%.

Los tipos `Event.honorees`/`eventType`/`eventTitle` (nivel raíz) se conservan como **opción futura** por si algún día se promueven a columnas reales; hoy los datos viven en `config`.

### Ruta de promoción futura (opcional, no requerida)
Si se quiere indexar/consultar por tipo de evento, más adelante se pueden crear columnas reales con `prisma db push` (aditivo) y un backfill desde `config`. El helper ya prioriza la columna sobre `config`, así que la migración sería transparente.

---

## 3-bis. (Referencia) Migración por columnas — solo si se promueve a futuro

```prisma
model Event {
  // ... campos existentes ...

  // ── NUEVOS (Fase C) ──
  eventType   String   @default("wedding")   // slug del tipo de evento
  honorees    Json     @default("[]")        // Honoree[]
  eventTitle  String?                        // nombre libre (ocasiones sin protagonistas)

  // groomName / brideName se conservan como LEGACY hasta migrar del todo.
  // Se pueden deprecar en una fase posterior una vez honorees esté poblado.
}
```

> No se crea un modelo `EventType` en DB (todavía): el catálogo vive en código (`EVENT_TYPES`) porque son pocos y estables. Si en el futuro se quieren tipos configurables desde el panel, se promueve a tabla — mismo patrón que `Template`.

### 3.1 Migración SQL (propuesta)

```sql
ALTER TABLE "events" ADD COLUMN "eventType"  TEXT NOT NULL DEFAULT 'wedding';
ALTER TABLE "events" ADD COLUMN "honorees"   JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "events" ADD COLUMN "eventTitle" TEXT;
```

### 3.2 Backfill de eventos existentes (seguro, idempotente)

```sql
-- Poblar honorees de los eventos boda existentes desde los campos legacy.
UPDATE "events"
SET "honorees" = jsonb_build_array(
  jsonb_build_object('role','bride','label','Novia','name',"brideName"),
  jsonb_build_object('role','groom','label','Novio','name',"groomName")
)
WHERE "honorees" = '[]'::jsonb
  AND "brideName" <> '' AND "groomName" <> '';
```

**Compatibilidad:** aunque no se corra el backfill, el frontend ya funciona — `getHonorees()` deriva de `brideName`/`groomName` cuando `honorees` está vacío. El backfill solo "materializa" ese cálculo.

---

## 4. Lo YA implementado (esta iteración, no-destructivo)

- ✅ Tipos `Honoree`, `EventTypeSlug`, y campos opcionales `honorees`/`eventType`/`eventTitle` en `Event` ([`src/types/index.ts`](src/types/index.ts)).
- ✅ Helper [`src/lib/honorees.ts`](src/lib/honorees.ts): `getHonorees`, `getHonoreesNames`, `getHonoreesInitials`, `getEventType`, `isCoupleEvent`, `EVENT_TYPES`. **Deriva de datos legacy**, así que funciona hoy sin migrar nada.
- ✅ 11 tests ([`src/lib/honorees.test.ts`](src/lib/honorees.test.ts)) cubriendo fallback legacy, honorees explícito, filtrado de vacíos, iniciales y detección de pareja.

Resultado: `type-check` y `test` (26) en verde. **Cero cambios visibles** para eventos boda existentes.

---

## 5. Plan de rollout (pasos siguientes, en orden)

| Paso | Descripción | Toca DB | Riesgo |
|---|---|---|---|
| C.1 ✅ | Fundación: tipos + helper + tests | No | Nulo |
| C.3 ✅ | Refactor de secciones para usar `getHonorees*` — **secciones ya agnósticas** | No | Bajo |
| C.2 ✅ | **Almacenamiento en `config` (sin migración)** — helper lee de `config` con fallback legacy | No | Nulo |
| C.5 ✅ | Panel master: selector "Tipo de evento" + editor de `honorees` dinámico; server persiste en `config` | No | Bajo |
| C.6 ✅ | Textos por ocasión (`src/lib/occasions.ts`): `announcementText` (S1) y `shareTitle` (S8) por `eventType` | No | Bajo |
| C.7 ✅ | Seed demo opt-in (`pnpm seed:occasions`): XV, bautizo, cumpleaños. Idempotente. **Requiere DB para correr** | Sí (datos) | Nulo |
| C.4 ⏳ | Degradado básico a 1 protagonista **hecho** (S1/S3). Refinamiento visual fino pendiente de QA en la app corriendo | No | Medio |

### Estado final de Fase C (Ago 2026)
**Núcleo COMPLETADO.** La plataforma ya es multi-ocasión: se puede crear una boda, XV, bautizo, comunión, cumpleaños o corporativo desde el panel, con protagonistas y textos propios, sin migración de DB y sin romper los eventos boda existentes. 42 archivos de tests (31 pruebas) en verde.

**Pendiente no bloqueante:**
- **C.4** refinamiento visual de layouts de 1 protagonista — requiere ver la app corriendo (Neon estaba inalcanzable en dev). El degradado funcional ya está.
- **QA end-to-end** con `pnpm seed:occasions` cuando la DB esté disponible: crear los eventos demo y revisar `/laura-xv`, `/mateo-bautizo`, `/ana-cumple`.

**C.2 es el único paso que modifica la base de datos de producción.** Antes de aplicarlo se debe: (a) confirmar acceso a `DATABASE_URL`, (b) idealmente snapshot/branch de Neon, (c) revisar la migración generada por Prisma.

---

## 6. Impacto en el código (dimensionado)

`groomName`/`brideName` se usan en **34 sitios / ~8 archivos**: `InvitationSection1/3/6/8`, `MasterDashboard`, `schemas`, y rutas `events.js`/`master.js`. El refactor (C.3) es acotado y mecánico gracias al helper: se sustituye el acceso directo por `getHonoreesNames(event)` / `getHonoreesInitials(event)`.

---

## 7. Decisión tomada (resuelto — ya no pendiente)

**Se descartó la migración de schema.** En vez de `ALTER TABLE`, `eventType`/`honorees`/`eventTitle` se guardan dentro de `config` (Json), que ya existía y fluye por todas las rutas (commit `e7dca9f`). Cero riesgo en prod, funciona hoy. Ver §3 de este documento y §3 de `ESTADO_Y_ROADMAP_2026.md`.

Fase C quedó con su **núcleo completo**: C.1, C.2 (vía config), C.3, C.5, C.6, C.7 hechos. Pendiente real: **C.4** (refinamiento visual de layouts con 1 protagonista).

---

*Documento vivo — actualizar al retomar C.4 o al promover honorees/layout a columnas reales.*
