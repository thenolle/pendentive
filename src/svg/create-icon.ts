import { renderIconShape } from './Icon'
import type { IconComponent, IconRenderProps, IconShape } from './types'

/**
 * Builds a ready-to-use icon component from a static shape -- mirroring how lucide
 * generates one component per icon via `createLucideIcon`.
 *
 * Every file in `svg/icons/*` calls this once and exports the result, so each icon
 * is a real, standalone, tree-shakeable SVG component instead of a shared data blob.
 *
 * @param name - Icon name, stamped onto the rendered element as `data-icon` (debugging/theming hook).
 * @param shape - The ordered list of child nodes that make up the icon.
 * @returns A component: call it with optional render props to get a fresh `SVGSVGElement`.
 */
export function createIcon(name: string, shape: IconShape): IconComponent {
  return function renderIcon(props: IconRenderProps = {}): SVGSVGElement {
    const svg = renderIconShape(shape, props)
    svg.setAttribute('data-icon', name)
    return svg
  }
}