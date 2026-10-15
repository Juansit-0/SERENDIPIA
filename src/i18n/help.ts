// The help panel: how each part works, what is new, and what the app is.
export type HelpSectionId = 'chord' | 'strip' | 'play' | 'theory' | 'songbook' | 'tools' | 'keys' | 'news' | 'about'

interface Section {
  id: HelpSectionId
  title: string
  items: string[]
}

/** Newest first. Each entry is one published version with what a player would notice. */
export const CHANGELOG: Array<{ version: string; es: string[]; en: string[] }> = [
  {
    version: '2.29',
    es: [
      'La guitarra vuelve a oírse por encima de la banda.',
      'El Afinador tiene su propia pestaña, con un cielo animado: un anillo de estrellas que vibra hasta que la cuerda está justa.',
      'Las notas del acorde dicen qué son: Raíz, 3ª menor, 5ª justa…',
      'El nombre del acorde vive dentro de su óvalo, que se dibuja con cada acorde; de día vuelven las posiciones del sol.',
    ],
    en: [
      'The guitar is heard above the band again.',
      'The Tuner has its own tab with an animated sky: a ring of stars that shakes until the string is right.',
      'Chord notes say what they are: Root, minor 3rd, perfect 5th…',
      'The chord name lives inside its oval, which draws itself for each chord; by day the sun positions are back.',
    ],
  },
  {
    version: '2.28',
    es: [
      'La banda suena de verdad: batería grabada (bombo, caja, aro, escobillas, charles) y bajo eléctrico o contrabajo, que camina hacia el siguiente acorde.',
      'Vuelven las lunas y los soles: un arco sobre el mástil que sigue el pulso mientras suena.',
      'Práctica más directa: Cambios y Afinador delante; Oído, Grabar y Progreso en «Más».',
    ],
    en: [
      'The band sounds real: recorded drums (kick, snare, side stick, brushes, hi-hat) and electric or upright bass that walks into the next chord.',
      'The moons and suns are back: an arc over the fretboard that follows the beat while it plays.',
      'A more direct Practice: Changes and Tuner up front; Ear, Record and Progress under «More».',
    ],
  },
  {
    version: '2.27',
    es: [
      'Pantalla más tranquila: fuera adornos y datos repetidos; el mástil tiene más sitio. La función de cada estrella de la tira aparece al pasar el ratón.',
    ],
    en: [
      'A calmer screen: decorations and repeated details are gone; the fretboard has more room. Hover a strip star to see its function.',
    ],
  },
  {
    version: '2.26',
    es: ['Títulos de sección más grandes y claros (Posiciones, Mástil, Notas del acorde, Puede seguir…).'],
    en: ['Larger, clearer section titles (Positions, Fretboard, Chord notes, What can follow…).'],
  },
  {
    version: '2.25',
    es: [
      'El sonido responde al instante: tocar un acorde ya no tiene retraso.',
      'Cancionero más fácil: toca una palabra y elige su acorde, sin escribir corchetes.',
      'Pega una canción con los acordes encima de la letra y se colocan solos.',
    ],
    en: [
      'Sound answers at once: tapping a chord no longer lags.',
      'Easier songbook: tap a word and pick its chord, no brackets to type.',
      'Paste a song with the chords above the lyrics and they place themselves.',
    ],
  },
  {
    version: '2.24',
    es: ['Ayuda «¿Cómo se usa?» (tecla ?), novedades y bienvenida al día.'],
    en: ['«How it works» help (? key), what is new, and an updated welcome.'],
  },
  {
    version: '2.23',
    es: ['Cancionero: letra con los acordes encima, que avanza sola al tocarla; se transpone, imprime y comparte.'],
    en: ['Songbook: lyrics with chords on top that move on as it plays; transpose, print and share.'],
  },
  {
    version: '2.20–2.22',
    es: [
      'Acompañamiento de bajo y batería (Pop, Balada, Rock, Bossa).',
      'Marcar el tempo tocando (tecla T) y subdivisión del click.',
      'Práctica → Grabar: grábate encima de la banda.',
    ],
    en: [
      'Bass and drum backing (Pop, Ballad, Rock, Bossa).',
      'Tap the tempo (T key) and click subdivision.',
      'Practice → Record: record yourself over the band.',
    ],
  },
  {
    version: '2.13–2.19',
    es: [
      'Oír: el micrófono reconoce el acorde que tocas.',
      'Práctica → Oído y Progreso; Teoría → Escalas.',
      'Mi patrón de rasgueo, canciones compartibles y vista previa de enlaces.',
    ],
    en: [
      'Hear: the microphone names the chord you play.',
      'Practice → Ear and Progress; Theory → Scales.',
      'My strum pattern, shareable songs and link previews.',
    ],
  },
]

export const helpText: Record<
  'es' | 'en',
  {
    title: string
    open: string
    close: string
    nav: string
    newsTitle: string
    newsNotice: string
    newsAction: string
    sections: Section[]
  }
> = {
  es: {
    title: '¿Cómo se usa?',
    open: '¿Cómo se usa?',
    close: 'Cerrar la ayuda',
    nav: 'Temas de la ayuda',
    newsTitle: 'Novedades',
    newsNotice: 'SERENDIPIA tiene novedades',
    newsAction: 'Ver novedades',
    sections: [
      {
        id: 'chord',
        title: 'Acorde',
        items: [
          'Escribe un acorde (Am7, Do, G/B…) o marca trastes en el mástil: te dice su nombre, sus notas y sus posiciones.',
          'El micrófono junto al campo del acorde lo escucha: rasguea y el acorde de arriba sigue lo que tocas.',
          '«Puede seguir» propone acordes que encajan; el + los añade a la progresión.',
          'Toca una posición para oírla; «Añadir a la progresión» la lleva a la tira.',
        ],
      },
      {
        id: 'strip',
        title: 'La tira (progresión)',
        items: [
          'Tu progresión, como una constelación: el color de cada estrella es su función — lila tónica, turquesa subdominante, oro dominante, rosa prestado (pasa el ratón por una estrella para verlo).',
          'Toca un paso para elegir su posición y su ritmo; arrástralo para moverlo. Entre pasos, un comentario explica el cambio.',
          'Las estrellas punteadas son hallazgos: acordes que podrían seguir.',
          'En ⋯: guardar, transponer, canciones por secciones, copia de seguridad, compartir enlace e imprimir la hoja.',
          'Deshacer y rehacer con las flechas curvas (o ⌘Z / ⌘⇧Z).',
        ],
      },
      {
        id: 'play',
        title: 'Tocar',
        items: [
          'Correr hace sonar la progresión; el tempo se cambia con − y + o marcándolo en Reproducción (tecla T).',
          'Reproducción: ritmo de rasgueo (o «Mi patrón»), acompañamiento de bajo y batería, repetir, click y su subdivisión.',
          'Sonido: el timbre de la guitarra y el volumen.',
        ],
      },
      {
        id: 'theory',
        title: 'Teoría',
        items: [
          'Acordes: los siete de la tonalidad con su función; tócalos o añádelos. Debajo, progresiones clásicas listas para usar.',
          'Escalas: la escala de la tonalidad en todo el mástil, por posiciones; las notas del acorde que suena van rellenas.',
        ],
      },
      {
        id: 'songbook',
        title: 'Cancionero',
        items: [
          'En «Letra» escribe o pega la letra. Si la pegas de internet con los acordes en la línea de arriba, se colocan solos.',
          'En «Acordes» toca una palabra y elige su acorde: primero salen los que ya usa la canción y luego los de su tonalidad (suenan al elegirlos). Toca un acorde puesto para cambiarlo o quitarlo.',
          'Tocar hace sonar los acordes en orden y la letra avanza sola. También se transpone, imprime y comparte.',
        ],
      },
      {
        id: 'tools',
        title: 'Afinador y ajustes',
        items: [
          'Afinador (su propia pestaña): activa el micrófono y toca una cuerda al aire. El anillo de estrellas vibra si está desafinada (lila baja, dorado alta) y se calma en turquesa al estar justa. Toca una clavija para fijar la cuerda y oír su nota.',
          '☾/☀ cambia entre noche y día; en Ajustes eliges automático, la notación (C o Do) y el idioma.',
          'Se instala en el móvil («Añadir a pantalla de inicio») y funciona sin conexión.',
          'Todo lo tuyo se guarda en este navegador: usa ⋯ → Mis progresiones → Descargar copia para llevarlo a otro.',
        ],
      },
      {
        id: 'keys',
        title: 'Atajos',
        items: [
          'Espacio: correr / parar',
          '→ ← o pedal (PageDown/PageUp): acorde siguiente / anterior',
          'T: marcar el tempo',
          '⌘Z / ⌘⇧Z: deshacer / rehacer',
          '?: esta ayuda',
        ],
      },
      { id: 'news', title: 'Novedades', items: [] },
      {
        id: 'about',
        title: 'Acerca de',
        items: [
          'SERENDIPIA es una app para practicar guitarra: acordes, teoría, oído y canciones, hecha por Juan Camilo López Díaz.',
          'Hecha con React, TypeScript, Tone.js (sonido) y three.js (la bienvenida). No tiene servidor: funciona entera en tu navegador, también sin conexión.',
          'Sonidos de guitarra y bajo: soundfont MusyngKite (CC BY-SA 3.0). Batería: Big Rusty Drums de Karoryfer (CC0). Tipografías IM Fell English, EB Garamond y Jost (SIL OFL). Código con licencia MIT.',
        ],
      },
    ],
  },
  en: {
    title: 'How it works',
    open: 'How it works',
    close: 'Close help',
    nav: 'Help topics',
    newsTitle: 'What is new',
    newsNotice: 'SERENDIPIA has something new',
    newsAction: 'See what is new',
    sections: [
      {
        id: 'chord',
        title: 'Chord',
        items: [
          'Type a chord (Am7, Do, G/B…) or mark frets on the fretboard: you get its name, notes and shapes.',
          'The microphone next to the chord field listens: strum and the chord above follows what you play.',
          '«Could follow» suggests chords that fit; + adds them to the progression.',
          'Tap a shape to hear it; «Add to progression» takes it to the strip.',
        ],
      },
      {
        id: 'strip',
        title: 'The strip (progression)',
        items: [
          'Your progression as a constellation: each star’s colour is its function — lilac tonic, turquoise subdominant, gold dominant, pink borrowed (hover a star to see it).',
          'Tap a step to choose its shape and rhythm; drag it to move it. Between steps, a note explains the change.',
          'Dotted stars are finds: chords that could come next.',
          'In ⋯: save, transpose, songs by sections, backup, share link and print sheet.',
          'Undo and redo with the curved arrows (or ⌘Z / ⌘⇧Z).',
        ],
      },
      {
        id: 'play',
        title: 'Playing',
        items: [
          'Run plays the progression; change the tempo with − and + or tap it in Playback (T key).',
          'Playback: strum rhythm (or «My pattern»), bass and drum backing, loop, click and its subdivision.',
          'Sound: the guitar’s timbre and the volume.',
        ],
      },
      {
        id: 'theory',
        title: 'Theory',
        items: [
          'Chords: the seven of the key with their function; play or add them. Below, classic progressions ready to use.',
          'Scales: the key’s scale over the whole neck, by positions; the tones of the sounding chord are filled.',
        ],
      },
      {
        id: 'songbook',
        title: 'Songbook',
        items: [
          'In «Lyrics» write or paste the lyrics. Pasted from the web with the chords on the line above, they place themselves.',
          'In «Chords» tap a word and pick its chord: the song’s own chords first, then its key’s (they sound as you pick). Tap a placed chord to change or remove it.',
          'Play sounds the chords in order and the lyrics move on by themselves. It also transposes, prints and shares.',
        ],
      },
      {
        id: 'tools',
        title: 'Tuner and settings',
        items: [
          'Tuner (its own tab): turn on the microphone and play an open string. The ring of stars shakes when it is out of tune (lilac low, gold high) and settles in turquoise when it is right. Tap a peg to fix the string and hear its note.',
          '☾/☀ switches night and day; in Settings choose automatic, the notation (C or Do) and the language.',
          'It installs on your phone («Add to home screen») and works offline.',
          'Everything of yours is kept in this browser: use ⋯ → My progressions → Download backup to take it elsewhere.',
        ],
      },
      {
        id: 'keys',
        title: 'Shortcuts',
        items: [
          'Space: run / stop',
          '→ ← or pedal (PageDown/PageUp): next / previous chord',
          'T: tap the tempo',
          '⌘Z / ⌘⇧Z: undo / redo',
          '?: this help',
        ],
      },
      { id: 'news', title: 'What is new', items: [] },
      {
        id: 'about',
        title: 'About',
        items: [
          'SERENDIPIA is an app to practise guitar: chords, theory, ear and songs, made by Juan Camilo López Díaz.',
          'Built with React, TypeScript, Tone.js (sound) and three.js (the welcome). No server: it runs entirely in your browser, offline too.',
          'Guitar and bass sounds: MusyngKite soundfont (CC BY-SA 3.0). Drums: Karoryfer’s Big Rusty Drums (CC0). Typefaces IM Fell English, EB Garamond and Jost (SIL OFL). Code under the MIT license.',
        ],
      },
    ],
  },
}
