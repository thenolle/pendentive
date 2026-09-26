import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { cx, px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { Icon } from '../../svg/Icon'
import type { IconInput } from '../../svg/types'

/** Visual style of a `Badge`. */
export type BadgeVariant = 'default' | 'outline' | 'success' | 'warning' | 'destructive'

/** Options accepted by the `Badge` factory. */
export interface BadgeOptions {
  /** Visual style. Defaults to `'default'`. */
  variant?: BadgeVariant
  /** Optional icon rendered before the label. */
  icon?: IconInput
}

/** The runtime control surface attached to every `Badge` element. */
export interface BadgeApi {
  /** Updates the visible label text. */
  setLabel: (text: string) => void
  /** Swaps the visual variant, updating classes in place. */
  setVariant: (variant: BadgeVariant) => void
  /** Detaches the badge from the DOM. */
  destroy: () => void
}

/** A `Badge` is a real `HTMLSpanElement` extended with `BadgeApi`. */
export type BadgeElement = HTMLSpanElement & BadgeApi

/** This component's own CSS, colocated and self-injected on first use. */
export const badgeCss = `
.linteau-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.6;
  border: 1px solid transparent;
}
.linteau-badge-default { background: var(--linteau-secondary); color: var(--linteau-secondary-foreground) }
.linteau-badge-outline { background: transparent; border-color: var(--linteau-border); color: var(--linteau-foreground) }
.linteau-badge-success { background: var(--linteau-success); color: var(--linteau-success-foreground) }
.linteau-badge-warning { background: var(--linteau-warning); color: var(--linteau-warning-foreground) }
.linteau-badge-destructive { background: var(--linteau-destructive); color: var(--linteau-destructive-foreground) }
`

/** Creates a small pill-shaped status/label indicator. */
export function Badge(text: string, options: BadgeOptions = {}): BadgeElement {
  assertDom('Badge')
  ensureComponentStyles('badge', badgeCss)
  let variant = options.variant ?? 'default'
  const span = el('span', cx(px('badge'), px(`badge-${variant}`)))
  const label = document.createElement('span')
  label.textContent = text
  if (options.icon) span.appendChild(Icon(options.icon, 11, { className: px('icon') })!)
  span.appendChild(label)
  const api: BadgeApi = {
    setLabel(newText) {
      label.textContent = newText
    },
    setVariant(newVariant) {
      span.classList.remove(px(`badge-${variant}`))
      variant = newVariant
      span.classList.add(px(`badge-${variant}`))
    },
    destroy() {
      span.remove()
    }
  }
  return attachController(span, api)
}