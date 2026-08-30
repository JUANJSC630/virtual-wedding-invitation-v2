# Qué debe tener un sistema de invitaciones virtuales — investigación 2026

> Investigación de campo, 30 de agosto de 2026. 16 búsquedas sobre plataformas reales,
> documentación de producto, foros de novios, literatura académica de asignación de
> asientos y precios de infraestructura. Fuentes completas en §12.
>
> Complementa a `INVESTIGACION_MERCADO_2026.md` (que cubrió posicionamiento y RSVP) y a
> `CATALOGO_FEATURES_2026.md` (checklist de features). **Este documento se centra en lo
> que falta**: el sistema completo, no solo la invitación.

---

## 1. La conclusión que ordena todo lo demás

El producto de hoy modela **una invitación por hogar**: `Guest` (con `code`, `maxGuests`
y ahora `rsvpAnswers`) más N `Companion` que solo tienen nombre y un booleano.

Casi todo lo que falta —mesas, menús por persona, check-in en la puerta, "¿dónde me
siento?"— necesita lo mismo: **tratar a cada asistente como una entidad de primera clase**.
Un acompañante hoy no puede tener su propio menú, ni su propia silla, ni su propio código
QR, porque no es más que una cadena de texto colgando del invitado principal.

> **No son cinco funciones pendientes. Son una decisión de modelo de datos y luego cinco
> funciones que se vuelven fáciles.**

Esto se detalla en §3 y es la recomendación principal de §11.

---

## 2. Lo que la industria da por sentado y aquí no existe

Ordenado por distancia entre "lo estándar" y "lo que hay".

| Capacidad | Estado del mercado | Aquí hoy |
|---|---|---|
| Asignación de mesas | Estándar en Zola, WeddingWire, RSVPify, Wedding Studio | ❌ |
| "Encuentra tu mesa" para el invitado | Tendencia fuerte 2026 vía QR | ❌ |
| Check-in en la puerta | Estándar en plataformas de evento | ❌ |
| Sub-eventos con lista propia | Estándar en Zola, Joy, The Knot, WedSites | ❌ |
| Hogares / grupos | Estándar (Zola agrupa en households) | ⚠️ parcial |
| Menú **por persona** | Estándar | ❌ (hoy 1 respuesta por invitación) |
| Recordatorios automáticos a quien no respondió | Estándar | ❌ |
| Galería colaborativa post-evento | Categoría entera de productos | ❌ |
| Alojamiento / transporte / FAQ | Estándar en webs de boda | ⚠️ solo FAQ |
| Export para catering | Estándar | ⚠️ conteo en pantalla, sin CSV |
| Multi-idioma | Diferenciador en bodas de destino | ❌ |

---

## 3. Mesas y asignación de asientos (lo que preguntaste)

Es la pieza más grande que falta y la mejor documentada.

### 3.1 Qué hacen las plataformas reales

Todas convergen en el mismo flujo: **plano → mesas → arrastrar invitados → publicar**.

- **Zola** saca automáticamente los invitados **confirmados** de la lista y deja colocar
  mesas redondas o rectangulares arrastrando.
- **WeddingWire** deja componer el plano con mesas circulares o cuadradas, cada una con su
  número de sillas, y arrastrar invitados a cada una.
- **Wedding Studio** añade lo interesante: **reglas de "sentar juntos" y "mantener
  separados"**, y un botón de auto-sentar el resto.
- **SeatPlan.io** aporta importación CSV, colaboración en tiempo real y **export a PDF
  imprimible**.
- **Social Tables y Zola** mantienen el plano **enganchado a la lista**, de modo que un
  cambio de RSVP se propaga al plano en vez de quedar desincronizado.

**El detalle que más importa:** el plano debe ser una *vista derivada* de la lista de
invitados, no una copia. Si alguien cancela a tres días de la boda, su silla se libera sola.

### 3.2 La tendencia 2026: el plano deja de ser un cartel

El cambio de este año es que **el plano de mesas se consume desde el móvil del invitado**.
En vez de un panel de acrílico con letra diminuta en la entrada, un QR lleva a una página
donde el invitado **busca su nombre** y ve su mesa —y con quién se sienta— en segundos.
Wedibox, Where Am I Sitting y Wedding Studio lo venden exactamente así.

Para este producto la implicación es directa y barata: **ya existe una página por invitado
autenticada por código**. Añadir "tu mesa es la 7, con Ana y Luis" a la pantalla que el
invitado ya ve es un bloque más, no un producto nuevo. Es la función con mejor relación
valor/esfuerzo de todo el documento.

### 3.3 Modelo de datos mínimo

```
Table                       Seat / asignación
  id, eventId                 id, tableId
  name / number               attendeeId  ← la entidad de §1
  shape (round|rect|custom)   position (opcional)
  capacity
  x, y   (posición en el plano)
```

Sin la entidad "asistente" de §1 esto no se puede modelar: un acompañante necesita silla
propia. Por eso **§1 es prerrequisito de §3**.

### 3.4 Sobre el auto-asignado: lo que dice la literatura

Hay investigación formal, no solo producto. Los enfoques documentados van de *constrained
signed spectral clustering* a *simulated annealing* e *integer linear programming*, con
dos tipos de restricción: **duras** ("debe / no debe sentarse con") y **blandas**
("preferiblemente").

Dos advertencias de esa literatura que conviene respetar desde el diseño:

1. **Demasiadas restricciones duras hacen el problema infactible.** El sistema debe poder
   decir "no existe plano que cumpla todo" y señalar qué restricción sobra, en vez de
   colgarse o mentir.
2. Los planes se **puntúan** por cuántas preferencias respetan; casi nunca se satisfacen
   todas.

**Recomendación:** no empezar por el algoritmo. Arrastrar y soltar con reglas
"juntos/separados" cubre el 95% del valor. El auto-asignado es una mejora posterior, y
cuando llegue, un *greedy* con puntuación es suficiente — nadie necesita el óptimo global
para 12 mesas.

---

## 4. La lista de invitados: hogares, niveles y acompañantes

Aquí el producto tiene una asimetría que conviene nombrar.

**Hogar como unidad.** El consenso es agrupar por hogar —"quien abre un mismo sobre"— y
llevar *una fila por hogar, no por persona*. El producto ya hace esto de facto: un `Guest`
con `maxGuests` **es** un hogar. Bien.

**Pero el hogar no puede ser la unidad final.** El mismo material insiste en que "un
invitado confirmado y su acompañante son **dos menús y dos sillas**". Ahí es donde el
modelo actual se queda corto: `Companion` no sostiene ni un menú ni una silla.

**Niveles (A/B/C).** Práctica muy extendida: lista A = a quien invitarías sin límites;
lista B = a quien invitas según vayan cayendo declinaciones. Implica un campo `tier` y
**poder invitar por oleadas**. Es barato de implementar y no lo tiene casi nadie en LATAM.

**Reglas de acompañante.** Quién tiene derecho a +1 y quién no es una decisión del
anfitrión que hoy se aproxima con `maxGuests`. Suficiente por ahora.

---

## 5. Sub-eventos: una invitación, varias listas

Estándar en Zola, Joy, The Knot, WedSites y AnRSVP. La boda moderna es un fin de semana:
bienvenida, ensayo, ceremonia, fiesta, brunch de recuperación.

La regla de oro es de etiqueta, no técnica: **cada invitado ve solo los eventos a los que
está invitado**, y confirma cada uno por separado. Enseñar a alguien un evento al que no
está invitado es un problema social real.

Modelo: `SubEvent(eventId, nombre, fecha, lugar)` + `Invitation(attendeeId, subEventId,
rsvp)`. Encaja con el sistema de bloques: cada sub-evento puede ser un bloque de la
invitación, visible según la lista.

---

## 6. RSVP: lo que le falta al que acabamos de construir

El RSVP con preguntas personalizadas ya está (ver `ESTADO_Y_ROADMAP_2026.md` §4ter). Lo
que el mercado tiene y aquí no:

1. **Lógica condicional.** Mostrar el menú solo a quien asiste presencialmente, o las
   preguntas de viaje solo a quien viene de fuera. RSVPify lo destaca como diferenciador.
2. **Respuestas por persona.** Hoy se responde una vez por invitación. Para menús no
   sirve. Es la consecuencia directa de §1.
3. **Multi-idioma.** QuikRSVP presume de 70+ idiomas. En bodas de destino es decisivo.

---

## 7. Comunicaciones: el recordatorio automático

El dato más accionable de toda la investigación:

> **WhatsApp y SMS superan el 80% de tasa de apertura frente a ~25% del email.** Los SMS
> rondan el 98% y se leen en los primeros 3 minutos.

Y el patrón que recomiendan las plataformas: **primer recordatorio 7–10 días antes del
cierre, último 48–72 h antes**, excluyendo automáticamente a quien ya respondió.

El producto ya genera enlaces de WhatsApp en bloque. El salto es **automatizarlo por
estado**: "mandar a los 23 que no han respondido", con su nombre y su enlace personal.

### Coste real, si se automatiza de verdad

Si en algún momento se usa la **WhatsApp Business API** en vez de enlaces manuales, hay
que saber que desde julio de 2025 Meta cobra **por mensaje**, no por conversación:

| Mercado | Mensaje de marketing |
|---|---|
| México | ~$0.0305 |
| Brasil | ~$0.0625 |
| EEUU | ~$0.025 |

Una boda de 150 hogares con 3 recordatorios ≈ **$14 USD en México**. Perfectamente
absorbible por evento — pero deja de ser gratis, y **desde el 1 de octubre de 2026 se
amplía lo facturable** dentro de la ventana de servicio. Conviene tenerlo en el modelo de
precios antes de prometer "recordatorios ilimitados".

Los enlaces `wa.me` manuales que ya existen siguen siendo **gratis** y son la opción
correcta mientras el volumen sea bajo.

---

## 8. El día del evento: la parte que nadie cubre en LATAM

Hoy el producto se despide cuando el invitado confirma. La industria no.

**Check-in con QR.** Cada invitado confirmado recibe un pase QR; en la puerta se escanea y
se valida en **menos de dos segundos**, con un panel en vivo de quién ha llegado. Eventspad
lo vende explícitamente para bodas, verificando además **la mesa asignada** al escanear.

**Y la restricción que casi todos olvidan: la conectividad.** Los salones tienen sótanos,
muros gruesos y wifi saturado; las fincas están en el campo. Por eso las plataformas serias
llevan **modo offline**: se descarga la lista al dispositivo, se registra en local y se
sincroniza al recuperar señal.

Para este producto es una oportunidad concreta: la app **ya es una PWA**. Un modo "puerta"
que cachee la lista del evento y sincronice después es una ventaja real sobre los
competidores LATAM, que se quedan en la invitación.

---

## 9. Después del evento: la galería colaborativa

Hay una categoría entera de productos que viven **solo** de esto: GuestCam, GuestPix,
Kululu, Fotify, Wedibox, EventShare.

El patrón es idéntico en todos y merece copiarse tal cual:

- **QR en la mesa → subir fotos. Sin app, sin cuenta, sin hashtag.** Es el requisito
  entero; cualquier fricción mata la función.
- Kululu añade el gancho: **slideshow en vivo** proyectado durante la fiesta.
- Varios recogen también **mensajes de voz** como libro de firmas.

El producto ya tiene bloque de galería, pero es **de solo lectura** (la carga el
organizador). Abrirlo a subida de invitados lo convierte en otra cosa: la razón por la que
la gente vuelve a la invitación *después* de la boda.

---

## 10. Lo demás, en breve

**Regalos (LATAM).** Knoott, GiftCo y miboda.love integran mesa de regalos con
**transferencia directa a la cuenta de los novios**, fondos de luna de miel y "lluvia de
sobres". Aquí es texto libre. Es la función monetizable más obvia del mercado LATAM.

**Info al invitado.** Alojamiento con **códigos de bloqueo, tarifa y fecha límite**, y 2–3
opciones por rango de precio; transporte desde el aeropuerto; shuttles con horarios; mapa.
Todo esto encaja como bloques nuevos sin tocar el modelo.

**Accesibilidad.** WCAG pide como mínimo declarar el idioma de la página con `lang` y
marcar los cambios de idioma para que los lectores de pantalla los interpreten. Es barato y
hoy no está.

**Privacidad.** Se manejan nombres, teléfonos, correos, **alergias** (dato de salud) e IPs.
El principio operativo es "no conservar más de lo necesario" y tener una política de
retención declarada. Para fotos de menores en la galería: consentimiento parental.

**Reportes a proveedores.** Cuando cambia el conteo, el catering recalcula. Lo mínimo es un
**export con conteo de platos y alergias** que se le pueda pasar al proveedor en un archivo.

**Negocio.** El mercado va de ~$390 MXN (paquete básico XV) a ~$6,000 MXN (a medida);
miboda.love arranca en $1,799 MXN. En EEUU el modelo es suscripción (RSVPify $10–15/mes por
tramos de invitados). El modelo de este producto —servicio, tú creas el evento— encaja con
**precio por evento y tramos por número de invitados**.

---

## 11. Recomendación priorizada

Impacto × esfuerzo, con las dependencias explícitas.

### Primero: el cimiento (habilita casi todo lo demás)
1. **Modelar cada asistente como entidad propia.** Convertir `Companion` en un asistente de
   primera clase, o introducir `Attendee` con el invitado principal como uno más.
   **Desbloquea: mesas, menú por persona, check-in, "encuentra tu mesa".**

### Ganancias rápidas y visibles
2. **"Encuentra tu mesa" en la invitación.** Una vez exista §1 y unas mesas simples, es un
   bloque más sobre una página que el invitado ya tiene. Máximo valor percibido.
3. **Recordatorios por estado** a quien no ha respondido, con `wa.me` (gratis). El dato del
   80% de apertura lo justifica solo.
4. **Export CSV de respuestas** para el catering. Horas de trabajo, cierra el ciclo del
   RSVP que ya construimos.

### El bloque grande
5. **Plano de mesas** con arrastrar y soltar + reglas juntos/separados. Sin algoritmo.

### Diferenciadores LATAM
6. **Galería colaborativa** (QR → subir, sin cuenta) + slideshow en vivo.
7. **Mesa de regalos estructurada** con transferencia.
8. **Check-in en la puerta con modo offline** — aprovecha que ya es PWA.

### Cuando haya tracción
9. Sub-eventos con lista propia.
10. Lógica condicional en el RSVP, multi-idioma, alojamiento/transporte.

---

## 12. Fuentes

**Mesas y asignación**
[Zola](https://www.zola.com/wedding-planning/seating-chart) ·
[WeddingWire](https://www.weddingwire.com/wedding-planning/wedding-seating-tables.html) ·
[Wedding Studio](https://www.wedding.studio/seating-chart) ·
[SeatPlan.io](https://seatplan.io/) ·
[Wedding Chicks — el plano digital sustituye al cartel](https://www.weddingchicks.com/tips-advice/digital-seating-chart-wedding/) ·
[Wedibox — QR "encuentra tu asiento"](https://www.wedibox.com/features/wedding-seating-chart) ·
[Where Am I Sitting](https://www.whereamisitting.com/)

**Algoritmos de asignación (académico)**
[Constrained Signed Spectral Clustering (arXiv)](https://arxiv.org/pdf/1708.00898) ·
[An automatic seating plan algorithm (PeerJ)](https://peerj.com/preprints/27420/) ·
[Simulated annealing para planos de boda](https://medium.com/analytics-vidhya/building-a-wedding-seating-plan-using-probabilistic-methods-simulated-annealing-8f31d8987026) ·
[Optimal Seat Allocation under constraints (arXiv)](https://arxiv.org/pdf/2105.05017)

**Check-in y día del evento**
[RSVPify — mejores apps de check-in 2026](https://rsvpify.com/best-event-check-in-apps-2026/) ·
[Cvent — guía de check-in con QR](https://www.cvent.com/en/blog/events/qr-code-check-in-guide) ·
[Eventspad — bodas](https://eventspad.com/solutions/weddings) ·
[QuikRSVP — check-in con QR](https://quikrsvp.com/resources/qr-code-event-check-in) ·
[Eventleaf — modo offline](https://www.eventleaf.com/event-management/event-check-in-app-offline-mode) ·
[Samaaro — check-in sin conexión](https://samaaro.com/event-app-features/offline-ready-event-check-in-apps-managing-guest-entries-and-analytics-without-missing-a-beat/)

**Lista de invitados y sub-eventos**
[Joy — gestor de lista](https://withjoy.com/guest-list/) ·
[Greenvelope — gestión online](https://www.greenvelope.com/resources/wedding-guest-list-management) ·
[Paperlust — etiqueta y +1](https://paperlust.co/blog/wedding-guest-list-etiquette/) ·
[Hope Springs — sistema de niveles A/B/C](https://www.hopespringsvenue.com/post/mastering-your-wedding-guest-list-a-step-by-step-guide-using-a-tier-system) ·
[WedSites — RSVP multi-evento](https://help.wedsites.com/en/articles/14455535-can-i-manage-rsvps-for-multiple-events) ·
[The Private Wedding App — RSVP por evento](https://www.theprivateweddingapp.com/blog/wedding-rsvp-multiple-events)

**Comunicaciones**
[Joy — recordatorios de RSVP](https://withjoy.com/blog/wedding-rsvp-reminder-text-perfect-examples-that-get-responses/) ·
[QuikRSVP — plantillas de recordatorio](https://quikrsvp.com/resources/rsvp-reminder-text-templates) ·
[Text My Wedding](https://text-my-wedding.com/send/rsvp-reminders) ·
[WhatsApp Business API — precios 2026](https://www.engagelab.com/blog/whatsapp-business-api-pricing) ·
[SleekFlow — modelo de precios mundial](https://sleekflow.io/blog/whatsapp-business-price)

**Galería y post-evento**
[GuestCam](https://guestcam.co/) · [GuestPix](https://guestpix.com/weddings/) ·
[Kululu](https://www.kululu.com/wedding-photo-sharing-app) ·
[Fotify](https://fotify.app/wedding-photo-sharing-app/) · [Wedibox](https://www.wedibox.com/)

**LATAM**
[Knoott — cuánto se regala en México](https://www.knoott.com/blog/cuanto-dar-regalo-boda-mexico) ·
[GiftCo](https://www.giftco.mx/) · [miboda.love — precios](https://miboda.love/pricing/) ·
[Invitame](https://invitameok.com/) ·
[PartyPass — invitaciones XV](https://www.partypass.mx/blog/invitaciones-digitales-xv-anos) ·
[Casa Convite — XV](https://casaconvite.com/invitaciones-digitales/xv-anos)

**Info al invitado, accesibilidad y privacidad**
[Joy — checklist de la web de boda](https://withjoy.com/blog/what-to-put-on-your-wedding-website-the-complete-checklist/) ·
[Riley & Grey — bodas de destino](https://www.rileygrey.com/wedding-guide/wedding-planning/destination-wedding-websites-what-to-include-for-traveling-guests) ·
[Linguise — WCAG en sitios multilingües](https://www.linguise.com/blog/guide/ada-wcag-accessibility-compliance-for-multilingual-websites-complete-global-guide/) ·
[zkipster — GDPR en eventos](https://www.zkipster.com/blog/gdpr-compliance) ·
[Gathmo — GDPR para anfitriones](https://gathmo.com/weddings/gdpr-for-wedding-hosts) ·
[labo.gallery — privacidad de fotos](https://labo.gallery/en/blog/wedding-photo-privacy-gdpr-guide)

**Catering, comparativas y negocio**
[CaterCamp](https://catercamp.com/wedding-catering-software) ·
[Check Cherry](https://www.checkcherry.com/catering-crm) ·
[VowConnection — comparativa 2026](https://vowconnection.com/best-wedding-guest-list-manager-apps-2026/) ·
[Fotify — 10 plataformas comparadas](https://fotify.app/blog/best-digital-invitation-apps-2026/) ·
[RSVPify en GetApp — precios y críticas](https://www.getapp.com/customer-management-software/a/rsvpify/) ·
[Greenvelope — mejores plataformas](https://www.greenvelope.com/resources/best-digital-invitation-platforms) ·
[WeddingWire — foro: RSVP online vs. papel](https://www.weddingwire.com/wedding-forums/online-vs-mail-in-rsvps/0df1231c0965d1f3.html)
