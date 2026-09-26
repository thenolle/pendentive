import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { Icon } from '../../svg/Icon'
import type { IconInput } from '../../svg/types'
import { fieldBaseCss } from './shared'
import { textInputCss } from './textInput.css'

/** Options accepted by the `NumberField` factory. */
export interface NumberFieldOptions {
  /** Label rendered above the input. */
  label?: string
  /** Optional icon rendered before the label. */
  icon?: IconInput
  /** Minimum allowed value. */
  min?: number
  /** Maximum allowed value. */
  max?: number
  /** Step increment used by the native spinner arrows. Defaults to `1`. */
  step?: number
  /** Controlled value. */
  value?: number
  /** Uncontrolled initial value, used only if `value` is omitted. Defaults to `0`. */
  defaultValue?: number
  /** Disables the input. Defaults to `false`. */
  disabled?: boolean
  /** Called on every valid numeric change. */
  onChange?: (value: number) => void
}

/** The runtime control surface attached to every `NumberField` element. */
export interface NumberFieldApi {
  /** Returns the current numeric value. */
  getValue: () => number
  /** Programmatically sets the value, clamped to `[min, max]` if provided. */
  setValue: (value: number) => void
  /** Enables/disables the input. */
  setDisabled: (disabled: boolean) => void
  /** Detaches the field from the DOM and its internal listener. */
  destroy: () => void
}

/** A `NumberField` is a real `HTMLDivElement` (the field wrapper) extended with `NumberFieldApi`. */
export type NumberFieldElement = HTMLDivElement & NumberFieldApi

/**
 * Creates a labeled numeric input, supporting controlled and uncontrolled usage.
 *
 * This component has no CSS of its own -- it's fully covered by the shared `field-base`
 * and `text-input` blocks, so it registers those keys and nothing else.
 */
export function NumberField(options: NumberFieldOptions = {}): NumberFieldElement {
  assertDom('NumberField')
  ensureComponentStyles('field-base', fieldBaseCss)
  ensureComponentStyles('text-input', textInputCss)
  const onChange = options.onChange
  const root = el('div', px('field'))
  if (options.label) {
    const header = el('div', px('field-header'))
    const labelWrap = el('div', px('field-label'))
    if (options.icon) labelWrap.appendChild(Icon(options.icon, 14, { className: px('icon') })!)
    const labelText = document.createElement('span')
    labelText.textContent = options.label
    labelWrap.appendChild(labelText)
    header.appendChild(labelWrap)
    root.appendChild(header)
  }
  const input = el('input', px('text-input'))
  input.type = 'number'
  if (options.min !== undefined) input.min = String(options.min)
  if (options.max !== undefined) input.max = String(options.max)
  input.step = String(options.step ?? 1)
  input.value = String(options.value ?? options.defaultValue ?? 0)
  input.disabled = options.disabled ?? false
  function clamp(value: number): number {
    let result = value
    if (options.min !== undefined) result = Math.max(options.min, result)
    if (options.max !== undefined) result = Math.min(options.max, result)
    return result
  }
  const listener = (): void => {
    const parsed = Number(input.value)
    if (!Number.isNaN(parsed)) onChange?.(parsed)
  }
  input.addEventListener('input', listener)
  root.appendChild(input)
  const api: NumberFieldApi = {
    getValue() {
      return Number(input.value)
    },
    setValue(value) {
      input.value = String(clamp(value))
    },
    setDisabled(disabled) {
      input.disabled = disabled
    },
    destroy() {
      input.removeEventListener('input', listener)
      root.remove()
    }
  }
  return attachController(root, api)
}