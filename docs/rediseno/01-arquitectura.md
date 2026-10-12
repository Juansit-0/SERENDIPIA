# SERENDIPIA — Rediseño, fase 1: Arquitectura de información

> **Estado: aprobada por el usuario (2026-10-12).** Decisiones sobre las preguntas abiertas de §8:
> 1. **Puede seguir:** 3 ideas visibles en Acorde + el panel completo a un clic (y los huecos fantasma de la tira). Teoría no repite el panel.
> 2. **Tonalidad:** un botón «C mayor ▾» en la barra que abre una cuadrícula de 12 raíces + Mayor/Menor + Auto.
> 3. **Detector → campo de texto:** sí se escribe el nombre detectado, salvo mientras el usuario está escribiendo en el campo.
> 4. **Tempo de Práctica:** propio, inicializado desde la barra; la subida automática no toca el tempo global.
> 5. **1024×640:** se adopta la recomendación (mástil de 9 trastes visibles con desplazamiento interno y tira plegada a ~96 px a esa altura).
> 6. Teoría: añadir un grado con un botón «+» visible, no con doble clic.

Alcance: estructura, jerarquía y comportamiento. Sin colores ni tipografías (fase 2). Presupuesto de pantalla de referencia: 1366×768 (mínimo 1024×640), sin scroll de página.

## 1. Principios

1. **Un foco por vista.** Cada vista tiene un objeto central (mástil en Acorde, círculo/grados en Teoría, botón ¡Cambio! en Práctica) y todo lo demás es secundario.
2. **Divulgación progresiva.** Siempre visible = lo que se toca mientras suena la guitarra (correr, tempo, capo, tonalidad). Lo que se ajusta una vez por sesión va a un clic; lo que se ajusta una vez en la vida va a Ajustes.
3. **Un dato, un dueño.** Cada valor (tonalidad, capo, tempo, notación, ritmo) se edita en un solo lugar; el resto lo muestra en solo lectura o enlaza al dueño.
4. **Un verbo, un significado.** "Cargar", "Limpiar", "Añadir", "Empezar/Correr" se usan para una sola acción en toda la app.
5. **Lo derivado se muestra, no se pide.** Notas, intervalos, "suena como", tonalidad probable salen del acorde/posición seleccionados; no son controles.
6. **Cero scroll de página; el scroll solo existe dentro de listas acotadas** (posiciones, sugerencias, biblioteca) y en la tira en móvil.
7. **Todo es reversible.** Deshacer/Rehacer cubren la progresión; los reemplazos masivos (cargar clásica, cargar biblioteca) piden un deshacer, no un diálogo.

## 2. Clasificación de controles

Leyenda: **V** siempre visible · **1c** a un clic · **Aj** Ajustes · **E/F** eliminar o fusionar.

### 2.1 Transporte (barra superior)

| Control | Destino | Nota |
|---|---|---|
| Título SERENDIPIA | V (marca compacta, a la izquierda) | |
| Pestañas de vista | V → 3: Acorde / Teoría / Práctica | Diccionario+Detector fusionados |
| Correr/Parar | V | Único "play" global; en Práctica se renombra el de la sesión (ver duplicados) |
| Puntos de pulso | V (anclados al botón Correr, solo sonando) | |
| Tempo −/valor/+ | V | Dueño del tempo global |
| Capo −/valor/+ | V | Dueño del capo |
| Tonalidad (nota + Mayor/Menor) | V como **un solo control compuesto** "C mayor ▾"; el desplegable contiene 12 raíces + Mayor/Menor + Auto | Dueño único de la tonalidad |
| Toggle Auto (tonalidad según progresión) | 1c: dentro del desplegable de tonalidad | |
| Tiempos 1/2/4/8 por acorde | 1c: popover "Reproducción" | |
| Loop | 1c: popover "Reproducción" | |
| Click (metrónomo) | 1c: popover "Reproducción" | |
| Ritmo global (rasgueo) | 1c: popover "Reproducción" | Valor por defecto de la tira |
| Timbre | 1c: popover "Sonido" | |
| Volumen | 1c: popover "Sonido" | |
| Activar sonido | V solo si el audio no está listo (reemplaza a los chips) | Estado, no control |
| Chips "Imprimiendo…" / "Modo síntesis" | Fusionar en **un indicador de estado** junto al botón Sonido (punto + tooltip) | |
| Notación Anglo/Ambas/Latina | Aj | Cambia rara vez |
| Idioma ES/EN | Aj | |
| [móvil] Ajustes ▾ con resumen | E: sustituido por el patrón de §7 | |

Resultado en la barra: **navegación, Correr+Tempo, Capo, Tonalidad, 2 botones (Reproducción, Sonido), engranaje Ajustes**.

### 2.2 Tira de progresión

| Control | Destino |
|---|---|
| Título, contador n/16 | V (cabecera, compacto) |
| Deshacer / Rehacer | V (cabecera) |
| Encadenar | V (cabecera; deshabilitado con <2 pasos) |
| Limpiar (tira) | Menú ⋯ de la cabecera, renombrado **"Vaciar progresión"** |
| Guardar / Biblioteca / Compartir | Menú ⋯ → un único panel "Mis progresiones" (Guardar, lista, Compartir enlace) |
| Pista de reordenado | E como texto fijo; pasa a tooltip y a anuncio al empezar a arrastrar |
| Pasos (16), marcas de transición, huecos fantasma | V (cuerpo) |
| Tonalidad detectada (pie) | V, solo lectura, con enlace "cambiar" que abre el desplegable de la barra |
| Análisis del cambio | V (una línea) |
| Capo recomendado + Aplicar | V como chip en el pie; "formas más fáciles" en tooltip |
| Picker de paso | 1c (popover): posiciones, ritmo del paso, mover, quitar |

### 2.3 Acorde (Diccionario + Detector)

| Control | Destino |
|---|---|
| Input Acorde | V |
| 12 raíces + select Cualidad | 1c: selector de acorde en forma de teclado compacto plegable bajo el input (alternativa al texto); en 1024 solo input + botón "Elegir…" |
| Nombre grande, latina | V |
| Chips capo "suena X" | V como una línea ("Con capo 2 suena D") |
| Notas con intervalo | V (franja bajo el mástil) |
| Posición (traste base, alcance, dificultad) | V en la lista de posiciones; la posición activa lo repite una vez |
| Escuchar | V (único) |
| Añadir a la progresión | V (único botón de acción del panel; ver §4) |
| Mástil lectura (6×5) y mástil edición (12 trastes) | Fusionar en **un mástil interactivo de 12 trastes** |
| Limpiar mástil | V pequeño en el mástil, renombrado **"Borrar marcas"** |
| Pruebas de imprenta (posiciones) | V como lista horizontal con miniaturas |
| Diagrama grande | E (el mástil ya es el diagrama) |
| Leyenda | 1c: icono "?" sobre el mástil |
| Tonalidad probable — Usar | 1c: chip en la línea de contexto, solo si difiere de la tonalidad actual |
| También podría ser | V (lista de alternativas) |
| Ver en el diccionario | E (ya no hay cambio de vista) |
| Puede seguir | V, pero solo en esta vista y Teoría comparte el componente (ver §2.5) |

### 2.4 Teoría y Práctica

| Control | Destino |
|---|---|
| Mayor/Menor, 12 raíces de Teoría | E: sustituidos por el control de tonalidad de la barra (Teoría lo muestra y lo abre) |
| Toggle 7 (séptimas) | V en Teoría (propio de la vista) |
| Grados diatónicos | V (foco) |
| Progresiones clásicas | V; botón **"Usar"** (reemplaza progresión, con Deshacer) |
| Puede seguir | Ver 2.5 |
| Práctica: Acorde A/B, modo, tempo inicial, tiempos, subir tempo solo | V (configuración arriba, compacta) |
| Práctica: tempo y tiempos | Tempo inicial parte del tempo de la barra (precargado, editable solo aquí); tiempos 4/2/1 propios de Práctica |
| Empezar/Parar, Más lento, ¡Cambio!, Quedan, Cambios, Récord | V |
| Ayuda | 1c ("?") |

### 2.5 Duplicados: quién gana

| Duplicado | Gana |
|---|---|
| Nombre del acorde en muchos sitios | Es normal (dato, no control). Regla: el nombre es **grande solo en el panel Acorde y en el paso**; en el resto va en tamaño de texto |
| Notación | Un único ajuste en Ajustes; todo lo demás obedece |
| Tonalidad (barra / Teoría / Tonalidad probable / tira) | **Barra**. Teoría y tira muestran y enlazan; "Tonalidad probable" es una sugerencia que llama al mismo setter |
| Capo (barra / chips / recomendación) | **Barra** edita. Chips = "suena como" (lectura). Recomendación de la tira = botón Aplicar que mueve el de la barra |
| Tempo y tiempos (barra / Práctica) | Tempo global: barra. Práctica tiene tempo de sesión propio, inicializado desde la barra, etiquetado "tempo de práctica". Tiempos por acorde: popover; Práctica tiene los suyos |
| Ritmo global y por paso | Global = valor por defecto (popover Reproducción); por paso = excepción en el picker, marcada con punto en el paso |
| Mástil en Diccionario y Detector | Uno solo, interactivo, en Acorde |
| Diagramas de posición en 4 sitios | Mástil (activa) + miniaturas (lista) + picker (miniaturas). Se elimina el diagrama grande. Práctica usa miniatura |
| Digitación/dificultad en 5 sitios | Una sola fuente: la lista de posiciones y el encabezado de la posición activa; el picker muestra solo dificultad como punto |
| Añadir al patrón en 3 sitios | Botón **"Añadir"** en Acorde; en "Puede seguir" es un clic-doble/botón por fila ya presente; huecos fantasma se conservan (son el atajo de la propia tira). Todos usan la misma acción y el mismo nombre: "Añadir a la progresión" |
| Escuchar | Uno, en el panel Acorde |
| Puede seguir en dos vistas | Un componente, ubicado en la tira (pie) como huecos fantasma; en Acorde se muestra un resumen de 3 filas; Teoría usa grados diatónicos y no repite el panel |
| "Cargar" (clásica vs biblioteca) | Clásica = **"Usar"**; biblioteca = **"Abrir"** |
| Correr/Parar vs Empezar/Parar | Correr/Parar = reproducción de la progresión. Práctica = **"Empezar ronda"/"Terminar"**; durante una ronda de Práctica Correr se deshabilita |
| Limpiar (tira vs mástil) | Tira = "Vaciar progresión"; mástil = "Borrar marcas" |
| Mayor/Menor (barra / Teoría) | Barra (dentro del desplegable de tonalidad) |

## 3. Barra superior (1366 px, una fila, 52 px)

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐ 52px
│ SERENDIPIA │ Acorde  Teoría  Práctica │ [▶ Correr ●●●●] [− 96 +] │ Capo [− 2 +] │ [C mayor ▾] │ ♪ ▾  🔊 ▾  ⚙ │
└──────────────────────────────────────────────────────────────────────────────────────────┘
  marca        navegación (izq.)           reproducción (centro)     armonía (centro-der.)     auxiliares (der.)
```

Orden y agrupación (de izquierda a derecha): 1) marca, 2) navegación, 3) grupo **Tocar** (Correr + pulso + Tempo), 4) grupo **Armonía** (Capo + Tonalidad), 5) auxiliares: "Reproducción ▾" (tiempos, loop, click, ritmo), "Sonido ▾" (timbre, volumen, estado de carga), "Ajustes" (notación, idioma). Separadores sutiles entre grupos, sin cajas. En 1024 px la marca se reduce a monograma. Total de elementos visibles: 3 pestañas + 7 controles + 3 botones = 13 (antes ~25).

## 4. Vista Acorde (1366×768)

Presupuesto: barra 52 + vista ~520 + tira 130 + márgenes ~66.

```
┌ barra 52px ───────────────────────────────────────────────────────────────────────────────┐
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ [ Cmaj7        ]  C mayor séptima · Do mayor 7   ⓘ Tonalidad probable: G mayor [Usar]      │ 56
│  (input)         Con capo 2 suena Bbmaj7                                                    │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ Posiciones            │  e ─○──┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼   ? Borrar marcas │
│ ┌──┐ ┌──┐ ┌──┐ ┌──┐   │  B ───┼─●─┼───┼───┼───┼───┼───┼───┼───┼───┼───┼   Mástil 12      │ ~260
│ │1 │ │2 │ │3 │ │4 │   │  G ───┼───┼─●─┼───┼ ...                         trastes         │
│ └──┘ └──┘ └──┘ └──┘   │  D …   A …   E …                                                   │
│ fácil · traste 0      │  1  2  3  4  5  6  7  8  9 10 11 12                               │
├───────────────────────┴────────────────────────────────────────────────────────────────────┤
│ Notas: C(1) E(3) G(5) B(7)     [▶ Escuchar]  [+ Añadir a la progresión]                    │ 56
│ También podría ser: Em/C  ·  Puede seguir: Fmaj7 · Am7 · G7 (+)                            │ 40
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ tira 130px                                                                                  │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

Disposición: arriba fila de **identidad** (input + nombre + contexto); centro el **mástil** a ancho completo con lista de posiciones como columna izquierda de miniaturas (scroll interno); abajo franja de **acciones y derivados**. El mástil ocupa >50% de la altura de la vista.

### Comportamiento bidireccional

**Fuente única de verdad:** el par `{acorde seleccionado, posición}` donde la posición es un conjunto de (cuerda, traste) con estado `libre | marcada`. El nombre mostrado, el mástil, la lista y las alternativas son vistas derivadas de ese par.

| Acción del usuario | Efecto |
|---|---|
| Escribe un nombre válido | Acorde = ese; posición = la mejor/primera del catálogo; el mástil la dibuja; la lista se rellena; las marcas anteriores se descartan |
| Hace clic en el mástil | Se alterna la nota; la posición pasa a "libre"; el detector corre en cada clic; si reconoce, el input se actualiza (sin robar foco) con el nombre principal; la lista de posiciones se filtra a "alternativas del mismo acorde" y marca como activa la coincidente si existe |
| Elige una posición de la lista | Mástil refleja la posición; el nombre no cambia (misma entidad); se oye una vez |
| Elige una alternativa de "También podría ser" | El acorde cambia a ese nombre; la posición marcada se conserva (es la misma digitación); notas/intervalos se recalculan |
| Pulsa una nota/cuerda | Suena esa cuerda; no cambia estado |
| "Borrar marcas" | Vacía el mástil; el input se conserva |

Dónde vive cada cosa: **Escuchar** y **Añadir a la progresión** en la franja inferior (una sola vez); lista de posiciones a la izquierda del mástil; notas e intervalos en la franja bajo el mástil (notas del mástil resaltadas al pasar el cursor); **Tonalidad probable** como chip en la fila de identidad (solo si difiere de la actual); **"suena como"** con capo ≠ 0 como segunda línea de identidad (se oculta con capo 0); **Puede seguir** como 3 sugerencias en línea con "(+)" que abre el panel completo dentro de la tira (fantasmas).

Estados vacíos e inválidos:
- Vacío (sin texto, sin marcas): mástil vacío y el texto "Escribe un acorde o marca trastes". Sin nombre, sin Escuchar ni Añadir (deshabilitados).
- Texto inválido: el input se señala con "No reconozco ese acorde"; el mástil conserva el último estado válido en tono atenuado.
- Marcas sin acorde: "Ningún acorde reconocible" donde iría el nombre; se muestran las notas sueltas; Añadir deshabilitado.
- Marcas ambiguas: nombre principal + alternativas visibles, sin cartel.

## 5. Vista Teoría y Vista Práctica

**Teoría** (hoy: Mayor/Menor, raíces, 7, grados, clásicas, Puede seguir). Cambios: se eliminan Mayor/Menor y raíces (los edita la barra; aquí se muestra "Tonalidad: C mayor ▾" como enlace al control de la barra); se elimina el panel Puede seguir (vive en la tira); queda el foco en los grados.

```
┌ barra ─────────────────────────────────────────────────────────────────────────┐
│ C mayor  [ Triadas | Séptimas ]                                                 │ 44
│ ┌ I ──┐ ┌ ii ──┐ ┌ iii ─┐ ┌ IV ──┐ ┌ V ──┐ ┌ vi ──┐ ┌ vii° ┐                    │
│ │ C   │ │ Dm   │ │ Em   │ │ F    │ │ G   │ │ Am   │ │ Bdim │  (clic: carga)    │ ~220
│ │Tónica Subdom. Tónica  Subdom. Dominante Tónica Dominante                      │
│ └─────┘ └──────┘ └──────┘ └──────┘ └─────┘ └──────┘ └──────┘                    │
│ Progresiones clásicas                                                           │
│ I–V–vi–IV [Usar]   ii–V–I [Usar]   I–vi–IV–V [Usar]   (scroll horizontal)       │ ~160
└─────────────────────────────────────────────────────────────────────────────────┘
```
Clic en un grado selecciona el acorde y muestra una mini-previa; un botón "+" visible en cada grado lo añade a la progresión (sin doble clic, que no se descubre). "Usar" reemplaza la progresión y ofrece Deshacer.

**Práctica** (sin tira). Cambios: configuración reducida a una fila; ¡Cambio! es el foco; se oculta la barra de reproducción de la progresión (Correr/Parar se deshabilita).

```
┌ barra ────────────────────────────────────────────────────────────────────────┐
│ [A: Am ▢diagrama]  ⇄  [B: C ▢diagrama]  Modo [Un minuto|Metrónomo] Tempo [−80+]│ 90
│ Tiempos [4|2|1]   ☐ Subir el tempo solo                  [ Empezar ronda ]  ? │
├────────────────────────────────────────────────────────────────────────────────┤
│                 Quedan 42 s      Cambios 18      Récord 24                     │ 90
│                                                                                │
│                      [        ¡ CAMBIO !        ]   (también Espacio)          │ ~220
│                              [Más lento]                                       │
└────────────────────────────────────────────────────────────────────────────────┘
```

## 6. Tira de progresión (130 px)

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ Progresión 5/16     ↶ ↷  [Encadenar]  ·  Tonalidad C mayor (detectada)         [⋯ menú]  │ 28
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌1──┐ ✓ ┌2──┐ ↗ ┌3──┐ → ┌4──┐ ~ ┌5──┐  ┌+Am7┐ ┌+F┐ ┌ ┐ ┌ ┐ … (16)                     │ 66
│ │ I │   │ vi│   │ IV│   │ V │   │ I │                                                   │
│ │ C │   │ Am│   │ F │   │ G │   │ C │                                                   │
│ │Auto   │Auto   │pos2   │Auto   │Auto                                                   │
│ └▔▔▔┘   └▔▔▔┘   └▔▔▔┘   └▔▔▔┘   └▔▔▔┘                                                   │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ V→I resuelve · notas comunes: G  │  Capo recomendado: 3 (formas fáciles) [Aplicar]       │ 28
└──────────────────────────────────────────────────────────────────────────────────────────┘
```
Cabecera visible: título + contador, Deshacer/Rehacer, Encadenar, tonalidad detectada (solo lectura). Menú ⋯: Vaciar progresión, Guardar, Mis progresiones (Abrir/Borrar), Compartir enlace. El menú sustituye a tres botones y a su formulario inline. Cada paso muestra numeral, nombre, posición/Auto y barra de función; "notas compartidas" pasa al análisis del pie (se retira del paso). Marcas de transición seleccionan el cambio y el pie explica. Picker de paso: popover con posiciones (máx. 9), ritmo del paso, ← →, Quitar, cerrar. Huecos fantasma: máximo 3 visibles + "…".

## 7. Móvil (≤640 px)

- Barra: fila 1 = Correr + Tempo + ⚙; fila 2 = Capo + Tonalidad. Navegación pasa a **barra inferior fija** de 3 iconos. Reproducción/Sonido/Ajustes se agrupan en una hoja inferior ("Más").
- Acorde: input, mástil horizontal con scroll lateral de trastes; posiciones y notas en acordeón; Escuchar y Añadir como barra de acciones fija bajo el mástil.
- Teoría: grados en rejilla 2×4; clásicas en lista.
- Práctica: ¡Cambio! ocupa el ancho; configuración en hoja plegable.
- Tira: colapsada a una fila de chips con scroll horizontal ("Desliza →"); al tocar se abre la hoja con picker y análisis. La tira de ~60 px + barra inferior de 56 px.

## 8. Riesgos y preguntas abiertas

1. **Tonalidad en un solo control.** Riesgo de que un desplegable sea menos inmediato que 12 botones. *Recomendado:* popover con cuadrícula de 12 raíces + Mayor/Menor + Auto, abre con un clic.
2. **Detector que reescribe el input.** Puede sentirse que el texto "salta". *Recomendado:* solo actualizar el input si el usuario no está escribiendo; mostrar el nombre detectado grande aparte.
3. **Perder el Puede seguir como panel grande.** *Recomendado:* resumen de 3 sugerencias en Acorde y fantasmas en la tira; panel completo solo a un clic.
4. **Tempo de Práctica propio vs. el global.** *Recomendado:* inicializar desde la barra, editar solo en Práctica, sin sincronización posterior para no sorprender.
5. **Altura a 1024×640.** El presupuesto queda ajustado (~400 px de vista). *Recomendado:* reducir mástil a 9 trastes visibles con desplazamiento horizontal interno y plegar la tira a 96 px en esa altura.
