import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { cx, px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { onClickOutside, positionFloating } from '../../core/overlay'
import { Icon } from '../../svg/Icon'
import { icons } from '../../svg/icons/index'
import type { IconInput } from '../../svg/types'
import type { SelectOptionItem } from './Select'
import { fieldBaseCss } from '../field/shared'
import { textInputCss } from '../field/textInput.css'

/** Options accepted by the `Combobox` factory. */
export interface ComboboxOptions {
  /** Label rendered above the field. */
  label: string
  /** Optional icon rendered before the label. */
  icon?: IconInput
  /** The list of selectable options, filtered live against the typed text. */
  options: SelectOptionItem[]
  /** Controlled value. */
  value?: string
  /** Uncontrolled initial value, used only if `value` is omitted. */
  defaultValue?: string
  /** Placeholder shown when nothing is typed/selected. */
  placeholder?: string
  /** Disables the field. Defaults to `false`. */
  disabled?: boolean
  /** Called whenever the user selects an option. */
  onChange?: (value: string) => void
}

/** The runtime control surface attached to every `Combobox` element. */
export interface ComboboxApi {
  /** Returns the currently selected value. */
  getValue: () => string
  /** Programmatically selects a value (does not trigger `onChange`). */
  setValue: (value: string) => void
  /** Replaces the full list of options. */
  setOptions: (options: SelectOptionItem[]) => void
  /** Opens the suggestion list. */
  open: () => void
  /** Closes the suggestion list. */
  close: () => void
  /** Detaches the field from the DOM and its internal listeners. */
  destroy: () => void
}

/** A `Combobox` is a real `HTMLDivElement` (the field wrapper) extended with `ComboboxApi`. */
export type ComboboxElement = HTMLDivElement & ComboboxApi

/** This component's own CSS. Reused by `DatePicker` under the same `combobox` key, so it's only ever injected once. */
export const comboboxCss = `
.pendentive-combobox { position: relative; display: flex; align-items: center }
.pendentive-combobox-input { padding-right: 28px }
.pendentive-combobox-chevron { position: absolute; right: 8px; pointer-events: none; color: var(--pendentive-muted-foreground) }
.pendentive-combobox-list { position: fixed; z-index: 1200; min-width: 180px; max-height: 220px; overflow-y: auto; background: var(--pendentive-card); border: 1px solid var(--pendentive-border); border-radius: var(--pendentive-radius-md); padding: 4px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4) }
.pendentive-combobox-option { padding: 6px 8px; border-radius: var(--pendentive-radius-sm); font-size: 12px; cursor: pointer; color: var(--pendentive-foreground) }
.pendentive-combobox-option-highlighted, .pendentive-combobox-option:hover { background: var(--pendentive-accent) }
`

/** Creates a filterable, type-to-search select -- a text input backed by a live-filtered dropdown of options. */
export function Combobox(options: ComboboxOptions): ComboboxElement {
  assertDom('Combobox')
  ensureComponentStyles('field-base', fieldBaseCss)
  ensureComponentStyles('text-input', textInputCss)
  ensureComponentStyles('combobox', comboboxCss)
  let items = options.options
  let value = options.value ?? options.defaultValue ?? ''
  let query = items.find((item) => item.value === value)?.label ?? ''
  let isOpen = false
  let highlighted = 0
  let unbindOutside: (() => void) | null = null
  const onChange = options.onChange
  const root = el('div', px('field'))
  const header = el('div', px('field-header'))
  const labelWrap = el('div', px('field-label'))
  if (options.icon) labelWrap.appendChild(Icon(options.icon, 14, { className: px('icon') })!)
  const labelText = document.createElement('span')
  labelText.textContent = options.label
  labelWrap.appendChild(labelText)
  header.appendChild(labelWrap)
  const wrap = el('div', px('combobox'))
  const input = el('input', cx(px('text-input'), px('combobox-input')))
  input.type = 'text'
  input.placeholder = options.placeholder ?? ''
  input.value = query
  input.disabled = options.disabled ?? false
  const chevron = Icon(icons.chevronDown, 12, { className: px('combobox-chevron') })!
  const list = el('div', cx(px('combobox-list'), px('hidden')))
  function filtered(): SelectOptionItem[] {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return items
    return items.filter((item) => item.label.toLowerCase().includes(normalized))
  }
  function renderList(): void {
    list.replaceChildren()
    filtered().forEach((item, index) => {
      const optionEl = el('div', cx(px('combobox-option'), index === highlighted && px('combobox-option-highlighted')))
      optionEl.textContent = item.label
      optionEl.addEventListener('mousedown', (event) => {
        event.preventDefault()
        select(item)
      })
      list.appendChild(optionEl)
    })
  }
  function select(item: SelectOptionItem): void {
    value = item.value
    query = item.label
    input.value = query
    close()
    onChange?.(value)
  }
  /** Reverts the visible text to whatever label matches the current committed `value`, discarding any unmatched typed text. */
  function syncInputToValue(): void {
    query = items.find((item) => item.value === value)?.label ?? ''
    input.value = query
  }
  function open(): void {
    if (isOpen || input.disabled) return
    isOpen = true
    highlighted = 0
    document.body.appendChild(list)
    list.classList.remove(px('hidden'))
    renderList()
    positionFloating(wrap, list, 'bottom')
    unbindOutside = onClickOutside([wrap, list], close)
  }
  function close(): void {
    if (!isOpen) return
    isOpen = false
    list.classList.add(px('hidden'))
    list.remove()
    unbindOutside?.()
    unbindOutside = null
    syncInputToValue()
  }
  const inputListener = (): void => {
    query = input.value
    highlighted = 0
    if (!isOpen) open()
    else renderList()
  }
  const keyListener = (event: KeyboardEvent): void => {
    const results = filtered()
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      highlighted = Math.min(highlighted + 1, results.length - 1)
      renderList()
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      highlighted = Math.max(highlighted - 1, 0)
      renderList()
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const item = results[highlighted]
      if (item) select(item)
    } else if (event.key === 'Escape') {
      close()
    }
  }
  const focusListener = (): void => open()
  input.addEventListener('input', inputListener)
  input.addEventListener('keydown', keyListener)
  input.addEventListener('focus', focusListener)
  wrap.append(input, chevron)
  root.append(header, wrap)
  const api: ComboboxApi = {
    getValue() {
      return value
    },
    setValue(newValue) {
      value = newValue
      syncInputToValue()
    },
    setOptions(newOptions) {
      items = newOptions
      syncInputToValue()
      if (isOpen) renderList()
    },
    open,
    close,
    destroy() {
      input.removeEventListener('input', inputListener)
      input.removeEventListener('keydown', keyListener)
      input.removeEventListener('focus', focusListener)
      unbindOutside?.()
      list.remove()
      root.remove()
    }
  }
  return attachController(root, api)
}