import type { IconInput, IconRenderProps, IconShape } from './types'

const SVGNS = 'http://www.w3.org/2000/svg'

/** Builds the shared base attributes (sizing, stroke, viewBox) applied to every rendered icon `<svg>`. */
function baseAttrs(props: IconRenderProps): Record<string, string> {
  const size = String(props.size ?? 16)
  return {
    xmlns: SVGNS,
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: props.color ?? 'currentColor',
    'stroke-width': String(props.strokeWidth ?? 2),
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round'
  }
}

/**
 * Renders a static `IconShape` into a real `SVGSVGElement`.
 *
 * Exported so per-icon components (`svg/icons/*`) can reuse the exact same rendering
 * path as the generic `Icon()` dispatcher below -- one source of truth, no duplication.
 */
export function renderIconShape(shape: IconShape, props: IconRenderProps): SVGSVGElement {
  const svg = document.createElementNS(SVGNS, 'svg') as SVGSVGElement
  const attrs = baseAttrs(props)
  for (const key in attrs) svg.setAttribute(key, attrs[key] as string)
  if (props.className) svg.setAttribute('class', props.className)
  for (const [tag, childAttrs] of shape) {
    const node = document.createElementNS(SVGNS, tag)
    for (const key in childAttrs) node.setAttribute(key, childAttrs[key] as string)
    svg.appendChild(node)
  }
  return svg
}

/** Clones an existing `SVGSVGElement`, re-applying size/color/stroke/class overrides. */
function fromElement(source: SVGSVGElement, props: IconRenderProps): SVGSVGElement {
  const svg = source.cloneNode(true) as SVGSVGElement
  const size = String(props.size ?? 16)
  svg.setAttribute('width', size)
  svg.setAttribute('height', size)
  if (props.color) svg.setAttribute('stroke', props.color)
  if (props.strokeWidth != null) svg.setAttribute('stroke-width', String(props.strokeWidth))
  if (props.className) svg.classList.add(...props.className.split(' ').filter(Boolean))
  return svg
}

/** Parses raw `<svg>...</svg>` markup into a real element before delegating to `fromElement`. */
function fromMarkup(markup: string, props: IconRenderProps): SVGSVGElement {
  const doc = new DOMParser().parseFromString(markup, 'image/svg+xml')
  return fromElement(doc.documentElement as unknown as SVGSVGElement, props)
}

/**
 * Renders any supported `IconInput` shape into a real `SVGSVGElement`.
 * Returns `null` when input is `null`/`undefined`, so callers never need to branch
 * before rendering an optional icon.
 *
 * @param input - The icon source: shape array, raw markup, an existing element, a component/render function, or nothing.
 * @param size - Shorthand for `props.size` (overridden if `props.size` is also set).
 * @param props - Additional render props: color, strokeWidth, className.
 * @requires A DOM environment (browser, or Node/Bun with a DOM shim).
 */
export function Icon(input: IconInput, size?: number | string, props: IconRenderProps = {}): SVGSVGElement | null {
  if (input === null || input === undefined) return null
  const resolved: IconRenderProps = { ...(size !== undefined ? { size } : {}), ...props }
  if (typeof input === 'function') return input(resolved)
  if (typeof input === 'string') return fromMarkup(input, resolved)
  if (input instanceof SVGElement) return fromElement(input as SVGSVGElement, resolved)
  if (Array.isArray(input)) return renderIconShape(input, resolved)
  return null
}