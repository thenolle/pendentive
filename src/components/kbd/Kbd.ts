import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { cx, px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'

/** Sizing preset of a `Kbd`. */
export type KbdSize = 'sm' | 'default'

/** Options accepted by the `Kbd` factory. */
export interface KbdOptions {
  /** Sizing preset. Defaults to `'default'`. */
  size?: KbdSize
}

/** The runtime control surface attached to every `Kbd` element. */
export interface KbdApi {
  /** Replaces the displayed key sequence. */
  setKeys: (keys: string | string[]) => void
  /** Detaches the element from the DOM. */
  destroy: () => void
}

/** A `Kbd` is a real `HTMLSpanElement` (wrapping one or more native `<kbd>` chips) extended with `KbdApi`. */
export type KbdElement = HTMLSpanElement & KbdApi

/** This component's own CSS, colocated and self-injected on first use. */
export const kbdCss = `
.pendentive-kbd-group { display: inline-flex; align-items: center; gap: 3px }
.pendentive-kbd { display: inline-flex; align-items: center; justify-content: center; min-width: 20px; height: 20px; padding: 0 6px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; font-weight: 500; line-height: 1; color: var(--pendentive-muted-foreground); background: var(--pendentive-muted); border: 1px solid var(--pendentive-border); border-bottom-width: 2px; border-radius: var(--pendentive-radius-sm) }
.pendentive-kbd-sm { min-width: 16px; height: 16px; padding: 0 4px; font-size: 10px }
.pendentive-kbd-separator { color: var(--pendentive-muted-foreground); font-size: 11px }
`

/** Creates a styled keyboard-shortcut hint -- pass `['Ctrl', 'K']` for a "+"-joined combo, or a single string for one key. */
export function Kbd(keys: string | string[], options: KbdOptions = {}): KbdElement {
  assertDom('Kbd')
  ensureComponentStyles('kbd', kbdCss)
  const size = options.size ?? 'default'
  const root = el('span', px('kbd-group'))
  function render(list: string[]): void {
    root.replaceChildren()
    list.forEach((key, index) => {
      if (index > 0) {
        const separator = el('span', px('kbd-separator'))
        separator.textContent = '+'
        root.appendChild(separator)
      }
      const kbd = document.createElement('kbd')
      kbd.className = cx(px('kbd'), size === 'sm' && px('kbd-sm'))
      kbd.textContent = key
      root.appendChild(kbd)
    })
  }
  render(Array.isArray(keys) ? keys : [keys])
  const api: KbdApi = {
    setKeys(newKeys) {
      render(Array.isArray(newKeys) ? newKeys : [newKeys])
    },
    destroy() {
      root.remove()
    }
  }
  return attachController(root, api)
}