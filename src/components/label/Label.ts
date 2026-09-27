import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { cx, px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { Icon } from '../../svg/Icon'
import type { IconInput } from '../../svg/types'

/**
 * Options accepted by the `Label` factory.
 *
 * Every field component in this library (`TextField`, `NumberField`, `Select`, ...) currently
 * builds its own `div > span` for a caption, which is only *visually* a label -- clicking it
 * doesn't focus the associated control, and screen readers get no native label/control
 * relationship. `Label` is a real `<label>` you can pass `htmlFor` an input's `id`, closing that gap.
 */
export interface LabelOptions {
  /** The `id` of the form control this label describes. Enables click-to-focus and proper a11y association. */
  htmlFor?: string
  /** Optional icon rendered before the text. */
  icon?: IconInput
  /** Shows a required-field asterisk. Defaults to `false`. */
  required?: boolean
  /** Renders in a muted, non-interactive style, mirroring the associated control's disabled state. Defaults to `false`. */
  disabled?: boolean
}

/** The runtime control surface attached to every `Label` element. */
export interface LabelApi {
  /** Updates the visible text. */
  setText: (text: string) => void
  /** Toggles the required-field asterisk. */
  setRequired: (required: boolean) => void
  /** Toggles the disabled visual style. */
  setDisabled: (disabled: boolean) => void
  /** Detaches the label from the DOM. */
  destroy: () => void
}

/** A `Label` is a real `HTMLLabelElement` extended with `LabelApi`. */
export type LabelElement = HTMLLabelElement & LabelApi

/** This component's own CSS, colocated and self-injected on first use. */
export const labelCss = `
.pendentive-label { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; color: var(--pendentive-foreground); user-select: none }
.pendentive-label-required::after { content: '*'; color: var(--pendentive-destructive); margin-left: 2px }
.pendentive-label-disabled { opacity: 0.5; cursor: not-allowed }
`

/** Creates a real, semantically-associated `<label>` -- clicking it focuses the control referenced by `htmlFor`. */
export function Label(text: string, options: LabelOptions = {}): LabelElement {
  assertDom('Label')
  ensureComponentStyles('label', labelCss)
  let required = options.required ?? false
  let disabled = options.disabled ?? false
  const root = el('label', px('label'))
  if (options.htmlFor) root.htmlFor = options.htmlFor
  if (options.icon) root.appendChild(Icon(options.icon, 14, { className: px('icon') })!)
  const textEl = document.createElement('span')
  textEl.textContent = text
  root.appendChild(textEl)
  function render(): void {
    root.classList.toggle(px('label-required'), required)
    root.classList.toggle(px('label-disabled'), disabled)
  }
  render()
  const api: LabelApi = {
    setText(newText) {
      textEl.textContent = newText
    },
    setRequired(value) {
      required = value
      render()
    },
    setDisabled(value) {
      disabled = value
      render()
    },
    destroy() {
      root.remove()
    }
  }
  return attachController(root, api)
}