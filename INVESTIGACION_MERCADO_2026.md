# Investigación de Mercado — Invitaciones Digitales Multi-Ocasión (2025–2026)
> Recopilación completa de la investigación web · Agosto 2026
> Documento de referencia para decisiones de producto. Complementa `ESTADO_Y_ROADMAP_2026.md` (§4 es su resumen).

---

## 0. Metodología

6 búsquedas web sobre: (1) mejores prácticas de plataformas de invitación 2026, (2) tendencias online boda/cumpleaños/quinceañera, (3) comparativa Paperless Post/Greenvelope/Evite, (4) RSVP/accesibilidad/QR/mobile, (5) mercado LATAM/WhatsApp, (6) modelos de datos multi-tipo de evento. Fuentes completas en §9.

---

## 1. Resumen ejecutivo (los 7 hallazgos que importan)

1. **RSVP sin fricción es EL factor decisivo.** Flujo ideal: link → ver → tap RSVP → listo. Sin cuenta. Todo lo demás es secundario.
2. **+70% de invitaciones se abren primero en móvil.** El diseño debe ser mobile-first, no "responsive como extra".
3. **El mercado se movió de "herramienta de invitación" a "plataforma de evento"** (invitación + RSVP + engagement + contenido post-evento).
4. **Multi-ocasión es la norma**, no un diferenciador. Las líderes cubren boda, XV, baby shower, bautizo, cumpleaños, corporativo, graduación.
5. **QR ya es estándar**: 49% de parejas lo usaron en 2024 (20% en 2022). Curva de adopción acelerada.
6. **WhatsApp es el canal dominante en LATAM** — la invitación viaja y se confirma por ahí. Ventaja estructural para productos LATAM-first.
7. **RSVP con campos personalizados** (menú, dieta, transporte, canción, +1) es demanda estándar, no premium.

---

## 2. Análisis plataforma por plataforma

### 2.1 Paperless Post (EEUU, desde 2009)
- **Fuerte en:** diseño premium, partnerships de marca (kate spade, Oscar de la Renta, Rifle Paper Co.), **animación de sobre** (envelope que se abre al abrir la invitación) — su feature distintiva.
- **Librería de plantillas enorme:** desde cumpleaños hasta galas corporativas.
- **Modelo de precio:** sistema de "coins" — tarjeta premium desde 2 coins por destinatario; elementos de diseño suman.
- **Lección para nosotros:** la animación de apertura crea un "momento". Nuestra pantalla de código/entrada es análoga; vale invertir en que ese primer momento sea memorable.

### 2.2 Greenvelope (EEUU)
- **Fuerte en:** estacionaria digital eco-friendly, diseños pulidos, **especialmente bodas**.
- **Tracking robusto:** quién abrió qué y cuándo (nosotros ya tenemos `GuestAccess`).
- **Modelo de precio:** paquetes por persona para un envío único + membresías anuales de envíos ilimitados.

### 2.3 Evite (EEUU, ~25 años)
- **Fuerte en:** **tier gratuito genuino** (enviar, trackear RSVP, gestionar lista sin pagar). Pionero del sector.
- **Modelo:** gratis con ads / Premium por cantidad de invitados / Pro anual ($249.99).
- **Lección:** el tier gratis con ads es el motor de adquisición. Para un modelo de servicio (tú creas), esto no aplica igual, pero informa el "plan básico".

### 2.4 RSVPify (EEUU)
- **Fuerte en:** gestión detallada de eventos — tracking de invitados, **ticketing**, páginas de evento con marca.
- Explícitamente **multi-ocasión**: bodas, quinceañeras, baby showers con páginas dedicadas.
- **RSVP avanzado:** menú, restricciones dietéticas, +1, asientos.

### 2.5 Jugadores LATAM (los más relevantes para este producto)
- **invitas.co, eventobonito.com, invitameok.com, invitadores.com, miboda.love, rsvp-pro.mx, PaperCute (Colombia)**
- **Patrón común LATAM:**
  - Confirmación **por WhatsApp** como default.
  - Campos **personalizados por invitado**.
  - Multi-ocasión: boda, XV años, baby shower, bautizo.
  - Features: countdown, **Google Maps interactivo**, galería de fotos, música elegida.
  - **Estadísticas en vivo** para coordinar con catering/organizador.
  - Cobertura: Colombia, México, Argentina, Chile, Perú.
- **Insight clave:** en Colombia las invitaciones de XV años se diseñan con música elegida, galería, RSVP y countdown, compartibles al instante por WhatsApp. En México se suma **mesa de regalos** y "panel de invitados".

---

## 3. RSVP — mejores prácticas detalladas

### 3.1 El flujo canónico
> Guest recibe link → click → ve la invitación → tap RSVP → listo. **Sin crear cuenta.** El invitado responde como individuo nombrado y añade dieta / +1 / detalles en el **mismo flujo único**.

**Nuestro estado:** ✅ Lo cumplimos con `?code=` (salta pantalla de código) + RSVP nativo. Proteger este flujo en todo refactor.

### 3.2 Campos de RSVP con demanda probada
- Confirmación sí/no (base).
- **Selección de menú / restricciones dietéticas.**
- **+1 / acompañantes** (ya tenemos `Companion`).
- **Transporte** (¿necesita?).
- **Canción sugerida.**
- **Solicitud de accesibilidad** (silla de ruedas, etc.).
- **Nota/mensaje para los anfitriones.**
- Respuestas con **emoji** (toque contemporáneo).

**Nuestro estado:** tenemos confirmación + acompañantes. **Gap:** menú, dieta, transporte, canción, nota. → Candidato fuerte para Fase E.

### 3.3 Profundidad de gestión (escala del mercado)
De menor a mayor: conteo sí/no → opciones de menú → control de +1 → **asignación de asientos/mesas**. Las plataformas se diferencian por qué tan arriba llegan.

---

## 4. QR codes — datos y prácticas

- **Adopción:** 49% de parejas usaron QR en save-the-dates/invitaciones en 2024 (38% en 2023, 20% en 2022). Curva acelerada.
- **Cómo funciona bien:** QR → URL con código precargado que va **directo al RSVP**. Sin descargas ni cuentas (cámara nativa del teléfono).
- **Buenas prácticas:**
  - Instrucción clara junto al QR: *"Escanea para confirmar"*.
  - Ubicación visible — **no** al reverso (se pasa por alto).
  - Optimizar la página destino para móvil.
- **Beneficios:** elimina tracking manual, reduce costos de impresión/correo, RSVP en tiempo real.

**Nuestro estado:** ✅ Tenemos `GuestQRModal` (G3) + `/:slug?code=XXX`. Ya alineado con la mejor práctica. Posible mejora: que el QR lleve directo a la sección RSVP, no solo a la portada.

---

## 5. WhatsApp / LATAM — el canal crítico

- **En LATAM y España, la invitación viaja por WhatsApp.** Es el canal que todos usan a diario.
- La confirmación se **espera** por WhatsApp.
- Plataformas LATAM integran: mensajes predefinidos, links `wa.me`, confirmación directa por chat.
- Estadísticas de asistencia organizadas en **vivo** para catering/organizador.

**Nuestro estado:** ✅ Integración WhatsApp (mensajes predefinidos por novio/novia, links masivos A5). **Es ventaja competitiva real, no un extra.** Profundizarla (plantillas WA por evento, deep links por invitado/mesa) rinde más que copiar features occidentales como la animación de sobre.

---

## 6. Mobile & Accesibilidad

- **+70% abre primero en móvil** → mobile-first obligatorio.
- Botones de RSVP, links e interactivos **suficientemente grandes** para tocar con el pulgar (referencia estándar: mín. 44×44px).
- Formularios **cortos**.
- Accesible en cualquier dispositivo (laptop/tablet/phone, Android/iOS).
- QR accesible para invitados menos tecnológicos con instrucción clara.

**Acción sugerida:** correr un **audit de accesibilidad** (contraste WCAG AA, tap targets, foco de teclado) sobre las secciones públicas — hay skill `audit` disponible en el entorno.

---

## 7. Multi-ocasión — patrones del modelo de datos

- Las plataformas **no son de bodas: son de eventos**. Tipos cubiertos: boda, cumpleaños, corporativo, baby shower, graduación, **bautizo/bris**, aniversario, jubilación, housewarming, gender reveal, festividades.
- **Campos de schema comunes** a todas las plantillas de invitación:
  - Tipo de evento, formato, **nombre del evento**, fecha & hora, **lugar/ubicación**, tema/estilo, esquema de color, tipografías, **wording de la invitación**.
- **Enfoque genérico/flexible:** plantillas genéricas adaptables a cualquier evento + diseños temáticos por tipo. Los "generic data models" definen tipos de relación estandarizados que generalizan modelos convencionales.

**Implicación directa para Fase C:** nuestro schema debe pasar de campos boda-específicos (`groomName`/`brideName`/`ceremony`) a un **núcleo genérico** (nombre de evento, protagonistas `honorees[]`, fecha, lugar, wording) + **overlay temático por `EventType`**. Esto es exactamente el patrón de la industria.

---

## 8. Tendencias de diseño 2025–2026

- **Animaciones de apertura** (envelope opening — Paperless Post).
- **Paletas:** suaves y románticas (blush pink, lavanda, marfil); tropical; y también **dark/lujo** (nuestra navy + oro ya es diferenciadora).
- **Elegancia floral** con estilos suaves.
- **Respuestas con emoji** en el RSVP.
- **Plantillas por ocasión** (no una sola plantilla estirada).
- Contenido **post-evento** (galería colaborativa, fotos de invitados).

---

## 9. Checklist accionable — mapeo a nuestro proyecto

| Mejor práctica del mercado | ¿La tenemos? | Acción |
|---|---|---|
| RSVP sin cuenta, flujo único | ✅ | Proteger en refactors |
| Mobile-first + tap targets | ⚠️ parcial | Correr audit accesibilidad |
| QR con código precargado | ✅ (G3) | Mejora: QR → directo a RSVP |
| WhatsApp confirmación/envío | ✅ (A5) | Profundizar: plantillas WA por evento |
| Countdown | ✅ | — |
| Mapa interactivo del lugar | ✅ (maps URL) | Posible embed en vez de link |
| Galería de fotos | ✅ | — |
| Música de fondo | ✅ (audioUrl) | — |
| Estadísticas en vivo | ✅ (analytics) | — |
| **RSVP: menú/dieta/transporte/canción** | ❌ | **Fase E — alto valor** |
| **Multi-ocasión (EventType)** | ❌ | **Fase C — tu meta** |
| **Plantillas por ocasión** | ❌ | Fase D |
| Animación de apertura ("momento") | ⚠️ básico | Pulir pantalla de entrada |
| Mesa de regalos (México/LATAM) | ⚠️ parcial (gifts) | Formalizar registry |
| i18n (es/en/pt) | ❌ | Casi gratis tras Fase C |
| Contenido post-evento (galería colaborativa) | ❌ | Fase E |
| Asignación de mesas/asientos | ❌ | Futuro |

---

## 10. Fuentes

**Plataformas y comparativas**
- https://www.greenvelope.com/resources/best-digital-invitation-platforms
- https://www.greenvelope.com/compare
- https://rsvpify.com/best-online-invitation-makers-2026/
- https://rsvpify.com/quinceanera/
- https://rsvpify.com/baby-showers/
- https://www.lemonvite.com/blog/paperless-post-vs-greenvelope
- https://www.lemonvite.com/blog/evite-vs-paperless-post
- https://www.invitedrop.com/blog/best-digital-invitation-cards (Invyt/InviteDrop)
- https://fotify.app/blog/best-digital-invitation-apps-2026/
- https://fotify.app/blog/best-free-online-invitations-with-rsvp-2026/
- https://www.eventcreate.com/types

**RSVP / QR / mobile**
- https://www.uniqode.com/blog/qr-codes-for-occasions/qr-codes-for-wedding-rsvp
- https://bitly.com/blog/qr-code-rsvp/
- https://rsvpify.com/qr-codes-for-wedding-invitations/
- https://www.theknot.com/content/wedding-qr-code

**LATAM / WhatsApp**
- https://aptie.org/noticias-sobre-tendencias/adios-a-las-invitaciones-impresas-la-gestion-digital-revoluciona-las-bodas-en-america-latina/
- https://www.veamoslasfotos.com/post/invitacion-digital-boda-whatsapp-link
- https://invitas.co/
- https://invitameok.com/
- https://eventobonito.com/

**Modelo de datos multi-ocasión**
- https://en.wikipedia.org/wiki/Generic_data_model
- https://invitio.events/en-US/blog/event-types-guide

---

*Documento de referencia. Las cifras (49% QR 2024, +70% móvil) provienen de las fuentes citadas y reflejan su fecha de publicación.*
