# Estado del Proyecto y Roadmap — Fuente Única de Verdad
> Última actualización: 17 de agosto de 2026 (cierre de sesión)
> Reemplaza a `PLAN_PLATAFORMA.md` e `INVITATION_IMPROVEMENT_PLAN.md` (quedan como referencia histórica).
> Complementado por: `INVESTIGACION_MERCADO_2026.md`, `CATALOGO_FEATURES_2026.md`, `FASE_C_MULTI_OCASION.md`, `ARQUITECTURA_SECCIONES_DINAMICAS.md`.

---

## 0. TL;DR — dónde quedamos hoy

- **Gate del proyecto: verde.** `type-check` 0 errores · `lint` 0 errores · **35 tests** pasando · `build` OK. Esto es cierto en cada commit de la sesión de hoy.
- **Fase A (estabilización):** ✅ completa. Ver §1.
- **Fase B (secciones dinámicas):** ✅ núcleo completo — reordenar/mostrar/ocultar/eliminar/añadir/editar bloques desde el panel. Ver §2.
- **Fase C (multi-ocasión):** ✅ núcleo completo — la plataforma soporta boda/XV/bautizo/comunión/cumpleaños/corporativo. Ver §3.
- **Panel maestro rediseñado:** ✅ ventana dedicada por evento con gestión completa (CRUD invitados + analítica) + dashboard principal simplificado a hub de eventos. Ver §4.
- **Herramientas de diseño de Claude Code:** instaladas globalmente (frontend-design, ui-ux-pro-max, taste-skill, Playwright MCP, shadcn MCP). Ver §5.
- **Siguiente prioridad recomendada:** ver §6.

---

## 1. Fase A — Estabilización ✅ COMPLETA

Commit: `2365e42` (+ ajustes puntuales en commits posteriores).

- `pnpm type-check`: 0 errores (se arreglaron 19 errores reales que `vite build` ocultaba).
- `pnpm lint`: 0 errores (antes 743 — el config no cubría `server/`; ahora ignora `generated/` y da globals de Node al backend).
- `pnpm test`: Vitest montado, **35 tests** (`src/lib/*.test.ts`) cubriendo schemas Zod, parseo de horas `.ics`, y toda la lógica de `honorees.ts`/`occasions.ts`.
- CORS endurecido con whitelist env-driven (`ALLOWED_ORIGIN` + dominios Vercel).
- Rate limiter de login arreglado (commit `d6bb06a`): antes cubría **toda** `/api/auth` (incluido `/me`, llamado en cada carga de página) y se agotaba con uso normal. Ahora solo cubre `POST /login`, con `skipSuccessfulRequests`.
- `.env` verificado no trackeado en git. `prisma.js.map` sacado del repo.

**Pendiente no bloqueante:** tests de integración con DB de prueba (aislamiento multi-tenant, login por rol) — requieren fixture de Postgres.

---

## 2. Fase B — Secciones Dinámicas ✅ NÚCLEO COMPLETO

Doc de diseño: `ARQUITECTURA_SECCIONES_DINAMICAS.md`. Commits: `6ace774`, `ffbaf90`, `554c7ea`, `300ee29`.

### Qué existe
- **`src/blocks/`**: `types.ts` (`BlockInstance`/`BlockType`), `registry.ts` (`SECTION_REGISTRY` — 10 secciones heredadas + 3 bloques nuevos: `text`, `faq`, `divider`), `BlockRenderer.tsx`, `legacyLayout.ts` (`buildLegacyLayout`/`resolveLayout`).
- La invitación se guarda en `event.config.layout` (`BlockInstance[]`) — **sin migración de DB**, dentro de la columna `config` (Json) que ya existía. Si un evento no tiene `layout`, el renderer usa el orden legacy → **cero cambios visibles en eventos existentes**.
- `App.tsx` renderiza con `<BlockRenderer blocks={layout} />` en vez del JSX fijo de 10 componentes.
- **Panel — pestaña "Diseño"** (`src/components/master/LayoutBuilder.tsx`, con `@dnd-kit`): arrastrar para reordenar, botón de ojo para mostrar/ocultar, papelera para eliminar, menú "+ Añadir bloque", lápiz para editar contenido inline (bloques `text`/`faq`/`divider`).
- Backend: `buildConfig` en `server/routes/master.js` persiste `config.layout` saneado.
- **Verificado E2E** contra la DB real: crear evento con layout reordenado + bloque oculto + bloque de texto nuevo → el endpoint público lo devuelve intacto.

### Limitación conocida (siguiente paso natural si se retoma)
Los bloques **heredados** (portada, foto, familia, etc.) todavía leen su contenido de la config **global** del evento (vía `EventContext`), no de su `config` por-instancia. Por eso **duplicar** un bloque de foto muestra la misma foto en ambas copias. Los bloques nuevos (`text`, `faq`, `divider`) sí son 100% por-instancia. Arreglar esto es el paso **B.3/B.4** documentado en `ARQUITECTURA_SECCIONES_DINAMICAS.md` §5.

**Pendiente:** B.8 preview en vivo lado-a-lado (hoy existe `?preview=1` + botón, pero no un iframe embebido en el editor que refresque al vuelo).

---

## 3. Fase C — Multi-Ocasión ✅ NÚCLEO COMPLETO

Doc de diseño: `FASE_C_MULTI_OCASION.md`. Commits: `40b5f4a`, `e7dca9f`, `9ae6a76`, `8ca761e`, `e4c821e`.

### Qué existe
- **`src/lib/honorees.ts`**: tipos `Honoree`/`EventTypeSlug`, catálogo `EVENT_TYPES` (wedding, quinceanera, baptism, communion, birthday, corporate, other) con sus roles de protagonista, y helpers `getHonorees`/`getHonoreesNames`/`getHonoreesInitials`/`getEventType`/`isCoupleEvent`. **Derivan de `groomName`/`brideName` legacy** cuando no hay datos nuevos → retrocompatible al 100%.
- **`src/lib/occasions.ts`**: defaults de texto por ocasión (versículo, `heroMessage`, `confirmedMessage`, labels de familia) para que un evento de XV/bautizo/cumpleaños no muestre wording de boda. `wedding` = exactamente los textos originales.
- **Almacenamiento: `eventType`/`honorees`/`eventTitle` viven en `config` (Json), sin migración de schema** — misma decisión de diseño que el layout de Fase B. Prisma no tiene columnas nuevas para esto.
- **Panel master**: selector "Tipo de evento" (7 ocasiones) + editor dinámico de protagonistas según el tipo, en la pestaña Básico.
- **Secciones agnósticas**: S1 (iniciales), S3 (nombres), S5 (familia), S6 (título calendario), S8 (compartir) ya usan los helpers — cero referencias directas a `groom/brideName` en las `InvitationSection*`.
- **Seed demo opt-in**: `pnpm seed:occasions` crea `/laura-xv`, `/mateo-bautizo`, `/ana-cumple` para QA visual (idempotente, no se corre solo).

### Bug real encontrado y arreglado en esta sesión
El primer pase de Fase C dejó "leaks" de wording de boda en eventos no-boda (ej. dashboard mostraba "Laura Valencia & Laura Valencia" para un XV, S1 mostraba el versículo de boda). Se hizo un **review completo de defaults** (commit `e4c821e`) que corrigió 6 puntos. Ver ese commit para el detalle si aparece un caso similar en una sección no revisada aún.

**Pendiente:** C.4 (refinamiento visual fino de layouts con 1 protagonista — el degradado funcional ya existe, falta pulir visualmente viendo la app corriendo).

---

## 4. Panel Maestro — Rediseño de Arquitectura de Información ✅

Motivado por feedback directo del usuario: *"si no tengo claridad de qué pasa con cada evento, ¿para qué sirven las estadísticas globales?"*. Commits: `d5c7af2`, `15a4c71`, `03da27b`, más pulido responsive en `405fd77`, `aee966e`.

### Ventana por evento (`EventDetail.tsx`)
Cada evento tiene ahora su propio panel accesible con el botón **"Abrir panel"** de su tarjeta:
- Pestaña **Invitados**: el `GuestManager` completo (CRUD de invitados/acompañantes, filtros, CSV, QR, WhatsApp, modo en vivo) — el mismo componente que usa el admin cliente, reapuntado.
- Pestaña **Analítica**: el `AnalyticsDashboard` del evento (accesos, no confirmados, etc.).
- Header con nombre, badge de estado, Editar/Vista previa/Admins.

**Cómo se logró sin duplicar código:** el data-layer (`guest-service.ts`, `useGuests.ts`) se parametrizó con un `base` de API (`/api/admin` para el cliente, `/api/master/events/:id` para el master — las sub-rutas coinciden). `GuestScopeContext` provee ese `base` a los hooks. Backend: se espejaron los endpoints admin en `server/routes/master.js` (`POST/PATCH/DELETE /events/:id/guests`, `.../companions`, `GET .../stats`, `.../analytics`), scoped y protegidos por `requireMaster`.

**Verificado E2E** contra la DB real: crear → confirmar → añadir acompañante → confirmar acompañante → stats → analytics → borrar (cascade) — sin dejar residuo.

### Dashboard principal simplificado (hub de eventos)
Se **eliminaron** los 5 KPIs globales y las 3 tarjetas de insights (Próximos eventos, Ranking, Últimas confirmaciones) — esos datos ahora viven en cada ventana de evento y eran redundantes. El dashboard quedó como:
- Toolbar: título + resumen de una línea (derivado, sin requests extra) + búsqueda por nombre/slug + filtro Activos/Archivados + Nuevo evento.
- Tarjetas de evento con **barra de progreso de confirmación** inline.
- Acciones de tarjeta con jerarquía: **Abrir panel** + **Vista previa** visibles, resto (Admins, Activar, Duplicar, Importar, Archivar, Eliminar) en menú `⋯`.

### Responsive
Modal de edición de evento: 12 tabs en grid fijo → barra flex-wrap; todos los `grid-cols-2/3` fijos → `sm:grid-cols-*` (apilan en móvil). Tabla de invitados: columnas de baja prioridad ocultas por breakpoint.

---

## 5. Herramientas de diseño de Claude Code (config global, todos los proyectos)

En `~/.claude/settings.json` y `~/.claude.json` (no específico de este repo, pero relevante para retomar trabajo de diseño):

| Herramienta | Tipo | Para qué |
|---|---|---|
| `frontend-design@claude-plugins-official` | Plugin/skills | Suite oficial: adapt, layout, polish, audit, critique… |
| `ui-ux-pro-max@ui-ux-pro-max-skill` | Plugin/skill | 161 paletas, 99 guías UX, fuerte en dashboards/responsive |
| `taste-skill@taste-skill` | Plugin/skills | Perillas de variedad/motion/densidad, presets de estilo |
| Playwright MCP | MCP (user scope) | Screenshots/ver la UI real para iterar diseño con feedback visual |
| shadcn MCP | MCP (user scope) | Leer el registro de componentes shadcn real del proyecto |

**Nota:** los plugins/MCP se cargan al **inicio de sesión** — si se instalaron a mitad de una sesión, hace falta reiniciar Claude Code para que su skill/tool aparezca activo. Detalle completo en memoria: `claude-code-design-plugins.md`.

---

## 6. Qué sigue (recomendado, en orden de impacto)

1. **Pulido visual profundo con las herramientas activas.** Con Playwright MCP se puede *ver* la UI real e iterar con `ui-ux-pro-max`/`taste-skill` aportando la inteligencia de diseño — quedó pendiente de esta sesión por no tener las tools cargadas.
2. **B.3/B.4** — hacer los bloques heredados (foto, familia…) 100% por-instancia, para que duplicar un bloque de foto no repita la misma imagen.
3. **RSVP con preguntas personalizadas** (menú, dieta, canción, transporte) — es la demanda #1 del mercado según `CATALOGO_FEATURES_2026.md` y hoy es ❌.
4. **Fase D — Plantillas** (`Template`): selector visual de estética al crear evento, ortogonal a `EventType`. Diseño esbozado en `ARQUITECTURA_SECCIONES_DINAMICAS.md` §6.
5. **Tests de integración con DB real** (aislamiento multi-tenant, roles) — pendiente desde Fase A.
6. Mapa embebido, mesa de regalos estructurada, galería colaborativa — ver checklist accionable en `CATALOGO_FEATURES_2026.md` §9.

---

## 7. Cómo levantar el entorno de desarrollo (para la próxima sesión)

- **Node:** el proyecto pide 20.x (`.nvmrc: 20.19.6`). El shell por defecto de esta máquina trae Node 18 — usar `nvm use 20.19.6` antes de correr el server (Vite 7 y algunos loaders fallan en Node 18).
- **Cliente:** `pnpm dev:client` (puerto 3000, proxy `/api` → 3002).
- **Servidor:** `pnpm dev:server` o `node server/index.js` con Node 20 (puerto 3002, conecta a Neon).
- **Credenciales master:** `juansc0630@gmail.com` — password por defecto del seed original (`admin123`); **cambiarla en producción**, es débil para la cuenta que controla todos los eventos.
- **Neon puede estar dormido** al primer intento (arranque en frío) — un segundo intento tras unos segundos suele conectar.

---

## 8. Documentos del proyecto — mapa

| Archivo | Contenido |
|---|---|
| `ESTADO_Y_ROADMAP_2026.md` | **Este archivo.** Fuente única de verdad, punto de entrada. |
| `INVESTIGACION_MERCADO_2026.md` | Investigación de mercado detallada (RSVP, QR, WhatsApp/LATAM, plataformas). |
| `CATALOGO_FEATURES_2026.md` | Catálogo exhaustivo de features invitado/admin/plataforma con estado ✅/⚠️/❌. |
| `FASE_C_MULTI_OCASION.md` | Diseño detallado de la abstracción multi-ocasión (honorees, EventType). |
| `ARQUITECTURA_SECCIONES_DINAMICAS.md` | Diseño detallado del sistema de bloques (SECTION_REGISTRY, layout). |
| `PLAN_PLATAFORMA.md`, `INVITATION_IMPROVEMENT_PLAN.md` | Históricos — superados por este documento, se conservan como referencia. |

---

*Documento vivo. Actualizar al cerrar cada sesión de trabajo relevante.*
