# Plan de Mejora — Sistema de Invitaciones Digitales
> Versión 1.0 — Marzo 2026

---

## 1. Diagnóstico del Estado Actual

### Problemas críticos

| Sección | Problema |
|---------|----------|
| Sección 2 y 4 | Fotos con UUIDs hardcodeadas en el código — no leen DB |
| Sección 7 | Itinerario 100% hardcodeado — no usa EventContext |
| Todas | Imágenes decorativas (fondo, flores, marcos) fijas en `/public/` — no configurables por evento |
| Sección 1 y 3 | Nombres de novios con tamaño fijo `text-6xl/8xl` — "LAURA SOFIA" rompe en dos líneas |
| Secciones 1, 5, 6, 7, 8 | Labels de UI ("¡NOS CASAMOS!", "CEREMONIA", "Padres de la novia", etc.) hardcodeados en español |
| Sección 5 | Fallbacks con nombres reales de otra boda — datos de terceros mostrados si no se configura |
| App.tsx | Secciones 1-9 ordenadas estáticamente en código — no se puede reordenar ni agregar/quitar |
| Schema | `photo2Url`, `venueName`, `venueAddress` existen pero ninguna sección los lee |
| Config | No existe concept de `timeline`, `assets`, `theme` — todo está hardcodeado en componentes |

### Qué sí funciona bien
- `brideName`, `groomName`, `audioUrl`, `heroPhotoUrl` → se leen de DB
- `ceremonyTime`, `receptionTime`, `rsvpDeadline` → correctos
- `config.ceremony`, `config.reception`, `config.dressCode` → bien estructurados
- `groomPhone`, `bridePhone`, mensajes WhatsApp → correctos
- Panel master edita la mayoría de estos campos

---

## 2. Visión Objetivo

Un sistema donde:

1. **Cada evento tiene su propia plantilla** (clásica floral, minimalista, rústica, etc.)
2. **Cada sección es un bloque independiente** que se puede activar, desactivar, reordenar y configurar
3. **Cada imagen decorativa** (fondo, flores, marcos) se puede cambiar por evento desde el panel
4. **El itinerario es completamente dinámico** — agregar, quitar, reordenar momentos
5. **Los textos de UI** (títulos de sección) son configurables, no hardcodeados
6. **Los nombres siempre caben** independientemente de su longitud
7. **El admin ve un preview** antes de publicar

---

## 3. Arquitectura Propuesta

### 3.1 Modelo de datos nuevo

```
Event ──────── Template (plantilla base)
  │               └── defaultConfig (JSON con defaults de esa plantilla)
  │               └── defaultAssets (rutas de imágenes por defecto)
  │               └── availableSectionTypes (qué tipos de sección ofrece)
  │
  ├── sections: SectionConfig[]  (array ordenado de secciones del evento)
  │     └── { id, type, enabled, order, config }
  │
  ├── assets: AssetMap           (overrides de imágenes por evento)
  │     └── { background, cornerFlower, bouquet, tornPaper, church, ... }
  │
  └── theme: ThemeConfig         (colores y tipografías del evento)
        └── { primaryColor, accentColor, actionColor, fontSerif, fontSans }
```

### 3.2 Sistema de secciones

Cada sección tiene un `type` string. El frontend tiene un **registro de componentes** que mapea
`type → componente React`. El evento guarda un array ordenado de secciones con su configuración:

```
SECTION_REGISTRY = {
  "hero"          → HeroSection       (título, versículo bíblico, iniciales)
  "photo-torn"    → PhotoTornSection  (foto con efecto papel rasgado)
  "names"         → NamesSection      (nombres novios, mensaje, audio)
  "photo-flowers" → PhotoFlowersSection (foto con flores decorativas)
  "family"        → FamilySection     (padres, padrinos, damas, caballeros)
  "countdown"     → CountdownSection  (cuenta regresiva)
  "venues"        → VenuesSection     (ceremonia, recepción, código vestimenta)
  "timeline"      → TimelineSection   (itinerario configurable)
  "photo-hero"    → PhotoHeroSection  (foto principal con papel rasgado)
  "rsvp"          → RsvpSection       (confirmación, regalo, WhatsApp)
  "divider"       → DividerSection    (separador decorativo — futuro)
  "custom-text"   → CustomTextSection (bloque de texto libre — futuro)
}
```

El renderer simplemente itera el array, filtra los desactivados, y renderiza cada componente:

```tsx
// Antes (estático, hardcodeado en App.tsx):
<InvitationSection1 />
<InvitationSection2 />
...

// Después (dinámico):
{event.sections
  .filter(s => s.enabled)
  .sort((a, b) => a.order - b.order)
  .map(s => {
    const Component = SECTION_REGISTRY[s.type];
    return Component ? <Component key={s.id} config={s.config} /> : null;
  })}
```

### 3.3 Sistema de assets

Cada sección acepta los assets desde un `AssetContext` que combina los defaults de la plantilla
con los overrides del evento. Ninguna sección tiene rutas hardcodeadas:

```tsx
// Antes:
<img src="/fondo.png" />

// Después:
const { assets } = useAssetContext();
<img src={assets.background} />
```

### 3.4 Sistema de temas

Un `ThemeContext` expone colores y fuentes. Las secciones usan variables CSS en lugar de colores
hardcodeados:

```tsx
// Antes:
className="text-[#bfa15a]"  // oro hardcodeado

// Después (CSS var):
className="text-accent"      // resuelto por tema del evento
```

---

## 4. Cambios al Schema de Base de Datos

### 4.1 Nuevo modelo `Template`

```prisma
model Template {
  id             String   @id @default(cuid())
  name           String                        // "Clásica Floral"
  slug           String   @unique              // "clasica-floral"
  description    String?
  thumbnailUrl   String?
  defaultConfig  Json     @default("{}")       // defaults para el config del evento
  defaultAssets  Json     @default("{}")       // rutas de imágenes por defecto
  defaultTheme   Json     @default("{}")       // colores/fuentes por defecto
  defaultSections Json    @default("[]")       // secciones iniciales al crear evento con esta plantilla
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  events         Event[]

  @@map("templates")
}
```

### 4.2 Campos nuevos en `Event`

```prisma
model Event {
  // ... campos existentes sin cambios ...

  // NUEVOS:
  templateId     String?
  template       Template? @relation(fields: [templateId], references: [id])
  sections       Json      @default("[]")    // SectionConfig[]
  assets         Json      @default("{}")    // AssetMap (overrides de la plantilla)
  theme          Json      @default("{}")    // ThemeConfig (overrides de la plantilla)
  photo3Url      String?                    // Tercer slot de foto
}
```

### 4.3 Estructura JSON de `sections`

```json
[
  {
    "id": "s1",
    "type": "hero",
    "enabled": true,
    "order": 1,
    "config": {
      "announcementText": "¡NOS CASAMOS!"
    }
  },
  {
    "id": "s2",
    "type": "photo-torn",
    "enabled": true,
    "order": 2,
    "config": {
      "photoUrl": "https://blob.vercel.com/...",
      "photoAlt": "Foto de los novios",
      "aspectRatio": "9/16"
    }
  },
  {
    "id": "s3",
    "type": "names",
    "enabled": true,
    "order": 3,
    "config": {}
  },
  {
    "id": "s4",
    "type": "photo-flowers",
    "enabled": true,
    "order": 4,
    "config": {
      "photoUrl": "https://blob.vercel.com/..."
    }
  },
  {
    "id": "s5",
    "type": "family",
    "enabled": true,
    "order": 5,
    "config": {
      "sectionTitle": "Con la bendición de Dios y de nuestros padres",
      "companionTitle": "Y en compañía de nuestros padrinos, damas y caballeros de honor",
      "labels": {
        "brideparents": "Padres de la novia",
        "groomparents": "Padres del novio",
        "godparents": "Padrinos",
        "bridesmaids": "Damas de honor",
        "groomsmen": "Caballeros de honor"
      }
    }
  },
  {
    "id": "s6",
    "type": "venues",
    "enabled": true,
    "order": 6,
    "config": {
      "labels": {
        "ceremony": "CEREMONIA",
        "reception": "RECEPCIÓN",
        "dresscode": "Código de vestimenta",
        "location": "Ver ubicación",
        "ladies": "ELLAS:",
        "gentlemen": "ELLOS:"
      }
    }
  },
  {
    "id": "s7",
    "type": "photo-hero",
    "enabled": true,
    "order": 7,
    "config": {}
  },
  {
    "id": "s8",
    "type": "timeline",
    "enabled": true,
    "order": 8,
    "config": {
      "title": "Itinerario",
      "items": [
        { "id": "t1", "time": "6:00 PM", "label": "CEREMONIA RELIGIOSA", "icon": "church" },
        { "id": "t2", "time": "8:00 PM", "label": "RECEPCIÓN",           "icon": "reception" },
        { "id": "t3", "time": "9:00 PM", "label": "BRINDIS",             "icon": "glasses" },
        { "id": "t4", "time": "9:30 PM", "label": "VALS",                "icon": "waltz" },
        { "id": "t5", "time": "11:00 PM","label": "CENA",                "icon": "dinner" }
      ]
    }
  },
  {
    "id": "s9",
    "type": "rsvp",
    "enabled": true,
    "order": 9,
    "config": {
      "labels": {
        "gifts": "SUGERENCIA DE REGALOS",
        "envelope": "LLUVIA DE SOBRES",
        "confirm": "CONFIRMAR ASISTENCIA",
        "closing": "ESPERAMOS CONTAR CON SU PRESENCIA",
        "thanks": "Muchas Gracias!",
        "deadline": "Fecha límite para confirmar:",
        "closed": "(Cerrado)",
        "groomLabel": "Novio",
        "brideLabel": "Novia"
      }
    }
  }
]
```

### 4.4 Estructura JSON de `assets`

```json
{
  "background":    "https://blob.vercel.com/fondo-evento-xyz.png",
  "cornerFlower":  "https://blob.vercel.com/flor-esquina-xyz.png",
  "bouquet":       "https://blob.vercel.com/ramo-xyz.png",
  "sideBouquet":   "https://blob.vercel.com/ramo-lateral-xyz.png",
  "flowers":       "https://blob.vercel.com/flores-xyz.png",
  "tornPaper":     "https://blob.vercel.com/hoja-rasgada-xyz.png",
  "church":        "https://blob.vercel.com/iglesia-xyz.png",
  "glasses":       "https://blob.vercel.com/copas-xyz.png",
  "dinner":        "https://blob.vercel.com/cena-xyz.png",
  "reception":     "https://blob.vercel.com/mesa-xyz.png",
  "waltz":         "https://blob.vercel.com/vals-xyz.png",
  "decorLine":     "https://blob.vercel.com/linea-xyz.png",
  "gift":          "https://blob.vercel.com/regalo-xyz.png",
  "envelope":      "https://blob.vercel.com/sobre-xyz.png"
}
```
> Cualquier asset no especificado cae al default de la plantilla, que a su vez cae a los actuales en `/public/`.

### 4.5 Estructura JSON de `theme`

```json
{
  "primaryColor":  "#162b4e",
  "accentColor":   "#bfa15a",
  "actionColor":   "#466691",
  "textColor":     "#374151",
  "fontSerif":     "Playfair Display",
  "fontSans":      "Inter",
  "borderRadius":  "full"
}
```

---

## 5. Fix de Overflow de Nombres

El problema ocurre porque los nombres tienen tamaño fijo grande. La solución es tipografía fluida con `clamp()`:

```tsx
// Sección 1 — Iniciales (actualmente text-8xl fijo)
// Nuevo: escala entre 4rem y 8rem según viewport
style={{ fontSize: "clamp(3rem, 15vw, 6rem)" }}

// Sección 3 — Nombres completos (actualmente text-6xl fijo)
// Nuevo: escala según longitud del nombre Y viewport
const getFontSize = (name: string) => {
  const len = name.length;
  if (len <= 6)  return "clamp(3rem, 12vw, 5rem)";
  if (len <= 10) return "clamp(2.5rem, 9vw, 4rem)";
  if (len <= 14) return "clamp(2rem, 7vw, 3.5rem)";
  return "clamp(1.75rem, 6vw, 3rem)";
};
```

Adicionalmente: `hyphens: "auto"` para nombres muy largos como fallback.

---

## 6. Admin Builder — Pantalla de Edición de Invitación

Nueva tab en el panel master/cliente: **"Invitación"** con 4 sub-paneles:

### 6.1 Constructor de Secciones
- Lista drag-and-drop de secciones activas
- Toggle para activar/desactivar cada sección
- Botón "Agregar sección" con selector del tipo
- Al hacer clic en una sección → abre su panel de configuración
- Preview en tiempo real (iframe o panel lateral)

### 6.2 Editor de Sección
Cada tipo de sección muestra un formulario específico:

**Hero:** texto del anuncio, versículo, referencia
**Photo-Torn/Photo-Flowers/Photo-Hero:** uploader de foto, alt text, relación de aspecto
**Names:** (solo usa brideName/groomName del evento — sin config extra)
**Family:** todos los textos de encabezado, arrays de nombres
**Venues:** datos de ceremonia y recepción, textos de botones
**Timeline:** array de items con tiempo, etiqueta, ícono — con agregar/quitar/reordenar
**RSVP:** todos los labels, mensaje de regalo

### 6.3 Gestor de Assets
Grid de todas las imágenes decorativas de la plantilla:
- Thumbnail actual
- Botón "Cambiar" → sube nueva imagen a Vercel Blob
- Botón "Restablecer" → vuelve al default de la plantilla

### 6.4 Tema Visual
- Paleta de colores (color pickers para primary, accent, action)
- Selector de fuente serif (lista de Google Fonts compatibles)
- Preview de cómo se ve la combinación en tiempo real

---

## 7. Gestión de Plantillas (Master Admin)

El master admin puede:
1. **Ver** todas las plantillas disponibles
2. **Crear** una nueva plantilla con:
   - Nombre y descripción
   - Subir thumbnail de preview
   - Definir `defaultConfig`, `defaultAssets`, `defaultTheme`
   - Seleccionar qué tipos de sección incluye por defecto
3. **Editar** una plantilla existente
4. **Activar/desactivar** plantillas

Al crear un evento nuevo, el master selecciona la plantilla base y el sistema:
1. Copia las secciones por defecto de la plantilla
2. Aplica el tema y assets de la plantilla
3. Deja el config del evento vacío (hereda todo de la plantilla)

---

## 8. Fases de Implementación

### FASE 1 — Fixes inmediatos sin cambio de schema *(~1 semana)*

**Objetivo:** Arreglar lo que está roto hoy sin refactorizar todo.

| Tarea | Descripción |
|-------|-------------|
| 1.1 | Fix overflow nombres: `clamp()` en Secciones 1 y 3 |
| 1.2 | Conectar Sección 2 a `event.photo2Url` (ya existe en schema) |
| 1.3 | Agregar `photo3Url` al schema y conectar Sección 4 |
| 1.4 | Migrar Sección 7 a `event.config.timeline[]` y leerlo dinámicamente |
| 1.5 | Limpiar fallbacks de Sección 5 (datos de otra boda) → arrays vacíos |
| 1.6 | Agregar campos de labels a `config` de cada sección y leer desde DB |
| 1.7 | Panel master: agregar editores de `config.timeline`, fotos Sección 2/4 |

**Resultado:** La invitación existente queda 100% dinámica y funcional para múltiples eventos.

---

### FASE 2 — Sistema de Assets Configurables *(~1 semana)*

**Objetivo:** Que cada imagen decorativa se pueda cambiar por evento.

| Tarea | Descripción |
|-------|-------------|
| 2.1 | Agregar campo `assets: Json` al schema (`Event`) + migración |
| 2.2 | Crear `AssetContext` con fallback chain: evento → plantilla → `/public/` |
| 2.3 | Reemplazar todos los `src="/fondo.png"` hardcodeados por `assets.background` |
| 2.4 | Reemplazar todos los íconos del itinerario por `assets.church`, `assets.glasses`, etc. |
| 2.5 | Panel master: UI de Gestor de Assets con thumbnails y uploader por slot |
| 2.6 | API endpoint: `PATCH /api/master/events/:id/assets` para actualizar cada asset |

**Resultado:** Cada evento puede tener imágenes totalmente diferentes sin tocar código.

---

### FASE 3 — Sistema de Temas *(~3-4 días)*

**Objetivo:** Colores y fuentes configurables por evento.

| Tarea | Descripción |
|-------|-------------|
| 3.1 | Agregar campo `theme: Json` al schema + migración |
| 3.2 | Convertir colores hardcodeados (`#bfa15a`, `#162b4e`, `#466691`) a CSS custom properties |
| 3.3 | Crear `ThemeProvider` que inyecta las CSS vars basándose en `event.theme` |
| 3.4 | Panel master: color pickers, selector de fuente serif con preview |
| 3.5 | API endpoint: `PATCH /api/master/events/:id/theme` |

**Resultado:** Un evento puede ser azul marino y oro, otro verde esmeralda y negro, sin cambiar código.

---

### FASE 4 — Secciones Dinámicas *(~2 semanas)*

**Objetivo:** El orden y la presencia de secciones se controla desde el panel.

| Tarea | Descripción |
|-------|-------------|
| 4.1 | Agregar campo `sections: Json` al schema + migración |
| 4.2 | Crear `SECTION_REGISTRY` con todos los tipos de sección actuales |
| 4.3 | Refactorizar cada InvitationSection para aceptar `config` como prop (no solo EventContext) |
| 4.4 | Crear renderer dinámico que itera `event.sections` en lugar de lista hardcodeada en App.tsx |
| 4.5 | Panel master/cliente: drag-and-drop para reordenar secciones |
| 4.6 | Panel: toggle para activar/desactivar cada sección |
| 4.7 | Panel: formulario de config específico por tipo de sección |
| 4.8 | Panel: botón "Agregar sección" con selector de tipo |
| 4.9 | API endpoints: `PATCH /api/master/events/:id/sections` |

**Resultado:** El admin puede reordenar, ocultar o agregar secciones desde el panel sin código.

---

### FASE 5 — Sistema de Plantillas *(~2 semanas)*

**Objetivo:** Múltiples plantillas seleccionables al crear un evento.

| Tarea | Descripción |
|-------|-------------|
| 5.1 | Crear modelo `Template` en Prisma + migración |
| 5.2 | Agregar `templateId` al modelo `Event` |
| 5.3 | Crear al menos 2 plantillas iniciales en seed: "Clásica Floral" (actual) y "Minimalista" |
| 5.4 | Sistema de herencia: evento hereda assets/theme/sections de la plantilla |
| 5.5 | Panel master: gestión de plantillas (CRUD) |
| 5.6 | Al crear evento: selector de plantilla con thumbnail y preview |
| 5.7 | Diseñar e implementar 2da plantilla con componentes de sección propios |
| 5.8 | Subir assets de cada plantilla a Vercel Blob |

**Resultado:** Al crear una boda nueva, el master elige la plantilla y el evento empieza pre-configurado.

---

### FASE 6 — Preview en Tiempo Real *(~1 semana)*

**Objetivo:** El admin ve cómo queda la invitación mientras la edita.

| Tarea | Descripción |
|-------|-------------|
| 6.1 | Ruta pública de preview: `/preview/:slug?token=xxx` con JWT de preview |
| 6.2 | Panel master/cliente: panel lateral con iframe apuntando a la preview |
| 6.3 | Cambios en el editor actualizan la preview via postMessage o refetch |
| 6.4 | Modo preview: watermark "Vista previa — no publicada" |

---

## 9. Compatibilidad con Eventos Existentes

Para no romper el evento actual (jimena-juan):

1. Los campos nuevos (`sections`, `assets`, `theme`) tienen `@default("{}")` o `@default("[]")`
2. Cada componente de sección verifica si hay config nuevo, si no cae al EventContext actual
3. El renderer dinámico verifica si `event.sections` está vacío → usa el orden hardcodeado legacy
4. Los eventos sin `templateId` usan la plantilla "Clásica Floral" por defecto

Esto permite una migración gradual: los eventos existentes siguen funcionando, los nuevos
usan el sistema nuevo desde el día 1.

---

## 10. Resumen de Cambios por Capa

### Base de datos
- `+` Nuevo modelo `Template`
- `~` Evento: agregar `templateId`, `sections`, `assets`, `theme`, `photo3Url`
- `~` Migración: poblar `sections` con defaults para eventos existentes

### Backend
- `+` Endpoints CRUD para Templates (`/api/master/templates`)
- `~` Endpoint de eventos: incluir `sections`, `assets`, `theme` en PATCH
- `+` Endpoints separados: `/events/:id/sections`, `/events/:id/assets`, `/events/:id/theme`

### Frontend — Invitación
- `+` `AssetContext` con fallback chain
- `+` `ThemeContext` con CSS custom properties
- `+` `SECTION_REGISTRY` (mapa type → componente)
- `~` Cada InvitationSection: acepta `config` como prop además de EventContext
- `~` `App.tsx`: renderer dinámico de secciones
- `~` Fix overflow de nombres con `clamp()`

### Frontend — Panel Admin
- `+` Tab "Invitación" con constructor drag-and-drop
- `+` Gestor de Assets con thumbnails y uploaders
- `+` Tema visual con color pickers
- `+` Gestión de plantillas (solo master)

---

## 11. Decisiones Técnicas

| Decisión | Elección | Razón |
|----------|----------|-------|
| ¿Templates en código o DB? | **Híbrido**: componentes en código, config en DB | Los componentes React no van a DB; lo configurable sí |
| ¿Drag-and-drop? | **@dnd-kit/core** | Más liviano que react-beautiful-dnd, soporta React 19 |
| ¿Preview en tiempo real? | **iframe + token JWT** | Aísla el preview de la sesión admin |
| ¿Color picker? | **react-colorful** (2KB) | Muy liviano, sin dependencias |
| ¿Font selector? | Lista curada de 5-8 fuentes | Evitar cargar Google Fonts API para cada fuente |
| ¿Herencia de config? | **Spread simple** en frontend | `{ ...template.defaults, ...event.overrides }` |
| ¿Migración de datos? | Script de migración + defaults seguros | Eventos existentes no se rompen |

---

## 12. Orden de Implementación Recomendado

```
Fase 1 → Fase 2 → Fase 3 → Fase 4 → Fase 5 → Fase 6
  │         │         │         │         │         │
Fix bugs   Assets   Temas   Secciones  Plantillas Preview
rápidos   config   y fuentes dinámicas  múltiples  live
```

**Fase 1 es prerrequisito de todo lo demás.**
Fases 2, 3 son independientes entre sí (se pueden hacer en paralelo).
Fase 4 requiere Fases 1+2+3 completas.
Fase 5 requiere Fase 4 completa.
Fase 6 puede hacerse en paralelo con Fase 5.

---

*Documento generado en base al análisis completo del codebase — Marzo 2026*
