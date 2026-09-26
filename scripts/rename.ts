import { readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git'])
const TEXT_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.json', '.md', '.html', '.yml', '.yaml', '.css'])

/** The three case variants of a project name used across code, docs, and CSS custom properties. */
interface NameCasing {
  pascal: string
  lower: string
  upper: string
}

/** Validates that `name` is a legal, lowercase, hyphenated npm package name (unscoped). */
function assertValidPackageName(name: string): void {
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    throw new Error(`'${name}' is not a valid package name -- use lowercase letters, digits, and hyphens only, starting with a letter.`)
  }
}

/** Derives PascalCase / lower-kebab / UPPER_SNAKE variants from a lower-kebab name. */
function deriveCasing(lowerKebabName: string): NameCasing {
  const bareLower = lowerKebabName.replace(/^@[^/]+\//, '') // strip a leading npm scope, if any
  const pascal = bareLower.replace(/(^|-)([a-z0-9])/g, (_, __, char: string) => char.toUpperCase())
  return { pascal, lower: bareLower, upper: bareLower.toUpperCase().replace(/-/g, '_') }
}

/** Recursively lists every eligible text file under `dir`, skipping build/VCS output. */
async function collectFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) files.push(...(await collectFiles(fullPath)))
    else if (TEXT_EXTENSIONS.has(extname(entry.name))) files.push(fullPath)
  }
  return files
}

/**
 * Applies Pascal -> Pascal, UPPER -> UPPER, then plain lower -> lower substitutions in that
 * order, so `Pendentive` and `PENDENTIVE` are replaced before the final unguarded `pendentive` pass, which
 * intentionally has no word boundaries -- it's what catches `pendentive-button`, `--pendentive-border`,
 * and `pendentive.global.js`.
 */
function renameOccurrences(content: string, from: NameCasing, to: NameCasing): { content: string; count: number } {
  const passes: Array<[RegExp, string]> = [
    [new RegExp(`\\b${from.pascal}\\b`, 'g'), to.pascal],
    [new RegExp(`\\b${from.upper}\\b`, 'g'), to.upper],
    [new RegExp(from.lower, 'g'), to.lower]
  ]
  let count = 0
  let next = content
  for (const [pattern, replacement] of passes) {
    const matches = next.match(pattern)
    if (matches) count += matches.length
    next = next.replace(pattern, replacement)
  }
  return { content: next, count }
}

async function main(): Promise<void> {
  const newNameArg = process.argv[2]
  const dryRun = process.argv.includes('--dry-run')
  if (!newNameArg) throw new Error('Usage: bun run scripts/rename-project.ts <new-package-name> [--dry-run]')

  const newLower = newNameArg.toLowerCase()
  assertValidPackageName(newLower)

  const packageJson = JSON.parse(await readFile(join(ROOT, 'package.json'), 'utf8')) as { name: string }
  const currentLower = packageJson.name.toLowerCase()
  if (currentLower.replace(/^@[^/]+\//, '') === newLower) {
    throw new Error(`Project is already named '${newLower}'.`)
  }

  const from = deriveCasing(currentLower)
  const to = deriveCasing(newLower)

  const files = await collectFiles(ROOT)
  let totalFiles = 0
  let totalReplacements = 0

  for (const file of files) {
    const original = await readFile(file, 'utf8')
    const { content, count } = renameOccurrences(original, from, to)
    if (count === 0) continue
    totalFiles += 1
    totalReplacements += count
    console.log(`${dryRun ? '[dry-run] would update' : 'updated'} ${relative(ROOT, file)} (${count} occurrence${count === 1 ? '' : 's'})`)
    if (!dryRun) await writeFile(file, content, 'utf8')
  }

  console.log(`\n[rename-project] ${dryRun ? 'would touch' : 'touched'} ${totalFiles} file(s), ${totalReplacements} occurrence(s): '${from.pascal}' -> '${to.pascal}'`)
  if (!dryRun) console.log('Next: bun run generate && bun run build, review the diff, then commit.')
}

await main()