import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { cx, px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'

/** Named size preset or an explicit pixel diameter/side length. */
export type AvatarSize = number | 'sm' | 'md' | 'lg' | 'xl'
/** Presence indicator shown as a small dot on the avatar's edge. */
export type AvatarStatus = 'online' | 'offline' | 'away' | 'busy'

/** Options accepted by the `Avatar` factory. */
export interface AvatarOptions {
  /** Image URL. Falls back to initials if omitted or if the image fails to load. */
  src?: string
  /** Accessible alt text for the image. Defaults to `name`. */
  alt?: string
  /** Fallback text (typically 1-2 letters) shown when there's no image. Derived from `name` if omitted. */
  initials?: string
  /** Full display name. Used to derive `initials`, a deterministic background color, and the `aria-label`. */
  name?: string
  /** Size preset or a pixel value. Defaults to `'md'` (36px). */
  size?: AvatarSize
  /** Outline shape. Defaults to `'circle'`. */
  shape?: 'circle' | 'square'
  /** Optional presence dot rendered on the bottom-right edge. */
  status?: AvatarStatus
  /** Draws a themed ring around the avatar, useful for "selected" or "active user" states. Defaults to `false`. */
  ring?: boolean
  /** Minimum time (ms) the loading shimmer stays visible before swapping to the image/fallback, so fast loads don't flicker. Defaults to `150`. */
  delayMs?: number
  /** Makes the avatar focusable and clickable (e.g. to open a profile menu). */
  onClick?: () => void
}

/** The runtime control surface attached to every `Avatar` element. */
export interface AvatarApi {
  /** Replaces the image source, or falls back to initials if `undefined`. */
  setSrc: (src: string | undefined) => void
  /** Replaces the fallback initials shown when there's no image. */
  setInitials: (initials: string) => void
  /** Updates or clears the presence dot. */
  setStatus: (status: AvatarStatus | undefined) => void
  /** Detaches the avatar from the DOM and its internal listeners. */
  destroy: () => void
}

/** An `Avatar` is a real `HTMLDivElement` (the wrapper, so the status dot can sit outside the clipped circle) extended with `AvatarApi`. */
export type AvatarElement = HTMLDivElement & AvatarApi

/** This component's own CSS, colocated and self-injected on first use. */
export const avatarCss = `
.pendentive-avatar-wrap { position: relative; display: inline-flex; flex-shrink: 0 }
.pendentive-avatar { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: var(--pendentive-secondary); color: var(--pendentive-secondary-foreground); font-weight: 600; overflow: hidden }
.pendentive-avatar-circle { border-radius: 50% }
.pendentive-avatar-square { border-radius: var(--pendentive-radius-sm) }
.pendentive-avatar img { width: 100%; height: 100%; object-fit: cover; display: block }
.pendentive-avatar-ring { box-shadow: 0 0 0 2px var(--pendentive-card), 0 0 0 4px var(--pendentive-ring) }
.pendentive-avatar-clickable { cursor: pointer; transition: opacity 120ms ease }
.pendentive-avatar-clickable:hover { opacity: 0.85 }
.pendentive-avatar-clickable:focus-visible { outline: 2px solid var(--pendentive-ring); outline-offset: 2px; border-radius: 50% }
.pendentive-avatar-loading { animation: pendentive-avatar-shine 1.4s ease infinite; background: linear-gradient(90deg, var(--pendentive-secondary) 25%, var(--pendentive-accent) 37%, var(--pendentive-secondary) 63%); background-size: 400% 100% }
@keyframes pendentive-avatar-shine { 0% { background-position: 100% 50% } 100% { background-position: 0 50% } }
.pendentive-avatar-status { position: absolute; right: -1px; bottom: -1px; border-radius: 50%; border: 2px solid var(--pendentive-card) }
.pendentive-avatar-status-online { background: var(--pendentive-success) }
.pendentive-avatar-status-away { background: var(--pendentive-warning) }
.pendentive-avatar-status-busy { background: var(--pendentive-destructive) }
.pendentive-avatar-status-offline { background: var(--pendentive-muted-foreground) }
`

const sizePresets: Record<'sm' | 'md' | 'lg' | 'xl', number> = { sm: 24, md: 36, lg: 48, xl: 64 }

/** A small, pleasant palette used to derive a consistent per-person color from `name` -- no dependency, no theme config needed. */
const namePalette: Array<{ bg: string, fg: string }> = [
  { bg: '#fee2e2', fg: '#b91c1c' },
  { bg: '#ffedd5', fg: '#c2410c' },
  { bg: '#fef9c3', fg: '#a16207' },
  { bg: '#dcfce7', fg: '#15803d' },
  { bg: '#ccfbf1', fg: '#0f766e' },
  { bg: '#dbeafe', fg: '#1d4ed8' },
  { bg: '#ede9fe', fg: '#6d28d9' },
  { bg: '#fce7f3', fg: '#be185d' }
]

function resolveSize(size: AvatarSize | undefined): number {
  if (size === undefined) return sizePresets.md
  return typeof size === 'number' ? size : sizePresets[size]
}

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  return hash
}

function colorForName(name: string): { bg: string, fg: string } {
  return namePalette[hashString(name) % namePalette.length]!
}

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return (parts[0] ?? '').slice(0, 2).toUpperCase()
  return `${parts[0]?.[0] ?? ''}${parts[parts.length - 1]?.[0] ?? ''}`.toUpperCase()
}

/** Creates a circular or square avatar with automatic initials fallback, name-derived color, a loading shimmer, an optional presence dot, and optional click handling. */
export function Avatar(options: AvatarOptions = {}): AvatarElement {
  assertDom('Avatar')
  ensureComponentStyles('avatar', avatarCss)
  const shape = options.shape ?? 'circle'
  const size = resolveSize(options.size)
  const delayMs = options.delayMs ?? 150
  let initials = options.initials ?? (options.name ? deriveInitials(options.name) : '')
  let status = options.status
  let pendingTimer: ReturnType<typeof setTimeout> | null = null
  const wrap = el('div', px('avatar-wrap'))
  wrap.style.width = `${size}px`
  wrap.style.height = `${size}px`
  if (options.ring) wrap.classList.add(px('avatar-ring'))
  wrap.setAttribute('aria-label', options.alt ?? options.name ?? initials ?? 'Avatar')
  const body = el('div', cx(px('avatar'), px(`avatar-${shape}`)))
  body.style.fontSize = `${Math.max(10, Math.round(size / 2.6))}px`
  if (options.name) {
    const { bg, fg } = colorForName(options.name)
    body.style.background = bg
    body.style.color = fg
  }
  wrap.appendChild(body)
  let statusEl: HTMLDivElement | null = null
  function syncStatus(): void {
    if (status) {
      if (!statusEl) {
        statusEl = el('div', px('avatar-status'))
        wrap.appendChild(statusEl)
      }
      statusEl.className = cx(px('avatar-status'), px(`avatar-status-${status}`))
      const dotSize = Math.max(8, Math.round(size * 0.28))
      statusEl.style.width = `${dotSize}px`
      statusEl.style.height = `${dotSize}px`
    } else if (statusEl) {
      statusEl.remove()
      statusEl = null
    }
  }
  syncStatus()
  function clearPendingTimer(): void {
    if (pendingTimer) clearTimeout(pendingTimer)
    pendingTimer = null
  }
  function showFallback(): void {
    body.classList.remove(px('avatar-loading'))
    body.replaceChildren()
    const fallback = document.createElement('span')
    fallback.textContent = initials
    body.appendChild(fallback)
  }
  function render(src: string | undefined): void {
    clearPendingTimer()
    if (!src) {
      showFallback()
      return
    }
    body.classList.add(px('avatar-loading'))
    body.replaceChildren()
    const startedAt = Date.now()
    const image = document.createElement('img')
    image.decoding = 'async'
    image.loading = 'lazy'
    image.alt = options.alt ?? options.name ?? ''
    const settle = (apply: () => void): void => {
      const remaining = Math.max(0, delayMs - (Date.now() - startedAt))
      pendingTimer = setTimeout(() => {
        body.classList.remove(px('avatar-loading'))
        apply()
      }, remaining)
    }
    image.addEventListener('load', () => settle(() => body.replaceChildren(image)), { once: true })
    image.addEventListener('error', () => settle(showFallback), { once: true })
    image.src = src
  }
  render(options.src)
  let unbindClick: (() => void) | null = null
  if (options.onClick) {
    const handler = options.onClick
    wrap.classList.add(px('avatar-clickable'))
    wrap.tabIndex = 0
    wrap.setAttribute('role', 'button')
    const clickListener = (): void => handler()
    const keyListener = (event: KeyboardEvent): void => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        handler()
      }
    }
    wrap.addEventListener('click', clickListener)
    wrap.addEventListener('keydown', keyListener)
    unbindClick = () => {
      wrap.removeEventListener('click', clickListener)
      wrap.removeEventListener('keydown', keyListener)
    }
  }
  const api: AvatarApi = {
    setSrc(src) {
      render(src)
    },
    setInitials(newInitials) {
      initials = newInitials
      if (!options.src) showFallback()
    },
    setStatus(newStatus) {
      status = newStatus
      syncStatus()
    },
    destroy() {
      clearPendingTimer()
      unbindClick?.()
      wrap.remove()
    }
  }
  return attachController(wrap, api)
}