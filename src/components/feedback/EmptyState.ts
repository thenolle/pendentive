import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { Icon } from '../../svg/Icon'
import type { IconInput } from '../../svg/types'

/** Options accepted by the `EmptyState` factory. */
export interface EmptyStateOptions {
  /** Icon shown in a soft circular badge above the title. */
  icon?: IconInput
  /** Primary heading, e.g. `'No results found'`. */
  title: string
  /** Supporting explanation text. */
  description?: string
  /** Optional call-to-action element, typically a `Button()` instance (e.g. "Create your first project"). */
  action?: HTMLElement
}

/** The runtime control surface attached to every `EmptyState` element. */
export interface EmptyStateApi {
  /** Updates the heading text. */
  setTitle: (title: string) => void
  /** Updates the description text. */
  setDescription: (description: string) => void
  /** Detaches the placeholder from the DOM. */
  destroy: () => void
}

/** An `EmptyState` is a real `HTMLDivElement` extended with `EmptyStateApi`. */
export type EmptyStateElement = HTMLDivElement & EmptyStateApi

/** This component's own CSS, colocated and self-injected on first use. */
export const emptyStateCss = `
.pendentive-empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 6px; padding: 40px 24px; color: var(--pendentive-muted-foreground) }
.pendentive-empty-state-icon { width: 44px; height: 44px; border-radius: 50%; background: var(--pendentive-muted); display: flex; align-items: center; justify-content: center; color: var(--pendentive-muted-foreground); margin-bottom: 6px }
.pendentive-empty-state-title { font-size: 14px; font-weight: 600; color: var(--pendentive-foreground) }
.pendentive-empty-state-description { font-size: 12px; max-width: 320px }
.pendentive-empty-state-action { margin-top: 10px }
`

/** Creates a consistent icon + title + description + optional action placeholder for empty lists, tables, or search results. */
export function EmptyState(options: EmptyStateOptions): EmptyStateElement {
  assertDom('EmptyState')
  ensureComponentStyles('empty-state', emptyStateCss)
  const root = el('div', px('empty-state'))
  if (options.icon) {
    const iconWrap = el('div', px('empty-state-icon'))
    const iconEl = Icon(options.icon, 20)
    if (iconEl) iconWrap.appendChild(iconEl)
    root.appendChild(iconWrap)
  }
  const titleEl = el('div', px('empty-state-title'))
  titleEl.textContent = options.title
  root.appendChild(titleEl)
  const descriptionEl = el('div', px('empty-state-description'))
  descriptionEl.textContent = options.description ?? ''
  root.appendChild(descriptionEl)
  if (options.action) {
    const actionWrap = el('div', px('empty-state-action'))
    actionWrap.appendChild(options.action)
    root.appendChild(actionWrap)
  }
  const api: EmptyStateApi = {
    setTitle(title) {
      titleEl.textContent = title
    },
    setDescription(description) {
      descriptionEl.textContent = description
    },
    destroy() {
      root.remove()
    }
  }
  return attachController(root, api)
}