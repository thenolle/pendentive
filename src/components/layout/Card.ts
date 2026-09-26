import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'

/** Options accepted by the `Card` factory. All slots are optional. */
export interface CardOptions {
  /** Content rendered in the header slot (a border-separated top strip). */
  header?: HTMLElement | string
  /** Content rendered in the footer slot (a border-separated bottom strip). */
  footer?: HTMLElement | string
}

/** The runtime control surface attached to every `Card` element. */
export interface CardApi {
  /** The main content container -- append anything here. */
  body: HTMLElement
  /** Replaces the header slot content (pass `null` to remove it). */
  setHeader: (content: HTMLElement | string | null) => void
  /** Replaces the footer slot content (pass `null` to remove it). */
  setFooter: (content: HTMLElement | string | null) => void
  /** Detaches the card from the DOM. */
  destroy: () => void
}

/** A `Card` is a real `HTMLDivElement` extended with `CardApi`. */
export type CardElement = HTMLDivElement & CardApi

/** This component's own CSS, colocated and self-injected on first use. */
export const cardCss = `
.socle-card { border: 1px solid var(--socle-border); border-radius: var(--socle-radius-lg); background: var(--socle-card); color: var(--socle-card-foreground); overflow: hidden }
.socle-card-header { padding: 14px 16px; border-bottom: 1px solid var(--socle-border); font-weight: 600 }
.socle-card-body { padding: 16px }
.socle-card-footer { padding: 12px 16px; border-top: 1px solid var(--socle-border) }
`

/** Creates a bordered, sectioned surface with optional header/footer slots and a body you fill freely. */
export function Card(options: CardOptions = {}): CardElement {
  assertDom('Card')
  ensureComponentStyles('card', cardCss)
  const root = el('div', px('card'))
  const headerEl = el('div', px('card-header'))
  const body = el('div', px('card-body'))
  const footerEl = el('div', px('card-footer'))
  function fill(target: HTMLElement, content: HTMLElement | string | null): void {
    target.replaceChildren()
    if (content instanceof HTMLElement) target.appendChild(content)
    else if (typeof content === 'string') target.textContent = content
  }
  function syncVisibility(target: HTMLElement, content: HTMLElement | string | null): void {
    target.style.display = content == null ? 'none' : ''
  }
  fill(headerEl, options.header ?? null)
  fill(footerEl, options.footer ?? null)
  syncVisibility(headerEl, options.header ?? null)
  syncVisibility(footerEl, options.footer ?? null)
  root.append(headerEl, body, footerEl)
  const api: CardApi = {
    body,
    setHeader(content) {
      fill(headerEl, content)
      syncVisibility(headerEl, content)
    },
    setFooter(content) {
      fill(footerEl, content)
      syncVisibility(footerEl, content)
    },
    destroy() {
      root.remove()
    }
  }
  return attachController(root, api)
}