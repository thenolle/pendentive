import { assertDom, el } from '../../core/dom'
import { px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { onClickOutside, onEscapeKey } from '../../core/overlay'
import { renderMenuEntries, menuCss } from './DropdownMenu'
import type { MenuEntry } from './DropdownMenu'
import type { Destroyable } from '../../core/types'

/** Options accepted by the `ContextMenu` factory. */
export interface ContextMenuOptions {
  /** The element that opens the menu on right-click. */
  target: HTMLElement
  /** The menu's items/separators. */
  items: MenuEntry[]
  /** Called when an enabled item is chosen. */
  onSelect?: (value: string) => void
}

/**
 * The runtime control surface returned by `ContextMenu`. This is a plain controller -- not
 * an element -- because it attaches behavior to an existing `target` rather than creating
 * a new one to place in your layout.
 */
export type ContextMenuApi = Destroyable

/** Replaces the native right-click menu on `target` with a styled `ContextMenu`. Shares `.linteau-menu` CSS with `DropdownMenu` -- the `menu` key dedupes. */
export function ContextMenu(options: ContextMenuOptions): ContextMenuApi {
  assertDom('ContextMenu')
  ensureComponentStyles('menu', menuCss)
  const { target } = options
  let unbindOutside: (() => void) | null = null
  let unbindEscape: (() => void) | null = null
  const menu = el('div', px('menu'))
  renderMenuEntries(menu, options.items, (value) => options.onSelect?.(value), close)
  menu.style.display = 'none'
  function close(): void {
    menu.style.display = 'none'
    menu.remove()
    unbindOutside?.()
    unbindOutside = null
    unbindEscape?.()
    unbindEscape = null
  }
  const contextListener = (event: MouseEvent): void => {
    event.preventDefault()
    document.body.appendChild(menu)
    menu.style.display = 'block'
    menu.style.position = 'fixed'
    menu.style.top = `${event.clientY}px`
    menu.style.left = `${event.clientX}px`
    unbindOutside = onClickOutside(menu, close)
    unbindEscape = onEscapeKey(close)
  }
  target.addEventListener('contextmenu', contextListener)
  return {
    destroy() {
      target.removeEventListener('contextmenu', contextListener)
      unbindOutside?.()
      unbindEscape?.()
      menu.remove()
    }
  }
}