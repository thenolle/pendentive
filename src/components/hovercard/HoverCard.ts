import { assertDom, el } from '../../core/dom'
import { cx, px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { positionFloating } from '../../core/overlay'
import type { FloatingPlacement } from '../../core/overlay'
import { fillContent } from '../../core/content'
import type { Destroyable } from '../../core/types'

/** Options accepted by the `HoverCard` factory. */
export interface HoverCardOptions {
  /** The element that triggers the card on hover/focus. */
  anchor: HTMLElement
  /** Initial card content -- can hold interactive elements, unlike `Tooltip`. */
  content: HTMLElement | string
  /** Side of the anchor the card appears on. Defaults to `'bottom'`. */
  placement?: FloatingPlacement
  /** Milliseconds to wait before showing, after hover/focus starts. Defaults to `300`. */
  openDelay?: number
  /** Milliseconds to wait before hiding, after the pointer leaves both the anchor and the card. Defaults to `150`. */
  closeDelay?: number
}

/**
 * The runtime control surface returned by `HoverCard`. Like `Tooltip`, this is a plain
 * controller -- not an element -- since it attaches behavior to an existing anchor.
 */
export interface HoverCardApi extends Destroyable {
  /** Replaces the card's content. */
  setContent: (content: HTMLElement | string) => void
  /** Opens the card immediately, bypassing `openDelay`. */
  open: () => void
  /** Closes the card immediately, bypassing `closeDelay`. */
  close: () => void
}

/** This component's own CSS, colocated and self-injected on first use. */
export const hoverCardCss = `
.socle-hover-card { position: fixed; z-index: 1200; width: 280px; background: var(--socle-card); border: 1px solid var(--socle-border); border-radius: var(--socle-radius-md); padding: 12px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4); font-size: 12px; color: var(--socle-foreground) }
`

/**
 * Attaches a floating rich-content card to `anchor`, shown on hover/focus with a delay in
 * each direction. Unlike `Tooltip`, the card stays open while the pointer moves into it --
 * so it can safely contain links, buttons, or other interactive content.
 */
export function HoverCard(options: HoverCardOptions): HoverCardApi {
  assertDom('HoverCard')
  ensureComponentStyles('hover-card', hoverCardCss)
  const { anchor, placement = 'bottom' } = options
  const openDelay = options.openDelay ?? 300
  const closeDelay = options.closeDelay ?? 150
  let openTimer: ReturnType<typeof setTimeout> | null = null
  let closeTimer: ReturnType<typeof setTimeout> | null = null
  let isVisible = false
  const card = el('div', cx(px('hover-card'), px('hidden')))
  fillContent(card, options.content)
  function clearTimers(): void {
    if (openTimer) clearTimeout(openTimer)
    if (closeTimer) clearTimeout(closeTimer)
    openTimer = null
    closeTimer = null
  }
  function showNow(): void {
    clearTimers()
    if (isVisible) return
    isVisible = true
    document.body.appendChild(card)
    card.classList.remove(px('hidden'))
    positionFloating(anchor, card, placement)
  }
  function hideNow(): void {
    clearTimers()
    if (!isVisible) return
    isVisible = false
    card.classList.add(px('hidden'))
    card.remove()
  }
  function scheduleShow(): void {
    if (closeTimer) clearTimeout(closeTimer)
    closeTimer = null
    if (isVisible || openTimer) return
    openTimer = setTimeout(showNow, openDelay)
  }
  function scheduleHide(): void {
    if (openTimer) clearTimeout(openTimer)
    openTimer = null
    if (!isVisible || closeTimer) return
    closeTimer = setTimeout(hideNow, closeDelay)
  }
  anchor.addEventListener('mouseenter', scheduleShow)
  anchor.addEventListener('mouseleave', scheduleHide)
  anchor.addEventListener('focus', scheduleShow)
  anchor.addEventListener('blur', scheduleHide)
  card.addEventListener('mouseenter', () => { if (closeTimer) clearTimeout(closeTimer); closeTimer = null })
  card.addEventListener('mouseleave', scheduleHide)
  return {
    setContent(content) {
      fillContent(card, content)
    },
    open: showNow,
    close: hideNow,
    destroy() {
      clearTimers()
      anchor.removeEventListener('mouseenter', scheduleShow)
      anchor.removeEventListener('mouseleave', scheduleHide)
      anchor.removeEventListener('focus', scheduleShow)
      anchor.removeEventListener('blur', scheduleHide)
      card.remove()
    }
  }
}