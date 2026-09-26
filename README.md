# Socle

A self-sufficient UI component library with **zero dependencies**, no Tailwind, no CSS framework, and no build step required by consumers. Every component is a real, fully-typed DOM element with attached controller methods -- append it, control it, destroy it.

Works in:
- The browser, via a single `<script>` tag (`dist/socle.global.js`, global `window.Socle`)
- Node.js and Bun, as an ESM/CJS package (`import { Button } from 'socle'`)
- TypeScript and plain JavaScript, with full `.d.ts` types shipped

## Install

```bash
npm install socle
# or
bun add socle
```

## Browser (no build step)

```html
<script src="./socle.global.js"></script>
<script>
  const button = Socle.Button('Save', { variant: 'default' })
  document.body.append(button)
</script>
```

## Node / Bun / bundlers

```ts
import { Button, Section, setTheme } from 'socle'

const button = Button('Save', {
  variant: 'default',
  onClick: () => console.log('saved')
})

document.body.append(button)
```

## Components

| Category | Components |
|---|---|
| Buttons | Button, ButtonGroup |
| Layout | Section, Card, Separator |
| Form fields | TextField, TextArea, NumberField, ColorField |
| Selection controls | Checkbox, RadioGroup, Switch, Slider, RangeSlider, Select, Combobox |
| Specialized inputs | ChipInput, FileDropzone, DatePicker |
| Display | Badge, Avatar, ModeCard |
| Feedback | Spinner, ProgressBar, Skeleton, Toast, Alert |
| Overlays | Tooltip, Dialog, Drawer, Popover, DropdownMenu, ContextMenu |
| Navigation | Tabs, Accordion, Breadcrumb, Pagination |
| Data display | Table, List, Tree |

Every component ships its own CSS alongside its code -- import only what you use, and only that component's styles are ever injected.

## Styling

CSS is injected automatically at runtime -- nothing to import or link. Customize the whole design system through CSS custom properties (all prefixed `--socle-*` so they never collide with your own variables) or the `setTheme()` API:

```ts
import { setTheme } from 'socle'

setTheme({ primary: 'oklch(0.7 0.2 250)', radius: '0.25rem' })
```

## Icons

Socle ships a built-in set of lucide-compatible icons, each a standalone, tree-shakeable component. Every `icon` prop across the library accepts any of: one of Socle's built-ins, a lucide-style icon-node array, raw SVG markup, an existing `SVGSVGElement`, a render function, or nothing at all.

```ts
import { Icon, icons } from 'socle/svg'

const check = Icon(icons.check, 16)
```

Mix in your own icons (from a lucide clone or hand-rolled) freely -- they're fully interchangeable:

```ts
import { icons } from 'socle/svg'

const allIcons = { ...icons, ...myLucideCloneIcons }
```

## License

WTFPL -- do what the fuck you want to.