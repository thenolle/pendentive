import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { cx, px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'

/** Options accepted by the `Separator` factory. */
export interface SeparatorOptions {
  /** Layout direction. Defaults to `'horizontal'`. */
  orientation?: 'horizontal' | 'vertical'
}

/** The runtime control surface attached to every `Separator` element. */
export interface SeparatorApi {
  /** Switches orientation, updating classes in place. */
  setOrientation: (orientation: 'horizontal' | 'vertical') => void
  /** Detaches the separator from the DOM. */
  destroy: () => void
}

/** A `Separator` is a real `HTMLHRElement` extended with `SeparatorApi`. */
export type SeparatorElement = HTMLHRElement & SeparatorApi

/** This component's own CSS, colocated and self-injected on first use. */
export const separatorCss = `
.socle-separator { background: var(--socle-border); border: none; flex-shrink: 0 }
.socle-separator-horizontal { width: 100%; height: 1px }
.socle-separator-vertical { width: 1px; height: 100% }
`

/** Creates a thin dividing line, horizontal or vertical. */
export function Separator(options: SeparatorOptions = {}): SeparatorElement {
  assertDom('Separator')
  ensureComponentStyles('separator', separatorCss)
  let orientation = options.orientation ?? 'horizontal'
  const hr = el('hr', cx(px('separator'), px(`separator-${orientation}`)))
  hr.setAttribute('role', 'separator')
  const api: SeparatorApi = {
    setOrientation(newOrientation) {
      hr.classList.remove(px(`separator-${orientation}`))
      orientation = newOrientation
      hr.classList.add(px(`separator-${orientation}`))
    },
    destroy() {
      hr.remove()
    }
  }
  return attachController(hr, api)
}