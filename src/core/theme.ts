import { isBrowser } from './dom'
import { createEmitter } from './controller'
import { buildTokensCss, defaultTheme } from '../styles/tokens'
import type { PendentiveThemeTokens } from '../styles/tokens'

const TOKENS_STYLE_ID = 'pendentive-tokens'

let currentTheme: PendentiveThemeTokens = { ...defaultTheme }
const emitter = createEmitter<{ change: Readonly<PendentiveThemeTokens> }>()

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
export function getTheme(): Readonly<PendentiveThemeTokens> {
  return currentTheme
}

/**
 * Overrides one or more theme tokens at runtime. Any token you omit keeps
 * its current value. Re-injects the `:root { --pendentive-* }` style tag and
 * notifies subscribers registered via `onThemeChange`.
 *
 * @param overrides - Partial theme tokens to merge over the current theme.
 */
export function setTheme(overrides: Partial<PendentiveThemeTokens>): void {
  currentTheme = { ...currentTheme, ...overrides }
  applyThemeToDom()
  emitter.emit('change', currentTheme)
}

/** Restores every theme token to Pendentive's built-in defaults. */
export function resetTheme(): void {
  currentTheme = { ...defaultTheme }
  applyThemeToDom()
  emitter.emit('change', currentTheme)
}

/**
 * Subscribes to theme changes made via `setTheme`/`resetTheme`.
 * @returns An unsubscribe function.
 */
export function onThemeChange(listener: (theme: Readonly<PendentiveThemeTokens>) => void): () => void {
  return emitter.on('change', listener)
}

// Safe at module load: `applyThemeToDom` checks `isBrowser()` first, so this
// is a guaranteed no-op in Node/Bun and an automatic style injection in the browser.
applyThemeToDom()