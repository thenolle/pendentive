import { readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const COMPONENTS_DIR = join(ROOT, 'src/components')
const README = join(ROOT, 'README.md')

/** Suffixes that mark a file as an internal CSS/helper module rather than a public component -- never listed. */
const IGNORED_SUFFIXES = ['.css.ts']

/**
 * Maps each `src/components/<folder>` directory to the human-readable category label used in
 * the README's component table. Any folder not listed here falls
 * back to its own capitalized name, so a brand-new category never silently disappears --
 * it just shows up ungrouped until someone adds it here.
 */
const CATEGORY_BY_FOLDER: Record<string, string> = {
  button: 'Buttons',
  layout: 'Layout',
  scrollarea: 'Layout',
  resizable: 'Layout',
  field: 'Form fields',
  label: 'Form fields',
  checkbox: 'Selection controls',
  radio: 'Selection controls',
  switch: 'Selection controls',
  slider: 'Selection controls',
  select: 'Selection controls',
  toggle: 'Selection controls',
  rating: 'Selection controls',
  input: 'Specialized inputs',
  badge: 'Display',
  avatar: 'Display',
  misc: 'Display',
  kbd: 'Display',
  carousel: 'Display',
  feedback: 'Feedback',
  tooltip: 'Overlays',
  hovercard: 'Overlays',
  overlay: 'Overlays',
  command: 'Overlays',
  navigation: 'Navigation',
  menubar: 'Navigation',
  collapsible: 'Navigation',
  data: 'Data display',
  timeline: 'Data display',
  devtools: 'Developer tools'
}

/** Preferred display order for categories; anything undiscovered here is appended alphabetically at the end. */
const CATEGORY_ORDER = [
  'Buttons',
  'Layout',
  'Form fields',
  'Selection controls',
  'Specialized inputs',
  'Display',
  'Feedback',
  'Overlays',
  'Navigation',
  'Data display',
  'Developer tools'
]

/** A single discovered component, ready to be grouped and rendered. */
interface DiscoveredComponent {
  /** The PascalCase export name, e.g. `TextField`. */
  name: string
  /** The immediate `src/components/<folder>` this file lives in. */
  folder: string
}

/** Mirrors `generate-index.ts`'s convention: PascalCase `.ts` files are public components; everything else is an internal helper. */
function isPublicComponentFile(fileName: string): boolean {
  if (!fileName.endsWith('.ts')) return false
  if (IGNORED_SUFFIXES.some((suffix) => fileName.endsWith(suffix))) return false
  return /^[A-Z]/.test(fileName.replace(/\.ts$/, ''))
}

/** Recursively collects every public component, tagging each with its top-level `src/components/<folder>`. */
async function discoverComponents(dir: string, topFolder = ''): Promise<DiscoveredComponent[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const components: DiscoveredComponent[] = []
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      components.push(...(await discoverComponents(fullPath, topFolder || entry.name)))
    } else if (isPublicComponentFile(entry.name)) {
      components.push({ name: entry.name.replace(/\.ts$/, ''), folder: topFolder })
    }
  }
  return components
}

/** Groups discovered components into `{ category, names[] }`, ordered per `CATEGORY_ORDER` then alphabetically for the rest. */
function groupByCategory(components: DiscoveredComponent[]): Array<{ category: string; names: string[] }> {
  const byCategory = new Map<string, string[]>()
  for (const component of components) {
    const category = CATEGORY_BY_FOLDER[component.folder] ?? component.folder.replace(/^\w/, (char) => char.toUpperCase())
    const list = byCategory.get(category) ?? []
    list.push(component.name)
    byCategory.set(category, list)
  }
  for (const list of byCategory.values()) list.sort((a, b) => a.localeCompare(b))
  const known = CATEGORY_ORDER.filter((category) => byCategory.has(category))
  const unknown = [...byCategory.keys()].filter((category) => !CATEGORY_ORDER.includes(category)).sort((a, b) => a.localeCompare(b))
  return [...known, ...unknown].map((category) => ({ category, names: byCategory.get(category)! }))
}

/** Renders the Markdown table (header row, separator row, one row per category) as LF-joined lines. */
function buildReadmeTable(groups: Array<{ category: string; names: string[] }>): string[] {
  const header = '| Category | Components |'
  const separator = '|---|---|'
  const rows = groups.map((group) => `| ${group.category} | ${group.names.join(', ')} |`)
  return [header, separator, ...rows]
}

async function readIfExists(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf8')
  } catch {
    return null
  }
}

/** Splits `content` into lines on either `\n` or `\r\n`, reporting which EOL style it used so the caller can rejoin identically. */
function splitLines(content: string): { lines: string[]; eol: string } {
  return { lines: content.split(/\r?\n/), eol: content.includes('\r\n') ? '\r\n' : '\n' }
}

/**
 * Replaces the table under the `## Components` heading and leaves everything else untouched.
 *
 * Works line-by-line instead of one large regex: find the heading line (exact match once
 * trimmed), skip any number of blank lines after it, then treat every consecutive line that
 * starts with `|` as the table to replace. This is deliberately tolerant of blank-line count,
 * trailing whitespace, and CRLF vs LF -- a single monolithic pattern kept failing to match
 * some combination of those even after accounting for `\r?\n` everywhere.
 */
function updateReadme(content: string, groups: Array<{ category: string; names: string[] }>): { content: string; changed: boolean } {
  const { lines, eol } = splitLines(content)
  const headingIndex = lines.findIndex((line) => line.trim() === '## Components')
  if (headingIndex === -1) return { content, changed: false }
  let tableStart = headingIndex + 1
  while (tableStart < lines.length && lines[tableStart].trim() === '') tableStart++
  if (tableStart >= lines.length || !lines[tableStart].trim().startsWith('|')) return { content, changed: false }
  let tableEnd = tableStart
  while (tableEnd < lines.length && lines[tableEnd].trim().startsWith('|')) tableEnd++
  const nextLines = [...lines.slice(0, tableStart), ...buildReadmeTable(groups), ...lines.slice(tableEnd)]
  const next = nextLines.join(eol)
  return { content: next, changed: next !== content }
}

async function main(): Promise<void> {
  const components = await discoverComponents(COMPONENTS_DIR)
  const groups = groupByCategory(components)
  const total = components.length
  const readme = await readIfExists(README)
  if (readme) {
    const { content, changed } = updateReadme(readme, groups)
    if (changed) {
      await writeFile(README, content, 'utf8')
      console.log(`[generate-docs] README.md components table refreshed (${total} components across ${groups.length} categories)`)
    } else {
      console.warn('[generate-docs] README.md has no "## Components" heading immediately followed by a table -- skipped')
    }
  } else {
    console.warn('[generate-docs] README.md not found -- skipped')
  }
}

await main()