import { serve } from 'bun'
import { dirname, extname, join, normalize } from 'node:path'

const root = dirname(import.meta.dir)

const contentTypeByExtension: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
}

serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url)
    let pathname = decodeURIComponent(url.pathname)
    if (pathname === '/') pathname = '/index.html'
    if (pathname === '/favicon.ico') return new Response(null, { status: 204 })
    const filePath = normalize(join(root, pathname))
    if (!filePath.startsWith(root)) return new Response('Forbidden', { status: 403 })
    const file = Bun.file(filePath)
    if (!(await file.exists())) return new Response('Not found', { status: 404 })
    const contentType = contentTypeByExtension[extname(filePath)] ?? 'application/octet-stream'
    return new Response(file, { headers: { 'Content-Type': contentType } })
  }
})

console.log(`Serving ${root} at http://localhost:3000 (plain static files, no bundling)`)