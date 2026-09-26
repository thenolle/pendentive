import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { Icon } from '../../svg/Icon'
import { icons } from '../../svg/icons/index'

/** A single crumb in a `Breadcrumb`. The last item in the list is rendered as the non-interactive current page. */
export interface BreadcrumbItem {
  /** Visible label. */
  label: string
  /** Called when the crumb is clicked (ignored for the last/current item). */
  onClick?: () => void
}

/** Options accepted by the `Breadcrumb` factory. */
export interface BreadcrumbOptions {
  /** The trail of crumbs, in order from root to current page. */
  items: BreadcrumbItem[]
}

/** The runtime control surface attached to every `Breadcrumb` element. */
export interface BreadcrumbApi {
  /** Replaces the full trail. */
  setItems: (items: BreadcrumbItem[]) => void
  /** Detaches the breadcrumb from the DOM and its internal listeners. */
  destroy: () => void
}

/** A `Breadcrumb` is a real `HTMLElement` (`<nav>`) extended with `BreadcrumbApi`. */
export type BreadcrumbElement = HTMLElement & BreadcrumbApi

/** This component's own CSS, colocated and self-injected on first use. */
export const breadcrumbCss = `
.linteau-breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--linteau-muted-foreground) }
.linteau-breadcrumb-item { background: transparent; border: none; color: var(--linteau-muted-foreground); cursor: pointer; font: inherit; padding: 0 }
.linteau-breadcrumb-item:hover { color: var(--linteau-foreground) }
.linteau-breadcrumb-current { color: var(--linteau-foreground); font-weight: 500 }
`

/** Creates a navigational trail of crumbs separated by chevrons. */
export function Breadcrumb(options: BreadcrumbOptions): BreadcrumbElement {
  assertDom('Breadcrumb')
  ensureComponentStyles('breadcrumb', breadcrumbCss)
  const nav = el('nav', px('breadcrumb'))
  nav.setAttribute('aria-label', 'breadcrumb')
  const cleanupListeners: Array<() => void> = []
  function render(items: BreadcrumbItem[]): void {
    nav.replaceChildren()
    cleanupListeners.splice(0).forEach((fn) => fn())
    items.forEach((item, index) => {
      const isLast = index === items.length - 1
      if (isLast) {
        const current = el('span', px('breadcrumb-current'))
        current.textContent = item.label
        nav.appendChild(current)
      } else {
        const button = el('button', px('breadcrumb-item'))
        button.type = 'button'
        button.textContent = item.label
        const listener = (): void => item.onClick?.()
        button.addEventListener('click', listener)
        cleanupListeners.push(() => button.removeEventListener('click', listener))
        nav.appendChild(button)
        const separator = Icon(icons.chevronRight, 12, { className: px('icon') })
        if (separator) nav.appendChild(separator)
      }
    })
  }
  render(options.items)
  const api: BreadcrumbApi = {
    setItems(items) {
      render(items)
    },
    destroy() {
      cleanupListeners.splice(0).forEach((fn) => fn())
      nav.remove()
    }
  }
  return attachController(nav, api)
}