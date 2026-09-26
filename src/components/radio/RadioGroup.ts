import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { cx, px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'

/** A single selectable option within a `RadioGroup`. */
export interface RadioOptionItem {
  /** Visible label. */
  label: string
  /** Unique value identifying this option. */
  value: string
  /** Disables just this option. Defaults to `false`. */
  disabled?: boolean
}

/** Options accepted by the `RadioGroup` factory. */
export interface RadioGroupOptions {
  /** The list of selectable options. */
  items: RadioOptionItem[]
  /** Controlled value. */
  value?: string
  /** Uncontrolled initial value, used only if `value` is omitted. */
  defaultValue?: string
  /** Disables every option. Defaults to `false`. */
  disabled?: boolean
  /** Called whenever the user picks a new option. */
  onChange?: (value: string) => void
}

/** The runtime control surface attached to every `RadioGroup` element. */
export interface RadioGroupApi {
  /** Returns the currently selected value, if any. */
  getValue: () => string | undefined
  /** Programmatically selects a value (does not trigger `onChange`). */
  setValue: (value: string) => void
  /** Detaches the group from the DOM and its internal listeners. */
  destroy: () => void
}

/** A `RadioGroup` is a real `HTMLDivElement` extended with `RadioGroupApi`. */
export type RadioGroupElement = HTMLDivElement & RadioGroupApi

/** This component's own CSS, colocated and self-injected on first use. */
export const radioCss = `
.pendentive-radio-group { display: flex; flex-direction: column; gap: 8px }
.pendentive-radio-row { display: flex; align-items: center; gap: 8px; cursor: pointer }
.pendentive-radio-row.pendentive-disabled { opacity: 0.5; cursor: not-allowed }
.pendentive-radio { width: 18px; height: 18px; border-radius: 50%; border: 1px solid var(--pendentive-border); background: var(--pendentive-secondary); display: flex; align-items: center; justify-content: center; flex-shrink: 0 }
.pendentive-radio.pendentive-checked { border-color: var(--pendentive-primary) }
.pendentive-radio-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--pendentive-primary); opacity: 0; transition: opacity 100ms ease }
.pendentive-radio.pendentive-checked .pendentive-radio-dot { opacity: 1 }
`

/** Creates a single-select group of radio rows. */
export function RadioGroup(options: RadioGroupOptions): RadioGroupElement {
  assertDom('RadioGroup')
  ensureComponentStyles('radio', radioCss)
  let value = options.value ?? options.defaultValue
  const groupDisabled = options.disabled ?? false
  const onChange = options.onChange
  const cleanupListeners: Array<() => void> = []
  const root = el('div', px('radio-group'))
  root.setAttribute('role', 'radiogroup')
  function render(): void {
    root.replaceChildren()
    cleanupListeners.splice(0).forEach((fn) => fn())
    for (const item of options.items) {
      const itemDisabled = groupDisabled || (item.disabled ?? false)
      const row = el('div', cx(px('radio-row'), itemDisabled && px('disabled')))
      const dot = el('div', cx(px('radio'), item.value === value && px('checked')))
      dot.appendChild(el('div', px('radio-dot')))
      const label = document.createElement('span')
      label.textContent = item.label
      row.append(dot, label)
      const listener = (): void => {
        if (itemDisabled) return
        value = item.value
        render()
        onChange?.(item.value)
      }
      row.addEventListener('click', listener)
      cleanupListeners.push(() => row.removeEventListener('click', listener))
      root.appendChild(row)
    }
  }
  render()
  const api: RadioGroupApi = {
    getValue() {
      return value
    },
    setValue(newValue) {
      value = newValue
      render()
    },
    destroy() {
      cleanupListeners.splice(0).forEach((fn) => fn())
      root.remove()
    }
  }
  return attachController(root, api)
}