import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { Icon } from '../../svg/Icon'
import type { IconInput } from '../../svg/types'
import { fieldBaseCss } from '../field/shared'

/** Options accepted by the `Slider` factory. */
export interface SliderOptions {
  /** Label rendered above the track. */
  label: string
  /** Optional icon rendered before the label. */
  icon?: IconInput
  /** Minimum value. */
  min: number
  /** Maximum value. */
  max: number
  /** Step increment. */
  step: number
  /** Controlled value. When provided together with `onChange`, you own the state. */
  value?: number
  /** Uncontrolled initial value, used only if `value` is omitted. */
  defaultValue?: number
  /** Disables interaction. Defaults to `false`. */
  disabled?: boolean
  /** Formats the displayed value string. Defaults to `String(value)`. */
  format?: (value: number) => string
  /** Called on every input event with the new numeric value. */
  onChange?: (value: number) => void
}

/** The runtime control surface attached to every `Slider` element. */
export interface SliderApi {
  /** Returns the current numeric value. */
  getValue: () => number
  /** Programmatically sets the value (does not trigger `onChange`, clamped to `[min, max]`). */
  setValue: (value: number) => void
  /** Enables/disables the slider. */
  setDisabled: (disabled: boolean) => void
  /** Detaches the slider from the DOM and its internal listener. */
  destroy: () => void
}

/** A `Slider` is a real `HTMLDivElement` (the field wrapper) extended with `SliderApi`. */
export type SliderElement = HTMLDivElement & SliderApi

/** This component's own CSS, colocated and self-injected on first use. */
export const sliderCss = `
.socle-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 6px; border-radius: 999px; background: linear-gradient(to right, var(--socle-primary) 0%, var(--socle-primary) var(--socle-fill, 0%), var(--socle-secondary) var(--socle-fill, 0%), var(--socle-secondary) 100%); outline: none; transition: background 120ms ease }
.socle-slider:disabled { opacity: 0.5 }
.socle-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: var(--socle-primary); border: 2px solid var(--socle-card); box-shadow: 0 0 0 1px var(--socle-border); cursor: pointer; transition: transform 120ms ease }
.socle-slider::-webkit-slider-thumb:hover { transform: scale(1.15) }
.socle-slider::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: var(--socle-primary); border: 2px solid var(--socle-card); cursor: pointer }
`

/** Creates a labeled range slider with a live value readout, supporting controlled and uncontrolled usage. */
export function Slider(options: SliderOptions): SliderElement {
  assertDom('Slider')
  ensureComponentStyles('field-base', fieldBaseCss)
  ensureComponentStyles('slider', sliderCss)
  const { min, max, step } = options
  let value = options.value ?? options.defaultValue ?? min
  const format = options.format ?? ((v: number) => v.toString())
  const onChange = options.onChange
  const root = el('div', px('field'))
  const header = el('div', px('field-header'))
  const labelWrap = el('div', px('field-label'))
  if (options.icon) labelWrap.appendChild(Icon(options.icon, 14, { className: px('icon') })!)
  const labelText = document.createElement('span')
  labelText.textContent = options.label
  labelWrap.appendChild(labelText)
  const valueEl = el('span', px('field-value'))
  valueEl.textContent = format(value)
  header.append(labelWrap, valueEl)
  const input = el('input', px('slider'))
  input.type = 'range'
  input.min = String(min)
  input.max = String(max)
  input.step = String(step)
  input.value = String(value)
  input.disabled = options.disabled ?? false
  function updateFill(v: number): void {
    const percent = ((v - min) / (max - min)) * 100
    input.style.setProperty('--socle-fill', `${percent}%`)
  }
  updateFill(value)
  const listener = (): void => {
    value = Number(input.value)
    valueEl.textContent = format(value)
    updateFill(value)
    onChange?.(value)
  }
  input.addEventListener('input', listener)
  root.append(header, input)
  const api: SliderApi = {
    getValue() {
      return value
    },
    setValue(newValue) {
      value = Math.max(min, Math.min(max, newValue))
      input.value = String(value)
      valueEl.textContent = format(value)
      updateFill(value)
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