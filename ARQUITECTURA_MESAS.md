# Mesas y asignación — diseño

> Diseño de la función de mapa de mesas. La investigación de mercado está en
> `INVESTIGACION_SISTEMA_COMPLETO_2026.md` §3 y la de librerías en
> `INVESTIGACION_TECNICA_2026.md` §3. Este documento decide **cómo se construye aquí**.

---

## 1. El acierto que tenemos y las plataformas no aprovechan

Casi todas las herramientas de mesas piden al organizador que declare a mano quién debe
sentarse con quién ("sit together" / "keep apart"). Es trabajo tedioso y por eso mucha gente
nunca lo rellena y el auto-asignado les sale mal.

**Aquí esa información ya existe y es gratis:** un `Guest` es un *hogar* —quien abre un
mismo enlace— y sus `Attendee` son las personas de ese hogar. La familia Torres ya está
declarada como grupo desde que se creó la invitación.

> La recomendación puede funcionar **sin que el organizador configure nada**: agrupar por
> invitación es la restricción más fuerte de una boda y ya la tenemos.

Esa es la decisión de producto que ordena todo el diseño.

---

## 2. Modelo de datos

```
model Table                        Attendee (ya existe)
  id, eventId                        + tableId  String?   ← la asignación
  name        "Mesa 1", "Novios"     + seatIndex Int?     ← sitio dentro de la mesa
  shape       round | rect
  capacity    Int
  x, y        Float                  ← posición en el plano
  rotation    Float                  ← solo útil en rectangulares
```

**La asignación va en `Attendee.tableId`, no en una tabla `Seat` aparte.** Una silla sin
persona no necesita existir: la capacidad es un número y el hueco libre es una resta. Añadir
`Seat` solo tendría sentido si algún día importa *qué* silla concreta ocupa cada uno
(protocolo estricto), y entonces `seatIndex` ya deja la puerta abierta sin tabla nueva.

**El plano es una vista derivada, no una copia.** Es el detalle que la investigación señala
como el que más importa: `tableId` cuelga de la persona, así que si alguien cancela, su sitio
se libera solo. Nunca se guarda una lista de nombres dentro de la mesa.

**Solo se sientan personas confirmadas.** Los pendientes aparecen en el panel lateral como
"aún sin confirmar" pero no ocupan sitio.

---

## 3. La recomendación

### 3.1 Qué problema es
Repartir N grupos indivisibles en M contenedores de capacidad fija, maximizando grupos que
no se parten. Es **bin packing**, y la heurística conocida que mejor resultado da con poco
código es **best-fit decreasing**: colocar primero los grupos grandes, y a cada uno en la
mesa donde quede el hueco más ajustado.

Contra la alternativa académica (clustering, simulated annealing, programación lineal): para
12 mesas y 40 hogares el óptimo global no aporta nada perceptible y cuesta mucho más código.
La investigación ya lo advierte — el valor está en no partir familias, no en la optimalidad.

### 3.2 El algoritmo
```
1. Tomar solo asistentes CONFIRMADOS.
2. Agrupar por invitación (guestId) → hogares indivisibles.
3. Respetar lo ya asignado a mano: esas plazas se descuentan y no se tocan.
4. Ordenar los hogares por tamaño, de mayor a menor.
5. Para cada hogar: elegir la mesa con el hueco MÁS AJUSTADO donde quepa entero.
6. Si no cabe entero en ninguna: repartirlo entre las mesas con más hueco y avisar.
7. Si sobra gente sin mesa: avisar con cuántos y cuánto falta.
```

### 3.3 Lo que devuelve importa tanto como lo que hace
La recomendación **no aplica nada**: devuelve una propuesta y una lista de avisos. El
organizador la ve, la ajusta y decide si guarda.

Los avisos son parte del producto, no un extra:
- *"La familia Pérez (5) no cabe en ninguna mesa; se repartió entre la 3 y la 7."*
- *"Faltan 6 sitios para sentar a todos: añade una mesa de 8."*

La literatura avisa de que con demasiadas restricciones el problema es **infactible**; un
sistema honesto lo dice en vez de inventarse un plano imposible.

---

## 4. La interfaz: dos modos, no uno

Aquí está la decisión de UX que condiciona el resto. **La mayoría de clientes usa el panel
desde el móvil**, y arrastrar mesas por un lienzo con el dedo en 375 px es malo.

En vez de forzar un único modo responsive:

| Modo | Para qué | Dónde |
|---|---|---|
| **Plano** | Colocar mesas, ver el salón, imprimir | Pensado para escritorio; en móvil se ve y se hace zoom, pero no es donde se trabaja |
| **Lista** | Asignar personas a mesas, revisar quién falta | **El modo por defecto en móvil**: mesa por mesa, con sus sitios y un selector de personas |

Las dos vistas operan **sobre los mismos datos**, así que el organizador puede maquetar el
salón en el portátil y luego ir ajustando invitados desde el teléfono.

### Por qué SVG y no canvas
`react-konva` mete el plano en un `<canvas>` y con él se pierden accesibilidad, selección de
texto, estilado con Tailwind e impresión. Para 12–30 mesas redondas y rectangulares, SVG con
`@dnd-kit` —que ya está en el proyecto— sobra. Konva se justificaría para dibujar paredes y
plantas complejas; no es el caso.

---

## 5. El lado del invitado

El plano es también para quien va a la fiesta. Ya existe una página por invitado autenticada
por código, así que "tu mesa es la 7, con Ana y Luis" es **un bloque más**, no un producto
nuevo. Es la mejor relación valor/esfuerzo de toda la función.

Se hace al final, cuando el plano ya se pueda componer.

---

## 6. Cómo funcionan las reglas

Es la parte que más se malinterpreta, así que conviene tenerlo claro.

### Qué son
Restricciones **entre invitaciones** (hogares), no entre personas sueltas. Dos tipos:

| Tipo | Significa | Caso típico |
|---|---|---|
| **Separar** | Esas dos invitaciones nunca comparten mesa | Padres divorciados, invitados enfrentados |
| **Juntar** | Esas dos invitaciones van en la misma mesa | Amigos que se conocen, primos |

Son **simétricas**: declararlas al revés no crea una regla nueva.

### Cuándo actúan — el punto que confunde
> **Las reglas se aplican al SUGERIR un reparto. Nunca mueven a quien ya está sentado.**

Si creas una regla después de haber repartido, no pasa nada por sí solo. Y "Sugerir
distribución" respeta lo ya asignado, así que tampoco lo arregla. Por eso el panel avisa
arriba cuando el reparto actual incumple una regla, nombrando la mesa concreta, y ofrece
**"Rehacer reparto respetando las reglas"**, que levanta a todos los no fijados y recalcula.

### Cómo se resuelven las de juntar
Se fusionan las invitaciones en un bloque que luego se reparte como una familia grande.
Se usan conjuntos disjuntos porque **encadenan**: si A va con B y B con C, los tres acaban
juntos aunque nadie declarara A-C.

**Una separación gana sobre un bloque juntado.** Si AB va junto y B está separada de C, el
bloque AB tampoco comparte mesa con C.

### Cuándo no se pueden cumplir
Si una regla deja a un grupo sin sitio habiendo hueco, la propuesta **lo dice nombrándolo**
en vez de romperla en silencio. Es lo que exige la literatura de asignación: un sistema
honesto admite que el problema es infactible.

---

## 7. Estado

1. ✅ **Modelo + algoritmo** (`src/lib/seating.ts`, **34 tests**) + endpoints.
2. ✅ **Modo lista** — asignar personas a mesas, con Combobox de búsqueda.
3. ✅ **Modo plano** — **en Konva, no en SVG**. Ver la corrección abajo.
4. ✅ **Bloque "tu mesa"** en la invitación, con endpoint público propio.
5. ✅ **Capacidades y formas distintas**, con el tamaño dibujado proporcional.
6. ✅ **Mesas fijadas** (presidencial) que la sugerencia no toca.
7. ✅ **Reglas de juntar y separar** + aviso de las ya incumplidas (§6).
8. ✅ **Elementos del salón**: pista, escenario, barra, entrada, buffet.
9. ✅ **Invitado vs acompañante** visible, agrupado por invitación.
10. ✅ **Catering mesa por mesa** en CSV, que es como sirve la cocina.
11. ✅ **Tamaños de alquiler reales** con su capacidad, rotación de mesas largas,
    y **hoja imprimible** (plano + listado por mesa) vía el diálogo del navegador.

**La función está completa.** Extensiones posibles, ninguna imprescindible:
asientos concretos dentro de la mesa (`Attendee.seatIndex` ya existe), medidas
del salón a escala real, y colaboración en vivo entre organizador y planner.

### Corrección: el plano acabó en Konva, no en SVG
§4 recomendaba SVG por ser "12 mesas simples". Al subir el listón a calidad de
edición esa decisión dejó de sostenerse: Konva trae arrastre, zoom con rueda y
pellizco, imán con guías y exportación en alta resolución sin reimplementar nada.
La accesibilidad que se pierde al dibujar en canvas la cubre el **modo lista**, y
ahí es donde el diseño de dos modos se paga solo.

Descartados con datos: tldraw cuesta 6.000 USD/año; seats.io y seatmap.pro
(desde 400 EUR/año) apuntan a recintos de +10.000 asientos con ticketing.

### Tres errores que costó encontrar, por si se repiten
1. **Mutar el servidor en cada gesto.** El arrastre llamaba a la API en cada
   `pointermove` y por eso no se movía nada: la posición solo cambiaba al
   responder la red. Lo mismo pasaba al renombrar, con un PATCH por tecla. Regla:
   estado local durante el gesto, una escritura al soltar o al salir del campo.
2. **Derivar identidad de un contador.** El nombre y la posición salían de
   `tables.length`, y eso produjo dos "Mesa 2" superpuestas. Mover el cálculo al
   servidor no bastó: la carrera estaba en la base. Se resolvió con
   `pg_advisory_xact_lock` por evento.
3. **Dibujar todo del mismo tamaño.** Una mesa de 12 se veía igual que una de 4.
   El tamaño dibujado tiene que salir de la capacidad o el plano no sirve.
4. **Nacer todos en la misma posición.** Les pasó a las mesas y luego, idéntico, a
   los elementos del salón. La posición inicial la calcula el servidor dentro de
   una transacción con cerrojo por evento.
5. **Poder arrastrar algo fuera del lienzo.** Las mesas tenían límites; los
   elementos del salón no, y acababan en coordenadas negativas irrecuperables.
6. **Una regla que no hace nada visible.** Prevenir no basta: si el estado actual
   ya la incumple, hay que decirlo. Ver §6.
7. **Probar una acción destructiva sobre datos reales.** Un test de navegador
   pulsó "Rehacer reparto" en el evento en producción y reasignó a sus 174
   personas. El botón solo aparecía allí porque el estado que lo dispara estaba
   en los datos del usuario; lo correcto era reproducirlo en un evento `zz-*`.
   La regla de no tocar eventos reales vale también para las pruebas de interfaz.
