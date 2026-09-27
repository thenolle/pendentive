import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { cx, px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { fillContent } from '../../core/content'
import { Icon } from '../../svg/Icon'
import { icons } from '../../svg/icons/index'

/** A single slide rendered by `Carousel`. */
export interface CarouselSlide {
  /** The slide's content. */
  content: string | HTMLElement
}

/** Options accepted by the `Carousel` factory. */
export interface CarouselOptions {
  /** The slides, in display order. */
  slides: CarouselSlide[]
  /** Wraps from the last slide back to the first (and vice versa). Defaults to `false`. */
  loop?: boolean
  /** Auto-advance interval in ms. `0`/omitted disables autoplay; pauses on hover. */
  autoplayMs?: number
  /** Shows prev/next arrow buttons. Defaults to `true`. */
  showArrows?: boolean
  /** Shows clickable position dots. Defaults to `true`. */
  showDots?: boolean
  /** Called whenever the active slide changes, by any means (arrows, dots, swipe, autoplay). */
  onSlideChange?: (index: number) => void
}

/** The runtime control surface attached to every `Carousel` element. */
export interface CarouselApi {
  /** Advances to the next slide. */
  next: () => void
  /** Returns to the previous slide. */
  prev: () => void
  /** Jumps to a specific slide index. */
  goTo: (index: number) => void
  /** Returns the currently active slide index. */
  getIndex: () => number
  /** Detaches the carousel from the DOM and its internal listeners. */
  destroy: () => void
}

/** A `Carousel` is a real `HTMLDivElement` extended with `CarouselApi`. */
export type CarouselElement = HTMLDivElement & CarouselApi

/** This component's own CSS, colocated and self-injected on first use. Uses native scroll-snap so touch/trackpad swipe works for free. */
export const carouselCss = `
.pendentive-carousel { position: relative; overflow: hidden; border-radius: var(--pendentive-radius-lg) }
.pendentive-carousel-track { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; scroll-behavior: smooth; scrollbar-width: none; -ms-overflow-style: none }
.pendentive-carousel-track::-webkit-scrollbar { display: none }
.pendentive-carousel-slide { flex: 0 0 100%; scroll-snap-align: start; min-width: 0 }
.pendentive-carousel-arrow { position: absolute; top: 50%; transform: translateY(-50%); background: var(--pendentive-card); border: 1px solid var(--pendentive-border); color: var(--pendentive-foreground); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) }
.pendentive-carousel-arrow:hover { background: var(--pendentive-accent) }
.pendentive-carousel-arrow:disabled { opacity: 0.35; cursor: not-allowed }
.pendentive-carousel-arrow-prev { left: 8px }
.pendentive-carousel-arrow-next { right: 8px }
.pendentive-carousel-dots { position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); display: flex; gap: 6px }
.pendentive-carousel-dot { width: 6px; height: 6px; border-radius: 999px; background: color-mix(in oklch, var(--pendentive-foreground) 30%, transparent); border: none; cursor: pointer; padding: 0; transition: background 120ms ease, width 120ms ease }
.pendentive-carousel-dot-active { background: var(--pendentive-foreground); width: 16px }
`

/** Creates a swipeable, scroll-snap-based carousel with optional arrows, dots, and autoplay. */
export function Carousel(options: CarouselOptions): CarouselElement {
  assertDom('Carousel')
  ensureComponentStyles('carousel', carouselCss)
  const loop = options.loop ?? false
  const onSlideChange = options.onSlideChange
  let index = 0
  let autoplayTimer: ReturnType<typeof setInterval> | null = null
  const root = el('div', px('carousel'))
  const track = el('div', px('carousel-track'))
  const slideEls = options.slides.map((slide) => {
    const slideEl = el('div', px('carousel-slide'))
    fillContent(slideEl, slide.content)
    track.appendChild(slideEl)
    return slideEl
  })
  root.appendChild(track)
  let prevButton: HTMLButtonElement | null = null
  let nextButton: HTMLButtonElement | null = null
  if (options.showArrows ?? true) {
    prevButton = el('button', cx(px('carousel-arrow'), px('carousel-arrow-prev')))
    prevButton.type = 'button'
    prevButton.setAttribute('aria-label', 'Previous slide')
    const prevIcon = Icon(icons.chevronLeft, 16)
    if (prevIcon) prevButton.appendChild(prevIcon)
    nextButton = el('button', cx(px('carousel-arrow'), px('carousel-arrow-next')))
    nextButton.type = 'button'
    nextButton.setAttribute('aria-label', 'Next slide')
    const nextIcon = Icon(icons.chevronRight, 16)
    if (nextIcon) nextButton.appendChild(nextIcon)
    prevButton.addEventListener('click', () => goTo(index - 1))
    nextButton.addEventListener('click', () => goTo(index + 1))
    root.append(prevButton, nextButton)
  }
  const dots: HTMLButtonElement[] = []
  if (options.showDots ?? true) {
    const dotsEl = el('div', px('carousel-dots'))
    options.slides.forEach((_, i) => {
      const dot = el('button', px('carousel-dot'))
      dot.type = 'button'
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`)
      dot.addEventListener('click', () => goTo(i))
      dots.push(dot)
      dotsEl.appendChild(dot)
    })
    root.appendChild(dotsEl)
  }
  function syncUi(): void {
    dots.forEach((dot, i) => dot.classList.toggle(px('carousel-dot-active'), i === index))
    if (prevButton) prevButton.disabled = !loop && index === 0
    if (nextButton) nextButton.disabled = !loop && index === slideEls.length - 1
  }
  function goTo(newIndex: number): void {
    const count = slideEls.length
    index = loop ? (newIndex + count) % count : Math.max(0, Math.min(count - 1, newIndex))
    slideEls[index]?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
    syncUi()
    onSlideChange?.(index)
  }
  syncUi()
  let scrollTimer: ReturnType<typeof setTimeout> | null = null
  const scrollListener = (): void => {
    if (scrollTimer) clearTimeout(scrollTimer)
    scrollTimer = setTimeout(() => {
      const settledIndex = Math.round(track.scrollLeft / track.clientWidth)
      if (settledIndex !== index && settledIndex >= 0 && settledIndex < slideEls.length) {
        index = settledIndex
        syncUi()
        onSlideChange?.(index)
      }
    }, 100)
  }
  track.addEventListener('scroll', scrollListener)
  function startAutoplay(): void {
    if (!options.autoplayMs) return
    autoplayTimer = setInterval(() => goTo(index + 1), options.autoplayMs)
  }
  function stopAutoplay(): void {
    if (autoplayTimer) clearInterval(autoplayTimer)
    autoplayTimer = null
  }
  startAutoplay()
  root.addEventListener('mouseenter', stopAutoplay)
  root.addEventListener('mouseleave', startAutoplay)
  const api: CarouselApi = {
    next() {
      goTo(index + 1)
    },
    prev() {
      goTo(index - 1)
    },
    goTo,
    getIndex() {
      return index
    },
    destroy() {
      stopAutoplay()
      if (scrollTimer) clearTimeout(scrollTimer)
      track.removeEventListener('scroll', scrollListener)
      root.removeEventListener('mouseenter', stopAutoplay)
      root.removeEventListener('mouseleave', startAutoplay)
      root.remove()
    }
  }
  return attachController(root, api)
}