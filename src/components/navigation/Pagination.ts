import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { cx, px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { Icon } from '../../svg/Icon'
import { icons } from '../../svg/icons/index'

/** Options accepted by the `Pagination` factory. */
export interface PaginationOptions {
  /** Controlled current page (1-indexed). */
  page?: number
  /** Uncontrolled initial page, used only if `page` is omitted. Defaults to `1`. */
  defaultPage?: number
  /** Total number of pages. */
  pageCount: number
  /** Page buttons shown on each side of the current page before collapsing into an ellipsis. Defaults to `1`. */
  siblingCount?: number
  /** Called whenever the user navigates to a new page. */
  onChange?: (page: number) => void
}

/** The runtime control surface attached to every `Pagination` element. */
export interface PaginationApi {
  /** Returns the current page. */
  getPage: () => number
  /** Programmatically navigates to a page (does not trigger `onChange`). */
  setPage: (page: number) => void
  /** Updates the total page count and re-renders. */
  setPageCount: (pageCount: number) => void
  /** Detaches the control from the DOM and its internal listeners. */
  destroy: () => void
}

/** A `Pagination` is a real `HTMLDivElement` extended with `PaginationApi`. */
export type PaginationElement = HTMLDivElement & PaginationApi

/** This component's own CSS, colocated and self-injected on first use. */
export const paginationCss = `
.linteau-pagination { display: flex; align-items: center; gap: 4px }
.linteau-pagination-item { min-width: 28px; height: 28px; padding: 0 6px; display: flex; align-items: center; justify-content: center; border-radius: var(--linteau-radius-sm); border: 1px solid transparent; background: transparent; color: var(--linteau-muted-foreground); font-size: 12px; cursor: pointer; font-family: inherit }
.linteau-pagination-item:hover:not(:disabled) { background: var(--linteau-accent) }
.linteau-pagination-item:disabled { opacity: 0.4; cursor: not-allowed }
.linteau-pagination-item-active { background: var(--linteau-primary); color: var(--linteau-primary-foreground) }
.linteau-pagination-ellipsis { color: var(--linteau-muted-foreground); padding: 0 4px }
`

function buildRange(current: number, pageCount: number, siblingCount: number): Array<number | 'ellipsis'> {
  const totalVisible = siblingCount * 2 + 5
  if (pageCount <= totalVisible) return Array.from({ length: pageCount }, (_, i) => i + 1)
  const leftSibling = Math.max(current - siblingCount, 1)
  const rightSibling = Math.min(current + siblingCount, pageCount)
  const showLeftEllipsis = leftSibling > 2
  const showRightEllipsis = rightSibling < pageCount - 1
  const range: Array<number | 'ellipsis'> = [1]
  if (showLeftEllipsis) range.push('ellipsis')
  for (let page = Math.max(leftSibling, 2); page <= Math.min(rightSibling, pageCount - 1); page++) range.push(page)
  if (showRightEllipsis) range.push('ellipsis')
  if (pageCount > 1) range.push(pageCount)
  return range
}

/** Creates a page-number navigator with previous/next controls and smart ellipsis collapsing. */
export function Pagination(options: PaginationOptions): PaginationElement {
  assertDom('Pagination')
  ensureComponentStyles('pagination', paginationCss)
  let page = options.page ?? options.defaultPage ?? 1
  let pageCount = options.pageCount
  const siblingCount = options.siblingCount ?? 1
  const onChange = options.onChange
  const cleanupListeners: Array<() => void> = []
  const root = el('div', px('pagination'))
  root.setAttribute('role', 'navigation')
  function goTo(newPage: number): void {
    page = Math.max(1, Math.min(pageCount, newPage))
    render()
    onChange?.(page)
  }
  function render(): void {
    root.replaceChildren()
    cleanupListeners.splice(0).forEach((fn) => fn())
    const prev = el('button', px('pagination-item'))
    prev.type = 'button'
    const prevIcon = Icon(icons.chevronLeft, 14)
    if (prevIcon) prev.appendChild(prevIcon)
    prev.disabled = page <= 1
    const prevListener = (): void => goTo(page - 1)
    prev.addEventListener('click', prevListener)
    cleanupListeners.push(() => prev.removeEventListener('click', prevListener))
    root.appendChild(prev)
    for (const entry of buildRange(page, pageCount, siblingCount)) {
      if (entry === 'ellipsis') {
        root.appendChild(el('span', px('pagination-ellipsis')))
        continue
      }
      const button = el('button', cx(px('pagination-item'), entry === page && px('pagination-item-active')))
      button.type = 'button'
      button.textContent = String(entry)
      const listener = (): void => goTo(entry)
      button.addEventListener('click', listener)
      cleanupListeners.push(() => button.removeEventListener('click', listener))
      root.appendChild(button)
    }
    const next = el('button', px('pagination-item'))
    next.type = 'button'
    const nextIcon = Icon(icons.chevronRight, 14)
    if (nextIcon) next.appendChild(nextIcon)
    next.disabled = page >= pageCount
    const nextListener = (): void => goTo(page + 1)
    next.addEventListener('click', nextListener)
    cleanupListeners.push(() => next.removeEventListener('click', nextListener))
    root.appendChild(next)
  }
  render()
  const api: PaginationApi = {
    getPage() {
      return page
    },
    setPage(newPage) {
      page = Math.max(1, Math.min(pageCount, newPage))
      render()
    },
    setPageCount(newPageCount) {
      pageCount = newPageCount
      render()
    },
    destroy() {
      cleanupListeners.splice(0).forEach((fn) => fn())
      root.remove()
    }
  }
  return attachController(root, api)
}