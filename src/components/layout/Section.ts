// components/layout/Section.ts
import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { cx, px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { Icon } from '../../svg/Icon'
import { icons } from '../../svg/icons/index'
import type { IconInput } from '../../svg/types'

/** Options accepted by the `Section` factory. */
export interface SectionOptions {
  /** Optional icon rendered before the title. */
  icon?: IconInput
  /** When `true`, the header becomes clickable and toggles the body. Defaults to `false`. */
  collapsible?: boolean
  /** Initial collapsed state when `collapsible` is `true`. Defaults to `false`. */
  defaultCollapsed?: boolean
  /** Extra elements (e.g. buttons) rendered on the right side of the header. */
  actions?: HTMLElement[]
}

/** The runtime control surface attached to every `Section` element. */
export interface SectionApi {
  /** The header element, exposed for advanced customization. */
  header: HTMLElement
  /** The body container -- append your fields/content here. */
  body: HTMLElement
  /** Updates the section title text. */
  setTitle: (title: string) => void
  /** Programmatically collapses/expands the section (only relevant when `collapsible`). */
  setCollapsed: (collapsed: boolean) => void
  /** Returns whether the section is currently collapsed. */
  isCollapsed: () => boolean
  /** Detaches the section from the DOM and its internal listeners. */
  destroy: () => void
}

/** A `Section` is a real `HTMLDivElement` extended with `SectionApi`. */
export type SectionElement = HTMLDivElement & SectionApi

/** This component's own CSS, colocated and self-injected on first use. */
export const sectionCss = `
.linteau-section { border: 1px solid var(--linteau-border); border-radius: var(--linteau-radius-lg); background: var(--linteau-muted); overflow: hidden; width: 100% }
.linteau-section-header { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-bottom: 1px solid var(--linteau-border); color: var(--linteau-muted-foreground); cursor: default }
.linteau-section-header.linteau-section-collapsible { cursor: pointer }
.linteau-section-header h3 { margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; flex: 1 }
.linteau-section-actions { display: flex; align-items: center; gap: 6px }
.linteau-section-body { padding: 12px; display: flex; flex-direction: column; gap: 12px }
.linteau-section-body.linteau-collapsed { display: none }
.linteau-section-chevron { transition: transform 150ms ease }
.linteau-section-chevron.linteau-collapsed { transform: rotate(-90deg) }
`

/** Creates a titled, bordered container -- the primary layout grouping primitive of the library. */
export function Section(title: string, options: SectionOptions = {}): SectionElement {
  assertDom('Section')
  ensureComponentStyles('section', sectionCss)
  const { icon, collapsible = false, defaultCollapsed = false, actions = [] } = options
  let collapsed = defaultCollapsed
  const root = el('div', px('section'))
  const header = el('div', cx(px('section-header'), collapsible && px('section-collapsible')))
  const titleEl = document.createElement('h3')
  titleEl.textContent = title
  const body = el('div', cx(px('section-body'), collapsed && px('collapsed')))
  const headerIcon = icon ? Icon(icon, 14, { className: px('icon') }) : null
  const chevron = collapsible ? Icon(icons.chevronDown, 14, { className: cx(px('icon'), px('section-chevron'), collapsed && px('collapsed')) }) : null
  const actionsWrap = el('div', px('section-actions'))
  actionsWrap.append(...actions)
  if (headerIcon) header.appendChild(headerIcon)
  header.appendChild(titleEl)
  if (actions.length) header.appendChild(actionsWrap)
  if (chevron) header.appendChild(chevron)
  root.append(header, body)
  function applyCollapsed(): void {
    body.classList.toggle(px('collapsed'), collapsed)
    chevron?.classList.toggle(px('collapsed'), collapsed)
  }
  const clickListener = (): void => {
    collapsed = !collapsed
    applyCollapsed()
  }
  if (collapsible) header.addEventListener('click', clickListener)
  const api: SectionApi = {
    header,
    body,
    setTitle(newTitle) {
      titleEl.textContent = newTitle
    },
    setCollapsed(value) {
      collapsed = value
      applyCollapsed()
    },
    isCollapsed() {
      return collapsed
    },
    destroy() {
      if (collapsible) header.removeEventListener('click', clickListener)
      root.remove()
    }
  }
  return attachController(root, api)
}