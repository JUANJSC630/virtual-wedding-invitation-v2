# Estado del Proyecto y Roadmap — Fuente Única de Verdad
> Última actualización: 30 de agosto de 2026 (sesión de saneamiento)
> Reemplaza a `PLAN_PLATAFORMA.md` e `INVITATION_IMPROVEMENT_PLAN.md` (quedan como referencia histórica).
> Complementado por: `CLAUDE.md` (**estándares de código — leer antes de tocar nada**),
> `INVESTIGACION_SISTEMA_COMPLETO_2026.md` (**qué falta**) e `INVESTIGACION_TECNICA_2026.md` (**con qué construirlo**),
> `INVESTIGACION_MERCADO_2026.md`, `CATALOGO_FEATURES_2026.md`, `FASE_C_MULTI_OCASION.md`, `ARQUITECTURA_SECCIONES_DINAMICAS.md`.

---

## 0. TL;DR — dónde quedamos hoy

- **Gate del proyecto: verde y ahora de verdad.** `type-check` 0 errores (tests incluidos) · `lint` 0 errores sobre **100+ archivos** · **68 tests** · `build` OK.
  Hasta el 30 ago el lint solo analizaba 15 archivos —ninguno del frontend— así que su verde no significaba gran cosa. Ver §4bis.
- **Fase A (estabilización):** ✅ completa. Ver §1.
- **Fase B (secciones dinámicas):** ✅ núcleo completo — reordenar/mostrar/ocultar/eliminar/añadir/editar bloques desde el panel. Ver §2.
- **Fase C (multi-ocasión):** ✅ núcleo completo — la plataforma soporta boda/XV/bautizo/comunión/cumpleaños/corporativo. Ver §3.
- **Panel maestro rediseñado:** ✅ ventana dedicada por evento con gestión completa (CRUD invitados + analítica) + dashboard principal simplificado a hub de eventos. Ver §4.
- **RSVP con preguntas personalizadas (30 ago):** ✅ la demanda #1 del mercado, entregada de punta a punta. Ver §4ter.
- **Cimiento de asistentes (31 ago):** ✅ tabla `Attendee` con 178 personas y escrituras sincronizadas. Desbloquea mesas, menú por persona y check-in. Ver §4quater.
- **Saneamiento (30 ago):** ✅ dos bugs de pérdida de datos corregidos, lint extendido al frontend, código muerto fuera, dos N+1 eliminados (uno superaba el timeout de Vercel). Ver §4bis.
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

## 4bis. Saneamiento — 30 de agosto de 2026

Sesión dedicada a auditar el código y dejar la base sana antes de seguir con producto.
Commits `5165f2e`, `e6799d3`, `62ea18e`, `5ea048e`, `5b29d4d`, `c94e188`, `0019ade`, `7a02a5d`.

### Dos bugs de pérdida de datos, reproducidos y corregidos

**1. Un PATCH parcial borraba la config entera del evento** (`5165f2e`).
`buildConfig(req.body)` reconstruía la config desde cero y el PATCH la escribía sin
fusionar. El toggle Activar/Desactivar del panel manda solo `{isActive}`: con un clic
se perdían el layout de Fase B, el `eventType`/`honorees` de Fase C, versículo, lugares,
familias, itinerario, galería y labels. Una quinceañera volvía a ser "wedding" vacía.
Reproducido contra la DB antes de tocar nada. `buildConfig` ahora fusiona sobre lo
guardado; verificado que las ediciones reales y los vaciados intencionales siguen
funcionando.

**2. Editar un invitado le borraba la fecha de confirmación** (`e6799d3`).
`confirmedAt: confirmed ? new Date() : null` se escribía siempre. Prisma ignora
`confirmed: undefined` pero sí aplica `confirmedAt: null`, así que renombrar a un
invitado confirmado lo dejaba con `confirmed: true` y sin fecha — corrompiendo la
analítica y el listado de últimas confirmaciones, que filtra por `confirmedAt`.
Nuevo helper `server/lib/confirmation.js` aplicado a los 4 caminos afectados
(invitado y acompañante × master y cliente). El RSVP público tenía el mismo patrón
latente: ahora exige `confirmed` booleano y responde 400.

### El gate no era lo que parecía

`eslint.config.js` solo declaraba `files: ["src/**/*.{js,jsx}"]`, pero `src/` son 79
archivos `.ts/.tsx` y 1 `.js`: ESLint procesaba 15 archivos en total, ninguno del
frontend (`62ea18e`). Y `tsconfig.json` excluía los tests, así que tampoco se
type-checkeaban (`5b29d4d`). Ambas cosas corregidas; el frontend limpio destapó solo
3 avisos reales, arreglados de verdad y no silenciados.

### Rendimiento — un fallo de producción encubierto

El import de CSV hacía 2 consultas por fila (`0019ade`). Medido contra la DB real con
200 filas: **46.087 ms**. `vercel.json` fija `maxDuration: 30` para `api/server.js`, así
que en producción una importación de ese tamaño **fallaba por timeout**, no iba lenta.
Ahora son 2 consultas en total: **874 ms**, 53× más rápido. El listado de eventos tenía
otro N+1 (un `count` por evento), resuelto con un `groupBy`.

### Limpieza

128 líneas de código muerto fuera (`c94e188`): `AdminLogin.tsx` sin importadores desde
que existe `LoginPage`, `src/lib/prisma.ts` que nadie usa (el backend importa
`prisma.js`), `prisma.js.map` obsoleto, `tsconfig.node.json` vacío, y el script
`build:server` que estaba **roto** (apuntaba a un `server/tsconfig.json` inexistente).

### Estándares de código

`CLAUDE.md` nuevo en la raíz (`5ea048e`, `7a02a5d`): arranque del entorno, arquitectura,
convenciones observadas, los invariantes que costaron estos bugs, deuda técnica viva y
definition of done. **Es el documento a leer antes de escribir código**; este archivo
sigue siendo el de *qué* está hecho.

### Método de verificación

Todo se verificó E2E contra la DB real con eventos desechables `zz-*` creados y
borrados, nunca sobre `xv-laura` ni `jimena-juan` — que resultó estar **vivo recibiendo
RSVPs reales** durante la sesión (los confirmados subieron de 90 a 91 mientras se
trabajaba). Para el import se capturó la salida del código anterior sobre un CSV con
todos los casos borde y se comprobó que la nueva es byte a byte idéntica.

---

## 4ter. RSVP con preguntas personalizadas ✅ — 30 de agosto de 2026

Commits `b98dee6` (modelo, schema y backend) y `39f646e` (UI). Era la demanda #1
del mercado según `CATALOGO_FEATURES_2026.md` y estaba en ❌.

### Los tres tipos, y por qué solo tres
Elegidos con evidencia, no a ojo. De los 6 campos que el catálogo marca como
demandados, **4 son texto libre** (alergias, canción, accesibilidad, nota) y solo
2 son de elegir — así que "elección única" sola no habría entregado la función.

- `single` — menú y transporte. Es lo que permite contar platos para el catering.
- `text`   — alergias, canción, accesibilidad, notas.
- `multi`  — el catálogo pide las restricciones dietéticas como "texto o checkboxes".

Se **descartó** un tipo "sí/no": es un `single` de dos opciones y añadiría un
camino de código y un caso de agregación sin ganar expresividad. Joy, de las
plataformas grandes, ships exactamente elección única + texto; QuikRSVP resuelve
el sí/no con radios.

### Dónde vive cada cosa
- **Definición:** `config.rsvpQuestions`, sin columnas nuevas — mismo patrón que
  el layout (Fase B) y los honorees (Fase C). `buildConfig` las conserva ante un
  PATCH parcial, como el resto de la config.
- **Respuestas:** `Guest.rsvpAnswers` (Json), aplicado con **`db push`**. Ver el
  aviso de §7 sobre por qué `migrate dev` sería destructivo aquí.
- **Lógica pura:** `src/lib/rsvpQuestions.ts` es la definición canónica, con 25
  tests (saneado, normalización, obligatorias y `tallyAnswers` para el conteo).
  `server/lib/rsvp-questions.js` la replica para el backend, que corre en Node
  plano y no puede importar TS. **Si cambias las reglas, cambia los dos lados.**

### UI
- Pestaña **RSVP** en el panel (`RsvpQuestionsEditor.tsx`, en su propio archivo
  para no volver a engordar `EventFormModal`). El `id` de cada pregunta se deriva
  de la etiqueta **solo al crearla** y nunca se recalcula: es la clave de las
  respuestas ya recibidas, así que renombrar no huerfana nada.
- `RSVPForm` renderiza radio / checkbox / texto, solo cuando el invitado asiste,
  y siembra el estado con lo ya respondido.
- `RsvpAnswersPanel` en `GuestManager`: conteo por opción para el catering y las
  respuestas abiertas con el nombre de quien las escribió.
- Las preguntas se pasan **por prop, no por EventContext**: los paneles de
  administración no están envueltos en ese contexto, que es exclusivo de la
  invitación pública.

### Verificación
Ciclo entero en un navegador real conducido por CDP: entrar con `?code=`, pasar
la pantalla de datos, pulsar "Sí, asistiré", ver aparecer las preguntas, intentar
confirmar sin la obligatoria y ser bloqueado, marcar radio y checkbox, escribir la
canción, confirmar — y luego, en el panel maestro autenticado, ver el conteo y la
respuesta de texto atribuida. Antes del cambio de schema se hizo respaldo de los
94 invitados y comprobación de integridad posterior (0 diferencias reales).

### Pendiente de esta función
- **Lógica condicional** (`CATALOGO` §A): mostrar una pregunta según la respuesta
  a otra. Hoy solo existe la regla implícita "solo se preguntan si asiste".
- **Export CSV de respuestas** para pasárselo al catering en un archivo.
- Las preguntas **no distinguen entre invitado y acompañantes**: se responden una
  vez por invitación. Para menús por persona haría falta llevarlas a `Companion`.

---

## 4quater. Cimiento de asistentes ✅ — 31 de agosto de 2026

Commits `eb6b5a5` (tabla + relleno) y `33d615c` (sincronización de escrituras).
Es el cimiento que `INVESTIGACION_SISTEMA_COMPLETO_2026.md` §1 señala como
prerrequisito de mesas, menú por persona y check-in.

### El cambio
`Guest` pasa a modelar el **hogar** (quien abre un mismo enlace: código,
contacto, cupos) y `Attendee` la **persona**, con el titular marcado por
`isPrimary`. Antes un acompañante era solo `{name, confirmed}` y no podía tener
silla propia, plato propio ni código propio.

Aguas abajo esto significa que mesas y check-in referencian **un único tipo** en
vez de distinguir titular de acompañante en cada consulta y cada pantalla.

### Estado actual de la transición
- ✅ Tabla creada y rellenada: **178 asistentes** (94 titulares + 84 acompañantes).
- ✅ Los 7 caminos de escritura la mantienen al día.
- ✅ **Menú por persona funcionando** (`a96d546`, `<pendiente>`): cada asistente
  guarda sus propias respuestas, el formulario público pregunta a cada uno, el
  panel cuenta por persona y el CSV saca una fila por comensal.
- ⏳ Las lecturas de acompañantes siguen yendo a `Companion`; `Attendee` convive
  con él mediante el puente `companionId`.

### Lo que falta para completarla
1. Derivar `companions` de `Attendee` en las respuestas de la API, para poder
   retirar la tabla sin romper el contrato del frontend.
2. Retirar `Companion` y el campo puente `Attendee.companionId`.
3. Dar a cada persona su propio código/QR → check-in en la puerta.

### Mesas ✅ (31 ago)
Diseño y lecciones en `ARQUITECTURA_MESAS.md`. Completo de punta a punta:
- Modelo `Table` + `Attendee.tableId`; el plano es vista derivada, así que una
  cancelación libera el sitio sola.
- Recomendación que **no pide configurar nada**: agrupa por invitación, que es la
  restricción más fuerte de una boda y ya estaba en los datos. 23 tests.
- Panel con dos modos: lista (móvil) y plano en **Konva** con arrastre, zoom,
  imán con guías y export a PNG. Capacidades y formas distintas por mesa, con el
  tamaño dibujado proporcional a la capacidad.
- Bloque **"Tu mesa"** en la invitación: el invitado ve su mesa y con quién se
  sienta desde el móvil.

Pendiente: rotación de mesas largas, export a PDF, reglas explícitas de "separar".

### Detalles que conviene no olvidar
- `Attendee.companionId` lleva `@@index` y **no** `@unique`: añadir una
  restricción única sobre una tabla con datos hace que `db push` exija
  `--accept-data-loss`, y esa bandera no se usa contra producción. La unicidad se
  garantiza en el código.
- `server/lib/attendees.js` es **best effort**: registra el fallo pero no tumba la
  operación principal. `node scripts/backfill-attendees.js` es idempotente y
  repara cualquier desvío (tiene `--dry`).
- El script va en **JS y no en TS** porque el loader `ts-node/esm` que usan los
  demás scripts revienta bajo Node 20 — los otros `pnpm seed:*` están rotos por
  lo mismo, pendiente de arreglar.

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

La base técnica quedó sana el 30 de agosto (§4bis), así que lo que sigue puede ser
producto sin arrastrar deuda.

**Producto — lo que mueve la aguja comercial**
1. ~~RSVP con preguntas personalizadas~~ ✅ **hecho** (§4ter). Quedan tres extensiones
   naturales: lógica condicional, export CSV de respuestas para el catering, y
   preguntas por acompañante (hoy se responden una vez por invitación).
2. **B.3/B.4** — bloques heredados por-instancia, para que duplicar un bloque de foto
   no repita la misma imagen (`ARQUITECTURA_SECCIONES_DINAMICAS.md` §5).
3. **Fase D — Plantillas** (`Template`): selector visual de estética al crear evento,
   ortogonal a `EventType`.
4. Mapa embebido, mesa de regalos estructurada, galería colaborativa — checklist en
   `CATALOGO_FEATURES_2026.md` §9.
5. **Pulido visual** con Playwright MCP + `ui-ux-pro-max`/`taste-skill`. Ojo: el MCP no
   estaba cargado ni el 17 ni el 30 de agosto; hace falta reiniciar la sesión.

> **Hallazgo de `INVESTIGACION_SISTEMA_COMPLETO_2026.md` (30 ago):** mesas, menú por
> persona, check-in en la puerta y "encuentra tu mesa" **no son cuatro funciones
> independientes** — las cuatro necesitan lo mismo: que cada asistente sea una entidad de
> primera clase, no una cadena colgando de `Guest`. Hacer ese cimiento primero convierte
> las cuatro en trabajo fácil. Ver §1 y §11 de ese documento.

**Técnico — lo que queda de deuda (detalle en `CLAUDE.md` §5)**
6. ~~Split de `MasterDashboard.tsx`~~ ✅ hecho (`fcab922`): 2004 → 449 líneas, repartido
   en `eventFormModel.ts`, `EventFormModal.tsx` y `ClientAdminModal.tsx`. El siguiente
   split natural sería una pestaña por archivo dentro de `EventFormModal` (1153 líneas).
7. **Tests de integración con DB real** — el aislamiento multi-tenant no tiene ninguna
   red hoy; los 43 tests son de lógica pura.
8. Índices en `GuestAccess` (`eventId`, `guestCode`), code-splitting del bundle
   (692 kB), `font-serif` configurable por tema.

---

## 7. Cómo levantar el entorno de desarrollo (para la próxima sesión)

- **Node:** el proyecto pide 20.x (`.nvmrc: 20.19.6`). El shell por defecto de esta
  máquina trae Node 18 — `nvm use 20.19.6` antes de correr el server.
- **Cliente:** `node_modules/.bin/vite` (puerto 3000, proxy `/api` → 3002).
- **Servidor:** `node server/index.js` con Node 20 (puerto 3002, conecta a Neon).
- ⚠️ **`pnpm type-check` y `pnpm test` revientan bajo Node 20.19.6** con
  `ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`: es el shim de corepack, no el proyecto.
  Correr el gate con los binarios locales:
  `./node_modules/.bin/tsc --noEmit`, `vitest run`, `eslint .`, `vite build`.
- **Credenciales master:** `juansc0630@gmail.com` / `admin123` (password débil del seed
  original; **cambiarla en producción**). Ojo: `ADMIN_EMAIL` del `.env`
  (`admin@ejemplo.com`) **no** es el usuario real — no existe en la DB.
- **Neon puede estar dormido** al primer intento (arranque en frío) — reintentar.
- ⚠️ **Nunca uses `prisma migrate dev`.** La migración `init` no contiene
  `archivedAt`, `notes`, `eventId` ni `rsvpAnswers` — todos se aplicaron con
  `db push`. `migrate status` dice "up to date" porque solo mira qué migraciones
  corrieron, no la deriva real, así que `migrate dev` vería drift e intentaría
  **resetear la base**. Los cambios de schema van con `prisma db push`.
- ⚠️ **`jimena-juan` es un evento en producción con tráfico real** (94 invitados, 91
  confirmados, 563 accesos, subiendo). Para probar cambios de backend: crear un evento
  desechable `zz-*`, ejercitarlo y borrarlo. Nunca mutar los eventos reales.

---

## 8. Documentos del proyecto — mapa

| Archivo | Contenido |
|---|---|
| `ESTADO_Y_ROADMAP_2026.md` | **Este archivo.** *Qué* está hecho y qué sigue. Punto de entrada. |
| `CLAUDE.md` | *Cómo* se escribe el código: estándares, invariantes, deuda, definition of done. **Leer antes de programar.** |
| `INVESTIGACION_MERCADO_2026.md` | Investigación de mercado (RSVP, QR, WhatsApp/LATAM, plataformas). |
| `INVESTIGACION_SISTEMA_COMPLETO_2026.md` | **Qué falta para ser un sistema completo**: mesas, check-in, sub-eventos, galería colaborativa. 16 fuentes. Leer antes de decidir el siguiente gran bloque. |
| `ARQUITECTURA_MESAS.md` | Diseño del mapa de mesas: modelo, algoritmo de recomendación y los dos modos de interfaz. |
| `INVESTIGACION_TECNICA_2026.md` | **Con qué construirlo**: librerías evaluadas contra las restricciones reales (serverless, 30 s). Qué instalar, qué NO y por qué. |
| `CATALOGO_FEATURES_2026.md` | Catálogo exhaustivo de features invitado/admin/plataforma con estado ✅/⚠️/❌. |
| `FASE_C_MULTI_OCASION.md` | Diseño detallado de la abstracción multi-ocasión (honorees, EventType). |
| `ARQUITECTURA_SECCIONES_DINAMICAS.md` | Diseño detallado del sistema de bloques (SECTION_REGISTRY, layout). |
| `PLAN_PLATAFORMA.md`, `INVITATION_IMPROVEMENT_PLAN.md` | Históricos — superados por este documento, se conservan como referencia. |

---

*Documento vivo. Actualizar al cerrar cada sesión de trabajo relevante.*
