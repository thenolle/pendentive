import { assertDom, el } from '../../core/dom'
import { cx, px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { Icon } from '../../svg/Icon'
import { icons } from '../../svg/icons/index'

/** Visual style of a `Toast`. */
export type ToastVariant = 'default' | 'success' | 'warning' | 'destructive'

/** Options accepted by `ToastManager.show`. */
export interface ToastOptions {
  /** Toast title. */
  title?: string
  /** Supporting description text. */
  description?: string
  /** Visual style. Defaults to `'default'`. */
  variant?: ToastVariant
  /** Auto-dismiss delay in milliseconds. `0` disables auto-dismiss. Defaults to `4000`. */
  duration?: number
}

/** A stack-based toast notification manager. Lazily mounts its viewport to `document.body` on first use. */
export interface ToastManager {
  /** Shows a new toast and returns its id (usable with `dismiss`). */
  show: (options: ToastOptions) => string
  /** Dismisses a specific toast by id. */
  dismiss: (id: string) => void
  /** Dismisses every visible toast. */
  clear: () => void
  /** Removes the viewport entirely. */
  destroy: () => void
}

/** This component's own CSS, colocated and self-injected on first use. */
export const toastCss = `
.pendentive-toast-viewport { position: fixed; bottom: 16px; right: 16px; display: flex; flex-direction: column; gap: 8px; z-index: 1400; width: min(340px, 92vw) }
.pendentive-toast { display: flex; gap: 8px; background: var(--pendentive-card); border: 1px solid var(--pendentive-border); border-left: 3px solid var(--pendentive-primary); border-radius: var(--pendentive-radius-md); padding: 12px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4) }
.pendentive-toast-success { border-left-color: var(--pendentive-success) }
.pendentive-toast-warning { border-left-color: var(--pendentive-warning) }
.pendentive-toast-destructive { border-left-color: var(--pendentive-destructive) }
.pendentive-toast-body { flex: 1 }
.pendentive-toast-title { font-size: 12px; font-weight: 600 }
.pendentive-toast-description { font-size: 12px; color: var(--pendentive-muted-foreground); margin-top: 2px }
.pendentive-toast-close { background: transparent; border: none; color: var(--pendentive-muted-foreground); cursor: pointer; display: flex; align-self: flex-start }
`

let idCounter = 0

/** Creates an independent toast manager with its own viewport. Most apps only need the shared `toast` export below. */
export function createToastManager(): ToastManager {
  assertDom('ToastManager')
  ensureComponentStyles('toast', toastCss)
  let viewport: HTMLDivElement | null = null
  const timers = new Map<string, ReturnType<typeof setTimeout>>()
  function ensureViewport(): HTMLDivElement {
    if (!viewport) {
      viewport = el('div', px('toast-viewport'))
      document.body.appendChild(viewport)
    }
    return viewport
  }
  function dismiss(id: string): void {
    const timer = timers.get(id)
    if (timer) clearTimeout(timer)
    timers.delete(id)
    document.getElementById(id)?.remove()
  }
  function show(options: ToastOptions): string {
    const id = `pendentive-toast-${++idCounter}`
    const variant = options.variant ?? 'default'
    const duration = options.duration ?? 4000
    const toastEl = el('div', cx(px('toast'), px(`toast-${variant}`)))
    toastEl.id = id
    const body = el('div', px('toast-body'))
    if (options.title) {
      const title = el('div', px('toast-title'))
      title.textContent = options.title
      body.appendChild(title)
    }
    if (options.description) {
      const description = el('div', px('toast-description'))
      description.textContent = options.description
      body.appendChild(description)
    }
    const closeButton = el('button', px('toast-close'))
    closeButton.type = 'button'
    const closeIcon = Icon(icons.x, 14)
    if (closeIcon) closeButton.appendChild(closeIcon)
    closeButton.addEventListener('click', () => dismiss(id))
    toastEl.append(body, closeButton)
    ensureViewport().appendChild(toastEl)
    if (duration > 0) timers.set(id, setTimeout(() => dismiss(id), duration))
    return id
  }
  return {
    show,
    dismiss,
    clear() {
      timers.forEach((timer) => clearTimeout(timer))
      timers.clear()
      viewport?.replaceChildren()
    },
    destroy() {
      timers.forEach((timer) => clearTimeout(timer))
      timers.clear()
      viewport?.remove()
      viewport = null
    }
  }
}

/** A ready-to-use shared toast manager: `toast.show({ title: 'Saved' })`. */
export const toast: ToastManager = createToastManager()