import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { cx, px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { Icon } from '../../svg/Icon'
import { icons } from '../../svg/icons/index'

/** Options accepted by the `Rating` factory. */
export interface RatingOptions {
  /** Number of stars. Defaults to `5`. */
  max?: number
  /** Controlled value. */
  value?: number
  /** Uncontrolled initial value, used only if `value` is omitted. Defaults to `0`. */
  defaultValue?: number
  /** Allows selecting/hovering half-star increments. Defaults to `false`. */
  allowHalf?: boolean
  /** Renders as a static, non-interactive display. Defaults to `false`. */
  readOnly?: boolean
  /** Disables interaction. Defaults to `false`. */
  disabled?: boolean
  /** Pixel size of each star. Defaults to `20`. */
  size?: number
  /** Called whenever the user picks a new value. */
  onChange?: (value: number) => void
}

/** The runtime control surface attached to every `Rating` element. */
export interface RatingApi {
  /** Returns the current value. */
  getValue: () => number
  /** Programmatically sets the value (does not trigger `onChange`). */
  setValue: (value: number) => void
  /** Enables/disables the control. */
  setDisabled: (disabled: boolean) => void
  /** Detaches the rating from the DOM and its internal listeners. */
  destroy: () => void
}

/** A `Rating` is a real `HTMLDivElement` extended with `RatingApi`. */
export type RatingElement = HTMLDivElement & RatingApi

/** This component's own CSS, colocated and self-injected on first use. */
export const ratingCss = `
.pendentive-rating { display: inline-flex; align-items: center; gap: 2px }
.pendentive-rating-item { position: relative; display: inline-flex; cursor: pointer; color: var(--pendentive-border) }
.pendentive-rating-item svg { display: block }
.pendentive-rating-item-fill { position: absolute; inset: 0; overflow: hidden; color: var(--pendentive-warning) }
.pendentive-rating-readonly .pendentive-rating-item { cursor: default }
.pendentive-rating-disabled { opacity: 0.5; pointer-events: none }
.pendentive-rating:focus-visible { outline: 2px solid var(--pendentive-ring); outline-offset: 2px; border-radius: 3px }
`

/** Creates a star rating input with hover preview, optional half-star precision, and full keyboard support. */
export function Rating(options: RatingOptions = {}): RatingElement {
  assertDom('Rating')
  ensureComponentStyles('rating', ratingCss)
  const max = options.max ?? 5
  const allowHalf = options.allowHalf ?? false
  const readOnly = options.readOnly ?? false
  let disabled = options.disabled ?? false
  const size = options.size ?? 20
  let value = options.value ?? options.defaultValue ?? 0
  let hoverValue: number | null = null
  const onChange = options.onChange
  const root = el('div', cx(px('rating'), readOnly && px('rating-readonly'), disabled && px('rating-disabled')))
  root.setAttribute('role', 'slider')
  root.setAttribute('aria-valuemin', '0')
  root.setAttribute('aria-valuemax', String(max))
  if (!readOnly && !disabled) root.tabIndex = 0
  const fills: HTMLDivElement[] = []
  for (let i = 1; i <= max; i++) {
    const item = el('div', px('rating-item'))
    const base = Icon(icons.star, size)!
    const fillWrap = el('div', px('rating-item-fill'))
    fillWrap.appendChild(Icon(icons.star, size)!)
    item.append(base, fillWrap)
    if (!readOnly && !disabled) {
      item.addEventListener('mousemove', (event) => {
        const rect = item.getBoundingClientRect()
        const isHalf = allowHalf && event.clientX - rect.left < rect.width / 2
        hoverValue = isHalf ? i - 0.5 : i
        render()
      })
      item.addEventListener('mouseleave', () => {
        hoverValue = null
        render()
      })
      item.addEventListener('click', (event) => {
        const rect = item.getBoundingClientRect()
        const isHalf = allowHalf && event.clientX - rect.left < rect.width / 2
        setValue(isHalf ? i - 0.5 : i)
      })
    }
    fills.push(fillWrap)
    root.appendChild(item)
  }
  function render(): void {
    const display = hoverValue ?? value
    fills.forEach((fillWrap, index) => {
      const starIndex = index + 1
      let percent = 0
      if (display >= starIndex) percent = 100
      else if (allowHalf && display >= starIndex - 0.5) percent = 50
      fillWrap.style.clipPath = `inset(0 ${100 - percent}% 0 0)`
    })
    root.setAttribute('aria-valuenow', String(value))
  }
  render()
  function setValue(newValue: number): void {
    value = newValue
    hoverValue = null
    render()
    onChange?.(value)
  }
  const keyListener = (event: KeyboardEvent): void => {
    if (readOnly || disabled) return
    const step = allowHalf ? 0.5 : 1
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault()
      setValue(Math.min(max, value + step))
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault()
      setValue(Math.max(0, value - step))
    }
  }
  root.addEventListener('keydown', keyListener)
  const api: RatingApi = {
    getValue() {
      return value
    },
    setValue(newValue) {
      value = newValue
      render()
    },
    setDisabled(newDisabled) {
      disabled = newDisabled
      root.classList.toggle(px('rating-disabled'), newDisabled)
    },
    destroy() {
      root.removeEventListener('keydown', keyListener)
      root.remove()
    }
  }
  return attachController(root, api)
}