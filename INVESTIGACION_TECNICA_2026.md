# Herramientas y librerías para construir lo que falta — investigación técnica 2026

> 15 búsquedas sobre librerías, servicios y APIs del navegador, evaluadas **contra las
> restricciones reales de este proyecto**, no en abstracto. Fuentes en §13.
>
> Pareja de `INVESTIGACION_SISTEMA_COMPLETO_2026.md`, que dice *qué* construir.
> Este documento dice *con qué*.

---

## 1. La restricción que decide casi todo

Antes de recomendar nada hay que fijar el terreno:

```
Frontend  React 19 · Vite 7 · Tailwind 3 · @dnd-kit · Motion (framer-motion 12) · React Query 5
Backend   Express 5 como UNA función serverless en Vercel, maxDuration: 30 s
DB        PostgreSQL en Neon vía Prisma
PWA       manifest.json presente, SIN service worker
```

**El servidor no es un proceso que viva.** Es una función que arranca, responde y muere.
Esto invalida de entrada media docena de recomendaciones que cualquier búsqueda genérica
daría por buenas, y es el filtro con el que está escrito todo lo que sigue.

---

## 2. Tiempo real: la respuesta corta es "todavía no WebSockets"

Pediste explícitamente secciones en vivo y websockets. La investigación da un resultado
más matizado que un sí o un no, y conviene entenderlo antes de escribir código.

### 2.1 Vercel SÍ soporta WebSockets desde junio de 2026… con letra pequeña

Vercel anunció **soporte nativo de WebSockets en beta pública el 22 de junio de 2026**,
compatible con `ws`, Socket.IO y **Express** entre otros. Suena perfecto. Los límites no lo
son tanto:

| Límite | Consecuencia para este producto |
|---|---|
| Conexión **fijada a una instancia**, que muere a los 5 min (30 min en beta Pro) | El panel en vivo se desconectaría sola cada pocos minutos |
| **Sin broadcast entre instancias** | Dos admins mirando el mismo evento pueden caer en funciones distintas y no verse |
| **Sin presencia**, sin garantías de entrega | Hay que construirlo todo a mano |
| Estado en memoria **no persiste** | Vercel recomienda Redis externo para estado compartido |

Traducido: para un panel donde el organizador ve entrar confirmaciones en vivo,
**WebSockets nativos en Vercel resuelven la mitad del problema y traen la otra mitad como
deuda**. Sin un Redis de pub/sub por encima, no hay difusión fiable.

### 2.2 Lo que el caso de uso realmente pide

Conviene separar los dos escenarios:

**a) Panel en vivo (organizador ve confirmaciones entrar).** El flujo es **solo
servidor → cliente**. Para eso el consenso de 2026 es claro: **Server-Sent Events**, no
WebSockets. SSE trae **reconexión automática y reanudación con `Last-Event-ID` de serie**;
con WebSockets ese mecanismo hay que reinventarlo. Además va sobre HTTP normal, sin tocar
proxies ni balanceadores.

**Pero** SSE en Vercel choca con el mismo muro: la conexión se corta al llegar al
`maxDuration` (hoy **30 s** en `vercel.json`; el techo de la plataforma es 300 s). Un SSE de
5 minutos con reconexión automática es viable subiendo `maxDuration`, y el navegador
reconecta solo — pero cada reconexión es una invocación nueva que se factura.

**b) Check-in en la puerta.** Aquí sí hay escritura desde el cliente, pero es de baja
frecuencia y **tolera latencia**. No necesita socket: una petición normal basta.

### 2.3 Recomendación, en orden de coste

1. **Quedarse en polling de React Query para el panel en vivo.** Ya existe (`refetchInterval`
   de 10 s en modo en vivo) y es la opción correcta hoy: cero infraestructura, cero coste
   fijo, funciona con serverless sin pelearse. Para 1–3 admins mirando una boda, la
   diferencia perceptible frente a un socket es **nula**.
2. **Si se quiere reducir la latencia**, subir a SSE con `maxDuration` a 300 s antes que a
   WebSockets. Menos piezas, reconexión gratis.
3. **Si algún día hace falta difusión real** (varios dispositivos de puerta sincronizados),
   la pieza que falta es un **pub/sub externo**, no un socket: Upstash Redis está en el
   Marketplace de Vercel, tiene **API REST** —clave, porque funciona donde no hay TCP— y
   cobra por comando (**500K/mes gratis**, luego ~$0.20 por 100K).
4. **Servicios gestionados** (Ably, Pusher, Liveblocks, PartyKit) solo si el producto crece a
   colaboración multiusuario. Para referencia: Pusher da 200K mensajes/día y 200 conexiones
   gratis; Ably factura por horas-conexión (~$30/mes en su tramo Growth). **Hoy sería pagar
   por un problema que no se tiene.**

> **Conclusión honesta:** "secciones en vivo" ya funciona con lo que hay. Migrar a
> WebSockets sería más complejidad, más coste y más modos de fallo, a cambio de una mejora
> que ningún organizador de bodas va a notar. Lo dejo documentado para retomarlo si el
> producto cambia de escala.

---

## 3. Mapeo de mesas: la decisión técnica principal

### 3.1 Arrastrar y soltar: quedarse donde estamos

**`@dnd-kit` sigue siendo la recomendación por defecto para React en 2026** — es el estándar
de facto, con la mejor documentación y el ecosistema más amplio. Ya está en el proyecto
(el `LayoutBuilder` lo usa). **No hay que cambiar nada.**

*Aviso:* hay un issue abierto sobre el `"use client"` en `@dnd-kit/react` para React 19.
No afecta aquí (no hay Server Components), pero conviene saberlo.

`Pragmatic drag-and-drop` (Atlassian) solo compensaría con miles de elementos o arrastre de
archivos externos. No es el caso: una boda tiene 20 mesas.

### 3.2 El lienzo: dos caminos, y el barato es el bueno

Aquí está la decisión real. Un plano de mesas necesita pan, zoom, hit-testing y capas.

**Opción A — SVG + `@dnd-kit`, sin dependencias nuevas.** Las mesas son círculos y
rectángulos posicionados en coordenadas. Para 20–30 mesas, el DOM/SVG va sobrado, es
accesible, se puede estilar con Tailwind y se imprime bien.

**Opción B — `react-konva` (Konva.js).** Es *la* librería de lienzo 2D para React: formas,
arrastre, eventos y capas de forma declarativa, con un ejemplo oficial de **plano interactivo
de edificio**. Existe además `Floorcraft`, un planificador de plantas open source en
**React 19 + TypeScript + Vite** —el mismo stack— construido sobre Konva, útil como
referencia.

**Recomendación: empezar por A.** Konva pesa y mete el plano en un `<canvas>`, lo que
significa perder accesibilidad, selección de texto y estilado por CSS. Se justifica cuando
haya que dibujar paredes, puertas y plantas complejas. Para "12 mesas redondas y una
presidencial", SVG es más simple, más accesible y más fácil de imprimir.

### 3.3 Auto-asignación: no todavía

Ver `INVESTIGACION_SISTEMA_COMPLETO_2026.md` §3.4. Cuando llegue, no hace falta librería:
un *greedy* con puntuación sobre las restricciones "juntos/separados" resuelve el caso real.

---

## 4. Check-in en la puerta: escanear QR en el navegador

El producto ya **genera** QR con `qrcode.react`. Falta **leerlos**.

| Opción | Valoración |
|---|---|
| **`BarcodeDetector` nativo** | Cero KB, aceleración del sistema. Soporte irregular en Safari/Firefox → necesita respaldo |
| **`@yudiel/react-qr-scanner`** | Moderno, hooks de React, construido **sobre la API nativa** con respaldo. **Mejor encaje** |
| **`html5-qrcode`** | Muy popular y multiplataforma, usa ZXing por debajo. Más pesado, API imperativa |
| **`jsQR`** | Ya no se mantiene activamente. Evitar |

**Recomendación:** `@yudiel/react-qr-scanner`, que usa lo nativo cuando existe. Y el escáner
**no puede ser la única vía**: hace falta siempre búsqueda por nombre — cámaras que fallan,
permisos denegados y pantallas rotas son la norma en una puerta.

---

## 5. Offline: lo que de verdad se necesita en un salón

`INVESTIGACION_SISTEMA_COMPLETO_2026.md` §8 documenta que los salones tienen mala cobertura.
La receta estándar son tres capas:

1. **Service worker** — `vite-plugin-pwa` (envuelve Workbox). El proyecto ya tiene
   `manifest.json`, así que **falta solo esta pieza** para ser PWA de verdad.
2. **IndexedDB como fuente local** — **Dexie.js** reduce el código de integración ~70% frente
   a la API cruda y ofrece *live queries* que re-renderizan solos al cambiar el dato.
3. **Cola de escrituras** — `workbox-background-sync` encola las peticiones fallidas y las
   reintenta al volver la red.

Aviso de campo: hay issues reportados con Background Sync en `vite-plugin-pwa`, y el API no
está en todos los navegadores. **Plan B fiable:** cola propia en IndexedDB vaciada al
detectar `online`. Menos elegante, funciona en todas partes.

---

## 6. Notificaciones push: la trampa de iOS

Tentador para sustituir WhatsApp. **No lo hace**, y conviene saberlo antes de invertir:

- En iOS solo funcionan si el usuario **instaló la PWA** con "Añadir a pantalla de inicio".
  Una pestaña abierta **no cuenta**.
- Entrega en iOS del **70–85%**, frente al 90–95% de Android.
- **En la UE, Apple rompió el modo standalone de las PWA en 2024: el push no funciona.**

Contrástalo con el dato del otro documento: **WhatsApp/SMS abren >80%**. Para invitados —que
nunca van a instalar una PWA para ir a una boda— **WhatsApp gana sin discusión**. El push
solo tendría sentido para el *organizador*, que sí usa la herramienta a diario. Si se hace,
`web-push` en Node con VAPID; implementar el cifrado a mano es propenso a errores.

---

## 7. Experiencia de usuario: lo que ya se tiene y lo que falta

### Animación — nada que cambiar, pero renombrar
`framer-motion` **pasó a llamarse `motion`** al independizarse en 2025; los imports actuales
van a `motion/react`. El proyecto está en `framer-motion@12`, que funciona. Migrar es un
cambio de import, no de código. El build de React pesa ~31 KB gzip.

### React 19: `useOptimistic` está sin usar y es la mejora de UX más barata
El proyecto ya está en React 19 pero no aprovecha `useOptimistic`, que actualiza la interfaz
**antes** de que responda el servidor y **revierte solo** si falla. Encaja exactamente en:

- Confirmar/desconfirmar un invitado en el panel
- Marcar acompañantes
- Arrastrar una mesa

Buena práctica documentada: **marcar visualmente lo optimista** (opacidad o spinner) para
que se distinga lo confirmado de lo que va en vuelo.

`<ViewTransition>` de React sigue siendo **experimental**; la API del navegador ya tiene
soporte amplio. Se puede usar con CSS puro sin depender del componente de React.

### Tablas — solo si la lista crece
La tabla de invitados es a mano y funciona. **TanStack Table** (headless, MIT, ~30 KB con
virtualización) es la evolución natural si llega la ordenación y filtrado por columna.
**AG Grid queda descartado**: 665 KB y licencia desde $999/desarrollador para lo Enterprise.
Una boda tiene 150 invitados, no 100.000.

### Galería
`yet-another-react-lightbox` está bien mantenida y es la base de los ejemplos de
`react-photo-album`. `react-image-lightbox` **está abandonada** — no usarla.
`react-masonry-css` para el mosaico. El proyecto ya comprime en cliente (`compressImage.ts`),
que es lo importante para subidas desde el móvil.

### CSV
**PapaParse** es el único parser maduro pensado para el navegador con streaming (~2.1M
descargas semanales). Es lo que falta para el **export de respuestas al catering**.
Para exportar basta con generar el CSV a mano y un `Blob` — no hace falta librería.

---

## 8. Mapas: la opción gratis es la correcta

| Opción | Coste |
|---|---|
| **Google Maps Embed API** | **Uso ilimitado sin coste** (un `<iframe>`) |
| Leaflet + OSM | Gratis a cualquier escala, sin API key, pero más código |
| Google Maps JS API | 10.000 eventos/mes gratis por API desde marzo 2025, luego se paga |

**Recomendación: Embed API.** El caso de uso es "mostrar dónde es la fiesta". El evento ya
guarda `mapsUrl`; convertirlo en un `<iframe>` es un bloque nuevo y **cero dependencias**.
Leaflet solo si algún día hace falta dibujar sobre el mapa.

---

## 9. Multi-idioma: compilado, no en runtime

Relevante para bodas de destino (§6 del otro documento).

| Librería | Bundle | Enfoque |
|---|---|---|
| **LinguiJS** | **~2 KB** gzip, cero dependencias | Compila en build, tree-shaking automático |
| **Paraglide** | 47 KB vs 205 KB de i18next en un caso comparado | Compila a funciones tipadas |
| react-i18next | 13,8 KB gzip | Runtime, ecosistema enorme |

Para una invitación pública —donde cada KB se paga en móvil con mala red— **la familia
compilada (Lingui o Paraglide) es claramente mejor** que el clásico i18next. Paraglide da
además autocompletado por clave.

---

## 10. Calidad: lo que le falta al gate

El gate actual (tsc + eslint + 68 tests unitarios + build) no prueba nada de lo que el
usuario ve. Dos piezas lo cerrarían:

**Playwright.** Ya se está usando su Chromium por CDP para verificar a mano (ver `CLAUDE.md`
§6). Formalizarlo convierte ese trabajo manual en regresión automática. Tiene además
*component testing* experimental para React.

**`@axe-core/playwright`** — el paquete **oficial** de Deque (`axe-playwright`, sin arroba,
es de la comunidad y otra API). Audita el DOM real contra WCAG 2.2. La estrategia
recomendada: **fallar en CI solo por violaciones critical y serious**, y pasar el escaneo
completo en builds nocturnas.

---

## 11. Resumen: qué instalar y qué no

### Instalar cuando toque la función
| Paquete | Para | Cuándo |
|---|---|---|
| `papaparse` | Export/import CSV al catering | Ya — cierra el ciclo del RSVP |
| `@yudiel/react-qr-scanner` | Leer QR en la puerta | Con el check-in |
| `vite-plugin-pwa` | Service worker | Con el modo offline |
| `dexie` | Cola local del check-in | Con el modo offline |
| `@playwright/test` + `@axe-core/playwright` | E2E y accesibilidad | Cuando se quiera blindar |
| `yet-another-react-lightbox` | Galería colaborativa | Con la galería |
| `@lingui/core` o Paraglide | Multi-idioma | Si llega la boda de destino |

### NO instalar
| Descartado | Por qué |
|---|---|
| `ws` / Socket.IO | Vercel los soporta, pero sin broadcast ni presencia: media función y deuda. Polling ya sirve |
| Ably / Pusher / Liveblocks | Coste fijo por un problema que el producto no tiene |
| AG Grid | 665 KB y licencia de pago para 150 invitados |
| `react-konva` | Mete el plano en canvas y pierde accesibilidad. SVG basta |
| `react-image-lightbox` | Abandonada |
| `jsQR` | Sin mantenimiento activo |
| Google Maps JS API | La Embed API es gratis para este caso |
| Web Push para invitados | Roto en la UE, requiere instalar la PWA, 70–85% de entrega |

### Gratis, sin instalar nada
- **`useOptimistic`** (React 19, ya disponible) — la mejora de UX más barata del documento
- **Google Maps Embed** — un `<iframe>`
- **SVG + `@dnd-kit`** para el plano de mesas
- **View Transitions** por CSS

---

## 12. Orden sugerido

1. **`useOptimistic`** en confirmar invitado y acompañantes. Horas, se nota de inmediato.
2. **`papaparse`** → export para catering. Cierra el RSVP que ya existe.
3. **Plano de mesas en SVG + `@dnd-kit`**, sobre el cimiento de asistentes.
4. **Mapa embebido** — un bloque, cero dependencias.
5. **Playwright + axe** para blindar lo construido.
6. **Check-in**: escáner QR + PWA offline con Dexie.
7. Galería colaborativa, y multi-idioma si aparece la demanda.

**Nada de esto necesita WebSockets.**

---

## 13. Fuentes

**Tiempo real**
[Vercel — WebSockets en beta pública](https://vercel.com/changelog/websocket-support-is-now-in-public-beta) ·
[Vercel — docs de WebSockets](https://vercel.com/docs/functions/websockets) ·
[Ably — WebSockets en Vercel: límites y opciones](https://ably.com/vercel/websockets-on-vercel) ·
[Ably — WebSockets vs SSE](https://ably.com/blog/websockets-vs-sse) ·
[Nimble — SSE vs WebSockets 2026](https://www.nimbleway.com/blog/server-sent-events-vs-websockets-what-is-the-difference-2026-guide) ·
[CoderCops — elegir transporte en 2026](https://blog.codercops.com/blog/server-sent-events-vs-websockets-2026) ·
[WebSocket.org — servicios gestionados comparados](https://websocket.org/comparisons/managed-services/) ·
[BuildMVPFast — precios de realtime](https://www.buildmvpfast.com/api-costs/realtime) ·
[PkgPulse — Liveblocks vs PartyKit vs Hocuspocus](https://www.pkgpulse.com/guides/liveblocks-vs-partykit-vs-hocuspocus-realtime-2026) ·
[Upstash — precios](https://upstash.com/docs/realtime/overall/pricing) ·
[Upstash en el Marketplace de Vercel](https://vercel.com/marketplace/upstash)

**Lienzo y arrastrar/soltar**
[react-konva](https://github.com/konvajs/react-konva) ·
[Konva — plano interactivo de edificio](https://konvajs.org/docs/sandbox/Interactive_Building_Map.html) ·
[Floorcraft — planificador open source en React 19 + Vite](https://github.com/rcasto123/Floorcraft) ·
[PkgPulse — dnd-kit vs react-beautiful-dnd vs Pragmatic DnD](https://www.pkgpulse.com/guides/dnd-kit-vs-react-beautiful-dnd-vs-pragmatic-drag-drop-2026) ·
[Puck — top 5 librerías de DnD](https://puckeditor.com/blog/top-5-drag-and-drop-libraries-for-react) ·
[dnd-kit — issue de React 19](https://github.com/clauderic/dnd-kit/issues/1654)

**QR, PWA y push**
[html5-qrcode](https://github.com/mebjas/html5-qrcode) ·
[@yudiel/react-qr-scanner](https://www.npmjs.com/package/@yudiel/react-qr-scanner) ·
[Scanbot — jsQR y qr-scanner](https://scanbot.io/techblog/javascript-qr-code-scanner-jsqr-qr-scanner-tutorial/) ·
[Rohit Raj — patrones offline-first](https://rohitraj.tech/en/notes/pwa-offline-sync) ·
[WellAlly — PWA offline con React, Dexie y Workbox](https://www.wellally.tech/blog/build-offline-pwa-react-dexie-workbox) ·
[vite-plugin-pwa — issue de Background Sync](https://github.com/vite-pwa/vite-plugin-pwa/issues/739) ·
[MagicBell — límites de PWA en iOS](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide) ·
[MobiLoud — PWA en iOS 2026](https://www.mobiloud.com/blog/progressive-web-apps-ios)

**UX y librerías de interfaz**
[Motion (ex Framer Motion)](https://motion.dev/) ·
[Epic React — useOptimistic](https://www.epicreact.dev/use-optimistic-to-make-your-app-feel-instant-zvyuv) ·
[DEV — patrones de useOptimistic 2026](https://dev.to/stacknotice/react-useoptimistic-optimistic-ui-patterns-that-actually-work-2026-5460) ·
[Simple Table — TanStack Table vs AG Grid](https://www.simple-table.com/blog/tanstack-table-vs-ag-grid-comparison) ·
[TanStack Table — virtualización](https://tanstack.com/table/v8/docs/guide/virtualization) ·
[Yet Another React Lightbox](https://yet-another-react-lightbox.com/) ·
[LogRocket — lightboxes de React comparados](https://blog.logrocket.com/comparing-the-top-3-react-lightbox-libraries/) ·
[PkgPulse — PapaParse vs csv-parse vs fast-csv](https://www.pkgpulse.com/guides/papaparse-vs-csv-parse-vs-fast-csv-parsing-2026)

**Mapas, i18n y calidad**
[Cost-Saver — Leaflet vs Google Maps](https://www.cost-saver.co.uk/blog/leaflet-vs-google-maps-mapping-tool-local-service-providers) ·
[WPGMaps — alternativas a Google Maps API](https://www.wpgmaps.com/7-google-maps-api-alternatives-for-2026/) ·
[Paraglide JS](https://github.com/opral/paraglide-js) ·
[Tolgee — librerías i18n de React comparadas](https://tolgee.io/blog/react-i18n-libraries-comparison) ·
[QASkills — Playwright + axe](https://qaskills.sh/blog/playwright-accessibility-testing-axe-complete-guide) ·
[TestDino — accesibilidad en CI con Playwright](https://testdino.com/blog/playwright-accessibility)
