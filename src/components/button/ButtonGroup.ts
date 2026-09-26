import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { Button } from './Button'
import type { IconInput } from '../../svg/types'

/** A single selectable item within a `ButtonGroup`. */
export interface ButtonGroupItem {
  /** Visible label. */
  label: string
  /** Unique value identifying this item. */
  value: string
  /** Optional icon shown before the label. */
  icon?: IconInput
}

/** Options accepted by the `ButtonGroup` factory. */
export interface ButtonGroupOptions {
  /** The items rendered as segments. */
  items: ButtonGroupItem[]
  /** Initially selected value (controlled if you keep calling `setValue`, uncontrolled otherwise). */
  value?: string
  /** Called whenever the selection changes via user interaction. */
  onChange?: (value: string) => void
}

/** The runtime control surface attached to every `ButtonGroup` element. */
export interface ButtonGroupApi {
  /** Returns the currently selected value, if any. */
  getValue: () => string | undefined
  /** Programmatically selects a value (does not trigger `onChange`). */
  setValue: (value: string) => void
  /** Replaces the full list of items, preserving selection where possible. */
  setItems: (items: ButtonGroupItem[]) => void
  /** Detaches the group from the DOM and its internal listeners. */
  destroy: () => void
}

/** A `ButtonGroup` is a real `HTMLDivElement` extended with `ButtonGroupApi`. */
export type ButtonGroupElement = HTMLDivElement & ButtonGroupApi

/** This component's own CSS. Depends on `.linteau-button`, which `Button()` registers itself the moment `ButtonGroup` renders its first segment. */
export const buttonGroupCss = `
.linteau-button-group { display: inline-flex; border: 1px solid var(--linteau-border); border-radius: var(--linteau-radius-sm); overflow: hidden }
.linteau-button-group .linteau-button { border-radius: 0; border: none; border-right: 1px solid var(--linteau-border); background: transparent; color: var(--linteau-muted-foreground) }
.linteau-button-group .linteau-button:last-child { border-right: none }
.linteau-button-group .linteau-button:hover:not(:disabled) { background: var(--linteau-accent) }
.linteau-button-group .linteau-button-group-item-active { background: var(--linteau-primary); color: var(--linteau-primary-foreground) }
`

/** Creates a segmented, single-select group of buttons -- useful for compact mode/tab-like pickers that don't need a full `Select`. */
export function ButtonGroup(options: ButtonGroupOptions): ButtonGroupElement {
  assertDom('ButtonGroup')
  ensureComponentStyles('button-group', buttonGroupCss)
  let items = options.items
  let value = options.value
  const onChange = options.onChange
  const root = el('div', px('button-group'))
  root.setAttribute('role', 'group')
  function render(): void {
    root.replaceChildren()
    for (const item of items) {
      const isActive = item.value === value
      const button = Button(item.label, {
        icon: item.icon,
        variant: 'ghost',
        onClick: () => {
          value = item.value
          render()
          onChange?.(item.value)
        }
      })
      button.classList.toggle(px('button-group-item-active'), isActive)
      root.appendChild(button)
    }
  }
  render()
  const api: ButtonGroupApi = {
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
      root.remove()
    }
  }
  return attachController(root, api)
}