// Texts of the first-visit welcome (src/welcome).
export const welcomeText = {
  es: {
    label: 'Bienvenida a SERENDIPIA',
    skip: 'Saltar',
    back: 'Atrás',
    next: 'Siguiente',
    start: 'Comenzar',
    play: 'Empezar a tocar',
    progress: 'Paso',
    of: 'de',
    steps: [
      {
        kicker: 'serendipia · f.',
        title: 'SERENDIPIA',
        body: 'Hallazgo valioso que llega sin buscarlo. Aquí, un mapa del cielo para encontrar acordes, encadenarlos y quedarte con los que suenan bien.',
      },
      {
        kicker: 'I · El acorde',
        title: 'Busca un acorde',
        body: 'Escríbelo o márcalo en el mástil: te digo su nombre, sus notas y las posiciones para tocarlo.',
      },
      {
        kicker: 'II · La constelación',
        title: 'Traza tu progresión',
        body: 'Cada acorde es una estrella y su color cuenta su función: tónica, subdominante, dominante o prestado. Dale a Escuchar y tócala a tu tempo.',
      },
      {
        kicker: 'III · El hallazgo',
        title: 'Deja sitio a la casualidad',
        body: 'Las estrellas punteadas son hallazgos: acordes que pueden seguir. Pruébalos; a veces el mejor llega sin buscarlo.',
      },
    ],
  },
  en: {
    label: 'Welcome to SERENDIPIA',
    skip: 'Skip',
    back: 'Back',
    next: 'Next',
    start: 'Begin',
    play: 'Start playing',
    progress: 'Step',
    of: 'of',
    steps: [
      {
        kicker: 'serendipity · n.',
        title: 'SERENDIPIA',
        body: 'A happy find you were not looking for. Here, a map of the sky to find chords, chain them and keep the ones that sound right.',
      },
      {
        kicker: 'I · The chord',
        title: 'Find a chord',
        body: 'Type it or mark it on the fretboard: you get its name, its notes and the shapes to play it.',
      },
      {
        kicker: 'II · The constellation',
        title: 'Trace your progression',
        body: 'Each chord is a star and its colour tells its function: tonic, subdominant, dominant or borrowed. Press Listen and play it at your tempo.',
      },
      {
        kicker: 'III · The find',
        title: 'Leave room for chance',
        body: 'Dotted stars are finds: chords that could come next. Try them; sometimes the best one arrives unlooked for.',
      },
    ],
  },
} as const
