import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { Icon } from '../../svg/Icon'
import { icons } from '../../svg/icons/index'
import type { IconInput } from '../../svg/types'
import { fieldBaseCss } from '../field/shared'

/** A single option rendered inside a `Select`. */
export interface SelectOptionItem {
  /** Visible label. */
  label: string
  /** Underlying value. */
  value: string
  /** Disables just this option. Defaults to `false`. */
  disabled?: boolean
}

/** Options accepted by the `Select` factory. */
export interface SelectOptions {
  /** Label rendered before the dropdown. */
  label: string
  /** Optional icon rendered before the label. */
  icon?: IconInput
  /** The list of selectable options. */
  options: SelectOptionItem[]
  /** Controlled value. When provided together with `onChange`, you own the state. */
  value?: string
  /** Uncontrolled initial value, used only if `value` is omitted. */
  defaultValue?: string
  /** Placeholder shown when no value is selected (renders as a disabled first option). */
  placeholder?: string
  /** Disables the whole control. Defaults to `false`. */
  disabled?: boolean
  /** Called whenever the user picks a new option. */
  onChange?: (value: string) => void
}

/** The runtime control surface attached to every `Select` element. */
export interface SelectApi {
  /** Returns the currently selected value. */
  getValue: () => string
  /** Programmatically selects a value (does not trigger `onChange`). */
  setValue: (value: string) => void
  /** Replaces the full list of options, preserving selection where possible. */
  setOptions: (options: SelectOptionItem[]) => void
  /** Enables/disables the control. */
  setDisabled: (disabled: boolean) => void
  /** Detaches the select from the DOM and its internal listener. */
  destroy: () => void
}

/** A `Select` is a real `HTMLDivElement` (the field row) extended with `SelectApi`. */
export type SelectElement = HTMLDivElement & SelectApi

/** This component's own CSS, colocated and self-injected on first use. */
export const selectCss = `
.linteau-select-wrap { position: relative }
.linteau-select { appearance: none; background: var(--linteau-secondary); color: var(--linteau-foreground); border: 1px solid var(--linteau-border); border-radius: var(--linteau-radius-sm); padding: 6px 28px 6px 10px; font-size: 12px; font-family: inherit; cursor: pointer; transition: border-color 120ms ease }
.linteau-select:disabled { opacity: 0.5; cursor: not-allowed }
.linteau-select:focus { outline: none; border-color: var(--linteau-ring); box-shadow: 0 0 0 2px color-mix(in oklch, var(--linteau-ring) 20%, transparent) }
.linteau-select-chevron { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); pointer-events: none }
`

/** Creates a labeled native select dropdown, restyled to match the design system. */
export function Select(options: SelectOptions): SelectElement {
  assertDom('Select')
  ensureComponentStyles('field-base', fieldBaseCss)
  ensureComponentStyles('select', selectCss)
  let items = options.options
  let value = options.value ?? options.defaultValue ?? items[0]?.value ?? ''
  const onChange = options.onChange
  const root = el('div', px('field-row'))
  const labelWrap = el('div', px('field-label'))
  if (options.icon) labelWrap.appendChild(Icon(options.icon, 14, { className: px('icon') })!)
  const labelText = document.createElement('span')
  labelText.textContent = options.label
  labelWrap.appendChild(labelText)
  const selectWrap = el('div', px('select-wrap'))
  const select = el('select', px('select'))
  select.disabled = options.disabled ?? false
  function renderOptions(): void {
    select.replaceChildren()
    if (options.placeholder) {
      const placeholderOption = document.createElement('option')
      placeholderOption.value = ''
      placeholderOption.textContent = options.placeholder
      placeholderOption.disabled = true
      placeholderOption.selected = !value
      select.appendChild(placeholderOption)
    }
    for (const item of items) {
      const optionEl = document.createElement('option')
      optionEl.value = item.value
      optionEl.textContent = item.label
      optionEl.disabled = item.disabled ?? false
      optionEl.selected = item.value === value
      select.appendChild(optionEl)
    }
  }
  renderOptions()
  const chevron = Icon(icons.chevronDown, 12, { className: px('select-chevron') })!
  selectWrap.append(select, chevron)
  const listener = (): void => {
    value = select.value
    onChange?.(value)
  }
  select.addEventListener('change', listener)
  root.append(labelWrap, selectWrap)
  const api: SelectApi = {
    getValue() {
      return value
    },
    setValue(newValue) {
      value = newValue
      select.value = newValue
    },
    setOptions(newOptions) {
      items = newOptions
      renderOptions()
    },
    setDisabled(disabled) {
      select.disabled = disabled
    },
    destroy() {
      select.removeEventListener('change', listener)
      root.remove()
    }
  }
  return attachController(root, api)
}