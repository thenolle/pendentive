import { isBrowser } from './dom'
import { createEmitter } from './controller'
import { buildTokensCss, defaultTheme } from '../styles/tokens'
import type { SocleThemeTokens } from '../styles/tokens'

const TOKENS_STYLE_ID = 'socle-tokens'

let currentTheme: SocleThemeTokens = { ...defaultTheme }
const emitter = createEmitter<{ change: Readonly<SocleThemeTokens> }>()

function applyThemeToDom(): void {
  if (!isBrowser()) return
  let style = document.getElementById(TOKENS_STYLE_ID) as HTMLStyleElement | null
  if (!style) {
    style = document.createElement('style')
    style.id = TOKENS_STYLE_ID
    document.head.appendChild(style)
  }
  style.textContent = buildTokensCss(currentTheme)
}

/** Returns the currently active theme tokens (read-only snapshot). */
export function getTheme(): Readonly<SocleThemeTokens> {
  return currentTheme
}

/**
 * Overrides one or more theme tokens at runtime. Any token you omit keeps
 * its current value. Re-injects the `:root { --socle-* }` style tag and
 * notifies subscribers registered via `onThemeChange`.
 *
 * @param overrides - Partial theme tokens to merge over the current theme.
 */
export function setTheme(overrides: Partial<SocleThemeTokens>): void {
  currentTheme = { ...currentTheme, ...overrides }
  applyThemeToDom()
  emitter.emit('change', currentTheme)
}

/** Restores every theme token to Socle's built-in defaults. */
export function resetTheme(): void {
  currentTheme = { ...defaultTheme }
  applyThemeToDom()
  emitter.emit('change', currentTheme)
}

/**
 * Subscribes to theme changes made via `setTheme`/`resetTheme`.
 * @returns An unsubscribe function.
 */
export function onThemeChange(listener: (theme: Readonly<SocleThemeTokens>) => void): () => void {
  return emitter.on('change', listener)
}

// Safe at module load: `applyThemeToDom` checks `isBrowser()` first, so this
// is a guaranteed no-op in Node/Bun and an automatic style injection in the browser.
applyThemeToDom()