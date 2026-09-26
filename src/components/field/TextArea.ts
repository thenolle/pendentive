import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { Icon } from '../../svg/Icon'
import type { IconInput } from '../../svg/types'
import { fieldBaseCss } from './shared'
import { textInputCss } from './textInput.css'

/** Options accepted by the `TextArea` factory. */
export interface TextAreaOptions {
  /** Label rendered above the textarea. */
  label?: string
  /** Optional icon rendered before the label. */
  icon?: IconInput
  /** Placeholder text. */
  placeholder?: string
  /** Visible row count. Defaults to `3`. */
  rows?: number
  /** Controlled value. */
  value?: string
  /** Uncontrolled initial value, used only if `value` is omitted. */
  defaultValue?: string
  /** Disables the textarea. Defaults to `false`. */
  disabled?: boolean
  /** Called on every keystroke with the new value. */
  onChange?: (value: string) => void
}

/** The runtime control surface attached to every `TextArea` element. */
export interface TextAreaApi {
  /** Returns the current value. */
  getValue: () => string
  /** Programmatically sets the value (does not trigger `onChange`). */
  setValue: (value: string) => void
  /** Enables/disables the textarea. */
  setDisabled: (disabled: boolean) => void
  /** Detaches the field from the DOM and its internal listener. */
  destroy: () => void
}

/** A `TextArea` is a real `HTMLDivElement` (the field wrapper) extended with `TextAreaApi`. */
export type TextAreaElement = HTMLDivElement & TextAreaApi

/** Creates a labeled multi-line text input, supporting controlled and uncontrolled usage. */
export function TextArea(options: TextAreaOptions = {}): TextAreaElement {
  assertDom('TextArea')
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
  const textarea = el('textarea', px('textarea'))
  textarea.placeholder = options.placeholder ?? ''
  textarea.rows = options.rows ?? 3
  textarea.value = options.value ?? options.defaultValue ?? ''
  textarea.disabled = options.disabled ?? false
  const listener = (): void => onChange?.(textarea.value)
  textarea.addEventListener('input', listener)
  root.appendChild(textarea)
  const api: TextAreaApi = {
    getValue() {
      return textarea.value
    },
    setValue(value) {
      textarea.value = value
    },
    setDisabled(disabled) {
      textarea.disabled = disabled
    },
    destroy() {
      textarea.removeEventListener('input', listener)
      root.remove()
    }
  }
  return attachController(root, api)
}