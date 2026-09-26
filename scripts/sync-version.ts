import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PACKAGE_JSON = join(ROOT, 'package.json')
const INDEX_HTML = join(ROOT, 'index.html')
const README = join(ROOT, 'README.md')
const CHANGELOG = join(ROOT, 'CHANGELOG.md')

/** Supported semver bump kinds. */
type BumpKind = 'major' | 'minor' | 'patch'

/** Parsed CLI intent: bump the current version, or just re-propagate it unchanged. */
interface Intent {
  mode: 'bump' | 'sync'
  bump?: BumpKind
  explicit?: string
}

/** Parses `patch` | `minor` | `major` | an explicit `x.y.z` | `--sync` (default if omitted). */
function parseArgs(argv: string[]): Intent {
  const arg = argv[2]
  if (!arg || arg === '--sync') return { mode: 'sync' }
  if (arg === 'major' || arg === 'minor' || arg === 'patch') return { mode: 'bump', bump: arg }
  if (/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(arg)) return { mode: 'bump', explicit: arg }
  throw new Error(`Unrecognized argument '${arg}'. Use 'patch' | 'minor' | 'major' | an explicit 'x.y.z' | '--sync'.`)
}

/** Applies a semver bump to a plain `x.y.z` string (pre-release suffixes are dropped). */
function bumpVersion(current: string, kind: BumpKind): string {
  const [major, minor, patch] = current.split('.').map((part) => Number.parseInt(part, 10))
  if (kind === 'major') return `${major + 1}.0.0`
  if (kind === 'minor') return `${major}.${minor + 1}.0`
  return `${major}.${minor}.${patch + 1}`
}

/** Replaces the captured version inside the first regex match, reporting whether anything changed. */
function replaceVersion(content: string, pattern: RegExp, nextValue: string): { content: string; changed: boolean } {
  let changed = false
  const updated = content.replace(pattern, (match, captured: string) => {
    changed = true
    return match.replace(captured, nextValue)
  })
  return { content: updated, changed }
}

async function readIfExists(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf8')
  } catch {
    return null
  }
}

async function main(): Promise<void> {
  const intent = parseArgs(process.argv)
  const packageJson = JSON.parse(await readFile(PACKAGE_JSON, 'utf8')) as { version: string }
  const currentVersion = packageJson.version
  const nextVersion = intent.mode === 'sync' ? currentVersion : intent.explicit ?? bumpVersion(currentVersion, intent.bump!)
  const touched: string[] = []
  if (intent.mode === 'bump' && nextVersion !== currentVersion) {
    packageJson.version = nextVersion
    await writeFile(PACKAGE_JSON, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8')
    touched.push('package.json')
  }
  const indexHtml = await readIfExists(INDEX_HTML)
  if (indexHtml) {
    const { content, changed } = replaceVersion(indexHtml, /Badge\('(v[\d.]+(?:-[\w.]+)?)'/, `v${nextVersion}`)
    if (changed) {
      await writeFile(INDEX_HTML, content, 'utf8')
      touched.push('index.html')
    }
  }
  const readme = await readIfExists(README)
  if (readme) {
    const { content, changed } = replaceVersion(readme, /!\[version\]\(https:\/\/img\.shields\.io\/badge\/version-([\d.]+(?:-[\w.]+)?)/, nextVersion)
    if (changed) {
      await writeFile(README, content, 'utf8')
      touched.push('README.md')
    }
  }
  const changelog = await readIfExists(CHANGELOG)
  if (intent.mode === 'bump' && changelog !== null) {
    const date = new Date().toISOString().slice(0, 10)
    await writeFile(CHANGELOG, `## v${nextVersion} -- ${date}\n\n- \n\n${changelog}`, 'utf8')
    touched.push('CHANGELOG.md')
  }
  if (touched.length === 0) {
    console.log(`[sync-version] already at v${nextVersion}, nothing to update`)
    return
  }
  console.log(`[sync-version] v${currentVersion} -> v${nextVersion}`)
  for (const file of touched) console.log(`  updated ${file}`)
}

await main()