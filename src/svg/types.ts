/** A single SVG child element in Pendentive's lightweight icon format: [tagName, attributes]. */
export type IconChildNode = readonly [tag: string, attrs: Record<string, string>]

/** The full shape of an icon: an ordered list of child nodes rendered inside a root <svg>. Compatible with lucide-style icon exports. */
export type IconShape = readonly IconChildNode[]

/** Props accepted when rendering any icon, regardless of its source shape. */
export interface IconRenderProps {
  /** Pixel size applied to both width and height. Defaults to `16`. */
  size?: number | string
  /** Stroke width for the icon's paths. Defaults to `2`. */
  strokeWidth?: number
  /** Stroke/fill color. Defaults to `currentColor` so icons inherit surrounding text color. */
  color?: string | undefined
  /** Extra class names appended to the rendered `svg`. */
  className?: string
}

/** A ready-to-render icon component -- the shape every per-icon file in `svg/icons/*` exports, mirroring one lucide component per icon. */
export type IconComponent = (props?: IconRenderProps) => SVGSVGElement

/**
 * Every shape an icon can be provided in -- this is the type every `icon?` prop across the whole library accepts:
 * - `IconShape` -- a lucide-style array of [tag, attrs] child nodes (tree-shakeable, framework-agnostic)
 * - `string` -- raw `<svg>...</svg>` markup, parsed at render time
 * - `SVGSVGElement` -- an already-built element, cloned before use
 * - `IconComponent` -- a render function receiving `IconRenderProps` and returning an `SVGSVGElement` (what every built-in icon now is)
 * - `null` / `undefined` -- renders nothing, so icons are always fully optional
 */
export type IconInput = IconShape | string | SVGSVGElement | IconComponent | null | undefined