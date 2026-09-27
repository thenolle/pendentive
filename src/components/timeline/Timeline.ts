import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { cx, px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { Icon } from '../../svg/Icon'
import { fillContent } from '../../core/content'
import type { IconInput } from '../../svg/types'

/** Visual style of a single `TimelineItem`'s marker dot. */
export type TimelineVariant = 'default' | 'success' | 'warning' | 'destructive'

/** A single entry rendered by `Timeline`. */
export interface TimelineItem {
  /** Primary label. */
  title: string
  /** Optional supporting text or markup. */
  description?: string | HTMLElement
  /** Optional right-aligned timestamp/label. */
  timestamp?: string
  /** Optional icon rendered inside the marker dot. */
  icon?: IconInput
  /** Marker color. Defaults to `'default'`. */
  variant?: TimelineVariant
}

/** Options accepted by the `Timeline` factory. */
export interface TimelineOptions {
  /** The events, in display order (top to bottom). */
  items: TimelineItem[]
}

/** The runtime control surface attached to every `Timeline` element. */
export interface TimelineApi {
  /** Replaces the full list of events. */
  setItems: (items: TimelineItem[]) => void
  /** Detaches the timeline from the DOM. */
  destroy: () => void
}

/** A `Timeline` is a real `HTMLDivElement` extended with `TimelineApi`. */
export type TimelineElement = HTMLDivElement & TimelineApi

/** This component's own CSS, colocated and self-injected on first use. */
export const timelineCss = `
.pendentive-timeline { display: flex; flex-direction: column }
.pendentive-timeline-row { display: flex; gap: 12px }
.pendentive-timeline-rail { display: flex; flex-direction: column; align-items: center; width: 24px; flex-shrink: 0 }
.pendentive-timeline-dot { width: 24px; height: 24px; border-radius: 50%; background: var(--pendentive-secondary); color: var(--pendentive-secondary-foreground); display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid var(--pendentive-border) }
.pendentive-timeline-dot-success { background: var(--pendentive-success); color: var(--pendentive-success-foreground); border-color: transparent }
.pendentive-timeline-dot-warning { background: var(--pendentive-warning); color: var(--pendentive-warning-foreground); border-color: transparent }
.pendentive-timeline-dot-destructive { background: var(--pendentive-destructive); color: var(--pendentive-destructive-foreground); border-color: transparent }
.pendentive-timeline-line { flex: 1; width: 2px; background: var(--pendentive-border); margin: 4px 0 }
.pendentive-timeline-row:last-child .pendentive-timeline-line { display: none }
.pendentive-timeline-content { padding-bottom: 20px; flex: 1; min-width: 0 }
.pendentive-timeline-header { display: flex; align-items: baseline; justify-content: space-between; gap: 8px }
.pendentive-timeline-title { font-size: 13px; font-weight: 600; color: var(--pendentive-foreground) }
.pendentive-timeline-timestamp { font-size: 11px; color: var(--pendentive-muted-foreground); white-space: nowrap }
.pendentive-timeline-description { font-size: 12px; color: var(--pendentive-muted-foreground); margin-top: 2px }
`

/** Creates a vertical timeline: a connected line of dated, iconable events. */
export function Timeline(options: TimelineOptions): TimelineElement {
  assertDom('Timeline')
  ensureComponentStyles('timeline', timelineCss)
  const root = el('div', px('timeline'))
  function render(items: TimelineItem[]): void {
    root.replaceChildren()
    items.forEach((item, index) => {
      const row = el('div', px('timeline-row'))
      const rail = el('div', px('timeline-rail'))
      const dot = el('div', cx(px('timeline-dot'), item.variant && item.variant !== 'default' && px(`timeline-dot-${item.variant}`)))
      if (item.icon) {
        const iconEl = Icon(item.icon, 12)
        if (iconEl) dot.appendChild(iconEl)
      }
      rail.appendChild(dot)
      if (index < items.length - 1) rail.appendChild(el('div', px('timeline-line')))
      const content = el('div', px('timeline-content'))
      const header = el('div', px('timeline-header'))
      const title = el('div', px('timeline-title'))
      title.textContent = item.title
      header.appendChild(title)
      if (item.timestamp) {
        const timestamp = el('span', px('timeline-timestamp'))
        timestamp.textContent = item.timestamp
        header.appendChild(timestamp)
      }
      content.appendChild(header)
      if (item.description) {
        const description = el('div', px('timeline-description'))
        fillContent(description, item.description)
        content.appendChild(description)
      }
      row.append(rail, content)
      root.appendChild(row)
    })
  }
  render(options.items)
  const api: TimelineApi = {
    setItems(items) {
      render(items)
    },
    destroy() {
      root.remove()
    }
  }
  return attachController(root, api)
}