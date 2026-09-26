import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { cx, px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { Icon } from '../../svg/Icon'
import { icons } from '../../svg/icons/index'
import type { IconInput } from '../../svg/types'

/** Visual style of an `Alert`. */
export type AlertVariant = 'default' | 'success' | 'warning' | 'destructive'

/** Options accepted by the `Alert` factory. */
export interface AlertOptions {
  /** Title shown above the description. */
  title?: string
  /** Visual style. Defaults to `'default'`. */
  variant?: AlertVariant
  /** Optional icon; defaults to a sensible one per variant if omitted. */
  icon?: IconInput
  /** Shows a close button. Defaults to `false`. */
  dismissible?: boolean
  /** Called when the close button is clicked. */
  onDismiss?: () => void
}

/** The runtime control surface attached to every `Alert` element. */
export interface AlertApi {
  /** Updates the description text. */
  setDescription: (description: string) => void
  /** Detaches the alert from the DOM and its internal listener. */
  destroy: () => void
}

/** An `Alert` is a real `HTMLDivElement` extended with `AlertApi`. */
export type AlertElement = HTMLDivElement & AlertApi

/** This component's own CSS, colocated and self-injected on first use. */
export const alertCss = `
.socle-alert { display: flex; gap: 10px; padding: 12px; border-radius: var(--socle-radius-lg); border: 1px solid var(--socle-border); background: var(--socle-muted) }
.socle-alert-success { border-color: var(--socle-success) }
.socle-alert-warning { border-color: var(--socle-warning) }
.socle-alert-destructive { border-color: var(--socle-destructive) }
.socle-alert-body { flex: 1 }
.socle-alert-title { font-size: 13px; font-weight: 600; margin-bottom: 2px }
.socle-alert-description { font-size: 12px; color: var(--socle-muted-foreground) }
.socle-alert-close { background: transparent; border: none; color: var(--socle-muted-foreground); cursor: pointer; display: flex; align-self: flex-start }
`

const defaultIconByVariant: Record<AlertVariant, IconInput> = {
  default: icons.info,
  success: icons.check,
  warning: icons.alertTriangle,
  destructive: icons.alertTriangle
}

/** Creates a static informational/status banner. */
export function Alert(description: string, options: AlertOptions = {}): AlertElement {
  assertDom('Alert')
  ensureComponentStyles('alert', alertCss)
  const variant = options.variant ?? 'default'
  const root = el('div', cx(px('alert'), px(`alert-${variant}`)))
  const iconEl = Icon(options.icon ?? defaultIconByVariant[variant], 18, { className: px('icon') })
  if (iconEl) root.appendChild(iconEl)
  const body = el('div', px('alert-body'))
  if (options.title) {
    const title = el('div', px('alert-title'))
    title.textContent = options.title
    body.appendChild(title)
  }
  const descriptionEl = el('div', px('alert-description'))
  descriptionEl.textContent = description
  body.appendChild(descriptionEl)
  root.appendChild(body)
  let closeListener: (() => void) | null = null
  if (options.dismissible) {
    const closeButton = el('button', px('alert-close'))
    closeButton.type = 'button'
    const closeIcon = Icon(icons.x, 14)
    if (closeIcon) closeButton.appendChild(closeIcon)
    closeListener = (): void => {
      options.onDismiss?.()
      root.remove()
    }
    closeButton.addEventListener('click', closeListener)
    root.appendChild(closeButton)
  }
  const api: AlertApi = {
    setDescription(description) {
      descriptionEl.textContent = description
    },
    destroy() {
      root.remove()
    }
  }
  return attachController(root, api)
}