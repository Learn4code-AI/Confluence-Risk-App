import { build } from 'esbuild'
import { cp, mkdir, readdir, readFile, rm, stat } from 'node:fs/promises'
import { deflateRawSync } from 'node:zlib'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))
const source = join(root, 'forge')
const output = join(source, 'dist')
await rm(output, { recursive: true, force: true })
await mkdir(output, { recursive: true })
await cp(join(source, 'index.html'), join(output, 'index.html'))
await build({ entryPoints: [join(source, 'app.js')], outfile: join(output, 'app.js'), bundle: true, minify: true, target: 'es2020' })

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? files(path) : [path]
  }))
  return nested.flat()
}

const outputFiles = await files(output)
let compressed = 0
for (const file of outputFiles) compressed += deflateRawSync(await readFile(file)).byteLength + 80
const raw = (await Promise.all(outputFiles.map(async (file) => (await stat(file)).size))).reduce((sum, size) => sum + size, 0)
console.log(`Forge resource: ${raw} raw bytes, ~${compressed} compressed archive bytes`)
if (compressed > 8438) throw new Error(`Forge resource exceeds the Bosch compressed threshold: ${compressed} > 8438`)
