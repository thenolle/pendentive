# Pendentive

A self-sufficient UI component library with **zero dependencies**, no Tailwind, no CSS framework, and no build step required by consumers. Every component is a real, fully-typed DOM element with attached controller methods -- append it, control it, destroy it.

Works in:
- The browser, via a single `<script>` tag (`dist/pendentive.global.js`, global `window.Pendentive`)
- Node.js and Bun, as an ESM/CJS package (`import { Button } from 'pendentive'`)
- TypeScript and plain JavaScript, with full `.d.ts` types shipped

## Install

```bash
npm install pendentive
# or
bun add pendentive
```

## Browser (no build step)

```html
<script src="./pendentive.global.js"></script>
<script>
  const button = Pendentive.Button('Save', { variant: 'default' })
  document.body.append(button)
</script>
```

## Node / Bun / bundlers

```ts
import { Button, Section, setTheme } from 'pendentive'

const button = Button('Save', {
  variant: 'default',
  onClick: () => console.log('saved')
})

document.body.append(button)
```

## Components

| Category           | Components                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| Buttons            | Button, ButtonGroup, CopyButton                                                                  |
| Layout             | AspectRatio, Card, Resizable, ScrollArea, Section, Separator                                     |
| Form fields        | ColorField, Label, NumberField, TextArea, TextField                                              |
| Selection controls | Checkbox, Combobox, RadioGroup, RangeSlider, Rating, Select, Slider, Switch, Toggle, ToggleGroup |
| Specialized inputs | ChipInput, DatePicker, FileDropzone, InputOTP                                                    |
| Display            | Avatar, Badge, Carousel, Kbd, ModeCard                                                           |
| Feedback           | Alert, EmptyState, ProgressBar, Skeleton, Spinner, Toast                                         |
| Overlays           | AlertDialog, Command, ContextMenu, Dialog, Drawer, DropdownMenu, HoverCard, Popover, Tooltip     |
| Navigation         | Accordion, Breadcrumb, Collapsible, Menubar, Pagination, Tabs                                    |
| Data display       | List, Table, Timeline, Tree, VirtualList                                                         |
| Developer tools    | RenderPulse                                                                                      |

Every component ships its own CSS alongside its code -- import only what you use, and only that component's styles are ever injected.

## Styling

CSS is injected automatically at runtime -- nothing to import or link. Customize the whole design system through CSS custom properties (all prefixed `--pendentive-*` so they never collide with your own variables) or the `setTheme()` API:

```ts
import { setTheme } from 'pendentive'

setTheme({ primary: 'oklch(0.7 0.2 250)', radius: '0.25rem' })
```

## Icons

Pendentive ships a built-in set of lucide-compatible icons, each a standalone, tree-shakeable component. Every `icon` prop across the library accepts any of: one of Pendentive's built-ins, a lucide-style icon-node array, raw SVG markup, an existing `SVGSVGElement`, a render function, or nothing at all.

```ts
import { Icon, icons } from 'pendentive/svg'

const check = Icon(icons.check, 16)
```

Mix in your own icons (from a lucide clone or hand-rolled) freely -- they're fully interchangeable:

```ts
import { icons } from 'pendentive/svg'

const allIcons = { ...icons, ...myLucideCloneIcons }
```

## License

WTFPL -- do what the fuck you want to.