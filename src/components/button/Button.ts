import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { cx, px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { Icon } from '../../svg/Icon'
import type { IconInput } from '../../svg/types'

/** Visual style of a `Button`. */
export type ButtonVariant = 'default' | 'outline' | 'ghost' | 'destructive'
/** Sizing preset of a `Button`. */
export type ButtonSize = 'sm' | 'default'

/** Options accepted by the `Button` factory. */
export interface ButtonOptions {
  /** Visual style. Defaults to `'default'`. */
  variant?: ButtonVariant
  /** Sizing preset. Defaults to `'default'`. */
  size?: ButtonSize
  /** Optional icon, in any `IconInput` shape. */
  icon?: IconInput
  /** Which side of the label the icon renders on. Defaults to `'start'`. */
  iconPosition?: 'start' | 'end'
  /** Disables the button and blocks click handling. Defaults to `false`. */
  disabled?: boolean
  /** Stretches the button to 100% of its container's width. Defaults to `false`. */
  fullWidth?: boolean
  /** Called on every click while the button is enabled. */
  onClick?: (event: MouseEvent) => void
}

/** The full runtime control surface attached to every `Button` element. */
export interface ButtonApi {
  /** Updates the visible label text. */
  setLabel: (text: string) => void
  /** Swaps the visual variant, updating classes in place. */
  setVariant: (variant: ButtonVariant) => void
  /** Swaps the sizing preset, updating classes in place. */
  setSize: (size: ButtonSize) => void
  /** Replaces the icon (or removes it if `icon` is `null`/`undefined`), optionally moving its position. */
  setIcon: (icon: IconInput, position?: 'start' | 'end') => void
  /** Enables/disables the button. */
  setDisabled: (disabled: boolean) => void
  /** Replaces the click handler (pass `undefined` to remove it). */
  setOnClick: (handler: ((event: MouseEvent) => void) | undefined) => void
  /** Removes the click listener and detaches the button from the DOM. */
  destroy: () => void
}

/** A `Button` is a real `HTMLButtonElement` extended with `ButtonApi`. */
export type ButtonElement = HTMLButtonElement & ButtonApi

/** This component's own CSS -- colocated so `Button.ts` is a single, self-contained, tree-shakeable unit. */
export const buttonCss = `
.pendentive-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: var(--pendentive-radius-sm);
  border: 1px solid transparent;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: background 120ms ease, border-color 120ms ease, transform 120ms ease, opacity 120ms ease;
}
.pendentive-button-default { padding: 10px 14px }
.pendentive-button-sm { padding: 6px 10px; font-size: 12px }
.pendentive-button-full { width: 100% }
.pendentive-button:active { transform: scale(0.97) }
.pendentive-button:disabled { opacity: 0.5; cursor: not-allowed; transform: none }
.pendentive-button-default:not(.pendentive-button-outline):not(.pendentive-button-ghost):not(.pendentive-button-destructive) {
  background: var(--pendentive-primary);
  color: var(--pendentive-primary-foreground);
}
.pendentive-button-default:not(.pendentive-button-outline):not(.pendentive-button-ghost):not(.pendentive-button-destructive):hover:not(:disabled) {
  filter: brightness(0.92);
}
.pendentive-button-outline { background: transparent; border-color: var(--pendentive-border); color: var(--pendentive-foreground) }
.pendentive-button-outline:hover:not(:disabled) { background: var(--pendentive-accent) }
.pendentive-button-ghost { background: transparent; color: var(--pendentive-muted-foreground) }
.pendentive-button-ghost:hover:not(:disabled) { background: var(--pendentive-accent); color: var(--pendentive-foreground) }
.pendentive-button-destructive { background: var(--pendentive-destructive); color: var(--pendentive-destructive-foreground) }
.pendentive-button-destructive:hover:not(:disabled) { filter: brightness(0.92) }
`

/**
 * Creates a fully controllable, self-styled button.
 *
 * @param text - Initial label text.
 * @param options - Configuration; every field is optional and can change later via the returned API.
 * @returns The button element itself, extended with `ButtonApi` methods.
 */
export function Button(text: string, options: ButtonOptions = {}): ButtonElement {
  assertDom('Button')
  ensureComponentStyles('button', buttonCss)
  let { variant = 'default', size = 'default' } = options
  let { icon, iconPosition = 'start', disabled = false } = options
  let onClickHandler = options.onClick
  const button = el('button', cx(px('button'), px(`button-${variant}`), px(`button-${size}`), options.fullWidth && px('button-full')))
  button.type = 'button'
  button.disabled = disabled
  const label = document.createElement('span')
  label.className = px('button-label')
  label.textContent = text
  function render(): void {
    button.replaceChildren()
    const iconEl = icon ? Icon(icon, 14, { className: px('icon') }) : null
    const nodes: Node[] = []
    if (iconEl && iconPosition === 'start') nodes.push(iconEl)
    nodes.push(label)
    if (iconEl && iconPosition === 'end') nodes.push(iconEl)
    button.append(...nodes)
  }
  render()
  const listener = (event: MouseEvent): void => { if (!disabled) onClickHandler?.(event) }
  button.addEventListener('click', listener)
  const api: ButtonApi = {
    setLabel(newText) {
      label.textContent = newText
    },
    setVariant(newVariant) {
      button.classList.remove(px(`button-${variant}`))
      variant = newVariant
      button.classList.add(px(`button-${variant}`))
    },
    setSize(newSize) {
      button.classList.remove(px(`button-${size}`))
      size = newSize
      button.classList.add(px(`button-${size}`))
    },
    setIcon(newIcon, position) {
      icon = newIcon
      if (position) iconPosition = position
      render()
    },
    setDisabled(value) {
      disabled = value
      button.disabled = value
    },
    setOnClick(handler) {
      onClickHandler = handler
    },
    destroy() {
      button.removeEventListener('click', listener)
      button.remove()
    }
  }
  return attachController(button, api)
}