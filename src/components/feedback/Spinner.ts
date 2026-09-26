import { assertDom } from '../../core/dom'
import { attachController } from '../../core/controller'
import { px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { Icon } from '../../svg/Icon'
import { icons } from '../../svg/icons/index'

/** Options accepted by the `Spinner` factory. */
export interface SpinnerOptions {
  /** Pixel size of the spinner. Defaults to `16`. */
  size?: number
  /** Stroke/text color. Defaults to `'currentColor'` via the icon's default. */
  color?: string
}

/** The runtime control surface attached to every `Spinner` element. */
export interface SpinnerApi {
  /** Resizes the spinner in place. */
  setSize: (size: number) => void
  /** Detaches the spinner from the DOM. */
  destroy: () => void
}

/** A `Spinner` is a real `SVGSVGElement` extended with `SpinnerApi`. */
export type SpinnerElement = SVGSVGElement & SpinnerApi

/** This component's own CSS, colocated and self-injected on first use. */
export const spinnerCss = `
.linteau-spinner { animation: linteau-spin 0.8s linear infinite; color: var(--linteau-muted-foreground) }
@keyframes linteau-spin { to { transform: rotate(360deg) } }
`

/** Creates a small, continuously rotating loading indicator. */
export function Spinner(options: SpinnerOptions = {}): SpinnerElement {
  assertDom('Spinner')
  ensureComponentStyles('spinner', spinnerCss)
  const size = options.size ?? 16
  const svg = Icon(icons.loader, size, { className: px('spinner'), color: options.color })!
  const api: SpinnerApi = {
    setSize(newSize) {
      svg.setAttribute('width', String(newSize))
      svg.setAttribute('height', String(newSize))
    },
    destroy() {
      svg.remove()
    }
  }
  return attachController(svg as unknown as HTMLElement, api) as unknown as SpinnerElement
}