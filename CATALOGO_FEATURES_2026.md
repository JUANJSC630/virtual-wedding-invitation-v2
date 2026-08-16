# Catálogo Completo de Features — Invitaciones Digitales 2026
> Investigación profunda · Agosto 2026 · Complementa `INVESTIGACION_MERCADO_2026.md`
> Cubre **TODO** lo que ofrecen las plataformas líderes, dividido en: (A) lado del **invitado**, (B) lado del **admin/manager**, (C) lado del **creador/plataforma**. Cada ítem marca si **ya lo tenemos** ✅, es **parcial** ⚠️ o **falta** ❌.

---

## Cómo leer este documento
- Fuentes: Zola, Joy (withJoy), Minted, RSVPify, WedSites, Appy Couple, Zkipster, Greenvelope, Paperless Post, Evite + jugadores LATAM. Enlaces en §D.
- El objetivo es doble: (1) tener el **universo de posibilidades** para decidir qué construir, y (2) alimentar el **catálogo de bloques** de la nueva arquitectura de secciones dinámicas (ver `ARQUITECTURA_SECCIONES_DINAMICAS.md`).

---

## A. LADO DEL INVITADO (la invitación pública)

### A.1 Secciones/bloques de contenido (lo que se puede mostrar)

| Bloque | Qué es | Estado |
|--------|--------|--------|
| **Portada / Hero** | Título, frase/versículo, iniciales o nombres, fecha | ✅ (S1) |
| **Cuenta regresiva** | Countdown al evento | ✅ (dentro de S5) |
| **Nuestra historia / "How we met"** | Narrativa con hitos (se conocieron, compromiso…) | ❌ |
| **Protagonistas / Nombres** | Nombres grandes + mensaje de bienvenida | ✅ (S3) |
| **Foto destacada** (varias variantes) | Foto con marco/papel rasgado/flores | ✅ (S2, S4, S9) |
| **Galería de fotos** | Grid/carrusel de fotos | ✅ (Gallery) |
| **Familia / Padres / Padrinos** | Padres, padrinos, corte de honor | ✅ (S5) |
| **Cortejo / Wedding party** | Damas, caballeros, chambelanes con foto y rol | ⚠️ (S5 sin fotos) |
| **Lugares / Venues** | Ceremonia + recepción con dirección y mapa | ✅ (S6) |
| **Mapa embebido** | Google Maps interactivo dentro de la invitación | ⚠️ (S6 solo link) |
| **Itinerario / Timeline del día** | Momentos con hora e ícono | ✅ (S7) |
| **Agenda multi-evento** | Varios sub-eventos (welcome, ceremonia, after) | ❌ |
| **Código de vestimenta** | Dress code con iconos/paleta | ✅ (S6) |
| **RSVP** | Confirmación de asistencia | ✅ (S8) |
| **Mesa de regalos / Registry** | Links a registries (Amazon, etc.) + lluvia de sobres | ⚠️ (S8 texto, sin links estructurados) |
| **Datos bancarios / transferencia** | Info para regalo en efectivo | ⚠️ (texto libre) |
| **Contacto** | WhatsApp/teléfono de anfitriones | ✅ (S8) |
| **FAQ** | Preguntas frecuentes (parking, niños, +1…) | ❌ |
| **Alojamiento / Hotel block** | Hoteles sugeridos + código de reserva | ❌ |
| **Transporte / Cómo llegar** | Shuttle, parking, Uber/Lyft | ❌ |
| **Things to do / Recomendaciones** | Qué hacer en la ciudad (bodas destino) | ❌ |
| **Libro de firmas / Guestbook** | Invitados dejan mensajes | ❌ |
| **Música de fondo** | Canción con player | ✅ (S3) |
| **Livestream / Transmisión** | Embed de transmisión en vivo | ❌ |
| **Galería colaborativa** | Invitados suben fotos (antes/durante) | ❌ |
| **Slideshow en vivo** | Fotos de invitados en tiempo real (recepción) | ❌ |
| **Add to calendar** | Botón .ics / Google Calendar | ✅ (S6) |
| **Divisor decorativo** | Separador visual entre bloques | ❌ |
| **Texto libre / Bloque custom** | Párrafo arbitrario configurable | ❌ |
| **Video** | Video embebido (YouTube/Vimeo/MP4) | ❌ |

### A.2 Experiencia y mecánica del invitado

| Feature | Detalle | Estado |
|---------|---------|--------|
| Acceso por código único | Código por invitado | ✅ |
| Link con código precargado | `?code=` salta la pantalla de código | ✅ |
| QR por invitado | Escanear → directo a la invitación | ✅ |
| Mobile-first | +70% abre en móvil | ✅ |
| Password / privacidad | Sitio protegido por contraseña | ⚠️ (código funciona como gate) |
| Animación de apertura | "Sobre" que se abre (Paperless Post) | ❌ |
| Estado de RSVP persistente | Recordar si ya confirmó | ✅ |
| Multi-idioma (es/en/pt) | Selector de idioma | ❌ |
| PWA / instalable | Añadir a pantalla de inicio | ✅ (G5) |
| Notificaciones push | Recordatorios al invitado | ❌ |
| Accesibilidad (WCAG AA) | Contraste, tap targets, teclado | ⚠️ (sin audit) |

### A.3 RSVP — profundidad (donde el mercado compite)

| Campo/feature | Detalle | Estado |
|---------------|---------|--------|
| Sí / No | Confirmación básica | ✅ |
| Nº de acompañantes / +1 | Con nombres | ✅ |
| **Selección de menú** | Dropdown/imagen por plato | ❌ |
| **Restricciones dietéticas** | Texto o checkboxes | ❌ |
| **Canción sugerida** | Petición para el DJ | ❌ |
| **Transporte** | ¿Necesita shuttle? | ❌ |
| **Solicitud de accesibilidad** | Silla de ruedas, etc. | ❌ |
| **Nota para los anfitriones** | Mensaje libre | ⚠️ (notas internas admin, no del invitado) |
| **Lógica condicional** | Si "No asiste" → salta a agradecimiento; si "Sí" → muestra menú/+1 | ❌ |
| **Preguntas custom** | El admin define preguntas propias | ❌ |
| **Respuestas con emoji** | Toque contemporáneo | ❌ |
| RSVP por WhatsApp | Confirmación por chat | ✅ (crítico LATAM) |
| RSVP nativo in-app | Formulario propio | ✅ (G1) |
| Deadline de confirmación | Cierre de RSVP | ✅ |

---

## B. LADO DEL ADMIN / MANAGER DEL EVENTO (los novios / organizador)

### B.1 Gestión de invitados

| Feature | Detalle | Estado |
|---------|---------|--------|
| CRUD de invitados | Crear/editar/borrar | ✅ |
| Acompañantes | Gestión de +1 | ✅ |
| Importar CSV | Carga masiva | ✅ (A1) |
| Exportar CSV/Excel | Descargar lista | ⚠️ (revisar) |
| Buscar y filtrar | Por estado, nombre… | ✅ (A7) |
| **Tags / etiquetas** | VIP, familia, lado novia/novio (Zkipster) | ❌ |
| Notas internas | Por invitado | ✅ |
| Códigos/QR por invitado | Generar y copiar | ✅ (G3) |
| Estado RSVP en vivo | Confirmados/pendientes | ✅ |
| **Auto-populado al confirmar** | La lista se sincroniza con respuestas | ✅ |
| **Grupos/hogares** | Agrupar invitados por familia/hogar | ⚠️ (guest+companions) |
| Recordatorios | WhatsApp/email a pendientes | ⚠️ (A5 links WA masivos) |
| **Mensajería directa** | Chatear con invitados desde el panel | ❌ |

### B.2 Logística del evento

| Feature | Detalle | Estado |
|---------|---------|--------|
| **Seating chart / mesas** | Asignación drag-and-drop de mesas | ❌ |
| **Menú → catering** | Conteo de platos para el catering | ❌ |
| **Sub-eventos / satélites** | Welcome dinner, ceremonia, after (invitar a subsets) | ❌ |
| **Check-in el día del evento** | Marcar asistencia en la puerta (QR) | ❌ |
| Deadline de RSVP editable | Cambiar fecha límite | ✅ |
| Vista previa | Ver la invitación como invitado | ✅ (M2) |

### B.3 Analítica y reportes

| Feature | Detalle | Estado |
|---------|---------|--------|
| Accesos (quién entró, cuándo) | Tracking | ✅ (GuestAccess) |
| KPIs (invitados/confirmados/accesos) | Dashboard | ✅ |
| Confirmaciones recientes | Feed | ✅ (M8) |
| **Tasa de apertura / respuesta** | % que abrió / confirmó | ⚠️ (datos existen, sin % dedicado) |
| **Export de reportes** | PDF/CSV para catering/planner | ❌ |
| **Timeline de actividad** | Historial de acciones | ❌ |

### B.4 Personalización de la invitación (por el admin cliente)

| Feature | Detalle | Estado |
|---------|---------|--------|
| Editar textos/labels | Todos los textos | ✅ (config.labels) |
| Colores y tipografía (tema) | Paletas + fuente serif | ✅ (M3, Fase 8) |
| Subir fotos/assets | Hero, galería, decoraciones | ✅ (Blob, M4) |
| Toggle de secciones | Mostrar/ocultar | ✅ (Fase 7) |
| **Reordenar secciones** | Drag-and-drop | ❌ ← **objetivo de la nueva arquitectura** |
| **Agregar/crear secciones** | Insertar bloques nuevos | ❌ ← **objetivo** |
| **Editor visual / preview en vivo** | WYSIWYG lado a lado | ❌ (solo preview modo M2) |
| Tipo de evento (multi-ocasión) | Boda/XV/bautizo… | ✅ (Fase C) |

---

## C. LADO DEL CREADOR / PLATAFORMA (tú)

| Feature | Detalle | Estado |
|---------|---------|--------|
| Multi-tenant (N eventos) | Aislamiento por evento | ✅ |
| Panel maestro | CRUD de todos los eventos | ✅ |
| Crear credenciales de cliente | Admin por evento | ✅ (M6) |
| Duplicar / clonar evento | Reusar config | ✅ (M1) |
| Archivar eventos | Soft delete | ✅ (M7) |
| Insights globales | KPIs de todos los eventos | ✅ (M8) |
| **Sistema de plantillas** | Templates seleccionables (Fase D) | ❌ |
| **Dominio personalizado** | invitacion.pareja.com | ❌ |
| **Marca blanca** | Sin marca de la plataforma | ❌ |
| **Facturación / planes** | Modelo de negocio (SaaS/servicio) | ❌ |
| **Biblioteca de bloques/plantillas** | Reusar bloques entre eventos | ❌ ← habilitado por nueva arquitectura |

---

## Prioridades sugeridas (impacto × esfuerzo)

**Quick wins de alto impacto (bajo esfuerzo):**
1. **RSVP con preguntas custom** (menú, dieta, canción, transporte) — demanda #1 del mercado.
2. **Mapa embebido** (S6 ya tiene la URL) e **FAQ** (bloque simple).
3. **Mesa de regalos estructurada** (links + datos bancarios) en vez de texto libre.
4. **Export CSV** de invitados (verificar/pulir).

**Estructural (habilita todo lo demás):**
5. **Arquitectura de secciones dinámicas** — reordenar/crear/editar bloques. Sin esto, cada bloque nuevo es código hardcoded. → `ARQUITECTURA_SECCIONES_DINAMICAS.md`.

**Diferenciadores LATAM:**
6. Profundizar **WhatsApp** (plantillas por evento, recordatorios automáticos).
7. **Galería colaborativa** post-evento.

**Grandes apuestas:**
8. Seating chart, sub-eventos, check-in con QR, multi-idioma, marca blanca.

---

## D. Fuentes de esta investigación

**Builders lado invitado**
- [Best Wedding Websites 2026 — Carats & Cake](https://caratsandcake.com/articles/best-wedding-websites)
- [Zola — Wedding Website](https://www.zola.com/wedding-planning/website)
- [Joy (withJoy)](https://withjoy.com/) · [2026 Wedding Trends — Joy](https://withjoy.com/blog/2026-wedding-trends-what-couples-are-actually-doing-this-year/)
- [Minted Wedding Websites](https://www.minted.com/wedding-websites)
- [WedSites — Features](https://wedsites.com/features)
- [Guest Hospitality Trends 2026 — AKK](https://www.akkweddingplanner.com/wedding/guest-hospitality-wedding-trends-2026/)

**Admin / gestión**
- [Best RSVP tools 2026 — Popl](https://popl.co/blogs/all/best-rsvp-tools-in-2026-top-event-registration-platforms)
- [RSVPify — Event Dashboard](https://rsvpify.com/event-dashboard/) · [Guest List Management](https://rsvpify.com/guest-list-management/) · [Custom Questions](https://rsvpify.com/custom-questions/) · [Menu Options](https://rsvpify.com/menu-options/)
- [Best RSVP Apps 2026 — Fotify](https://fotify.app/blog/best-rsvp-apps-for-events-2026/)

**RSVP / formularios**
- [Jotform — RSVP with Meal Choice](https://www.jotform.com/form-templates/rsvp-with-meal-choice-template)
- [Typeform — RSVP template](https://www.typeform.com/templates/rsvp-form)
- [RSVPify — Conditional logic (foro)](https://community.rsvpify.com/hc/en-us/community/posts/41982472293268)

**Arquitectura de builders**
- [Puck — visual editor for React (GitHub)](https://github.com/puckeditor/puck) · [puckeditor.com](https://puckeditor.com/)
- [Top 5 Drag-and-Drop Libraries for React 2026 — Puck](https://puckeditor.com/blog/top-5-drag-and-drop-libraries-for-react)
- [dnd-kit](https://dndkit.com/) · [GrapesJS vs Webflow vs Builder.io vs Puck 2026](https://gjs.market/blogs/grapesjs-vs-webflow-vs-builderio-vs-puck-which-visual-builde)

---

*Documento vivo. Actualizar al construir cada feature.*
