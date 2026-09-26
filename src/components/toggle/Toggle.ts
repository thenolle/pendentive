import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { cx, px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { Icon } from '../../svg/Icon'
import type { IconInput } from '../../svg/types'

/** Visual style of a `Toggle`. */
export type ToggleVariant = 'default' | 'outline'
/** Sizing preset of a `Toggle`. */
export type ToggleSize = 'sm' | 'default'

/** Options accepted by the `Toggle` factory. */
export interface ToggleOptions {
  /** Visual style. Defaults to `'default'`. */
  variant?: ToggleVariant
  /** Sizing preset. Defaults to `'default'`. */
  size?: ToggleSize
  /** Optional icon rendered before the label. */
  icon?: IconInput
  /** Controlled pressed state. When provided together with `onPressedChange`, you own the state. */
  pressed?: boolean
  /** Uncontrolled initial pressed state, used only if `pressed` is omitted. Defaults to `false`. */
  defaultPressed?: boolean
  /** Disables interaction. Defaults to `false`. */
  disabled?: boolean
  /** Called whenever the user toggles the button. */
  onPressedChange?: (pressed: boolean) => void
}

/** The runtime control surface attached to every `Toggle` element. */
export interface ToggleApi {
  /** Returns the current pressed state. */
  getPressed: () => boolean
  /** Programmatically sets the pressed state (does not trigger `onPressedChange`). */
  setPressed: (pressed: boolean) => void
  /** Enables/disables the toggle. */
  setDisabled: (disabled: boolean) => void
  /** Detaches the toggle from the DOM and its internal listener. */
  destroy: () => void
}

/** A `Toggle` is a real `HTMLButtonElement` extended with `ToggleApi`. */
export type ToggleElement = HTMLButtonElement & ToggleApi

/** This component's own CSS, colocated and self-injected on first use. */
export const toggleCss = `
.pendentive-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: var(--pendentive-radius-sm);
  border: 1px solid transparent;
  background: transparent;
  color: var(--pendentive-muted-foreground);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
}
.pendentive-toggle-default { padding: 8px 12px }
.pendentive-toggle-sm { padding: 5px 8px; font-size: 12px }
.pendentive-toggle:hover:not(:disabled) { background: var(--pendentive-accent); color: var(--pendentive-foreground) }
.pendentive-toggle:disabled { opacity: 0.5; cursor: not-allowed }
.pendentive-toggle-outline { border-color: var(--pendentive-border) }
.pendentive-toggle.pendentive-pressed { background: var(--pendentive-accent); color: var(--pendentive-foreground) }
`

/** Creates a single pressable toggle button -- a two-state control (like a checkbox rendered as a button), useful for toolbar options (bold, italic, view modes). */
export function Toggle(text: string, options: ToggleOptions = {}): ToggleElement {
  assertDom('Toggle')
  ensureComponentStyles('toggle', toggleCss)
  const variant = options.variant ?? 'default'
  const size = options.size ?? 'default'
  let pressed = options.pressed ?? options.defaultPressed ?? false
  let disabled = options.disabled ?? false
  const onPressedChange = options.onPressedChange
  const button = el('button', cx(px('toggle'), px(`toggle-${size}`), variant === 'outline' && px('toggle-outline')))
  button.type = 'button'
  button.setAttribute('aria-pressed', String(pressed))
  button.disabled = disabled
  if (options.icon) button.appendChild(Icon(options.icon, 14, { className: px('icon') })!)
  const label = document.createElement('span')
  label.textContent = text
  button.appendChild(label)
  function applyState(): void {
    button.classList.toggle(px('pressed'), pressed)
    button.setAttribute('aria-pressed', String(pressed))
  }
  applyState()
  const listener = (): void => {
    if (disabled) return
    pressed = !pressed
    applyState()
    onPressedChange?.(pressed)
  }
  button.addEventListener('click', listener)
  const api: ToggleApi = {
    getPressed() {
      return pressed
    },
    setPressed(value) {
      pressed = value
      applyState()
    },
    setDisabled(value) {
      disabled = value
      button.disabled = value
    },
    destroy() {
      button.removeEventListener('click', listener)
      button.remove()
    }
  }
  return attachController(button, api)
}