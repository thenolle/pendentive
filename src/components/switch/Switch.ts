import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { Icon } from '../../svg/Icon'
import type { IconInput } from '../../svg/types'
import { fieldBaseCss } from '../field/shared'

/** Options accepted by the `Switch` factory. */
export interface SwitchOptions {
  /** Label rendered next to the toggle. */
  label: string
  /** Optional icon rendered before the label. */
  icon?: IconInput
  /** Controlled checked state. When provided together with `onChange`, you own the state. */
  checked?: boolean
  /** Uncontrolled initial state, used only if `checked` is omitted. Defaults to `false`. */
  defaultChecked?: boolean
  /** Disables interaction. Defaults to `false`. */
  disabled?: boolean
  /** Called whenever the user toggles the switch. */
  onChange?: (checked: boolean) => void
}

/** The runtime control surface attached to every `Switch` element. */
export interface SwitchApi {
  /** Returns the current checked state. */
  getValue: () => boolean
  /** Programmatically sets the checked state (does not trigger `onChange`). */
  setValue: (checked: boolean) => void
  /** Updates the label text. */
  setLabel: (label: string) => void
  /** Enables/disables the switch. */
  setDisabled: (disabled: boolean) => void
  /** Detaches the switch from the DOM and its internal listener. */
  destroy: () => void
}

/** A `Switch` is a real `HTMLDivElement` (the row) extended with `SwitchApi`. */
export type SwitchElement = HTMLDivElement & SwitchApi

/** This component's own CSS, colocated and self-injected on first use. */
export const switchCss = `
.socle-switch-row { display: flex; align-items: center; justify-content: space-between }
.socle-switch { width: 38px; height: 22px; border-radius: 999px; background: var(--socle-secondary); border: 1px solid var(--socle-border); padding: 2px; cursor: pointer; display: flex; align-items: center; transition: background 150ms ease }
.socle-switch:disabled { opacity: 0.5; cursor: not-allowed }
.socle-switch.socle-checked { background: var(--socle-primary) }
.socle-switch-thumb { width: 16px; height: 16px; border-radius: 50%; background: var(--socle-card); transition: transform 150ms cubic-bezier(0.4, 0, 0.2, 1); transform: translateX(0) }
.socle-switch.socle-checked .socle-switch-thumb { transform: translateX(16px); background: var(--socle-primary-foreground) }
`

/** Creates a labeled on/off toggle, supporting both controlled and uncontrolled usage. */
export function Switch(options: SwitchOptions): SwitchElement {
  assertDom('Switch')
  ensureComponentStyles('field-base', fieldBaseCss)
  ensureComponentStyles('switch', switchCss)
  let checked = options.checked ?? options.defaultChecked ?? false
  let disabled = options.disabled ?? false
  const onChange = options.onChange
  const root = el('div', px('switch-row'))
  const labelWrap = el('div', px('field-label'))
  if (options.icon) labelWrap.appendChild(Icon(options.icon, 14, { className: px('icon') })!)
  const labelText = document.createElement('span')
  labelText.textContent = options.label
  labelWrap.appendChild(labelText)
  const track = el('button', px('switch'))
  track.type = 'button'
  track.setAttribute('role', 'switch')
  track.disabled = disabled
  const thumb = el('span', px('switch-thumb'))
  track.appendChild(thumb)
  function applyState(): void {
    track.classList.toggle(px('checked'), checked)
    track.setAttribute('aria-checked', String(checked))
  }
  applyState()
  const listener = (): void => {
    if (disabled) return
    checked = !checked
    applyState()
    onChange?.(checked)
  }
  track.addEventListener('click', listener)
  root.append(labelWrap, track)
  const api: SwitchApi = {
    getValue() {
      return checked
    },
    setValue(value) {
      checked = value
      applyState()
    },
    setLabel(newLabel) {
      labelText.textContent = newLabel
    },
    setDisabled(value) {
      disabled = value
      track.disabled = value
    },
    destroy() {
      track.removeEventListener('click', listener)
      root.remove()
    }
  }
  return attachController(root, api)
}