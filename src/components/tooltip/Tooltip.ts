import { assertDom, el } from '../../core/dom'
import { px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { positionFloating } from '../../core/overlay'
import type { FloatingPlacement } from '../../core/overlay'
import type { Destroyable } from '../../core/types'

/** Options accepted by the `Tooltip` factory. */
export interface TooltipOptions {
  /** Side of the anchor the tooltip appears on. Defaults to `'top'`. */
  placement?: FloatingPlacement
  /** Milliseconds to wait before showing, after hover/focus starts. Defaults to `200`. */
  delay?: number
}

/**
 * The runtime control surface returned by `Tooltip`. Unlike most components, this is a
 * plain controller -- not an element -- because it attaches behavior to an existing anchor
 * rather than creating a new one to place in your layout.
 */
export interface TooltipApi extends Destroyable {
  /** Updates the tooltip's text content. */
  setContent: (content: string) => void
}

/** This component's own CSS, colocated and self-injected on first use. */
export const tooltipCss = `
.socle-tooltip { position: fixed; z-index: 1300; background: var(--socle-foreground); color: var(--socle-background); font-size: 11px; font-weight: 500; padding: 5px 8px; border-radius: var(--socle-radius-sm); pointer-events: none; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3) }
`

/** Attaches a floating text tooltip to `anchor`, shown on hover/focus. */
export function Tooltip(anchor: HTMLElement, content: string, options: TooltipOptions = {}): TooltipApi {
  assertDom('Tooltip')
  ensureComponentStyles('tooltip', tooltipCss)
  const placement = options.placement ?? 'top'
  const delay = options.delay ?? 200
  let text = content
  let showTimer: ReturnType<typeof setTimeout> | null = null
  const tooltip = el('div', px('tooltip'))
  tooltip.textContent = text
  tooltip.style.display = 'none'
  function show(): void {
    showTimer = setTimeout(() => {
      document.body.appendChild(tooltip)
      tooltip.style.display = 'block'
      positionFloating(anchor, tooltip, placement)
    }, delay)
  }
  function hide(): void {
    if (showTimer) clearTimeout(showTimer)
    tooltip.style.display = 'none'
    tooltip.remove()
  }
  anchor.addEventListener('mouseenter', show)
  anchor.addEventListener('mouseleave', hide)
  anchor.addEventListener('focus', show)
  anchor.addEventListener('blur', hide)
  return {
    setContent(newContent) {
      text = newContent
      tooltip.textContent = text
    },
    destroy() {
      hide()
      anchor.removeEventListener('mouseenter', show)
      anchor.removeEventListener('mouseleave', hide)
      anchor.removeEventListener('focus', show)
      anchor.removeEventListener('blur', hide)
    }
  }
}