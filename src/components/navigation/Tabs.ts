import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { cx, px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { Icon } from '../../svg/Icon'
import type { IconInput } from '../../svg/types'

/** A single tab: its trigger label/icon and the panel content it reveals. */
export interface TabItem {
  /** Visible trigger label. */
  label: string
  /** Unique value identifying this tab. */
  value: string
  /** Optional icon rendered before the label. */
  icon?: IconInput
  /** Content shown in the panel while this tab is active. */
  content: HTMLElement
}

/** Options accepted by the `Tabs` factory. */
export interface TabsOptions {
  /** The tabs to render. */
  items: TabItem[]
  /** Controlled active value. */
  value?: string
  /** Uncontrolled initial value, used only if `value` is omitted. Defaults to the first item. */
  defaultValue?: string
  /** Called whenever the active tab changes. */
  onChange?: (value: string) => void
}

/** The runtime control surface attached to every `Tabs` element. */
export interface TabsApi {
  /** Returns the currently active tab's value. */
  getValue: () => string
  /** Programmatically activates a tab (does not trigger `onChange`). */
  setValue: (value: string) => void
  /** Detaches the tabs from the DOM and their internal listeners. */
  destroy: () => void
}

/** A `Tabs` is a real `HTMLDivElement` extended with `TabsApi`. */
export type TabsElement = HTMLDivElement & TabsApi

/** This component's own CSS, colocated and self-injected on first use. */
export const tabsCss = `
.pendentive-tabs { display: flex; flex-direction: column; gap: 12px; width: 100% }
.pendentive-tabs-list { display: flex; gap: 4px; border-bottom: 1px solid var(--pendentive-border) }
.pendentive-tabs-trigger { background: transparent; border: none; border-bottom: 2px solid transparent; padding: 8px 12px; font-size: 12px; font-weight: 500; color: var(--pendentive-muted-foreground); cursor: pointer; display: flex; align-items: center; gap: 6px; font-family: inherit }
.pendentive-tabs-trigger:hover { color: var(--pendentive-foreground) }
.pendentive-tabs-trigger-active { color: var(--pendentive-foreground); border-bottom-color: var(--pendentive-primary) }
.pendentive-tabs-panel { width: 100% }
`

/** Creates a tabbed container: a trigger list plus a panel that swaps content per active tab. */
export function Tabs(options: TabsOptions): TabsElement {
  assertDom('Tabs')
  ensureComponentStyles('tabs', tabsCss)
  let value = options.value ?? options.defaultValue ?? options.items[0]?.value ?? ''
  const onChange = options.onChange
  const cleanupListeners: Array<() => void> = []
  const root = el('div', px('tabs'))
  const list = el('div', px('tabs-list'))
  list.setAttribute('role', 'tablist')
  const panel = el('div', px('tabs-panel'))
  function renderPanel(): void {
    const active = options.items.find((item) => item.value === value)
    panel.replaceChildren()
    if (active) panel.appendChild(active.content)
  }
  function renderTriggers(): void {
    list.replaceChildren()
    cleanupListeners.splice(0).forEach((fn) => fn())
    for (const item of options.items) {
      const trigger = el('button', cx(px('tabs-trigger'), item.value === value && px('tabs-trigger-active')))
      trigger.type = 'button'
      trigger.setAttribute('role', 'tab')
      if (item.icon) trigger.appendChild(Icon(item.icon, 14, { className: px('icon') })!)
      const label = document.createElement('span')
      label.textContent = item.label
      trigger.appendChild(label)
      const listener = (): void => {
        value = item.value
        renderTriggers()
        renderPanel()
        onChange?.(value)
      }
      trigger.addEventListener('click', listener)
      cleanupListeners.push(() => trigger.removeEventListener('click', listener))
      list.appendChild(trigger)
    }
  }
  renderTriggers()
  renderPanel()
  root.append(list, panel)
  const api: TabsApi = {
    getValue() {
      return value
    },
    setValue(newValue) {
      value = newValue
      renderTriggers()
      renderPanel()
    },
    destroy() {
      cleanupListeners.splice(0).forEach((fn) => fn())
      root.remove()
    }
  }
  return attachController(root, api)
}