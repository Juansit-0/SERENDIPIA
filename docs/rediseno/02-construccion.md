# Rediseño · fase 3: construcción «Carta celeste»

Brief común para los agentes que construyen el rediseño. Léelo entero antes de editar.

## Fuentes de verdad (léelas)
1. `docs/rediseno/01-arquitectura.md`: estructura aprobada (qué va dónde, duplicados resueltos, comportamiento).
2. `.impeccable/surfaces/src-app-tsx.md`: contrato de dirección (THESIS, OWN-WORLD, STORY, FIRST VIEWPORT, FORM).
3. Mockup aprobado: `.impeccable/mocks/decision/carta-celeste-demo.html`, con sus capturas `carta-celeste-demo-noche.png` y `carta-celeste-demo-dia.png`. Ábrelas: es la referencia visual. Es un mockup estático, no código a copiar tal cual.
4. Las referencias del usuario: `.impeccable/references/ref-magic-poster.png` y `ref-background-color-theory.png`.
5. Suelo de calidad de Impeccable: `/Users/juansit0/.claude/skills/impeccable/reference/craft-floor.md`. Úsalo: contraste, estados, sin glifos unicode como iconos, etc.

## Sistema ya construido (úsalo, no lo dupliques)
- `src/styles/celeste.css`: tokens de los dos temas sobre `html[data-theme="night|day"]`, expuestos como utilidades de Tailwind: `bg-ground`, `bg-ground-2`, `bg-ground-3`, `text-ink`, `text-ink-soft`, `text-ink-faint`, `border-line`, `border-line-strong`, `bg-accent`, `text-accent-ink`, `text-accent-deep`, `text-fn-tonic|sub|dom|borrowed`, `bg-fn-*-fill`, y las fuentes `font-display` (IM Fell English), `font-serif` (EB Garamond) y `font-ui` (Jost).
  - Componentes: `.cc-module` (sección con filete y esquinas), `.cc-label` (título de sección), `.cc-btn` con `--primary`, `--ghost`, `--icon` y `--lg`; los estados `aria-pressed`, `aria-current` y `aria-expanded` lo rellenan. También `.cc-seg` (segmentado), `.cc-chip` (información, no control), `.cc-pop` (popover), `.cc-hero` (nombre del acorde: pon `--chars` inline y un contenedor `@container`), `.cc-gloss`, `.cc-num`, `.cc-hatch` (/////), `.cc-checker` (rombos), `.cc-twinkle`, y la clase `.on-dark`, que aplica la paleta nocturna dentro de una banda oscura (la tira de día).
  - Si necesitas CSS propio, créalo en `src/styles/<tu-area>.css` e impórtalo desde tu componente. **No edites `celeste.css` ni `tailwind.css`.**
- `src/state/theme.ts`: `useTheme()` devuelve `{ theme, toggle(originEl) }`, con el eclipse incluido.
- `src/components/icons.tsx`: iconos SVG (Play, Stop, Listen, Plus, Minus, ChevronDown, Close, Undo, Redo, Settings, More, Moon, Sun, Sound, Loop, Share, Sparkle, Resolve, Tension, Deceptive, Color, Surprise, Smooth, ArrowRight, Repeat). Si te falta uno, créalo en tu propio archivo con la misma gramática: 24px, trazo 1.6.
- Store (`src/state/store.tsx`, **no lo edites**): todo lo que ya existía, más el mástil unificado de la vista Acorde: `chartSource`, `chartFrets` (trastes de forma), `detection`, `toggleChartFret(string, absoluteFret)`, `pickDetectedName(anglo)`, `clearChartMarks()` y `setChordInputFocused(bool)`. Las vistas son `'chord' | 'theory' | 'practice'`.

## Reglas de diseño (obligatorias)
- **Nota del usuario al aprobar: los botones y las secciones deben distinguirse claramente.** Todo control debe verse como control: `.cc-btn` con forma, borde y relleno visibles, y estados pulsado o activo evidentes. Toda sección es un `.cc-module` con su `.cc-label`. El ornamento va siempre detrás y nunca sobre datos ni controles.
- **El color es información**, igual en día y noche: tónica `fn-tonic`, subdominante `fn-sub`, dominante `fn-dom`, prestado `fn-borrowed`. Roles de nota: raíz = estrella de 4 puntas, 3.ª = círculo lleno, 7.ª = rombo, extensión = anillo; la 5.ª y las demás, punto pequeño.
- Texto con significado ≥ 11px. Controles ≥ 28px en escritorio (44px en táctil; ya lo resuelve `.cc-btn`). Contraste del cuerpo ≥ 4.5:1.
- **Escritorio** (`desk:` = ≥1024×640): sin scroll de página a 1366×768 ni a 1280×720. Presupuesto: barra superior 52px, tira ~130–150px y la vista ocupa el resto. **Móvil**: el layout fluye, sin scroll horizontal.
- Bilingüe ES/EN. Si necesitas textos nuevos, **no edites `src/i18n/es.ts` ni `en.ts`** (otros agentes trabajan en paralelo): crea `src/i18n/<tu-area>.ts` con `export const <area>Text = { es: {...}, en: {...} }` y léelo con `lang` del store.
- Accesibilidad: nombres accesibles, foco visible, teclado. Respeta `prefers-reduced-motion`.
- Los dos temas tienen que verse bien. Para probar: `localStorage.setItem('serendipia.theme','night'|'day'); location.reload()`.

## Verificación de cada agente
- `npm run typecheck`, `npm run lint` y `npx vitest run` en verde. Otros agentes editan en paralelo: si falla un archivo que no es tuyo, vuelve a intentar más tarde y no lo toques.
- Actualiza o crea los tests de tus componentes (Testing Library + jsdom, `src/test/renderApp.tsx`). Conserva los nombres accesibles cuando puedas.
- Comprobación visual: levanta tu propio servidor (`npx vite --port <tu puerto> --strictPort`), abre una pestaña propia del navegador integrado, `resize_window` a 1366×768 (también 1920×1080 y 390×844), y verifica en los dos temas con medidas del DOM y una captura. Las capturas pueden salir viejas o en blanco si el panel está oculto: confía en el DOM. Al terminar, cierra tu servidor y tu pestaña.
- Nada de git que cambie estado.
