import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { Icon } from '../../svg/Icon'
import { icons } from '../../svg/icons/index'
import type { IconInput } from '../../svg/types'
import { fieldBaseCss } from '../field/shared'

/** Options accepted by the `ChipInput` factory. */
export interface ChipInputOptions {
  /** Label rendered above the field. */
  label?: string
  /** Optional icon rendered before the label. */
  icon?: IconInput
  /** Controlled list of chip values. */
  value?: string[]
  /** Uncontrolled initial values, used only if `value` is omitted. */
  defaultValue?: string[]
  /** Placeholder shown in the text input. */
  placeholder?: string
  /** Called whenever a chip is added or removed. */
  onChange?: (value: string[]) => void
}

/** The runtime control surface attached to every `ChipInput` element. */
export interface ChipInputApi {
  /** Returns the current list of chip values. */
  getValue: () => string[]
  /** Programmatically replaces the chip list (does not trigger `onChange`). */
  setValue: (value: string[]) => void
  /** Detaches the field from the DOM and its internal listeners. */
  destroy: () => void
}

/** A `ChipInput` is a real `HTMLDivElement` (the field wrapper) extended with `ChipInputApi`. */
export type ChipInputElement = HTMLDivElement & ChipInputApi

/** This component's own CSS, colocated and self-injected on first use. */
export const chipInputCss = `
.pendentive-chip-field { display: flex; flex-wrap: wrap; gap: 6px; padding: 6px; background: var(--pendentive-secondary); border: 1px solid var(--pendentive-border); border-radius: var(--pendentive-radius-sm) }
.pendentive-chip-field:focus-within { border-color: var(--pendentive-ring) }
.pendentive-chip { display: inline-flex; align-items: center; gap: 4px; background: var(--pendentive-accent); color: var(--pendentive-accent-foreground); border-radius: 999px; padding: 3px 8px; font-size: 11px }
.pendentive-chip-remove { background: transparent; border: none; color: inherit; cursor: pointer; display: flex; padding: 0 }
.pendentive-chip-input { flex: 1; min-width: 80px; background: transparent; border: none; color: var(--pendentive-foreground); font-size: 12px; font-family: inherit; outline: none }
`

/** Creates a labeled tag/chip input: press Enter to add the typed text as a removable chip. */
export function ChipInput(options: ChipInputOptions = {}): ChipInputElement {
  assertDom('ChipInput')
  ensureComponentStyles('field-base', fieldBaseCss)
  ensureComponentStyles('chip-input', chipInputCss)
  let chips = options.value ?? options.defaultValue ?? []
  const onChange = options.onChange
  const cleanupChipListeners: Array<() => void> = []
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
  const fieldWrap = el('div', px('chip-field'))
  const input = el('input', px('chip-input'))
  input.type = 'text'
  input.placeholder = options.placeholder ?? ''
  fieldWrap.appendChild(input)
  function renderChips(): void {
    Array.from(fieldWrap.children).forEach((child) => { if (child !== input) child.remove() })
    cleanupChipListeners.splice(0).forEach((fn) => fn())
    chips.forEach((value, index) => {
      const chip = el('span', px('chip'))
      const label = document.createElement('span')
      label.textContent = value
      const removeButton = el('button', px('chip-remove'))
      removeButton.type = 'button'
      const removeIcon = Icon(icons.x, 10)
      if (removeIcon) removeButton.appendChild(removeIcon)
      const listener = (): void => {
        chips = chips.filter((_, i) => i !== index)
        renderChips()
        onChange?.(chips)
      }
      removeButton.addEventListener('click', listener)
      cleanupChipListeners.push(() => removeButton.removeEventListener('click', listener))
      chip.append(label, removeButton)
      fieldWrap.insertBefore(chip, input)
    })
  }
  renderChips()
  const keyListener = (event: KeyboardEvent): void => {
    if (event.key === 'Enter' && input.value.trim()) {
      event.preventDefault()
      chips = [...chips, input.value.trim()]
      input.value = ''
      renderChips()
      onChange?.(chips)
    } else if (event.key === 'Backspace' && !input.value && chips.length > 0) {
      chips = chips.slice(0, -1)
      renderChips()
      onChange?.(chips)
    }
  }
  input.addEventListener('keydown', keyListener)
  root.appendChild(fieldWrap)
  const api: ChipInputApi = {
    getValue() {
      return chips
    },
    setValue(newValue) {
      chips = newValue
      renderChips()
    },
    destroy() {
      input.removeEventListener('keydown', keyListener)
      cleanupChipListeners.splice(0).forEach((fn) => fn())
      root.remove()
    }
  }
  return attachController(root, api)
}