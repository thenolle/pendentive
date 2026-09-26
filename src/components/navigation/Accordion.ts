import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { cx, px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { Icon } from '../../svg/Icon'
import { icons } from '../../svg/icons/index'
import type { IconInput } from '../../svg/types'

/** A single collapsible section within an `Accordion`. */
export interface AccordionItem {
  /** Visible header label. */
  label: string
  /** Unique value identifying this section. */
  value: string
  /** Optional icon rendered before the label. */
  icon?: IconInput
  /** Content revealed when this section is open. */
  content: HTMLElement
}

/** Options accepted by the `Accordion` factory. */
export interface AccordionOptions {
  /** The sections to render. */
  items: AccordionItem[]
  /** Allows more than one section open at once. Defaults to `false`. */
  multiple?: boolean
  /** Values open by default. */
  defaultOpen?: string[]
  /** Called whenever the set of open sections changes. */
  onChange?: (openValues: string[]) => void
}

/** The runtime control surface attached to every `Accordion` element. */
export interface AccordionApi {
  /** Returns the values of currently open sections. */
  getOpen: () => string[]
  /** Opens a section by value. */
  open: (value: string) => void
  /** Closes a section by value. */
  close: (value: string) => void
  /** Toggles a section by value. */
  toggle: (value: string) => void
  /** Detaches the accordion from the DOM and its internal listeners. */
  destroy: () => void
}

/** An `Accordion` is a real `HTMLDivElement` extended with `AccordionApi`. */
export type AccordionElement = HTMLDivElement & AccordionApi

/** This component's own CSS, colocated and self-injected on first use. */
export const accordionCss = `
.linteau-accordion { display: flex; flex-direction: column; gap: 8px; width: 100% }
.linteau-accordion-item { border: 1px solid var(--linteau-border); border-radius: var(--linteau-radius-lg); overflow: hidden }
.linteau-accordion-header { display: flex; align-items: center; gap: 8px; width: 100%; padding: 12px; background: var(--linteau-muted); border: none; cursor: pointer; font-size: 13px; font-weight: 500; color: var(--linteau-foreground); font-family: inherit }
.linteau-accordion-chevron { margin-left: auto; transition: transform 150ms ease }
.linteau-accordion-chevron.linteau-open { transform: rotate(180deg) }
.linteau-accordion-content { padding: 12px }
.linteau-accordion-content.linteau-collapsed { display: none }
`

/** Creates a set of collapsible sections, single- or multi-open. */
export function Accordion(options: AccordionOptions): AccordionElement {
  assertDom('Accordion')
  ensureComponentStyles('accordion', accordionCss)
  const multiple = options.multiple ?? false
  let openValues = new Set(options.defaultOpen ?? [])
  const onChange = options.onChange
  const cleanupListeners: Array<() => void> = []
  const root = el('div', px('accordion'))
  function setOpenState(value: string, shouldOpen: boolean): void {
    if (shouldOpen) {
      if (!multiple) openValues.clear()
      openValues.add(value)
    } else {
      openValues.delete(value)
    }
    render()
    onChange?.(Array.from(openValues))
  }
  function render(): void {
    root.replaceChildren()
    cleanupListeners.splice(0).forEach((fn) => fn())
    for (const item of options.items) {
      const isOpen = openValues.has(item.value)
      const itemEl = el('div', px('accordion-item'))
      const header = el('button', px('accordion-header'))
      header.type = 'button'
      if (item.icon) header.appendChild(Icon(item.icon, 14, { className: px('icon') })!)
      const label = document.createElement('span')
      label.textContent = item.label
      const chevron = Icon(icons.chevronDown, 14, { className: cx(px('accordion-chevron'), isOpen && px('open')) })!
      header.append(label, chevron)
      const content = el('div', cx(px('accordion-content'), !isOpen && px('collapsed')))
      content.appendChild(item.content)
      const listener = (): void => setOpenState(item.value, !isOpen)
      header.addEventListener('click', listener)
      cleanupListeners.push(() => header.removeEventListener('click', listener))
      itemEl.append(header, content)
      root.appendChild(itemEl)
    }
  }
  render()
  const api: AccordionApi = {
    getOpen() {
      return Array.from(openValues)
    },
    open(value) {
      setOpenState(value, true)
    },
    close(value) {
      setOpenState(value, false)
    },
    toggle(value) {
      setOpenState(value, !openValues.has(value))
    },
    destroy() {
      cleanupListeners.splice(0).forEach((fn) => fn())
      root.remove()
    }
  }
  return attachController(root, api)
}