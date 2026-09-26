import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { cx, px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { Icon } from '../../svg/Icon'
import type { IconInput } from '../../svg/types'

/** A single row rendered inside a `List`. */
export interface ListItem {
  /** Visible label. */
  label: string
  /** Unique value identifying this row. */
  value: string
  /** Optional icon rendered before the text. */
  icon?: IconInput
  /** Optional secondary line under the label. */
  description?: string
}

/** Options accepted by the `List` factory. */
export interface ListOptions {
  /** The rows to render. */
  items: ListItem[]
  /** Enables single-select highlighting/interaction. Defaults to `true`. */
  selectable?: boolean
  /** Controlled selected value. */
  value?: string
  /** Called whenever the user selects a row (only when `selectable`). */
  onChange?: (value: string) => void
}

/** The runtime control surface attached to every `List` element. */
export interface ListApi {
  /** Returns the currently selected value, if any. */
  getValue: () => string | undefined
  /** Programmatically selects a value (does not trigger `onChange`). */
  setValue: (value: string) => void
  /** Replaces the full list of rows. */
  setItems: (items: ListItem[]) => void
  /** Detaches the list from the DOM and its internal listeners. */
  destroy: () => void
}

/** A `List` is a real `HTMLDivElement` extended with `ListApi`. */
export type ListElement = HTMLDivElement & ListApi

/** This component's own CSS, colocated and self-injected on first use. */
export const listCss = `
.linteau-list { display: flex; flex-direction: column; gap: 2px; width: 100% }
.linteau-list-item { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: var(--linteau-radius-sm); cursor: pointer }
.linteau-list-item:hover { background: var(--linteau-accent) }
.linteau-list-item-selected { background: var(--linteau-accent) }
.linteau-list-item-text { display: flex; flex-direction: column }
.linteau-list-item-label { font-size: 13px; color: var(--linteau-foreground) }
.linteau-list-item-description { font-size: 11px; color: var(--linteau-muted-foreground) }
`

/** Creates a vertical list of rows, optionally single-selectable. */
export function List(options: ListOptions): ListElement {
  assertDom('List')
  ensureComponentStyles('list', listCss)
  let items = options.items
  const selectable = options.selectable ?? true
  let value = options.value
  const onChange = options.onChange
  const cleanupListeners: Array<() => void> = []
  const root = el('div', px('list'))
  function render(): void {
    root.replaceChildren()
    cleanupListeners.splice(0).forEach((fn) => fn())
    for (const item of items) {
      const row = el('div', cx(px('list-item'), selectable && item.value === value && px('list-item-selected')))
      if (item.icon) row.appendChild(Icon(item.icon, 16, { className: px('icon') })!)
      const textWrap = el('div', px('list-item-text'))
      const label = el('div', px('list-item-label'))
      label.textContent = item.label
      textWrap.appendChild(label)
      if (item.description) {
        const description = el('div', px('list-item-description'))
        description.textContent = item.description
        textWrap.appendChild(description)
      }
      row.appendChild(textWrap)
      if (selectable) {
        const listener = (): void => {
          value = item.value
          render()
          onChange?.(item.value)
        }
        row.addEventListener('click', listener)
        cleanupListeners.push(() => row.removeEventListener('click', listener))
      }
      root.appendChild(row)
    }
  }
  render()
  const api: ListApi = {
    getValue() {
      return value
    },
    setValue(newValue) {
      value = newValue
      render()
    },
    setItems(newItems) {
      items = newItems
      render()
    },
    destroy() {
      cleanupListeners.splice(0).forEach((fn) => fn())
      root.remove()
    }
  }
  return attachController(root, api)
}