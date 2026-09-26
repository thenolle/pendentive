import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { cx, px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { onClickOutside, onEscapeKey, positionFloating } from '../../core/overlay'
import type { FloatingPlacement } from '../../core/overlay'
import { fillContent } from '../../core/content'

/** Options accepted by the `Popover` factory. */
export interface PopoverOptions {
  /** The element the popover is anchored to and toggled by. */
  anchor: HTMLElement
  /** Initial panel content. */
  content: HTMLElement | string
  /** Side of the anchor the panel appears on. Defaults to `'bottom'`. */
  placement?: FloatingPlacement
  /** Closes the popover when clicking outside it. Defaults to `true`. */
  closeOnClickOutside?: boolean
}

/** The runtime control surface attached to every `Popover` element. */
export interface PopoverApi {
  /** Opens the popover and positions it against its anchor. */
  open: () => void
  /** Closes the popover. */
  close: () => void
  /** Toggles between open and closed. */
  toggle: () => void
  /** Returns whether the popover is currently open. */
  isOpen: () => boolean
  /** Replaces the panel content. */
  setContent: (content: HTMLElement | string) => void
  /** Removes all listeners and detaches the popover from the DOM. */
  destroy: () => void
}

/** A `Popover` is a real `HTMLDivElement` (the floating panel) extended with `PopoverApi`. */
export type PopoverElement = HTMLDivElement & PopoverApi

/** This component's own CSS, colocated and self-injected on first use. */
export const popoverCss = `
.linteau-popover { position: fixed; z-index: 1200; background: var(--linteau-card); border: 1px solid var(--linteau-border); border-radius: var(--linteau-radius-md); padding: 10px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4) }
`

/** Creates a floating panel anchored to another element, toggled by clicking that anchor. */
export function Popover(options: PopoverOptions): PopoverElement {
  assertDom('Popover')
  ensureComponentStyles('popover', popoverCss)
  const { anchor, placement = 'bottom', closeOnClickOutside = true } = options
  let isOpen = false
  let unbindOutside: (() => void) | null = null
  let unbindEscape: (() => void) | null = null
  const panel = el('div', cx(px('popover'), px('hidden')))
  fillContent(panel, options.content)
  function open(): void {
    if (isOpen) return
    isOpen = true
    document.body.appendChild(panel)
    panel.classList.remove(px('hidden'))
    positionFloating(anchor, panel, placement)
    if (closeOnClickOutside) unbindOutside = onClickOutside([anchor, panel], close)
    unbindEscape = onEscapeKey(close)
  }
  function close(): void {
    if (!isOpen) return
    isOpen = false
    panel.classList.add(px('hidden'))
    panel.remove()
    unbindOutside?.()
    unbindOutside = null
    unbindEscape?.()
    unbindEscape = null
  }
  function toggle(): void {
    if (isOpen) close()
    else open()
  }
  const anchorListener = (): void => toggle()
  anchor.addEventListener('click', anchorListener)
  const api: PopoverApi = {
    open,
    close,
    toggle,
    isOpen() {
      return isOpen
    },
    setContent(content) {
      fillContent(panel, content)
    },
    destroy() {
      anchor.removeEventListener('click', anchorListener)
      unbindOutside?.()
      unbindEscape?.()
      panel.remove()
    }
  }
  return attachController(panel, api)
}