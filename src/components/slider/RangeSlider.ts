import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { cx, px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { Icon } from '../../svg/Icon'
import type { IconInput } from '../../svg/types'
import { fieldBaseCss } from '../field/shared'
import { sliderCss } from './Slider'

/** A `[low, high]` numeric pair. */
export type RangeValue = [number, number]

/** Options accepted by the `RangeSlider` factory. */
export interface RangeSliderOptions {
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
  /** Controlled `[low, high]` value. */
  value?: RangeValue
  /** Uncontrolled initial `[low, high]` value, used only if `value` is omitted. */
  defaultValue?: RangeValue
  /** Disables both thumbs. Defaults to `false`. */
  disabled?: boolean
  /** Formats each displayed bound. Defaults to `String(value)`. */
  format?: (value: number) => string
  /** Called on every change with the new `[low, high]` pair. */
  onChange?: (value: RangeValue) => void
}

/** The runtime control surface attached to every `RangeSlider` element. */
export interface RangeSliderApi {
  /** Returns the current `[low, high]` value. */
  getValue: () => RangeValue
  /** Programmatically sets the value (does not trigger `onChange`). */
  setValue: (value: RangeValue) => void
  /** Enables/disables both thumbs. */
  setDisabled: (disabled: boolean) => void
  /** Detaches the slider from the DOM and its internal listeners. */
  destroy: () => void
}

/** A `RangeSlider` is a real `HTMLDivElement` (the field wrapper) extended with `RangeSliderApi`. */
export type RangeSliderElement = HTMLDivElement & RangeSliderApi

/** This component's own CSS. Depends on `.linteau-slider` (registered via the imported `sliderCss`) for its thumbs. */
export const rangeSliderCss = `
.linteau-range-track { position: relative; height: 20px; display: flex; align-items: center }
.linteau-range-track::before { content: ''; position: absolute; left: 0; right: 0; height: 6px; border-radius: 999px; background: var(--linteau-secondary) }
.linteau-range-track::after { content: ''; position: absolute; height: 6px; border-radius: 999px; background: var(--linteau-primary); left: var(--linteau-range-low, 0%); right: calc(100% - var(--linteau-range-high, 100%)) }
.linteau-range-input { position: absolute; left: 0; right: 0; width: 100%; height: 20px; background: transparent; pointer-events: none; margin: 0 }
.linteau-range-input::-webkit-slider-thumb { pointer-events: auto }
.linteau-range-input::-moz-range-thumb { pointer-events: auto }
`

/** Creates a labeled dual-thumb range slider, supporting controlled and uncontrolled usage. */
export function RangeSlider(options: RangeSliderOptions): RangeSliderElement {
  assertDom('RangeSlider')
  ensureComponentStyles('field-base', fieldBaseCss)
  ensureComponentStyles('slider', sliderCss)
  ensureComponentStyles('range-slider', rangeSliderCss)
  const { min, max, step } = options
  let [low, high] = options.value ?? options.defaultValue ?? [min, max]
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
  header.append(labelWrap, valueEl)
  const track = el('div', px('range-track'))
  const inputLow = el('input', cx(px('slider'), px('range-input')))
  const inputHigh = el('input', cx(px('slider'), px('range-input')))
  for (const input of [inputLow, inputHigh]) {
    input.type = 'range'
    input.min = String(min)
    input.max = String(max)
    input.step = String(step)
    input.disabled = options.disabled ?? false
  }
  function syncDisplay(): void {
    valueEl.textContent = `${format(low)} - ${format(high)}`
    inputLow.value = String(low)
    inputHigh.value = String(high)
    track.style.setProperty('--linteau-range-low', `${((low - min) / (max - min)) * 100}%`)
    track.style.setProperty('--linteau-range-high', `${((high - min) / (max - min)) * 100}%`)
  }
  syncDisplay()
  const lowListener = (): void => {
    low = Math.min(Number(inputLow.value), high)
    syncDisplay()
    onChange?.([low, high])
  }
  const highListener = (): void => {
    high = Math.max(Number(inputHigh.value), low)
    syncDisplay()
    onChange?.([low, high])
  }
  inputLow.addEventListener('input', lowListener)
  inputHigh.addEventListener('input', highListener)
  track.append(inputLow, inputHigh)
  root.append(header, track)
  const api: RangeSliderApi = {
    getValue() {
      return [low, high]
    },
    setValue(value) {
      ;[low, high] = value
      syncDisplay()
    },
    setDisabled(disabled) {
      inputLow.disabled = disabled
      inputHigh.disabled = disabled
    },
    destroy() {
      inputLow.removeEventListener('input', lowListener)
      inputHigh.removeEventListener('input', highListener)
      root.remove()
    }
  }
  return attachController(root, api)
}