import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { Icon } from '../../svg/Icon'
import type { IconInput } from '../../svg/types'
import { fieldBaseCss } from '../field/shared'

/** Options accepted by the `InputOTP` factory. */
export interface InputOTPOptions {
  /** Label rendered above the slots. */
  label?: string
  /** Optional icon rendered before the label. */
  icon?: IconInput
  /** Number of character slots. Defaults to `6`. */
  length?: number
  /** Controlled value. */
  value?: string
  /** Uncontrolled initial value, used only if `value` is omitted. */
  defaultValue?: string
  /** Disables every slot. Defaults to `false`. */
  disabled?: boolean
  /** Regex a single typed/pasted character must match to be accepted. Defaults to digits only. */
  pattern?: RegExp
  /** Called on every change with the concatenated current value. */
  onChange?: (value: string) => void
  /** Called once when every slot is filled. */
  onComplete?: (value: string) => void
}

/** The runtime control surface attached to every `InputOTP` element. */
export interface InputOTPApi {
  /** Returns the concatenated current value. */
  getValue: () => string
  /** Programmatically fills the slots (does not trigger `onChange`/`onComplete`). */
  setValue: (value: string) => void
  /** Enables/disables every slot. */
  setDisabled: (disabled: boolean) => void
  /** Focuses the first empty slot (or the first slot if all are filled). */
  focus: () => void
  /** Detaches the field from the DOM and its internal listeners. */
  destroy: () => void
}

/** An `InputOTP` is a real `HTMLDivElement` (the field wrapper) extended with `InputOTPApi`. */
export type InputOTPElement = HTMLDivElement & InputOTPApi

/** This component's own CSS, colocated and self-injected on first use. */
export const inputOtpCss = `
.pendentive-otp-group { display: flex; gap: 8px }
.pendentive-otp-slot { width: 36px; height: 40px; text-align: center; font-size: 16px; font-weight: 600; background: var(--pendentive-secondary); color: var(--pendentive-foreground); border: 1px solid var(--pendentive-border); border-radius: var(--pendentive-radius-sm); font-family: inherit; transition: border-color 120ms ease, box-shadow 120ms ease }
.pendentive-otp-slot:focus { outline: none; border-color: var(--pendentive-ring); box-shadow: 0 0 0 2px color-mix(in oklch, var(--pendentive-ring) 20%, transparent) }
.pendentive-otp-slot:disabled { opacity: 0.5; cursor: not-allowed }
`

/** Creates a segmented one-time-passcode input: auto-advancing single-character slots with paste and backspace-navigation support. */
export function InputOTP(options: InputOTPOptions = {}): InputOTPElement {
  assertDom('InputOTP')
  ensureComponentStyles('field-base', fieldBaseCss)
  ensureComponentStyles('input-otp', inputOtpCss)
  const length = options.length ?? 6
  const pattern = options.pattern ?? /[0-9]/
  const onChange = options.onChange
  const onComplete = options.onComplete
  const initial = (options.value ?? options.defaultValue ?? '').slice(0, length).split('')
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
  const group = el('div', px('otp-group'))
  group.setAttribute('role', 'group')
  const slots: HTMLInputElement[] = []
  for (let i = 0; i < length; i++) {
    const slot = el('input', px('otp-slot'))
    slot.type = 'text'
    slot.inputMode = 'numeric'
    slot.maxLength = 1
    slot.autocomplete = i === 0 ? 'one-time-code' : 'off'
    slot.value = initial[i] ?? ''
    slot.disabled = options.disabled ?? false
    slot.setAttribute('aria-label', `Digit ${i + 1} of ${length}`)
    slots.push(slot)
    group.appendChild(slot)
  }
  root.appendChild(group)
  function currentValue(): string {
    return slots.map((slot) => slot.value).join('')
  }
  function emit(): void {
    const value = currentValue()
    onChange?.(value)
    if (slots.every((slot) => slot.value)) onComplete?.(value)
  }
  const cleanupFns: Array<() => void> = []
  slots.forEach((slot, index) => {
    const inputListener = (): void => {
      const char = slot.value.slice(-1)
      if (char && !pattern.test(char)) {
        slot.value = ''
        return
      }
      slot.value = char
      emit()
      if (char && index < length - 1) slots[index + 1]?.focus()
    }
    const keyListener = (event: KeyboardEvent): void => {
      if (event.key === 'Backspace' && !slot.value && index > 0) {
        const previousSlot = slots[index - 1]
        if (previousSlot) {
          previousSlot.focus()
          previousSlot.value = ''
          emit()
        }
      } else if (event.key === 'ArrowLeft' && index > 0) {
        event.preventDefault()
        slots[index - 1]?.focus()
      } else if (event.key === 'ArrowRight' && index < length - 1) {
        event.preventDefault()
        slots[index + 1]?.focus()
      }
    }
    const pasteListener = (event: ClipboardEvent): void => {
      const pasted = event.clipboardData?.getData('text') ?? ''
      const chars = pasted.split('').filter((char) => pattern.test(char)).slice(0, length)
      if (chars.length === 0) return
      event.preventDefault()
      chars.forEach((char, i) => { if (slots[i]) slots[i].value = char })
      emit()
      slots[Math.min(chars.length, length - 1)]?.focus()
    }
    slot.addEventListener('input', inputListener)
    slot.addEventListener('keydown', keyListener)
    slot.addEventListener('paste', pasteListener)
    cleanupFns.push(() => {
      slot.removeEventListener('input', inputListener)
      slot.removeEventListener('keydown', keyListener)
      slot.removeEventListener('paste', pasteListener)
    })
  })
  const api: InputOTPApi = {
    getValue() {
      return currentValue()
    },
    setValue(value) {
      const chars = value.slice(0, length).split('')
      slots.forEach((slot, i) => { slot.value = chars[i] ?? '' })
    },
    setDisabled(value) {
      slots.forEach((slot) => { slot.disabled = value })
    },
    focus() {
      (slots.find((slot) => !slot.value) ?? slots[0])?.focus()
    },
    destroy() {
      cleanupFns.forEach((fn) => fn())
      root.remove()
    }
  }
  return attachController(root, api)
}