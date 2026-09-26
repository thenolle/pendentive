import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { cx, px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { onEscapeKey, lockBodyScroll } from '../../core/overlay'
import { fillContent } from '../../core/content'
import { Icon } from '../../svg/Icon'
import { icons } from '../../svg/icons/index'

/** Options accepted by the `Dialog` factory. */
export interface DialogOptions {
  /** Title shown in the header. */
  title?: string
  /** Initial body content. */
  content?: HTMLElement | string
  /** Footer action elements (e.g. Buttons), right-aligned. */
  actions?: HTMLElement[]
  /** Closes the dialog when the backdrop is clicked. Defaults to `true`. */
  closeOnBackdrop?: boolean
  /** Closes the dialog on Escape. Defaults to `true`. */
  closeOnEscape?: boolean
  /** Called whenever the open state changes. */
  onOpenChange?: (open: boolean) => void
}

/** The runtime control surface attached to every `Dialog` element. */
export interface DialogApi {
  /** The scrollable body container -- set once via `content`, or update later with `setContent`. */
  body: HTMLElement
  /** Opens the dialog: locks scroll, binds Escape. */
  open: () => void
  /** Closes the dialog. */
  close: () => void
  /** Returns whether the dialog is currently open. */
  isOpen: () => boolean
  /** Updates the header title text. */
  setTitle: (title: string) => void
  /** Replaces the body content. */
  setContent: (content: HTMLElement | string) => void
  /** Removes all listeners/subscriptions and detaches the dialog from the DOM. */
  destroy: () => void
}

/** A `Dialog` is a real `HTMLDivElement` (the overlay) extended with `DialogApi`. */
export type DialogElement = HTMLDivElement & DialogApi

/** This component's own CSS, colocated and self-injected on first use. */
export const dialogCss = `
.socle-dialog-overlay { position: fixed; inset: 0; background: color-mix(in oklch, black 60%, transparent); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px) }
.socle-dialog-panel { width: min(480px, 92vw); max-height: 86vh; display: flex; flex-direction: column; background: var(--socle-card); border: 1px solid var(--socle-border); border-radius: var(--socle-radius-lg); box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); overflow: hidden }
.socle-dialog-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--socle-border) }
.socle-dialog-title { font-size: 14px; font-weight: 600 }
.socle-dialog-close { background: transparent; border: none; color: var(--socle-muted-foreground); cursor: pointer; display: flex; padding: 4px; border-radius: var(--socle-radius-sm) }
.socle-dialog-close:hover { background: var(--socle-accent); color: var(--socle-foreground) }
.socle-dialog-body { padding: 16px; overflow-y: auto }
.socle-dialog-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--socle-border) }
`

/** Creates a centered modal dialog with a backdrop, focus-safe scroll lock, and Escape-to-close. */
export function Dialog(options: DialogOptions = {}): DialogElement {
  assertDom('Dialog')
  ensureComponentStyles('dialog', dialogCss)
  const closeOnBackdrop = options.closeOnBackdrop ?? true
  const closeOnEscape = options.closeOnEscape ?? true
  let isOpen = false
  let unlockScroll: (() => void) | null = null
  let unbindEscape: (() => void) | null = null
  const overlay = el('div', cx(px('dialog-overlay'), px('hidden')))
  const panel = el('div', px('dialog-panel'))
  panel.setAttribute('role', 'dialog')
  panel.setAttribute('aria-modal', 'true')
  const header = el('div', px('dialog-header'))
  const titleEl = el('div', px('dialog-title'))
  titleEl.textContent = options.title ?? ''
  const closeButton = el('button', px('dialog-close'))
  closeButton.type = 'button'
  const closeIcon = Icon(icons.x, 16)
  if (closeIcon) closeButton.appendChild(closeIcon)
  header.append(titleEl, closeButton)
  const body = el('div', px('dialog-body'))
  if (options.content) fillContent(body, options.content)
  const footer = el('div', px('dialog-footer'))
  if (options.actions?.length) footer.append(...options.actions)
  panel.append(header, body)
  if (options.actions?.length) panel.appendChild(footer)
  overlay.appendChild(panel)
  function setOpen(value: boolean): void {
    isOpen = value
    overlay.classList.toggle(px('hidden'), !value)
    if (value) {
      unlockScroll = lockBodyScroll()
      if (closeOnEscape) unbindEscape = onEscapeKey(close)
    } else {
      unlockScroll?.()
      unlockScroll = null
      unbindEscape?.()
      unbindEscape = null
    }
    options.onOpenChange?.(value)
  }
  function close(): void {
    if (isOpen) setOpen(false)
  }
  const backdropListener = (event: MouseEvent): void => {
    if (closeOnBackdrop && event.target === overlay) close()
  }
  overlay.addEventListener('mousedown', backdropListener)
  closeButton.addEventListener('click', close)
  const api: DialogApi = {
    body,
    open() {
      setOpen(true)
    },
    close,
    isOpen() {
      return isOpen
    },
    setTitle(title) {
      titleEl.textContent = title
    },
    setContent(content) {
      fillContent(body, content)
    },
    destroy() {
      overlay.removeEventListener('mousedown', backdropListener)
      closeButton.removeEventListener('click', close)
      unlockScroll?.()
      unbindEscape?.()
      overlay.remove()
    }
  }
  return attachController(overlay, api)
}