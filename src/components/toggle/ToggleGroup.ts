import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { Toggle } from './Toggle'
import type { ToggleSize, ToggleVariant } from './Toggle'
import type { IconInput } from '../../svg/types'

/** A single item within a `ToggleGroup`. */
export interface ToggleGroupItem {
  /** Visible label. */
  label: string
  /** Unique value identifying this item. */
  value: string
  /** Optional icon shown before the label. */
  icon?: IconInput
  /** Disables just this item. Defaults to `false`. */
  disabled?: boolean
}

/** Options accepted by the `ToggleGroup` factory. */
export interface ToggleGroupOptions {
  /** The items rendered as toggles. */
  items: ToggleGroupItem[]
  /** `'single'` allows one selected item at a time; `'multiple'` allows several. Defaults to `'single'`. */
  type?: 'single' | 'multiple'
  /** Controlled selected value(s) -- a `string` in `'single'` mode, a `string[]` in `'multiple'` mode. */
  value?: string | string[]
  /** Uncontrolled initial value(s), used only if `value` is omitted. */
  defaultValue?: string | string[]
  /** Visual style applied to every item. Defaults to `'outline'`. */
  variant?: ToggleVariant
  /** Sizing preset applied to every item. Defaults to `'default'`. */
  size?: ToggleSize
  /** Disables every item. Defaults to `false`. */
  disabled?: boolean
  /** Called whenever the selection changes via user interaction. */
  onChange?: (value: string | string[]) => void
}

/** The runtime control surface attached to every `ToggleGroup` element. */
export interface ToggleGroupApi {
  /** Returns the current selected value(s). */
  getValue: () => string | string[]
  /** Programmatically sets the selected value(s) (does not trigger `onChange`). */
  setValue: (value: string | string[]) => void
  /** Detaches the group from the DOM and its internal listeners. */
  destroy: () => void
}

/** A `ToggleGroup` is a real `HTMLDivElement` extended with `ToggleGroupApi`. */
export type ToggleGroupElement = HTMLDivElement & ToggleGroupApi

/** This component's own CSS. Depends on `.socle-toggle`, which `Toggle()` registers itself the moment `ToggleGroup` renders its first item. */
export const toggleGroupCss = `
.socle-toggle-group { display: inline-flex; gap: 2px; padding: 2px; border: 1px solid var(--socle-border); border-radius: var(--socle-radius-sm) }
`

/** Creates a group of toggle buttons supporting single- or multiple-selection, useful for view/alignment/format pickers. */
export function ToggleGroup(options: ToggleGroupOptions): ToggleGroupElement {
  assertDom('ToggleGroup')
  ensureComponentStyles('toggle-group', toggleGroupCss)
  const type = options.type ?? 'single'
  const variant = options.variant ?? 'outline'
  const size = options.size ?? 'default'
  const groupDisabled = options.disabled ?? false
  const onChange = options.onChange
  let selected = new Set<string>(
    Array.isArray(options.value ?? options.defaultValue)
      ? (options.value ?? options.defaultValue) as string[]
      : options.value !== undefined || options.defaultValue !== undefined
        ? [(options.value ?? options.defaultValue) as string]
        : []
  )
  const root = el('div', px('toggle-group'))
  root.setAttribute('role', 'group')
  const toggles = new Map<string, ReturnType<typeof Toggle>>()
  function currentValue(): string | string[] {
    if (type === 'single') return Array.from(selected)[0] ?? ''
    return Array.from(selected)
  }
  function toggleItem(value: string): void {
    if (type === 'single') {
      selected = selected.has(value) ? new Set() : new Set([value])
    } else {
      if (selected.has(value)) selected.delete(value)
      else selected.add(value)
    }
    for (const [itemValue, toggle] of toggles) toggle.setPressed(selected.has(itemValue))
    onChange?.(currentValue())
  }
  for (const item of options.items) {
    const toggle = Toggle(item.label, {
      variant,
      size,
      icon: item.icon,
      pressed: selected.has(item.value),
      disabled: groupDisabled || (item.disabled ?? false),
      onPressedChange: () => toggleItem(item.value)
    })
    toggles.set(item.value, toggle)
    root.appendChild(toggle)
  }
  const api: ToggleGroupApi = {
    getValue() {
      return currentValue()
    },
    setValue(value) {
      selected = new Set(Array.isArray(value) ? value : [value])
      for (const [itemValue, toggle] of toggles) toggle.setPressed(selected.has(itemValue))
    },
    destroy() {
      for (const toggle of toggles.values()) toggle.destroy()
      root.remove()
    }
  }
  return attachController(root, api)
}