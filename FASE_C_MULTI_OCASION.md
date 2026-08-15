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
| C.3 ✅ | Refactor de secciones para usar `getHonorees*` en vez de `groom/brideName` — **secciones ya agnósticas** | No | Bajo |
| C.2 ✅ | **Almacenamiento en `config` (sin migración)** — helper lee de `config.honorees`/`config.eventType` con fallback legacy | No | Nulo |
| C.5 | Panel master: selector "Tipo de evento" + editor de `honorees` dinámico según el tipo (escribe a `config`) | No | Bajo |
| C.6 | Labels por ocasión: defaults de `config.labels` según `eventType` (ej. "NOS CASAMOS" vs "MIS XV") | No | Bajo |
| C.4 | Layouts que se adaptan a 1 vs 2 protagonistas (refinar más allá del degradado básico) | No | Medio |
| C.7 | Seed de ejemplo: 1 evento por ocasión para QA | Sí (datos) | Nulo |

**C.2 es el único paso que modifica la base de datos de producción.** Antes de aplicarlo se debe: (a) confirmar acceso a `DATABASE_URL`, (b) idealmente snapshot/branch de Neon, (c) revisar la migración generada por Prisma.

---

## 6. Impacto en el código (dimensionado)

`groomName`/`brideName` se usan en **34 sitios / ~8 archivos**: `InvitationSection1/3/6/8`, `MasterDashboard`, `schemas`, y rutas `events.js`/`master.js`. El refactor (C.3) es acotado y mecánico gracias al helper: se sustituye el acceso directo por `getHonoreesNames(event)` / `getHonoreesInitials(event)`.

---

## 7. Decisión pendiente para el usuario

Para avanzar a **C.2** necesito luz verde para **aplicar la migración en tu DB Neon** (aditiva, con backfill idempotente y reversible). Alternativa: seguir con **C.3** (refactor de secciones usando el helper con fallback legacy) que **no toca la DB** y ya deja las secciones agnósticas — dejando la migración para cuando prefieras.

---

*Documento vivo — actualizar al cerrar cada paso C.x.*
