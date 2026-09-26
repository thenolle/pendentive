import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { cx, px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { onClickOutside, onEscapeKey, positionFloating } from '../../core/overlay'
import type { FloatingPlacement } from '../../core/overlay'
import { Icon } from '../../svg/Icon'
import type { IconInput } from '../../svg/types'

/** A single actionable entry in a `DropdownMenu`/`ContextMenu`. */
export interface MenuItem {
  /** Visible label. */
  label: string
  /** Value passed to `onSelect` when this item is chosen. */
  value: string
  /** Optional icon rendered before the label. */
  icon?: IconInput
  /** Disables this item. Defaults to `false`. */
  disabled?: boolean
  /** Renders the item in the destructive color. Defaults to `false`. */
  destructive?: boolean
}

/** A visual divider between menu items. */
export interface MenuSeparator {
  separator: true
}

/** A single entry rendered by a menu -- either a selectable item or a separator. */
export type MenuEntry = MenuItem | MenuSeparator

function isSeparator(entry: MenuEntry): entry is MenuSeparator {
  return 'separator' in entry
}

/** Renders `entries` into `container`, wiring up click handling. Shared by `DropdownMenu` and `ContextMenu`. */
export function renderMenuEntries(container: HTMLElement, entries: MenuEntry[], onSelect: (value: string) => void, onAfterSelect: () => void): void {
  container.replaceChildren()
  for (const entry of entries) {
    if (isSeparator(entry)) {
      container.appendChild(el('div', px('menu-separator')))
      continue
    }
    const item = el('div', cx(px('menu-item'), entry.disabled && px('menu-item-disabled'), entry.destructive && px('menu-item-destructive')))
    if (entry.icon) item.appendChild(Icon(entry.icon, 14, { className: px('icon') })!)
    const label = document.createElement('span')
    label.textContent = entry.label
    item.appendChild(label)
    item.addEventListener('click', () => {
      if (entry.disabled) return
      onSelect(entry.value)
      onAfterSelect()
    })
    container.appendChild(item)
  }
}

/** Options accepted by the `DropdownMenu` factory. */
export interface DropdownMenuOptions {
  /** The element the menu is anchored to and toggled by. */
  anchor: HTMLElement
  /** The menu's items/separators. */
  items: MenuEntry[]
  /** Side of the anchor the menu appears on. Defaults to `'bottom'`. */
  placement?: FloatingPlacement
  /** Called when an enabled item is chosen. */
  onSelect?: (value: string) => void
}

/** The runtime control surface attached to every `DropdownMenu` element. */
export interface DropdownMenuApi {
  /** Opens the menu. */
  open: () => void
  /** Closes the menu. */
  close: () => void
  /** Toggles between open and closed. */
  toggle: () => void
  /** Returns whether the menu is currently open. */
  isOpen: () => boolean
  /** Replaces the full list of items/separators. */
  setItems: (items: MenuEntry[]) => void
  /** Removes all listeners and detaches the menu from the DOM. */
  destroy: () => void
}

/** A `DropdownMenu` is a real `HTMLDivElement` (the floating menu) extended with `DropdownMenuApi`. */
export type DropdownMenuElement = HTMLDivElement & DropdownMenuApi

/** This component's own CSS. Reused by `ContextMenu` under the same `menu` key, so it's only ever injected once. */
export const menuCss = `
.pendentive-menu { position: fixed; z-index: 1200; min-width: 160px; background: var(--pendentive-card); border: 1px solid var(--pendentive-border); border-radius: var(--pendentive-radius-md); padding: 4px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4) }
.pendentive-menu-item { display: flex; align-items: center; gap: 8px; padding: 7px 8px; border-radius: var(--pendentive-radius-sm); font-size: 12px; color: var(--pendentive-foreground); cursor: pointer }
.pendentive-menu-item:hover:not(.pendentive-menu-item-disabled) { background: var(--pendentive-accent) }
.pendentive-menu-item-disabled { opacity: 0.5; cursor: not-allowed }
.pendentive-menu-item-destructive { color: var(--pendentive-destructive) }
.pendentive-menu-separator { height: 1px; background: var(--pendentive-border); margin: 4px 0 }
`

/** Creates a floating action menu anchored to another element, toggled by clicking that anchor. */
export function DropdownMenu(options: DropdownMenuOptions): DropdownMenuElement {
  assertDom('DropdownMenu')
  ensureComponentStyles('menu', menuCss)
  const { anchor, placement = 'bottom' } = options
  let items = options.items
  let isOpen = false
  let unbindOutside: (() => void) | null = null
  let unbindEscape: (() => void) | null = null
  const menu = el('div', cx(px('menu'), px('hidden')))
  renderMenuEntries(menu, items, (value) => options.onSelect?.(value), close)
  function open(): void {
    if (isOpen) return
    isOpen = true
    document.body.appendChild(menu)
    menu.classList.remove(px('hidden'))
    positionFloating(anchor, menu, placement)
    unbindOutside = onClickOutside([anchor, menu], close)
    unbindEscape = onEscapeKey(close)
  }
  function close(): void {
    if (!isOpen) return
    isOpen = false
    menu.classList.add(px('hidden'))
    menu.remove()
    unbindOutside?.()
    unbindOutside = null
    unbindEscape?.()
    unbindEscape = null
  }
  function toggle(): void {
    if (isOpen) close()
    else open()
  }
  const anchorListener = (): void => toggle()
  anchor.addEventListener('click', anchorListener)
  const api: DropdownMenuApi = {
    open,
    close,
    toggle,
    isOpen() {
      return isOpen
    },
    setItems(newItems) {
      items = newItems
      renderMenuEntries(menu, items, (value) => options.onSelect?.(value), close)
    },
    destroy() {
      anchor.removeEventListener('click', anchorListener)
      unbindOutside?.()
      unbindEscape?.()
      menu.remove()
    }
  }
  return attachController(menu, api)
}