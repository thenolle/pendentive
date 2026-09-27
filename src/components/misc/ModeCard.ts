import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { Icon } from '../../svg/Icon'
import { icons } from '../../svg/icons/index'
import type { IconInput } from '../../svg/types'

/** Options accepted by the `ModeCard` factory. */
export interface ModeCardOptions {
  /** Title text. */
  label: string
  /** Description text, hidden and replaced by a lock message when `locked` is `true`. */
  description: string
  /** Icon shown at the top of the card (replaced by a lock icon when `locked`). */
  icon: IconInput
  /** Disables selection and shows a lock icon/message. Defaults to `false`. */
  locked?: boolean
  /** Message shown instead of `description` when locked. Defaults to `'Coming in the next update'`. */
  lockedMessage?: string
  /** Initial selected visual state. Defaults to `false`. */
  selected?: boolean
  /** Called when the (unlocked) card is clicked. */
  onSelect?: () => void
}

/** The runtime control surface attached to every `ModeCard` element. */
export interface ModeCardApi {
  /** Returns whether the card is currently marked as selected. */
  isSelected: () => boolean
  /** Programmatically toggles the selected visual state. */
  setSelected: (selected: boolean) => void
  /** Programmatically locks/unlocks the card. */
  setLocked: (locked: boolean) => void
  /** Detaches the card from the DOM and its internal listener. */
  destroy: () => void
}

/** A `ModeCard` is a real `HTMLButtonElement` extended with `ModeCardApi`. */
export type ModeCardElement = HTMLButtonElement & ModeCardApi

/** This component's own CSS, colocated and self-injected on first use. */
export const modeCardCss = `
.pendentive-mode-card { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; padding: 14px; background: var(--pendentive-card); border: 1px solid var(--pendentive-border); border-radius: var(--pendentive-radius-lg); color: var(--pendentive-foreground); cursor: pointer; text-align: left; font-family: inherit; transition: border-color 120ms ease, transform 120ms ease }
.pendentive-mode-card:hover:not(.pendentive-locked) { border-color: var(--pendentive-ring); transform: translateY(-2px) }
.pendentive-mode-card.pendentive-selected { border-color: var(--pendentive-primary); box-shadow: 0 0 0 1px var(--pendentive-primary) }
.pendentive-mode-card.pendentive-locked { opacity: 0.45; cursor: not-allowed }
.pendentive-mode-card-icon { color: var(--pendentive-foreground) }
.pendentive-mode-card-text { display: flex; flex-direction: column; gap: 2px }
.pendentive-mode-card-title { font-weight: 600; font-size: 13px }
.pendentive-mode-card-description { font-size: 11px; color: var(--pendentive-muted-foreground) }
`

/** Creates a selectable, optionally lockable option card -- typically used in mode/menu pickers. */
export function ModeCard(options: ModeCardOptions): ModeCardElement {
  assertDom('ModeCard')
  ensureComponentStyles('mode-card', modeCardCss)
  let locked = options.locked ?? false
  let selected = options.selected ?? false
  const lockedMessage = options.lockedMessage ?? 'Coming in the next update'
  const root = el('button', px('mode-card'))
  root.type = 'button'
  root.setAttribute('role', 'button')
  const iconWrap = el('div', px('mode-card-icon'))
  const textWrap = el('div', px('mode-card-text'))
  const titleEl = el('div', px('mode-card-title'))
  titleEl.textContent = options.label
  const descEl = el('div', px('mode-card-description'))
  textWrap.append(titleEl, descEl)
  function render(): void {
    iconWrap.replaceChildren()
    const iconEl = Icon(locked ? icons.lock : options.icon, 20, { className: px('icon') })
    if (iconEl) iconWrap.appendChild(iconEl)
    descEl.textContent = locked ? lockedMessage : options.description
    root.classList.toggle(px('locked'), locked)
    root.classList.toggle(px('selected'), selected)
    root.disabled = locked
    root.setAttribute('aria-pressed', String(selected))
    root.setAttribute('aria-disabled', String(locked))
  }
  render()
  root.append(iconWrap, textWrap)
  const listener = (): void => {
    if (locked) return
    options.onSelect?.()
  }
  root.addEventListener('click', listener)
  const api: ModeCardApi = {
    isSelected() {
      return selected
    },
    setSelected(value) {
      selected = value
      render()
    },
    setLocked(value) {
      locked = value
      render()
    },
    destroy() {
      root.removeEventListener('click', listener)
      root.remove()
    }
  }
  return attachController(root, api)
}