import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { Icon } from '../../svg/Icon'
import type { IconInput } from '../../svg/types'
import { fieldBaseCss } from './shared'

/** Options accepted by the `ColorField` factory. */
export interface ColorFieldOptions {
  /** Label rendered before the swatch. */
  label: string
  /** Optional icon rendered before the label. */
  icon?: IconInput
  /** Controlled hex value. When provided together with `onChange`, you own the state. */
  value?: string
  /** Uncontrolled initial value, used only if `value` is omitted. Defaults to `'#ffffff'`. */
  defaultValue?: string
  /** Disables interaction. Defaults to `false`. */
  disabled?: boolean
  /** Called on every color change. */
  onChange?: (value: string) => void
}

/** The runtime control surface attached to every `ColorField` element. */
export interface ColorFieldApi {
  /** Returns the current hex color string. */
  getValue: () => string
  /** Programmatically sets the color (does not trigger `onChange`). */
  setValue: (value: string) => void
  /** Enables/disables the control. */
  setDisabled: (disabled: boolean) => void
  /** Detaches the field from the DOM and its internal listener. */
  destroy: () => void
}

/** A `ColorField` is a real `HTMLDivElement` (the field row) extended with `ColorFieldApi`. */
export type ColorFieldElement = HTMLDivElement & ColorFieldApi

/** This component's own CSS, colocated and self-injected on first use. */
export const swatchCss = `
.socle-swatch { --socle-swatch-color: #ffffff; width: 28px; height: 28px; border-radius: var(--socle-radius-sm); background: var(--socle-swatch-color); border: 1px solid var(--socle-border); cursor: pointer; display: block; position: relative; overflow: hidden; transition: transform 120ms ease }
.socle-swatch:hover { transform: scale(1.06) }
.socle-swatch input[type='color'] { position: absolute; inset: 0; opacity: 0; cursor: pointer }
`

/** Creates a labeled native color-picker swatch, supporting controlled and uncontrolled usage. */
export function ColorField(options: ColorFieldOptions): ColorFieldElement {
  assertDom('ColorField')
  ensureComponentStyles('field-base', fieldBaseCss)
  ensureComponentStyles('swatch', swatchCss)
  let value = options.value ?? options.defaultValue ?? '#ffffff'
  const onChange = options.onChange
  const root = el('div', px('field-row'))
  const labelWrap = el('div', px('field-label'))
  if (options.icon) labelWrap.appendChild(Icon(options.icon, 14, { className: px('icon') })!)
  const labelText = document.createElement('span')
  labelText.textContent = options.label
  labelWrap.appendChild(labelText)
  const swatch = el('label', px('swatch'))
  swatch.style.setProperty('--socle-swatch-color', value)
  const input = el('input', undefined)
  input.type = 'color'
  input.value = value
  input.disabled = options.disabled ?? false
  const listener = (): void => {
    value = input.value
    swatch.style.setProperty('--socle-swatch-color', value)
    onChange?.(value)
  }
  input.addEventListener('input', listener)
  swatch.appendChild(input)
  root.append(labelWrap, swatch)
  const api: ColorFieldApi = {
    getValue() {
      return value
    },
    setValue(newValue) {
      value = newValue
      input.value = newValue
      swatch.style.setProperty('--socle-swatch-color', newValue)
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