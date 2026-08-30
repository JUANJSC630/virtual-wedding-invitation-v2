# CLAUDE.md — Guía de ingeniería del proyecto

> Estándares de código y contexto arquitectónico. **Léelo antes de tocar código.**
> El estado funcional y el roadmap viven en `ESTADO_Y_ROADMAP_2026.md` (fuente de verdad de *qué* está hecho).
> Este archivo define *cómo* se escribe el código.

---

## 1. Arranque del entorno

```bash
nvm use 20.19.6          # obligatorio: Vite 7 falla en Node 18 (default del shell)
node server/index.js     # API   → :3002  (Neon puede tardar en despertar: reintenta)
node_modules/.bin/vite   # front → :3000  (proxy /api → :3002)
```

**Trampa conocida:** `pnpm type-check` / `pnpm test` revientan bajo Node 20.19.6 con
`ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`. Es el shim de corepack, no el proyecto.
Usa los binarios locales directamente:

```bash
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/vitest run
./node_modules/.bin/eslint .
```

Credenciales master reales: `juansc0630@gmail.com` / `admin123`.
Ojo: `ADMIN_EMAIL` en `.env` (`admin@ejemplo.com`) **no** es el usuario real — es un
residuo del seed y no existe en la DB.

---

## 2. Arquitectura en una página

```
Público          /:slug  → App.tsx → resolveLayout(config.layout) → <BlockRenderer>
                                   → EventContext + ThemeProvider + AssetContext + GuestContext
Panel cliente    /admin  → AdminDashboard  ─┐
Panel master     /master → MasterDashboard  ├→ GuestManager / AnalyticsDashboard
                           └ EventDetail   ─┘   (mismos componentes, distinto `base`)

API   Express (server/app.js)
      /api/auth    login/logout/me         — JWT en cookie httpOnly `admin_token`
      /api/events  :slug público           — select explícito, filtra isActive/archivedAt
      /api/guests  validate/rsvp/access    — rate-limited
      /api/admin   requireAuth + role=client, scoped a req.user.eventId
      /api/master  requireMaster, scoped por :id de la URL
```

### Los dos patrones que sostienen el proyecto

**a) Config extensible sin migraciones.** Todo dato nuevo de evento vive dentro de la
columna `config` (Json) de `Event`, no en columnas nuevas. Así se hicieron Fase B
(`config.layout`) y Fase C (`config.eventType` / `config.honorees`).
Antes de proponer un `ALTER TABLE`, pregúntate si cabe en `config`.

**b) Data-layer parametrizado por `base`.** `guest-service.ts` recibe el prefijo de API
como parámetro; `GuestScopeContext` lo inyecta a los hooks. Por eso el mismo
`GuestManager` sirve al panel cliente (`/api/admin`) y al master
(`/api/master/events/:id`) sin duplicar una línea. **Al añadir un endpoint de gestión,
espéjalo en ambos routers con la misma sub-ruta** o rompes esta simetría.

### Sistema de bloques (`src/blocks/`)

- `types.ts` — `BlockInstance { id, type, enabled, config }`. El orden del array **es** el orden en pantalla.
- `registry.ts` — `SECTION_REGISTRY`: `type` → componente + metadatos del panel. **Añadir un bloque = añadir una entrada aquí**, nada más.
- `BlockRenderer.tsx` — filtra deshabilitados, ignora tipos desconocidos (forward-compat), envuelve cada bloque en su error boundary.
- `legacyLayout.ts` — si un evento no tiene `config.layout`, se reconstruye el orden histórico. **Nunca rompas esta ruta:** los eventos viejos dependen de ella.

Limitación viva: los bloques heredados leen config **global** del evento vía
`EventContext`, no su `config` por-instancia. Duplicar un bloque de foto repite la
misma imagen. Los bloques nuevos (`text`, `faq`, `divider`) sí son por-instancia.

---

## 3. Convenciones de código

### Idioma
- **Comentarios, mensajes de error y UI: español.** Identificadores: inglés.
- Comentarios que explican **por qué**, no qué. El código ya dice qué hace.
- Separadores de sección con el estilo existente: `// ─── Título ───────────`.

### TypeScript
- `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` están activos. Respétalos.
- **Cero `any`.** Hoy hay 0 en `src/` — no seas el primero. Usa `unknown` + narrowing.
- Tipos compartidos en `src/types/index.ts`. Los tipos del sistema de bloques en `src/blocks/types.ts`.

### Imports
Ordenados por `@trivago/prettier-plugin-sort-imports` con grupos separados por línea en blanco:
`react` → third-party → `@/types` → `@/lib` → `@/hooks` → `@/components/ui` → `@/components` → `@/*` → relativos.
No los ordenes a mano: `./node_modules/.bin/prettier --write <archivo>`.

### React
- Componentes funcionales tipados: `const X: React.FC<Props> = ({ ... }) => {}`.
- Estado de servidor: **React Query**, nunca `useState` + `useEffect` + `fetch`.
- Los hooks de gestión leen su `base` de `useGuestScope()` — no hardcodees rutas.
- Al invalidar caché usa el prefijo (`["guests", "all"]`), que matchea todas las variantes con `base`.

### Backend
- Todo handler: `try/catch` + `console.error("Contexto:", error)` + `500` genérico. Nunca filtres el error crudo al cliente en producción.
- Validación de entrada con **Zod** en el borde (ver `createGuestSchema`).
- **Aislamiento multi-tenant obligatorio.** Antes de mutar un recurso anidado, verifica pertenencia:
  ```js
  const owned = await prisma.guest.findFirst({ where: { id: guestId, eventId } });
  if (!owned) return res.status(404).json({ error: "..." });
  ```
  Este patrón está bien aplicado hoy en `master.js`. Mantenlo.

### Estilos
- Tailwind. Estética pública: navy `#162b4e`, gold `#bfa15a`, Cormorant/Jost.
- Colores de tema vía CSS vars de `ThemeProvider` (`--color-primary`, `--color-accent`…), no hardcodeados.
- Mobile-first: `grid-cols-1` + `sm:grid-cols-*`. Nada de grids fijos que no apilen.

---

## 4. Invariantes que costaron un bug — no las rompas

Las tres se arreglaron (commits `5165f2e`, `e6799d3`, `62ea18e`). Se documentan
porque son fáciles de reintroducir.

### Un PATCH parcial no debe borrar lo que no menciona
`buildConfig(body, existing)` en `server/routes/master.js` fusiona sobre la config
actual. Antes reconstruía desde cero y el `PATCH {isActive:false}` del toggle
Activar/Desactivar borraba layout, eventType, honorees y todos los textos del
evento — una quinceañera volvía a ser "wedding" vacía.

**Al añadir un campo a `config`:** dale su rama en `buildConfig` con el patrón
`sent(key) ? <del body> : <lo guardado>`. Un campo que ignore `existing` vuelve a
abrir el mismo agujero.

### `confirmedAt` solo se toca si viene `confirmed`
Usa `confirmationFields(confirmed)` de `server/lib/confirmation.js`. Escribir
`confirmedAt: confirmed ? new Date() : null` directo es el bug: Prisma ignora
`confirmed: undefined` pero sí aplica `confirmedAt: null`, así que renombrar a un
invitado confirmado le borraba la fecha y corrompía la analítica.

### El lint debe ver los archivos que escribes
`eslint.config.js` cubre `.ts/.tsx` desde `62ea18e` (15 → 99 archivos). Si añades
un directorio o una extensión nueva, comprueba que entra:
`./node_modules/.bin/eslint . -f json | node -pe '"archivos: "+JSON.parse(require("fs").readFileSync(0)).length'`

### Nada de una consulta por fila — hay un techo de 30 s
`vercel.json` fija `maxDuration: 30` para `api/server.js`. El import de CSV hacía
2 consultas por fila y tardaba 46 s con 200 invitados: en producción no iba
lento, **fallaba por timeout**. Cualquier operación sobre una colección va en
lote (`findMany` con `in`, `createMany`, `groupBy`), nunca en un bucle `await`.

---

## 5. Deuda técnica registrada

| Punto | Detalle |
|---|---|
| `EventFormModal.tsx` — 1153 líneas | 12 pestañas en un componente. Siguiente split natural: un archivo por pestaña. |
| `fetch` directo en 9 componentes | Rompe la capa de servicios. Lo nuevo va en `src/services/`. |
| `font-serif` hardcodeado (49 usos) | Bloquea que la fuente sea configurable por tema. |
| Tests de integración | Los 43 tests son de lógica pura (`src/lib/`). Cero cobertura de aislamiento multi-tenant y roles contra una DB real. |
| Sin índices en `GuestAccess` | `eventId` y `guestCode` sin índice; los `groupBy` de analítica escanean la tabla. |
| Bundle de 692 kB | El build avisa. Falta code-splitting de los paneles. |
| `groomName`/`brideName` siguen siendo NOT NULL | Legacy de boda: un bautizo tiene que rellenarlas igual. Migrar cuando se toque el schema. |

Resuelto en la sesión del 30 ago 2026: código muerto (`AdminLogin.tsx`,
`prisma.ts`, `prisma.js.map`, `tsconfig.node.json`, script `build:server` roto),
los dos N+1, el lint ciego al frontend, los tests fuera del type-check y el split
de `MasterDashboard.tsx` (2004 → 449 líneas).

---

## 6. Definition of done

Antes de dar por cerrado cualquier cambio:

1. `./node_modules/.bin/tsc --noEmit` → 0 errores.
2. `./node_modules/.bin/vitest run` → 43 en verde. **Lógica pura nueva ⇒ test nuevo** en `src/lib/*.test.ts`.
   Si un componente encapsula lógica pura difícil de verificar en ejecución, sácala a `src/lib/` y tésteala.
3. `./node_modules/.bin/eslint .` → 0 errores y 0 advertencias, sobre 99 archivos.
4. `./node_modules/.bin/vite build` → build OK.
5. Si tocaste endpoints: **verificación E2E contra la DB real**. Es el estándar que ya usó
   este proyecto en Fases B y C. Crea un evento desechable, ejercita el flujo, bórralo —
   nunca pruebes mutaciones sobre `xv-laura` ni `jimena-juan`.
6. Si tocaste un evento no-boda: revisa que no se filtre wording de boda (el bug de la
   Fase C, commit `e4c821e`).
7. Smoke test de la UI cuando toques componentes. Hay un chromium en la caché de
   Playwright que sirve sin instalar nada:
   ```bash
   CHROME=~/Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell
   "$CHROME" --headless --disable-gpu --virtual-time-budget=7000 --dump-dom http://localhost:3000/login
   ```
   Ojo: las secciones que montan con `IntersectionObserver` (la cuenta regresiva)
   no aparecen en un volcado headless. Ausencia ahí no es prueba de regresión —
   compáralo contra `git stash` antes de concluir nada.

   Para los paneles hace falta sesión. Node 22 (`nvm use 22.21.1`) trae `WebSocket`
   nativo, así que se puede conducir Chrome por CDP sin instalar nada: arrancarlo con
   `--remote-debugging-port=9222`, inyectar la cookie con `Network.setCookie`
   (`admin_token`, obtenida del `Set-Cookie` del login), navegar y evaluar
   `document.documentElement.outerHTML`. Sirve también para hacer clic en un botón
   y comprobar que un modal monta.
8. **Un commit por sub-paso**, en español, formato Conventional Commits con scope.

---

## 7. Documentos

| Archivo | Contenido |
|---|---|
| `ESTADO_Y_ROADMAP_2026.md` | Estado real y roadmap. **Punto de entrada.** |
| `CLAUDE.md` | Este archivo — estándares de ingeniería. |
| `ARQUITECTURA_SECCIONES_DINAMICAS.md` | Diseño del sistema de bloques. |
| `FASE_C_MULTI_OCASION.md` | Diseño de la abstracción multi-ocasión. |
| `CATALOGO_FEATURES_2026.md` | Catálogo de features con estado ✅/⚠️/❌. |
| `INVESTIGACION_MERCADO_2026.md` | Investigación de mercado. |
| `PLAN_PLATAFORMA.md`, `INVITATION_IMPROVEMENT_PLAN.md` | Históricos, superados. |
