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

## 6. Orden de construcción

1. **Modelo + algoritmo** (`src/lib/seating.ts`, lógica pura con tests) + endpoints.
2. **Modo lista** — asignar personas a mesas. Es lo que se usa desde el móvil.
3. **Modo plano** — colocar mesas arrastrando, en SVG.
4. **Bloque "tu mesa"** en la invitación.
5. Más adelante: reglas explícitas de "separar", export a PDF imprimible.
