import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { Icon } from '../../svg/Icon'
import type { IconInput } from '../../svg/types'
import { fieldBaseCss } from './shared'
import { textInputCss } from './textInput.css'

/** Options accepted by the `TextField` factory. */
export interface TextFieldOptions {
  /** Label rendered above the input. */
  label?: string
  /** Optional icon rendered before the label. */
  icon?: IconInput
  /** Native input type. Defaults to `'text'`. */
  type?: 'text' | 'email' | 'password' | 'search' | 'tel' | 'url'
  /** Placeholder text. */
  placeholder?: string
  /** Controlled value. When provided together with `onChange`, you own the state. */
  value?: string
  /** Uncontrolled initial value, used only if `value` is omitted. */
  defaultValue?: string
  /** Disables the input. Defaults to `false`. */
  disabled?: boolean
  /** Called on every keystroke with the new value. */
  onChange?: (value: string) => void
  /** Called when Enter is pressed. */
  onEnter?: (value: string) => void
}

/** The runtime control surface attached to every `TextField` element. */
export interface TextFieldApi {
  /** Returns the current input value. */
  getValue: () => string
  /** Programmatically sets the value (does not trigger `onChange`). */
  setValue: (value: string) => void
  /** Enables/disables the input. */
  setDisabled: (disabled: boolean) => void
  /** Focuses the underlying input. */
  focus: () => void
  /** Detaches the field from the DOM and its internal listeners. */
  destroy: () => void
}

/** A `TextField` is a real `HTMLDivElement` (the field wrapper) extended with `TextFieldApi`. */
export type TextFieldElement = HTMLDivElement & TextFieldApi

/** Creates a labeled single-line text input, supporting controlled and uncontrolled usage. */
export function TextField(options: TextFieldOptions = {}): TextFieldElement {
  assertDom('TextField')
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
  input.type = options.type ?? 'text'
  input.placeholder = options.placeholder ?? ''
  input.value = options.value ?? options.defaultValue ?? ''
  input.disabled = options.disabled ?? false
  const inputListener = (): void => onChange?.(input.value)
  const keyListener = (event: KeyboardEvent): void => { if (event.key === 'Enter') options.onEnter?.(input.value) }
  input.addEventListener('input', inputListener)
  input.addEventListener('keydown', keyListener)
  root.appendChild(input)
  const api: TextFieldApi = {
    getValue() {
      return input.value
    },
    setValue(value) {
      input.value = value
    },
    setDisabled(disabled) {
      input.disabled = disabled
    },
    focus() {
      input.focus()
    },
    destroy() {
      input.removeEventListener('input', inputListener)
      input.removeEventListener('keydown', keyListener)
      root.remove()
    }
  }
  return attachController(root, api)
}