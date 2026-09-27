import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { cx, px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { onClickOutside, onEscapeKey, positionFloating } from '../../core/overlay'
import { renderMenuEntries, menuCss } from '../overlay/DropdownMenu'
import type { MenuEntry } from '../overlay/DropdownMenu'

/** A single top-level menu in a `Menubar`. */
export interface MenubarMenu {
  /** Trigger label, e.g. `'File'`. */
  label: string
  /** The dropdown's items/separators, reusing `DropdownMenu`'s `MenuEntry` shape. */
  items: MenuEntry[]
}

/** Options accepted by the `Menubar` factory. */
export interface MenubarOptions {
  /** The top-level menus, in display order. */
  menus: MenubarMenu[]
  /** Called when an enabled item in any menu is chosen, with the owning menu's index. */
  onSelect?: (menuIndex: number, value: string) => void
}

/** The runtime control surface attached to every `Menubar` element. */
export interface MenubarApi {
  /** Removes all listeners and detaches the menubar from the DOM. */
  destroy: () => void
}

/** A `Menubar` is a real `HTMLDivElement` extended with `MenubarApi`. */
export type MenubarElement = HTMLDivElement & MenubarApi

/** This component's own CSS. Reuses `.pendentive-menu` from `DropdownMenu` for its panels, so that CSS is imported and registered here too. */
export const menubarCss = `
.pendentive-menubar { display: inline-flex; align-items: center; gap: 2px; padding: 4px; background: var(--pendentive-card); border: 1px solid var(--pendentive-border); border-radius: var(--pendentive-radius-md) }
.pendentive-menubar-trigger { background: transparent; border: none; padding: 6px 10px; font-size: 12px; font-weight: 500; color: var(--pendentive-foreground); border-radius: var(--pendentive-radius-sm); cursor: pointer; font-family: inherit }
.pendentive-menubar-trigger:hover { background: var(--pendentive-accent) }
.pendentive-menubar-trigger-active { background: var(--pendentive-accent) }
`

/** Creates a horizontal app-style menu bar -- click a trigger to open its panel; while one panel is open, hovering another trigger switches to it (standard menubar behavior); arrow keys move between triggers. */
export function Menubar(options: MenubarOptions): MenubarElement {
  assertDom('Menubar')
  ensureComponentStyles('menu', menuCss)
  ensureComponentStyles('menubar', menubarCss)
  const root = el('div', px('menubar'))
  root.setAttribute('role', 'menubar')
  let openIndex = -1
  const triggers: HTMLButtonElement[] = []
  const panels: HTMLDivElement[] = []
  let unbindOutside: (() => void) | null = null
  let unbindEscape: (() => void) | null = null
  function closeAll(): void {
    if (openIndex === -1) return
    panels[openIndex]?.remove()
    triggers[openIndex]?.classList.remove(px('menubar-trigger-active'))
    openIndex = -1
    unbindOutside?.()
    unbindOutside = null
    unbindEscape?.()
    unbindEscape = null
  }
  function openMenu(index: number): void {
    if (openIndex === index) return
    closeAll()
    openIndex = index
    triggers[index]?.classList.add(px('menubar-trigger-active'))
    const panel = panels[index]
    const trigger = triggers[index]
    if (!panel || !trigger) return
    document.body.appendChild(panel)
    positionFloating(trigger, panel, 'bottom')
    unbindOutside = onClickOutside([root, panel], closeAll)
    unbindEscape = onEscapeKey(closeAll)
  }
  const cleanupFns: Array<() => void> = []
  options.menus.forEach((menuDef, index) => {
    const trigger = el('button', px('menubar-trigger'))
    trigger.type = 'button'
    trigger.textContent = menuDef.label
    trigger.setAttribute('role', 'menuitem')
    trigger.setAttribute('aria-haspopup', 'true')
    const panel = el('div', px('menu'))
    renderMenuEntries(panel, menuDef.items, (value) => options.onSelect?.(index, value), closeAll)
    const clickListener = (): void => (openIndex === index ? closeAll() : openMenu(index))
    const enterListener = (): void => { if (openIndex !== -1 && openIndex !== index) openMenu(index) }
    const keyListener = (event: KeyboardEvent): void => {
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        const next = (index + 1) % triggers.length
        triggers[next]?.focus()
        if (openIndex !== -1) openMenu(next)
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        const prev = (index - 1 + triggers.length) % triggers.length
        triggers[prev]?.focus()
        if (openIndex !== -1) openMenu(prev)
      } else if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        openMenu(index)
      }
    }
    trigger.addEventListener('click', clickListener)
    trigger.addEventListener('mouseenter', enterListener)
    trigger.addEventListener('keydown', keyListener)
    cleanupFns.push(() => {
      trigger.removeEventListener('click', clickListener)
      trigger.removeEventListener('mouseenter', enterListener)
      trigger.removeEventListener('keydown', keyListener)
    })
    triggers.push(trigger)
    panels.push(panel)
    root.appendChild(trigger)
  })
  const api: MenubarApi = {
    destroy() {
      closeAll()
      cleanupFns.forEach((fn) => fn())
      root.remove()
    }
  }
  return attachController(root, api)
}