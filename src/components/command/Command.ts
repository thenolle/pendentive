import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { cx, px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { onEscapeKey, lockBodyScroll } from '../../core/overlay'
import { Icon } from '../../svg/Icon'
import { icons } from '../../svg/icons/index'
import type { IconInput } from '../../svg/types'

/** A single selectable entry in a `Command` palette. */
export interface CommandItem {
  /** Visible label. */
  label: string
  /** Value passed to `onSelect` when this item is chosen. */
  value: string
  /** Optional icon rendered before the label. */
  icon?: IconInput
  /** Extra terms matched against the search query, alongside `label`. */
  keywords?: string[]
  /** Disables this item. Defaults to `false`. */
  disabled?: boolean
}

/** A labeled cluster of `CommandItem`s within the palette. */
export interface CommandGroup {
  /** Optional heading shown above this group's items. */
  heading?: string
  /** The items in this group. */
  items: CommandItem[]
}

/** Options accepted by the `Command` factory. */
export interface CommandOptions {
  /** The groups of selectable items. */
  groups?: CommandGroup[]
  /** Placeholder shown in the search input. Defaults to `'Type a command or search...'`. */
  placeholder?: string
  /** Text shown when no items match the query. Defaults to `'No results found.'`. */
  emptyText?: string
  /** Closes the palette after a selection is made. Defaults to `true`. */
  closeOnSelect?: boolean
  /** Called when an enabled item is chosen. */
  onSelect?: (value: string) => void
}

/** The runtime control surface attached to every `Command` element. */
export interface CommandApi {
  /** Opens the palette, locks scroll, and focuses the search input. */
  open: () => void
  /** Closes the palette. */
  close: () => void
  /** Toggles between open and closed. */
  toggle: () => void
  /** Returns whether the palette is currently open. */
  isOpen: () => boolean
  /** Replaces the full list of groups. */
  setGroups: (groups: CommandGroup[]) => void
  /** Removes all listeners and detaches the palette from the DOM. */
  destroy: () => void
}

/** A `Command` is a real `HTMLDivElement` (the overlay) extended with `CommandApi`. */
export type CommandElement = HTMLDivElement & CommandApi

/** This component's own CSS, colocated and self-injected on first use. */
export const commandCss = `
.linteau-command-overlay { position: fixed; inset: 0; background: color-mix(in oklch, black 60%, transparent); display: flex; align-items: flex-start; justify-content: center; padding-top: 15vh; z-index: 1500; backdrop-filter: blur(4px) }
.linteau-command-panel { width: min(560px, 92vw); max-height: 60vh; display: flex; flex-direction: column; background: var(--linteau-card); border: 1px solid var(--linteau-border); border-radius: var(--linteau-radius-lg); box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); overflow: hidden }
.linteau-command-input-wrap { display: flex; align-items: center; gap: 8px; padding: 12px 14px; border-bottom: 1px solid var(--linteau-border) }
.linteau-command-input { flex: 1; background: transparent; border: none; outline: none; color: var(--linteau-foreground); font-size: 14px; font-family: inherit }
.linteau-command-list { overflow-y: auto; padding: 6px; flex: 1 }
.linteau-command-group-heading { padding: 6px 8px 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--linteau-muted-foreground) }
.linteau-command-item { display: flex; align-items: center; gap: 8px; padding: 8px; border-radius: var(--linteau-radius-sm); font-size: 13px; color: var(--linteau-foreground); cursor: pointer }
.linteau-command-item-highlighted { background: var(--linteau-accent) }
.linteau-command-item-disabled { opacity: 0.5; cursor: not-allowed }
.linteau-command-empty { padding: 24px; text-align: center; font-size: 12px; color: var(--linteau-muted-foreground) }
`

/**
 * Creates a full-screen command palette: a search input backed by a live-filtered,
 * grouped, keyboard-navigable list -- opened on demand (bind it to a keyboard shortcut
 * like Cmd/Ctrl+K in your app).
 */
export function Command(options: CommandOptions = {}): CommandElement {
  assertDom('Command')
  ensureComponentStyles('command', commandCss)
  let groups = options.groups ?? []
  const closeOnSelect = options.closeOnSelect ?? true
  const onSelect = options.onSelect
  let query = ''
  let highlighted = 0
  let isOpen = false
  let unlockScroll: (() => void) | null = null
  let unbindEscape: (() => void) | null = null
  const overlay = el('div', cx(px('command-overlay'), px('hidden')))
  const panel = el('div', px('command-panel'))
  panel.setAttribute('role', 'dialog')
  panel.setAttribute('aria-modal', 'true')
  const inputWrap = el('div', px('command-input-wrap'))
  const searchIcon = Icon(icons.search, 14, { className: px('icon') })
  if (searchIcon) inputWrap.appendChild(searchIcon)
  const input = el('input', px('command-input'))
  input.type = 'text'
  input.placeholder = options.placeholder ?? 'Type a command or search...'
  inputWrap.appendChild(input)
  const list = el('div', px('command-list'))
  panel.append(inputWrap, list)
  overlay.appendChild(panel)

  function filteredFlat(): CommandItem[] {
    const normalized = query.trim().toLowerCase()
    const all = groups.flatMap((group) => group.items)
    if (!normalized) return all
    return all.filter((item) => item.label.toLowerCase().includes(normalized) || item.keywords?.some((k) => k.toLowerCase().includes(normalized)))
  }

  function renderList(): void {
    list.replaceChildren()
    const normalized = query.trim().toLowerCase()
    const flat = filteredFlat()
    if (flat.length === 0) {
      const empty = el('div', px('command-empty'))
      empty.textContent = options.emptyText ?? 'No results found.'
      list.appendChild(empty)
      return
    }
    let runningIndex = 0
    for (const group of groups) {
      const matchingItems = group.items.filter((item) => !normalized || item.label.toLowerCase().includes(normalized) || item.keywords?.some((k) => k.toLowerCase().includes(normalized)))
      if (matchingItems.length === 0) continue
      if (group.heading) {
        const heading = el('div', px('command-group-heading'))
        heading.textContent = group.heading
        list.appendChild(heading)
      }
      for (const item of matchingItems) {
        const index = runningIndex++
        const itemEl = el('div', cx(px('command-item'), index === highlighted && px('command-item-highlighted'), item.disabled && px('command-item-disabled')))
        if (item.icon) itemEl.appendChild(Icon(item.icon, 14, { className: px('icon') })!)
        const label = document.createElement('span')
        label.textContent = item.label
        itemEl.appendChild(label)
        itemEl.addEventListener('mousedown', (event) => {
          event.preventDefault()
          selectItem(item)
        })
        itemEl.addEventListener('mouseenter', () => {
          highlighted = index
          renderList()
        })
        list.appendChild(itemEl)
      }
    }
  }

  function selectItem(item: CommandItem): void {
    if (item.disabled) return
    onSelect?.(item.value)
    if (closeOnSelect) close()
  }

  function handleKeydown(event: KeyboardEvent): void {
    const flat = filteredFlat()
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      highlighted = Math.min(highlighted + 1, flat.length - 1)
      renderList()
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      highlighted = Math.max(highlighted - 1, 0)
      renderList()
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const item = flat[highlighted]
      if (item) selectItem(item)
    }
  }

  const inputListener = (): void => {
    query = input.value
    highlighted = 0
    renderList()
  }
  input.addEventListener('input', inputListener)
  input.addEventListener('keydown', handleKeydown)
  const backdropListener = (event: MouseEvent): void => {
    if (event.target === overlay) close()
  }
  overlay.addEventListener('mousedown', backdropListener)

  function open(): void {
    if (isOpen) return
    isOpen = true
    query = ''
    highlighted = 0
    input.value = ''
    overlay.classList.remove(px('hidden'))
    renderList()
    unlockScroll = lockBodyScroll()
    unbindEscape = onEscapeKey(close)
    input.focus()
  }
  function close(): void {
    if (!isOpen) return
    isOpen = false
    overlay.classList.add(px('hidden'))
    unlockScroll?.()
    unlockScroll = null
    unbindEscape?.()
    unbindEscape = null
  }
  function toggle(): void {
    if (isOpen) close()
    else open()
  }
  const api: CommandApi = {
    open,
    close,
    toggle,
    isOpen() {
      return isOpen
    },
    setGroups(newGroups) {
      groups = newGroups
      renderList()
    },
    destroy() {
      input.removeEventListener('input', inputListener)
      input.removeEventListener('keydown', handleKeydown)
      overlay.removeEventListener('mousedown', backdropListener)
      unlockScroll?.()
      unbindEscape?.()
      overlay.remove()
    }
  }
  return attachController(overlay, api)
}