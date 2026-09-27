import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { cx, px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { Icon } from '../../svg/Icon'
import { icons } from '../../svg/icons/index'

/** Sort direction used by `Table`. */
export type SortDirection = 'asc' | 'desc'

/** Definition of a single `Table` column. */
export interface TableColumn<TRow> {
  /** Unique key, also used as the sort key passed to `onSortChange`. */
  key: string
  /** Header label. */
  header: string
  /** Allows this column's header to trigger sorting. Defaults to `false`. */
  sortable?: boolean
  /** Custom cell renderer; defaults to reading `row[key]` as a string if omitted. */
  render?: (row: TRow) => HTMLElement | string
}

/** Options accepted by the `Table` factory. */
export interface TableOptions<TRow> {
  /** Column definitions, in display order. */
  columns: Array<TableColumn<TRow>>
  /** The rows to render. */
  rows: TRow[]
  /** Derives a stable string id for a row; used only internally for key stability. */
  getRowId?: (row: TRow) => string
  /** Called when the user clicks a sortable header. */
  onSortChange?: (key: string, direction: SortDirection) => void
}

/** The runtime control surface attached to every `Table` element. */
export interface TableApi<TRow> {
  /** Replaces the rows shown, re-rendering the body. */
  setRows: (rows: TRow[]) => void
  /** Detaches the table from the DOM and its internal listeners. */
  destroy: () => void
}

/** A `Table` is a real `HTMLDivElement` (the scroll wrapper) extended with `TableApi`. */
export type TableElement<TRow> = HTMLDivElement & TableApi<TRow>

/** This component's own CSS, colocated and self-injected on first use. */
export const tableCss = `
.pendentive-table-wrap { width: 100%; overflow-x: auto; border: 1px solid var(--pendentive-border); border-radius: var(--pendentive-radius-lg) }
.pendentive-table { width: 100%; border-collapse: collapse; font-size: 12px }
.pendentive-table th { text-align: left; padding: 10px 12px; background: var(--pendentive-muted); color: var(--pendentive-muted-foreground); font-weight: 600; border-bottom: 1px solid var(--pendentive-border); cursor: default; white-space: nowrap }
.pendentive-table th.pendentive-table-sortable { cursor: pointer; user-select: none }
.pendentive-table td { padding: 10px 12px; border-bottom: 1px solid var(--pendentive-border); color: var(--pendentive-foreground) }
.pendentive-table tr:last-child td { border-bottom: none }
.pendentive-table-sort-icon { display: inline-block; margin-left: 4px; vertical-align: middle }
`

/** Creates a data table with optional click-to-sort headers and custom cell rendering. */
export function Table<TRow>(options: TableOptions<TRow>): TableElement<TRow> {
  assertDom('Table')
  ensureComponentStyles('table', tableCss)
  let rows = options.rows
  let sortKey: string | null = null
  let sortDirection: SortDirection = 'asc'
  const cleanupListeners: Array<() => void> = []
  const wrap = el('div', px('table-wrap'))
  const table = el('table', px('table'))
  const thead = document.createElement('thead')
  const tbody = document.createElement('tbody')
  function renderHead(): void {
    thead.replaceChildren()
    cleanupListeners.splice(0).forEach((fn) => fn())
    const headRow = document.createElement('tr')
    for (const column of options.columns) {
      const th = document.createElement('th')
      th.className = cx(column.sortable && px('table-sortable'))
      th.textContent = column.header
      if (column.sortable) {
        th.setAttribute('aria-sort', sortKey === column.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none')
        if (sortKey === column.key) {
          const sortIcon = Icon(sortDirection === 'asc' ? icons.chevronUp : icons.chevronDown, 12, { className: px('table-sort-icon') })
          if (sortIcon) th.appendChild(sortIcon)
        }
        const listener = (): void => {
          sortDirection = sortKey === column.key && sortDirection === 'asc' ? 'desc' : 'asc'
          sortKey = column.key
          renderHead()
          options.onSortChange?.(column.key, sortDirection)
        }
        th.addEventListener('click', listener)
        cleanupListeners.push(() => th.removeEventListener('click', listener))
      }
      headRow.appendChild(th)
    }
    thead.appendChild(headRow)
  }
  function renderBody(): void {
    tbody.replaceChildren()
    for (const row of rows) {
      const tr = document.createElement('tr')
      for (const column of options.columns) {
        const td = document.createElement('td')
        const content = column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? '')
        if (content instanceof HTMLElement) td.appendChild(content)
        else td.textContent = content
        tr.appendChild(td)
      }
      tbody.appendChild(tr)
    }
  }
  renderHead()
  renderBody()
  table.append(thead, tbody)
  wrap.appendChild(table)
  const api: TableApi<TRow> = {
    setRows(newRows) {
      rows = newRows
      renderBody()
    },
    destroy() {
      cleanupListeners.splice(0).forEach((fn) => fn())
      wrap.remove()
    }
  }
  return attachController(wrap, api)
}