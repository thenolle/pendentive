import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { cx, px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { onEscapeKey, lockBodyScroll } from '../../core/overlay'
import { fillContent } from '../../core/content'
import { Icon } from '../../svg/Icon'
import { icons } from '../../svg/icons/index'

/** Which edge of the screen a `Drawer` slides in from. */
export type DrawerSide = 'left' | 'right' | 'top' | 'bottom'

/** Options accepted by the `Drawer` factory. */
export interface DrawerOptions {
  /** Which edge to slide in from. Defaults to `'right'`. */
  side?: DrawerSide
  /** Title shown in the header. */
  title?: string
  /** Initial body content. */
  content?: HTMLElement | string
  /** Closes the drawer when the backdrop is clicked. Defaults to `true`. */
  closeOnBackdrop?: boolean
  /** Closes the drawer on Escape. Defaults to `true`. */
  closeOnEscape?: boolean
  /** Called whenever the open state changes. */
  onOpenChange?: (open: boolean) => void
}

/** The runtime control surface attached to every `Drawer` element. */
export interface DrawerApi {
  /** The scrollable body container. */
  body: HTMLElement
  /** Opens the drawer. */
  open: () => void
  /** Closes the drawer. */
  close: () => void
  /** Returns whether the drawer is currently open. */
  isOpen: () => boolean
  /** Updates the header title text. */
  setTitle: (title: string) => void
  /** Replaces the body content. */
  setContent: (content: HTMLElement | string) => void
  /** Removes all listeners/subscriptions and detaches the drawer from the DOM. */
  destroy: () => void
}

/** A `Drawer` is a real `HTMLDivElement` (the overlay) extended with `DrawerApi`. */
export type DrawerElement = HTMLDivElement & DrawerApi

/** This component's own CSS, colocated and self-injected on first use. */
export const drawerCss = `
.pendentive-drawer-overlay { position: fixed; inset: 0; background: color-mix(in oklch, black 55%, transparent); z-index: 1000 }
.pendentive-drawer-panel { position: fixed; background: var(--pendentive-card); border: 1px solid var(--pendentive-border); display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); transition: transform 200ms ease }
.pendentive-drawer-right { top: 0; right: 0; bottom: 0; width: min(360px, 90vw); transform: translateX(0) }
.pendentive-drawer-left { top: 0; left: 0; bottom: 0; width: min(360px, 90vw); transform: translateX(0) }
.pendentive-drawer-top { top: 0; left: 0; right: 0; height: min(320px, 80vh); transform: translateY(0) }
.pendentive-drawer-bottom { bottom: 0; left: 0; right: 0; height: min(320px, 80vh); transform: translateY(0) }
.pendentive-drawer-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--pendentive-border) }
.pendentive-drawer-title { font-size: 14px; font-weight: 600 }
.pendentive-drawer-close { background: transparent; border: none; color: var(--pendentive-muted-foreground); cursor: pointer; display: flex; padding: 4px; border-radius: var(--pendentive-radius-sm) }
.pendentive-drawer-body { padding: 16px; overflow-y: auto; flex: 1 }
`

/** Creates a slide-in panel anchored to a screen edge, ideal for side navigation or contextual forms. */
export function Drawer(options: DrawerOptions = {}): DrawerElement {
  assertDom('Drawer')
  ensureComponentStyles('drawer', drawerCss)
  const side = options.side ?? 'right'
  const closeOnBackdrop = options.closeOnBackdrop ?? true
  const closeOnEscape = options.closeOnEscape ?? true
  let isOpen = false
  let unlockScroll: (() => void) | null = null
  let unbindEscape: (() => void) | null = null
  const overlay = el('div', cx(px('drawer-overlay'), px('hidden')))
  const panel = el('div', cx(px('drawer-panel'), px(`drawer-${side}`)))
  panel.setAttribute('role', 'dialog')
  panel.setAttribute('aria-modal', 'true')
  const header = el('div', px('drawer-header'))
  const titleEl = el('div', px('drawer-title'))
  titleEl.textContent = options.title ?? ''
  const closeButton = el('button', px('drawer-close'))
  closeButton.type = 'button'
  const closeIcon = Icon(icons.x, 16)
  if (closeIcon) closeButton.appendChild(closeIcon)
  header.append(titleEl, closeButton)
  const body = el('div', px('drawer-body'))
  if (options.content) fillContent(body, options.content)
  panel.append(header, body)
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
  const api: DrawerApi = {
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