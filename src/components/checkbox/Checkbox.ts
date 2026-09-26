import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { Icon } from '../../svg/Icon'
import { icons } from '../../svg/icons/index'

/** Options accepted by the `Checkbox` factory. */
export interface CheckboxOptions {
  /** Label rendered next to the box. */
  label: string
  /** Controlled checked state. */
  checked?: boolean
  /** Uncontrolled initial state, used only if `checked` is omitted. Defaults to `false`. */
  defaultChecked?: boolean
  /** Renders a dash instead of a check mark, without affecting the boolean value. Defaults to `false`. */
  indeterminate?: boolean
  /** Disables interaction. Defaults to `false`. */
  disabled?: boolean
  /** Called whenever the user toggles the checkbox. */
  onChange?: (checked: boolean) => void
}

/** The runtime control surface attached to every `Checkbox` element. */
export interface CheckboxApi {
  /** Returns the current checked state. */
  getValue: () => boolean
  /** Programmatically sets the checked state (does not trigger `onChange`). */
  setValue: (checked: boolean) => void
  /** Toggles the indeterminate visual state. */
  setIndeterminate: (indeterminate: boolean) => void
  /** Enables/disables the checkbox. */
  setDisabled: (disabled: boolean) => void
  /** Detaches the checkbox from the DOM and its internal listener. */
  destroy: () => void
}

/** A `Checkbox` is a real `HTMLDivElement` (the row) extended with `CheckboxApi`. */
export type CheckboxElement = HTMLDivElement & CheckboxApi

/** This component's own CSS, colocated and self-injected on first use. */
export const checkboxCss = `
.pendentive-checkbox-row { display: flex; align-items: center; gap: 8px }
.pendentive-checkbox {
  width: 18px;
  height: 18px;
  border-radius: var(--pendentive-radius-sm);
  border: 1px solid var(--pendentive-border);
  background: var(--pendentive-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--pendentive-primary-foreground);
}
.pendentive-checkbox:disabled { opacity: 0.5; cursor: not-allowed }
.pendentive-checkbox.pendentive-checked { background: var(--pendentive-primary); border-color: var(--pendentive-primary) }
.pendentive-checkbox svg { display: none }
.pendentive-checkbox.pendentive-checked svg, .pendentive-checkbox.pendentive-indeterminate svg { display: block }
`

/** Creates a labeled checkbox, supporting controlled/uncontrolled and indeterminate states. */
export function Checkbox(options: CheckboxOptions): CheckboxElement {
  assertDom('Checkbox')
  ensureComponentStyles('checkbox', checkboxCss)
  let checked = options.checked ?? options.defaultChecked ?? false
  let indeterminate = options.indeterminate ?? false
  let disabled = options.disabled ?? false
  const onChange = options.onChange
  const root = el('div', px('checkbox-row'))
  const box = el('button', px('checkbox'))
  box.type = 'button'
  box.setAttribute('role', 'checkbox')
  box.disabled = disabled
  const checkIcon = Icon(icons.check, 12)!
  const dashIcon = Icon(icons.minus, 12)!
  box.append(checkIcon, dashIcon)
  const labelText = document.createElement('span')
  labelText.textContent = options.label
  function render(): void {
    box.classList.toggle(px('checked'), checked)
    box.classList.toggle(px('indeterminate'), indeterminate && !checked)
    box.setAttribute('aria-checked', indeterminate ? 'mixed' : String(checked))
    checkIcon.style.display = checked ? 'block' : 'none'
    dashIcon.style.display = !checked && indeterminate ? 'block' : 'none'
  }
  render()
  const listener = (): void => {
    if (disabled) return
    checked = !checked
    indeterminate = false
    render()
    onChange?.(checked)
  }
  box.addEventListener('click', listener)
  root.append(box, labelText)
  const api: CheckboxApi = {
    getValue() {
      return checked
    },
    setValue(value) {
      checked = value
      indeterminate = false
      render()
    },
    setIndeterminate(value) {
      indeterminate = value
      render()
    },
    setDisabled(value) {
      disabled = value
      box.disabled = value
    },
    destroy() {
      box.removeEventListener('click', listener)
      root.remove()
    }
  }
  return attachController(root, api)
}