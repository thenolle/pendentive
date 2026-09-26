import { isBrowser } from './dom'

const STYLE_ID = 'pendentive-styles'
const injectedKeys = new Set<string>()

/** A handful of utility classes nearly every component depends on (icon color, hidden state). Injected once, ahead of any component-specific CSS. */
const baseCss = `
.pendentive-hidden { display: none !important }
.pendentive-icon { color: var(--pendentive-muted-foreground); flex-shrink: 0 }
`

function getStyleSheet(): HTMLStyleElement | null {
  if (!isBrowser) return null
  let sheet = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (!sheet) {
    sheet = document.createElement('style')
    sheet.id = STYLE_ID
    document.head.appendChild(sheet)
  }
  return sheet
}

/**
 * Injects a single CSS block exactly once, keyed by `key`. Safe to call from every
 * instance of every component -- the second and later calls for the same key are no-ops.
 *
 * Each component factory calls this with its own colocated CSS string right after
 * `assertDom`, so consumers never import or link any CSS file themselves -- and an app
 * that only imports `Button` never pays for `Dialog`'s or `Table`'s styles.
 *
 * @param key - A stable identifier for this CSS block (typically the component name). Shared blocks (e.g. field-base) reuse the same key across multiple components to dedupe.
 * @param css - The raw CSS text to inject.
 */
export function ensureComponentStyles(key: string, css: string): void {
  const sheet = getStyleSheet()
  if (!sheet) return
  if (!injectedKeys.has('base')) {
    sheet.appendChild(document.createTextNode(baseCss))
    injectedKeys.add('base')
  }
  if (injectedKeys.has(key)) return
  sheet.appendChild(document.createTextNode(css))
  injectedKeys.add(key)
}