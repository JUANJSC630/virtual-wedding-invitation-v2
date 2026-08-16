# Arquitectura de Secciones Dinámicas
> Diseño · Agosto 2026 · Objetivo: que las secciones se puedan **reordenar, editar, crear y borrar** desde el panel, en vez de estar hardcoded en `App.tsx`.
> Reemplaza y concreta la "Fase 4" de `INVITATION_IMPROVEMENT_PLAN.md`.

---

## 1. Review sección por sección (estado actual)

Hoy la invitación son 10 componentes fijos (`InvitationSection1..9` + `Gallery`) renderizados en orden fijo en [App.tsx](src/App.tsx), controlados solo por toggles `show(...)`. Inventario real de lo que lee cada uno:

| # | Componente | Rol (tipo de bloque) | Lee de `config`/`event` | Assets decorativos |
|---|-----------|----------------------|------------------------|--------------------|
| 1 | `InvitationSection1` | **hero** — frase/versículo + iniciales + anuncio | verse, announcementText, honorees | background, cornerFlower, bouquet |
| 2 | `InvitationSection2` | **photo-torn** — foto con papel rasgado | photo2Url | background, tornPaper |
| 3 | `InvitationSection3` | **names** — nombres + mensaje + música | honorees, heroMessage, audioUrl | background, sideBouquet |
| 4 | `InvitationSection4` | **photo-flowers** — foto con flores | photo3Url | background, flowers, tornPaper |
| — | `InvitationSectionGallery` | **gallery** — grid de fotos | config.gallery, labels.galleryTitle | background |
| 5 | `InvitationSection5` | **family** + **countdown** (¡mezclados!) | parents, godparents, corte, labels, eventDate | background |
| 6 | `InvitationSection6` | **venues** — ceremonia/recepción + dress code + add-to-calendar | ceremony, reception, dressCode, times | background, church, glasses |
| 9 | `InvitationSection9` | **photo-hero** — foto principal | heroPhotoUrl | background, tornPaper |
| 7 | `InvitationSection7` | **timeline** — itinerario | config.timeline, labels | background, church, glasses, dinner, reception, waltz, decorLine |
| 8 | `InvitationSection8` | **rsvp** — confirmación + regalos + contacto WA | phones, WA msgs, giftMessage, rsvpMode, deadline, labels | background, gift, envelope, sideBouquet |

### Problemas concretos detectados
1. **Orden fijo y raro:** en `App.tsx` el orden real es 1,2,3,4,Gallery,5,6,**9**,7,8 — S9 está intercalada entre S6 y S7 por código. No se puede cambiar sin editar el JSX.
2. **Toggles acoplados:** `show("showPhotos")` controla **3 secciones distintas** (S2, S4, S9) a la vez — no se pueden mostrar/ocultar por separado.
3. **Responsabilidades mezcladas:** S5 hace **familia Y countdown** en un solo componente. El countdown debería ser su propio bloque reordenable.
4. **No se pueden repetir bloques:** no puedes tener 2 galerías o 3 fotos en posiciones arbitrarias.
5. **No se pueden crear bloques nuevos** sin tocar `App.tsx` y agregar imports.
6. **La config es plana:** los datos de cada sección viven sueltos en `config` (no agrupados por instancia de bloque), así que dos bloques del mismo tipo compartirían datos.

**Conclusión:** el modelo actual (componentes fijos + toggles) topó su techo. Para "reordenar/crear/editar" hace falta pasar a un **modelo de bloques dirigido por datos** (data-driven).

---

## 2. El cambio de arquitectura: de componentes fijos a registro de bloques

### 2.1 Idea central
La invitación pasa a ser un **array ordenado de instancias de bloque**, cada una con su `type`, su `config` propia y su `enabled`. El frontend tiene un **registro** (`SECTION_REGISTRY`) que mapea `type → componente React`. Un **renderer** itera el array y pinta cada bloque.

```
Hoy:   App.tsx  →  <Section1/> <Section2/> ... (fijo)
Nuevo: event.layout = [ {type:"hero"}, {type:"names"}, {type:"gallery"}, ... ]
       <BlockRenderer blocks={event.layout} />   (dinámico)
```

### 2.2 Modelo de datos (guardado en `config.layout`, sin migración de DB)

Igual que en Fase C, esto vive dentro de la columna `config` (Json) que ya existe → **cero migración**.

```jsonc
// event.config.layout : BlockInstance[]
[
  { "id": "b1", "type": "hero",     "enabled": true, "config": { "announcementText": "¡NOS CASAMOS!" } },
  { "id": "b2", "type": "photo",    "enabled": true, "config": { "src": "https://…", "frame": "torn", "aspect": "9/16" } },
  { "id": "b3", "type": "names",    "enabled": true, "config": {} },
  { "id": "b4", "type": "countdown","enabled": true, "config": { "title": "Faltan" } },
  { "id": "b5", "type": "gallery",  "enabled": true, "config": { "title": "Recuerdos", "photos": [...] } },
  { "id": "b6", "type": "family",   "enabled": true, "config": { /* labels + arrays */ } },
  { "id": "b7", "type": "venues",   "enabled": true, "config": {} },
  { "id": "b8", "type": "timeline", "enabled": true, "config": { "items": [...] } },
  { "id": "b9", "type": "rsvp",     "enabled": true, "config": {} }
]
```

- El **orden del array** = orden en pantalla (sin campo `order` que mantener).
- `config` es **por instancia** → puedes tener 3 bloques `photo` con fotos distintas.
- Compatibilidad: si `config.layout` no existe, el renderer usa el **orden legacy** actual (no rompe eventos existentes).

### 2.3 El registro de bloques

```tsx
// src/blocks/registry.ts
export const SECTION_REGISTRY = {
  hero:      { component: HeroBlock,      label: "Portada",        icon: "✨" },
  photo:     { component: PhotoBlock,     label: "Foto",           icon: "🖼️" },   // absorbe S2/S4/S9 (variante por config.frame)
  names:     { component: NamesBlock,     label: "Protagonistas",  icon: "💗" },
  countdown: { component: CountdownBlock, label: "Cuenta regresiva", icon: "⏳" }, // extraído de S5
  gallery:   { component: GalleryBlock,   label: "Galería",        icon: "📸" },
  family:    { component: FamilyBlock,    label: "Familia",        icon: "👪" },
  venues:    { component: VenuesBlock,    label: "Lugares",        icon: "📍" },
  timeline:  { component: TimelineBlock,  label: "Itinerario",     icon: "🕒" },
  rsvp:      { component: RsvpBlock,      label: "Confirmación",   icon: "✅" },
  // ── nuevos (del catálogo de research) ──
  story:     { component: StoryBlock,     label: "Nuestra historia", icon: "📖" },
  faq:       { component: FaqBlock,       label: "Preguntas frecuentes", icon: "❓" },
  registry:  { component: RegistryBlock,  label: "Mesa de regalos", icon: "🎁" },
  map:       { component: MapBlock,       label: "Mapa",           icon: "🗺️" },
  text:      { component: TextBlock,      label: "Texto libre",    icon: "📝" },
  divider:   { component: DividerBlock,   label: "Separador",      icon: "➖" },
  video:     { component: VideoBlock,     label: "Video",          icon: "🎬" },
} as const;

export type BlockType = keyof typeof SECTION_REGISTRY;
```

### 2.4 El renderer (reemplaza el JSX fijo de App.tsx)

```tsx
function BlockRenderer({ blocks }: { blocks: BlockInstance[] }) {
  return blocks
    .filter(b => b.enabled)
    .map(b => {
      const entry = SECTION_REGISTRY[b.type];
      if (!entry) return null; // tipo desconocido → se ignora (forward-compat)
      const Block = entry.component;
      return (
        <SectionErrorBoundary key={b.id}>
          <Block config={b.config} />
        </SectionErrorBoundary>
      );
    });
}

// App.tsx:
const layout = event?.config?.layout ?? LEGACY_LAYOUT; // fallback no-destructivo
<BlockRenderer blocks={layout} />
```

### 2.5 Refactor de los componentes de sección → bloques
Cada `InvitationSectionN` se vuelve un `XBlock` que recibe **`config` por props** (no solo del `EventContext`). Regla: el bloque lee su instancia (`config`) primero, y cae a `EventContext`/defaults de ocasión para lo global (honorees, tema, assets). Esto conserva toda la lógica multi-ocasión de Fase C.

Cambios estructurales necesarios:
- **Separar `countdown` de `family`** (S5) en dos bloques.
- **Unificar `photo`** (S2/S4/S9) en un bloque con `config.frame: "torn" | "flowers" | "hero"` y `config.src`.
- **`gallery`, `timeline`, `rsvp`, `venues`, `family`, `hero`, `names`** → un bloque cada uno.

---

## 3. El editor (admin builder) — cómo se ve para el manager

Nueva pestaña **"Diseño"** en el panel (master + cliente):

```
┌─────────────────  [ + Añadir bloque ▾ ] ─────────┐
│ ⣿ Portada            👁 ✎ 🗑 │   (lista drag-and-drop
│ ⣿ Foto (rasgada)     👁 ✎ 🗑 │    reordenable)
│ ⣿ Protagonistas      👁 ✎ 🗑 │
│ ⣿ Cuenta regresiva   👁 ✎ 🗑 │   👁 = mostrar/ocultar
│ ⣿ Galería            👁 ✎ 🗑 │   ✎ = editar config del bloque
│ ⣿ Familia            👁 ✎ 🗑 │   🗑 = eliminar
│ ⣿ Lugares            👁 ✎ 🗑 │
│ ⣿ Itinerario         👁 ✎ 🗑 │   ⣿ = handle para arrastrar
│ ⣿ Confirmación       👁 ✎ 🗑 │
└──────────────────────────────┘
        │  al hacer ✎ →  panel lateral con el formulario
        │                específico de ese tipo de bloque
        ▼
   [ Vista previa en vivo — iframe a /slug?preview=1 ]
```

- **Reordenar:** drag-and-drop (`@dnd-kit/sortable`).
- **Añadir:** menú con los tipos del `SECTION_REGISTRY` (con ícono y label).
- **Editar:** al hacer ✎, se abre el **form específico del tipo** (cada bloque declara sus campos).
- **Preview en vivo:** iframe a la invitación en modo preview que refresca al guardar.
- **Guardar:** `PATCH /api/master/events/:id` con `config.layout` actualizado (el endpoint ya persiste `config`).

---

## 4. Dos caminos de implementación

### Opción A — **Custom con `@dnd-kit`** (control total, más trabajo)
- Construimos el registro, el renderer, la lista drag-and-drop y los forms por tipo a mano.
- **Pros:** 100% a medida, se integra con nuestros contextos (tema/assets/ocasión) sin fricción, bundle pequeño, estética propia.
- **Contras:** más código (lista DnD, panel de edición, preview). ~2-3 semanas.
- `@dnd-kit` es el estándar 2026 para DnD en React (liviano, soporta React 19).

### Opción B — **Puck** (`@measured/puck`, editor visual MIT)
- Puck es un **editor visual open-source para React**: le das tus componentes + su config de campos, y él te da el canvas drag-and-drop, el panel de edición y el output **JSON**. Self-hosted, sin lock-in.
- **Pros:** el editor (DnD + panel de campos + preview) viene hecho; defines componentes y campos y listo. Menos código de UI. Output JSON encaja con nuestro `config.layout`.
- **Contras:** dependencia adicional; su modelo de datos y estilos hay que adaptarlos a nuestros contextos (tema/assets/ocasión) y a la estética; curva de aprendizaje de su API de `fields`.
- Ideal si queremos el builder rápido y robusto sin reinventar el editor.

### Recomendación
**Empezar por la Opción A (custom dnd-kit)** para el **renderer + reorder + toggle + editar config**, porque:
1. El `BlockRenderer` y el modelo `config.layout` son necesarios en ambos casos y son la parte que da valor inmediato (reordenar/mostrar/ocultar/editar ya cubre el 80% del pedido).
2. Se integra sin choques con la lógica de Fase C (ocasión/tema/assets) y con nuestra estética dark-luxury.
3. Evita acoplar el modelo de datos a la forma de Puck desde el día 1.

Dejar **Puck como evaluación para la fase "editor visual WYSIWYG"** (arrastrar bloques sobre un canvas con preview inline) si más adelante queremos esa experiencia tipo Wix. El `config.layout` en JSON es compatible con migrar a Puck después.

---

## 5. Plan de implementación por pasos (no-destructivo)

| Paso | Descripción | Estado |
|------|-------------|--------|
| **B.1** | Tipos `BlockInstance`/`BlockType` + `SECTION_REGISTRY` | ✅ `src/blocks/` |
| **B.2** | `BlockRenderer` + `buildLegacyLayout`/`resolveLayout` como fallback. `App.tsx` usa el renderer. Sin cambio visible. | ✅ |
| **B.6** | Panel "Diseño": drag-and-drop (`@dnd-kit`) + mostrar/ocultar + eliminar + añadir. Persiste `config.layout`. | ✅ verificado E2E |
| **B.7** | Edición inline de config por bloque (texto, faq, separador) | ✅ |
| **B.9** | Bloques nuevos config-driven: `text`, `faq`, `divider` | ✅ (parcial) |
| **B.3** | Refactor de secciones **heredadas** para aceptar `config` por instancia (hoy leen EventContext global) | ⏳ pendiente |
| **B.4** | Separar `countdown` de `family`; unificar `photo` (torn/flowers/hero) en un bloque con `config.frame` | ⏳ pendiente |
| **B.5** | Script de migración masiva de `config.layout` (hoy se materializa al abrir+guardar en el panel; el renderer cae a legacy si falta) | ⏳ opcional |
| **B.8** | Preview en vivo lado-a-lado (existe modo `?preview=1` + botón "Vista previa"; falta el iframe embebido en el editor) | ⏳ pendiente |
| **B.9+** | Más bloques del catálogo: `story`, `registry`, `map`, `video` | ⏳ aditivo |

### Estado de Fase B (Ago 2026)
**Núcleo COMPLETADO y verificado end-to-end.** Ya se puede **reordenar, mostrar/ocultar, eliminar, añadir y editar** secciones desde la pestaña "Diseño" del panel; el orden y los bloques nuevos se guardan en `config.layout` (sin migración de DB) y la invitación los renderiza dinámicamente. Retrocompatible: eventos sin `layout` usan el orden legacy.

**Limitación conocida (B.3/B.4):** los bloques heredados (portada, foto, familia…) aún leen su contenido de la config global del evento, no por-instancia. Por eso **duplicar** un bloque de foto muestra la misma foto en ambas copias. Los bloques nuevos (texto, faq, separador) sí son 100% por-instancia. Resolver B.3/B.4 quita esa limitación.

**Prerrequisito ya cumplido:** la estabilización (Fase A) y la config-en-JSON (Fase C) dejan el terreno listo — `config.layout` se guarda igual que `config.honorees`, sin migración.

**Ruta crítica:** B.1 → B.2 → B.3 → B.6 dan ya "reordenar/mostrar/ocultar". B.4/B.7/B.9 completan "crear/editar bloques nuevos".

---

## 6. Cómo se conecta con lo ya hecho

- **Fase C (multi-ocasión):** cada bloque sigue usando `getHonorees`/`getEventType`/`getOccasionDefaults`. Un `EventType` puede definir su **layout por defecto** (qué bloques trae una boda vs un XV) — esto une secciones dinámicas + ocasiones.
- **Tema y assets:** los bloques siguen leyendo `ThemeContext`/`AssetContext`. Sin cambios.
- **Almacenamiento:** `config.layout` junto a `config.honorees`, `config.labels`, etc. Un solo `PATCH` de `config`.
- **Fase D (plantillas):** una plantilla = un `layout` + `theme` + `assets` por defecto. La arquitectura de bloques es el cimiento de las plantillas.

---

## 7. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|-----------|
| Romper invitaciones existentes | `LEGACY_LAYOUT` como fallback cuando falta `config.layout`; migración por script idempotente |
| Refactor grande de 10 componentes | Hacerlo bloque por bloque, con el renderer soportando ambos modos durante la transición |
| Config por-instancia diverge del actual (config plano) | El migrador mapea el `config` plano actual a `config` por-bloque; los bloques leen ambos durante la transición |
| Estética inconsistente al reordenar | Los bloques ya usan fondo/tema compartido; validar con preview |

---

*Documento de diseño. La implementación (Fase B) se detalla al arrancarla.*
