# Estado del Proyecto, Review Completo y Roadmap Adaptativo
> Consolidado — Agosto 2026 · Autor del análisis: revisión técnica integral
> Reemplaza como "fuente única de verdad" a `PLAN_PLATAFORMA.md` e `INVITATION_IMPROVEMENT_PLAN.md` (que quedan como referencia histórica).

---

## 0. TL;DR (para leer en 30 segundos)

- **Dónde vamos:** los dos planes escritos (`PLAN_PLATAFORMA` fases 0–7 e `INVITATION_IMPROVEMENT_PLAN` fases 1–6) están **~85% implementados**. Multi-tenant, auth JWT, panel master, panel cliente, RSVP nativo, temas/assets configurables, PWA, CSV, QR, WhatsApp masivo: **hecho**.
- **Lo que falta de esos planes:** sistema de **plantillas (`Template`)**, **secciones dinámicas reordenables** (drag-and-drop / `SECTION_REGISTRY`), **preview en tiempo real** completo y **tests**.
- **Lo nuevo que pediste (multi-ocasión / "toda ocasión"):** hoy **no existe**. Todo el modelo está *cableado a boda* (`groomName`, `brideName`, ceremonia, novios, padrinos…). Convertirlo en adaptativo es una **nueva fase mayor** — es el corazón de este documento (§5).
- **Salud del código:** funciona y despliega, pero **`type-check` falla**, el **lint tiene 743 errores** (config no cubre `server/`) y **0% de tests**. Deuda controlable pero real (§3).

---

## 1. ¿Dónde vamos en el roadmap?

Reconstruido desde los 99 commits + estado real del código.

### ✅ Completado

| Área | Estado | Evidencia |
|------|--------|-----------|
| **Fase 0 — Seguridad** | ✅ | JWT httpOnly, `helmet`, `express-rate-limit`, CORS con whitelist, bcrypt |
| **Fase 1 — Multi-tenancy DB** | ✅ | `Event`, `ClientAdmin`, `Guest.eventId`, `@@unique([eventId, code])` |
| **Fase 2 — Invitación dinámica** | ✅ | `/:slug` carga de DB, `?code=` precarga invitado, `EventContext` |
| **Fase 3 — Panel cliente** | ✅ | `AdminDashboard`, CSV import (A1), filtros (A7), QR (G3), notas |
| **Fase 4+5 — Panel master + routing** | ✅ | `MasterDashboard`, wizard, CRUD eventos, duplicar (M1), archivar (M7) |
| **Fase 6 — Storage de assets** | ✅ | Vercel Blob, upload, compresión cliente (T3), bulk upload (M4) |
| **Deploy Vercel** | ✅ | `export default app`, sin `serverless-http`, binary targets |
| **Invitación: assets configurables** | ✅ | `AssetContext` + fallback chain (`INVITATION_IMPROVEMENT` Fase 2) |
| **Invitación: temas por evento** | ✅ | `ThemeContext` + CSS custom props, paletas, fuente serif Google (Fase 3, Fase 8) |
| **Invitación: labels/textos configurables** | ✅ | `config.sections`, labels dinámicos |
| **Toggles de visibilidad de sección** | ✅ | `show("showVerse")…` en `App.tsx` |
| **RSVP nativo in-app** | ✅ | G1 + M9 (`RSVPForm`), auto-decline acompañantes |
| **Extras** | ✅ | PWA (G5), .ics/calendario (G2), recordatorios WhatsApp (A5), insights globales (M8) |

### 🔲 Pendiente de los planes escritos

| Ítem | Plan origen | Por qué importa |
|------|-------------|-----------------|
| Modelo **`Template`** + herencia | INVITATION Fase 5 | Sin él, cada evento se configura desde cero. No hay "elegir plantilla". |
| **Secciones dinámicas** (`SECTION_REGISTRY`, drag-and-drop, reordenar/agregar) | INVITATION Fase 4 | Hoy las secciones están **hardcodeadas** en `App.tsx` (`InvitationSection1..9`). Solo se pueden **ocultar**, no reordenar ni añadir nuevas. |
| **Preview en tiempo real** (iframe + postMessage) | INVITATION Fase 6 | Existe `?preview=1` (M2) pero no el editor live lado-a-lado. |
| **Tests** (Vitest) | PLATAFORMA Fase 7 | 0% de cobertura. No hay red de seguridad para refactors. |
| **Fix overflow de nombres con `clamp()`** | INVITATION Fase 1.1 | Verificar si se aplicó; nombres largos aún pueden romper. |

### 🆕 No estaba en ningún plan (tu pedido de hoy)

- **Adaptar la plataforma a "toda ocasión"** (bodas, XV años, bautizos, baby shower, cumpleaños, corporativo…). Requiere abstraer el vocabulario boda-específico. → **§5, la fase nueva prioritaria.**

**Veredicto:** el proyecto pasó de "invitación única" a "plataforma multi-tenant de bodas" con éxito. El siguiente salto natural es de "plataforma de bodas" a **"plataforma de invitaciones para cualquier evento"**.

---

## 2. Review de arquitectura (lo bueno)

- **Separación limpia backend:** `server/app.js` (setup) → `index.js` (dev listen) / `api/server.js` (Vercel). Rutas por dominio (`auth`, `events`, `guests`, `admin`, `master`).
- **Multi-tenancy correcta:** todo filtra por `eventId`; `adminRoutes` fuerza `role === "client"` + `eventFilter(user)`; `masterRoutes` fuerza `requireMaster`. El aislamiento entre eventos está bien.
- **Auth sólida para el tamaño del proyecto:** JWT en cookie `httpOnly` + `secure` en prod + `sameSite: "lax"`, bcrypt, rate limit en `/api/auth`. Correcto.
- **Contextos React bien pensados:** `EventContext`, `ThemeContext`, `AssetContext`, `GuestContext` desacoplan datos de presentación. El fallback chain de assets (evento → default) es un buen patrón.
- **Config flexible sin romper schema:** `config`/`assets`/`theme` como `Json` permite evolucionar sin migraciones constantes.
- **Zod** en formularios y backend (T1), **error boundaries** por sección y panel (T2).

---

## 3. Review de calidad — deuda técnica (lo que hay que arreglar)

Ordenado por impacto.

### 🔴 P0 — Bloqueantes de mantenibilidad

1. **`pnpm type-check` FALLA.** Errores reales en `src/lib/generateICS.ts` (varios `string | undefined` no chequeados) y en `useGuests.ts` (`refetchInterval: number | undefined` incompatible con `exactOptionalPropertyTypes`). El build de prod es `vite build` (sin `tsc`), así que **estos errores no bloquean el deploy pero sí esconden bugs**. Un dato malo en un evento (sin fecha de ceremonia) puede reventar el `.ics` en runtime.
   - *Fix:* corregir los guardas de tipo y añadir `pnpm type-check` como paso obligatorio (pre-commit / CI).

2. **Lint roto: 743 errores.** La config de ESLint no declara el entorno Node para `server/**` → `'process' is not defined`, `no-unused-vars` en middlewares. Es ruido que **oculta problemas reales** y hace inútil el linter.
   - *Fix:* añadir bloque `files: ["server/**", "scripts/**", "api/**"]` con `globals.node` en `eslint.config.js`.

3. **0% de tests.** Ningún test unitario ni de integración. Con multi-tenancy y auth, un test que verifique "el evento A no ve invitados del evento B" vale oro.
   - *Fix:* Vitest + Supertest. Empezar por: aislamiento multi-tenant, `POST /auth/login` (roles), validación de código de invitado.

### 🟠 P1 — Seguridad / robustez

4. **CORS `origin: true` en producción.** Refleja *cualquier* origen con `credentials: true`. En Vercel front y API comparten dominio, así que en la práctica funciona, pero es más permisivo de lo necesario. Como las cookies son `sameSite: "lax"`, el riesgo real de CSRF es bajo — aun así conviene fijar el dominio explícito (`ALLOWED_ORIGIN`) también en prod. **Baja probabilidad, fácil de endurecer.**

5. **Sin CSRF token explícito.** Mitigado por `sameSite: "lax"` (protege POST cross-site), pero acciones destructivas del master (borrar evento) se benefician de doble verificación. Opcional según apetito de riesgo.

6. **Enumeración de login.** `/auth/login` responde igual para email inexistente y password incorrecto ("Credenciales incorrectas") — bien. Verificar que el tiempo de respuesta no filtre existencia (bcrypt.compare solo corre si hay user → timing diferencial menor). Aceptable.

### 🟡 P2 — Arquitectura / escala

7. **Secciones hardcodeadas en `App.tsx`.** El bloque `show("showPhotos") && <InvitationSection2 />` repite `showPhotos` para 3 secciones distintas (2, 4 y 9) — acoplamiento raro. El orden es fijo. Esto **bloquea** el objetivo de plantillas y reordenamiento (§ INVITATION Fase 4).

8. **`config` como `Json` sin tipado fuerte end-to-end.** Flexible, pero el backend arma `config` en `buildConfig(body)` a mano; un cambio de forma no da error de compilación. Un esquema Zod compartido cliente/servidor cerraría el hueco.

9. **`GuestManager` ya se dividió** (bien), pero `MasterDashboard.tsx` es ahora el componente monolítico grande. Vigilar.

10. **`generateICS.ts`, `compressImage.ts`, etc. sin tests** → funciones puras ideales para cubrir primero.

### 🟢 P3 — Housekeeping

- `@prisma/adapter-neon` sigue en deps sin usarse (según memoria) — remover.
- `src/lib/prisma.js.map` versionado — no debería estar en git.
- `.env` existe en el root pero **NO está trackeado** en git (está en `.gitignore`) — ✅ verificado, sin secretos expuestos.
- `font-serif` hardcodeado en ~30-40 usos (pendiente conocido en memoria).

---

## 4. Investigación: mejores prácticas de invitaciones digitales (2025–2026)

Síntesis de la investigación en fuentes del sector (Greenvelope, RSVPify, Paperless Post, Evite, mercado LATAM). Fuentes al final.

### 4.1 El principio rector: RSVP sin fricción
> El flujo ideal es **link → ver invitación → tap RSVP → listo**, sin crear cuenta. **+70% de las invitaciones se abren primero en el móvil.**

**Ya lo cumples** con `?code=` (salta pantalla de código) y RSVP nativo. ✅ Mantener y proteger este flujo en cualquier refactor.

### 4.2 Mobile-first + tap targets grandes
Botones de RSVP grandes, formularios cortos, todo tocable con el pulgar. → Cruzar con un **audit de accesibilidad** (tamaños mínimos 44×44px, contraste WCAG AA).

### 4.3 QR como estándar (no opcional)
**49% de las parejas usaron QR en 2024** (era 20% en 2022). Ya tienes `GuestQRModal` (G3). Buenas prácticas confirmadas:
- QR → URL con código precargado (`/:slug?code=XXX`) que salta directo al RSVP. ✅ Ya lo soportas.
- Instrucción clara junto al QR ("Escanea para confirmar").
- No esconderlo al reverso.

### 4.4 WhatsApp-first es **crítico en LATAM**
En Colombia/México/LATAM la invitación **viaja por WhatsApp** y la confirmación se espera por ese canal. Tu integración WhatsApp (mensajes predefinidos, links masivos A5) está **perfectamente alineada** con el mercado. Es una ventaja competitiva; profundizarla (plantillas por evento, deep links `wa.me`) rinde más que features occidentales.

### 4.5 "Después del RSVP" es lo que diferencia (tendencia 2026)
La tendencia es pasar de *herramienta de invitación* a **plataforma de evento completa**: invitación + RSVP + engagement + contenido post-evento. Ideas con demanda probada:
- **Preguntas personalizadas en el RSVP:** restricciones alimentarias, selección de menú, transporte, canción sugerida, +1.
- **Galería colaborativa post-evento** (invitados suben fotos).
- **Estadísticas en vivo** para coordinar con catering/organizador. ✅ (ya tienes analytics).
- **Countdown, mapa interactivo, música** — ya presentes.

### 4.6 Multi-ocasión es la norma del mercado
Las plataformas líderes (Paperless Post, Evite, RSVPify, y las LATAM: invitas.co, eventobonito, invitameok) **no son de bodas: son de eventos**. Cubren boda, XV años, baby shower, bautizo, cumpleaños, corporativo, graduación, con **campos personalizados por tipo de evento**. Aquí es donde tu producto tiene el mayor upside sin explorar (→ §5).

### 4.7 Diseño 2025–2026
Envelope/opening animations (Paperless Post), paletas suaves (blush, lavanda, marfil) y también dark/lujo (tu estética navy+oro ya es diferenciadora), respuestas con emoji, plantillas por ocasión.

---

## 5. 🎯 Propuesta de arquitectura ADAPTATIVA (multi-ocasión)

**Objetivo:** que la misma plataforma sirva para boda, XV años, bautizo, baby shower, cumpleaños, aniversario y evento corporativo — sin duplicar código y sin que "novio/novia" aparezca en un bautizo.

### 5.1 El problema hoy
El dominio está **cableado a boda** en 3 capas:
- **DB:** `Event.groomName`, `Event.brideName`, `ceremonyTime`, `receptionTime`.
- **Config:** `parentsBride`, `parentsGroom`, `godparents`, `bridesmaids`, `groomsmen`, `ceremony`/`reception`.
- **UI:** labels "¡NOS CASAMOS!", "CEREMONIA", "Padres de la novia", secciones `family`/`venues`/`rsvp` pensadas para boda.

### 5.2 Idea central: **`EventType` + protagonistas genéricos**

Introducir un modelo `EventType` (o enum + config) que define, por ocasión:
1. **Vocabulario / roles de protagonista** (`honorees`): boda = 2 (novio, novia); XV = 1 (quinceañera); bautizo = 1 (bebé) + padres/padrinos; corporativo = 0 protagonistas, 1 organizador.
2. **Secciones por defecto** que aplican a esa ocasión.
3. **Labels por defecto** (i18n-friendly).
4. **Campos de RSVP** relevantes (menú, transporte, etc.).

```prisma
model EventType {
  id             String  @id @default(cuid())
  slug           String  @unique   // "wedding" | "quinceanera" | "baptism" | "birthday" | "corporate"
  name           String            // "Boda", "XV Años", "Bautizo"...
  honoreeSchema  Json    // define cuántos protagonistas y sus roles/labels
  defaultConfig  Json    // labels + secciones por defecto de la ocasión
  defaultTheme   Json
  isActive       Boolean @default(true)
  events         Event[]
}
```

### 5.3 Reemplazar `groomName/brideName` por `honorees: Json`

En vez de dos columnas boda-específicas, un array genérico:

```jsonc
// Event.honorees  (boda)
[
  { "role": "groom", "label": "Novio", "name": "Juan" },
  { "role": "bride", "label": "Novia", "name": "Jimena" }
]

// Event.honorees  (XV años)
[ { "role": "celebrant", "label": "Quinceañera", "name": "Laura Sofía" } ]

// Event.honorees  (bautizo)
[ { "role": "baby", "label": "Bautizado/a", "name": "Mateo" } ]

// Event.honorees  (corporativo)
[ { "role": "host", "label": "Organiza", "name": "Acme Corp" } ]
```

> **Migración segura:** mantener `groomName`/`brideName` como columnas legacy y poblar `honorees` desde ellas. Un helper `getHonorees(event)` da compatibilidad hacia atrás (eventos viejos siguen funcionando). Deprecar las columnas después.

### 5.4 Secciones como catálogo por ocasión (une esto con INVITATION Fase 4)

El `SECTION_REGISTRY` pendiente se vuelve **la palanca** de la multi-ocasión. Cada tipo de sección es agnóstico y recibe `config`; cada `EventType` define qué secciones trae por defecto:

| Sección (type) | Boda | XV | Bautizo | Cumpleaños | Corporativo |
|---|:--:|:--:|:--:|:--:|:--:|
| `hero` (título + frase) | ✅ | ✅ | ✅ | ✅ | ✅ |
| `honorees` (protagonistas) | ✅ | ✅ | ✅ | ✅ | – |
| `countdown` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `venues` (lugares) | ✅ | ✅ | ✅ | ✅ | ✅ |
| `timeline` (itinerario) | ✅ | ✅ | opt | opt | ✅ |
| `family` (padres/padrinos) | ✅ | ✅ | ✅ | – | – |
| `court` (damas/chambelanes) | – | ✅ | – | – | – |
| `rsvp` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `gifts` (mesa de regalos/sobres) | ✅ | ✅ | ✅ | ✅ | – |
| `agenda`/`speakers` | – | – | – | – | ✅ |
| `gallery` | ✅ | ✅ | ✅ | ✅ | ✅ |

Con esto, "agregar una ocasión nueva" = crear un `EventType` con su combinación de secciones + labels. **Cero código nuevo de UI** para la ocasión N+1.

### 5.5 Labels 100% desde config (ya casi lo tienes)
Ya migraste muchos labels a `config`. El paso final: que **ningún** string de dominio ("NOS CASAMOS", "CEREMONIA", "Padrinos") esté hardcodeado — todos vienen de `EventType.defaultConfig` + override del evento. Esto además te deja **i18n** casi gratis (es/en/pt) — otra tendencia del mercado.

### 5.6 Plantillas (Template) ortogonales a la ocasión
- `EventType` = **qué** se muestra (semántica: secciones, roles, labels).
- `Template` = **cómo** se ve (estética: colores, fuentes, assets, decoraciones).
- Un evento = `EventType` (boda) × `Template` (floral clásico / dark lujo / minimalista).

Esto multiplica el catálogo sin multiplicar el trabajo: 5 ocasiones × 4 plantillas = 20 combinaciones con ~9 componentes de sección.

---

## 6. Roadmap propuesto (próximos pasos, ordenados)

### 🥇 Fase A — Estabilización (1 semana) — *hacer antes que nada*
Baratísima y desbloquea todo lo demás con red de seguridad.
- [x] **`pnpm type-check` en verde** — arreglados 19 errores reales (generateICS, useGuests, ErrorBoundary `override`, PREVIEW_GUEST, CSVImportModal, GuestFormModal, MasterDashboard, labels).
- [x] **ESLint en verde** — ignora `generated/`/`lib/`, y `server/`·`scripts/`·`api/` reciben globals de Node (de 743 errores → 0).
- [x] `.env` no trackeado (verificado — está en `.gitignore`).
- [x] **Vitest montado + 15 tests** — validación Zod (`guestFormSchema`, `eventBasicSchema`, `extractZodErrors`) y parseo de horas del `.ics` (`parseTime`). Scripts: `pnpm test` / `pnpm test:watch`.
- [x] **CORS endurecido** — whitelist env-driven (`ALLOWED_ORIGIN` + `VERCEL_PROJECT_PRODUCTION_URL`/`VERCEL_URL`), con fallback permisivo solo si no hay allowlist configurada (no rompe prod).
- [x] **Limpieza** — `@prisma/adapter-neon` ya no estaba; `prisma.js.map` sacado de git + `*.js.map` en `.gitignore`; overflow de nombres **ya resuelto** con `clamp()` en Secciones 1 y 3.
- [ ] Tests de integración con DB de prueba: aislamiento multi-tenant, login por rol, validación de código (requieren fixture de Postgres — siguiente iteración).

> **Estado Fase A (Ago 2026): ✅ COMPLETADA.** `type-check`, `lint`, `build` y `test` todos en verde; CORS endurecido; limpieza hecha. Único pendiente no bloqueante: tests de integración con DB de prueba.

### 🥈 Fase B — Secciones dinámicas (2 semanas) — *INVITATION Fase 4*
Prerrequisito técnico de la multi-ocasión y de las plantillas.
- [ ] `SECTION_REGISTRY` (type → componente). Refactor `InvitationSection1..9` para recibir `config` como prop.
- [ ] Renderer que itera `event.sections` (con fallback al orden legacy si está vacío).
- [ ] Panel: drag-and-drop (`@dnd-kit`), toggle, agregar sección.

### 🥉 Fase C — Multi-ocasión (2–3 semanas) — *§5, tu pedido*
- [ ] Modelo `EventType` + `Event.honorees` (Json) + helper de compatibilidad legacy.
- [ ] Migrar labels de dominio restantes a config.
- [ ] Nuevas secciones: `honorees` (genérica), `court` (XV), `agenda`/`speakers` (corporativo).
- [ ] Seeds de 3–4 ocasiones (boda, XV, bautizo, cumpleaños) con sus secciones/labels.
- [ ] Wizard master: paso 0 = "¿Qué tipo de evento?" → precarga todo.

### Fase D — Plantillas (`Template`) (2 semanas) — *INVITATION Fase 5*
- [ ] Modelo `Template` + herencia (spread `{...template, ...event}`).
- [ ] 2–3 plantillas: "Dark Lujo" (actual), "Floral Clásico", "Minimalista".
- [ ] Selector visual con thumbnail al crear evento.

### Fase E — Engagement & mercado (continuo)
- [ ] RSVP con preguntas personalizadas (menú, transporte, canción) — alta demanda LATAM.
- [ ] Preview live lado-a-lado (iframe + postMessage) — INVITATION Fase 6.
- [ ] i18n es/en/pt (casi gratis tras Fase C).
- [ ] Galería colaborativa post-evento.
- [ ] Deep links WhatsApp por evento / mesa de regalos.

**Ruta crítica:** A → B → C → D. E se intercala en paralelo. La Fase A es el mejor ROI: 1 semana que evita bugs de producción y da tests antes de refactorizar todo.

---

## 7. Fuentes de la investigación

- [10 Best Digital Invitation Platforms 2026 — Greenvelope](https://www.greenvelope.com/resources/best-digital-invitation-platforms)
- [12 Best Online Invitation Makers 2026 — RSVPify](https://rsvpify.com/best-online-invitation-makers-2026/)
- [Digital Invitation Design Tips 2026 — InviteDrop](https://www.invitedrop.com/blog/digital-invitation-design-tips)
- [Best Digital Invitation Apps 2026 — Fotify](https://fotify.app/blog/best-digital-invitation-apps-2026/)
- [Best Free Invitations with RSVP Tracking 2026 — Fotify](https://fotify.app/blog/best-free-online-invitations-with-rsvp-2026/)
- [Paperless Post vs Greenvelope — Lemonvite](https://www.lemonvite.com/blog/paperless-post-vs-greenvelope)
- [Compare Digital Invitation Platforms — Greenvelope](https://www.greenvelope.com/compare)
- [QR Codes for Wedding RSVP — Uniqode](https://www.uniqode.com/blog/qr-codes-for-occasions/qr-codes-for-wedding-rsvp)
- [How to Use QR Codes for RSVPs 2026 — Bitly](https://bitly.com/blog/qr-code-rsvp/)
- [Adiós a las invitaciones impresas: gestión digital en LATAM — APTIE](https://aptie.org/noticias-sobre-tendencias/adios-a-las-invitaciones-impresas-la-gestion-digital-revoluciona-las-bodas-en-america-latina/)
- [Invitación digital boda WhatsApp 2026 — VeamosLasFotos](https://www.veamoslasfotos.com/post/invitacion-digital-boda-whatsapp-link)
- [Invitaciones digitales con confirmación WhatsApp — invitas.co](https://invitas.co/)
- [Quinceañera Invitations & RSVP — RSVPify](https://rsvpify.com/quinceanera/)
- [Event Types — EventCreate](https://www.eventcreate.com/types)

---

*Documento vivo. Actualizar al cerrar cada fase.*
