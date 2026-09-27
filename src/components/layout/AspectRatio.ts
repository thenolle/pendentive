import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { fillContent } from '../../core/content'

/** Options accepted by the `AspectRatio` factory. */
export interface AspectRatioOptions {
  /** Width-to-height ratio, e.g. `16 / 9` or `1` for a square. Defaults to `16 / 9`. */
  ratio?: number
  /** The media/content to constrain -- typically an `<img>`, `<video>`, or iframe embed. */
  content: string | HTMLElement
}

/** The runtime control surface attached to every `AspectRatio` element. */
export interface AspectRatioApi {
  /** Changes the locked ratio. */
  setRatio: (ratio: number) => void
  /** Replaces the wrapped content. */
  setContent: (content: string | HTMLElement) => void
  /** Detaches the wrapper from the DOM. */
  destroy: () => void
}

/** An `AspectRatio` is a real `HTMLDivElement` extended with `AspectRatioApi`. */
export type AspectRatioElement = HTMLDivElement & AspectRatioApi

/** This component's own CSS, colocated and self-injected on first use. */
export const aspectRatioCss = `
.pendentive-aspect-ratio { position: relative; width: 100%; overflow: hidden; border-radius: var(--pendentive-radius-md) }
.pendentive-aspect-ratio-inner { width: 100%; height: 100% }
.pendentive-aspect-ratio-inner > * { width: 100%; height: 100%; object-fit: cover; display: block }
`

/** Creates a container that keeps its content at a fixed width-to-height ratio regardless of container width. */
export function AspectRatio(options: AspectRatioOptions): AspectRatioElement {
  assertDom('AspectRatio')
  ensureComponentStyles('aspect-ratio', aspectRatioCss)
  const root = el('div', px('aspect-ratio'))
  const inner = el('div', px('aspect-ratio-inner'))
  fillContent(inner, options.content)
  root.appendChild(inner)
  function setRatio(ratio: number): void {
    root.style.aspectRatio = String(ratio)
  }
  setRatio(options.ratio ?? 16 / 9)
  const api: AspectRatioApi = {
    setRatio,
    setContent(content) {
      fillContent(inner, content)
    },
    destroy() {
      root.remove()
    }
  }
  return attachController(root, api)
}