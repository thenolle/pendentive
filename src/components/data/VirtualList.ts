import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'

/** Options accepted by the `VirtualList` factory. */
export interface VirtualListOptions<TItem> {
  /** The full dataset -- can be arbitrarily large; only visible rows are ever mounted. */
  items: TItem[]
  /** Fixed pixel height of every row. */
  itemHeight: number
  /** Visible viewport height, as a pixel number or any CSS length. */
  height: number | string
  /** Renders a single row's content. Called only for rows currently in (or near) the viewport. */
  renderItem: (item: TItem, index: number) => HTMLElement
  /** Extra rows kept mounted above/below the visible range, smoothing fast scrolls. Defaults to `4`. */
  overscan?: number
}

/** The runtime control surface attached to every `VirtualList` element. */
export interface VirtualListApi<TItem> {
  /** Replaces the dataset and re-renders the visible window. */
  setItems: (items: TItem[]) => void
  /** Scrolls so that `index` is at the top of the viewport. */
  scrollToIndex: (index: number) => void
  /** Detaches the list from the DOM and its internal listeners. */
  destroy: () => void
}

/** A `VirtualList` is a real `HTMLDivElement` (the scroll viewport) extended with `VirtualListApi`. */
export type VirtualListElement<TItem> = HTMLDivElement & VirtualListApi<TItem>

/** This component's own CSS, colocated and self-injected on first use. */
export const virtualListCss = `
.pendentive-virtual-list { overflow-y: auto; position: relative }
.pendentive-virtual-list-spacer { position: relative; width: 100% }
.pendentive-virtual-list-row { position: absolute; left: 0; right: 0 }
`

/**
 * Creates a scrollable list that only mounts the rows currently near the viewport, regardless of
 * how large `items` is -- the missing piece `List`/`Table`/`Tree` don't cover, since those render
 * every row up front and start to choke well before a few thousand items.
 */
export function VirtualList<TItem>(options: VirtualListOptions<TItem>): VirtualListElement<TItem> {
  assertDom('VirtualList')
  ensureComponentStyles('virtual-list', virtualListCss)
  let items = options.items
  const itemHeight = options.itemHeight
  const overscan = options.overscan ?? 4
  const renderItem = options.renderItem
  const root = el('div', px('virtual-list'))
  root.style.height = typeof options.height === 'number' ? `${options.height}px` : options.height
  const spacer = el('div', px('virtual-list-spacer'))
  root.appendChild(spacer)
  const rowPool = new Map<number, HTMLElement>()
  function renderVisible(): void {
    const scrollTop = root.scrollTop
    const viewportHeight = root.clientHeight
    const total = items.length
    spacer.style.height = `${total * itemHeight}px`
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(total - 1, Math.ceil((scrollTop + viewportHeight) / itemHeight) + overscan)
    for (const [index, rowEl] of rowPool) {
      if (index < startIndex || index > endIndex) {
        rowEl.remove()
        rowPool.delete(index)
      }
    }
    for (let index = startIndex; index <= endIndex; index++) {
      if (rowPool.has(index)) continue
      const rowEl = el('div', px('virtual-list-row'))
      rowEl.style.top = `${index * itemHeight}px`
      rowEl.style.height = `${itemHeight}px`
      const item = items[index]
      if (item === undefined) continue
      rowEl.appendChild(renderItem(item, index))
      spacer.appendChild(rowEl)
      rowPool.set(index, rowEl)
    }
  }
  renderVisible()
  const scrollListener = (): void => renderVisible()
  root.addEventListener('scroll', scrollListener)
  const resizeObserver = new ResizeObserver(() => renderVisible())
  resizeObserver.observe(root)
  const api: VirtualListApi<TItem> = {
    setItems(newItems) {
      items = newItems
      rowPool.forEach((rowEl) => rowEl.remove())
      rowPool.clear()
      renderVisible()
    },
    scrollToIndex(index) {
      root.scrollTop = index * itemHeight
      renderVisible()
    },
    destroy() {
      root.removeEventListener('scroll', scrollListener)
      resizeObserver.disconnect()
      root.remove()
    }
  }
  return attachController(root, api)
}