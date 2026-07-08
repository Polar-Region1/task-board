import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import pngToIco from 'png-to-ico'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const svgPath = resolve(root, 'assets/icons/icon.svg')
const outDir = resolve(root, 'assets/icons')

const SIZES = [1024, 256, 128, 64, 32]
const ICO_SIZES = [256, 128, 64, 32, 16]

async function main() {
  if (!existsSync(outDir)) await mkdir(outDir, { recursive: true })
  const svg = await readFile(svgPath)

  console.log('[icon] generating PNGs...')
  for (const size of SIZES) {
    const out = resolve(outDir, `icon-${size}.png`)
    await sharp(svg).resize(size, size).png().toFile(out)
    console.log(`  wrote ${out}`)
  }

  console.log('[icon] generating .ico...')
  const icoSources = []
  for (const size of ICO_SIZES) {
    const buf = await sharp(svg).resize(size, size).png().toBuffer()
    icoSources.push(buf)
  }
  const icoBuf = await pngToIco(icoSources)
  await writeFile(resolve(outDir, 'icon.ico'), icoBuf)
  console.log(`  wrote ${resolve(outDir, 'icon.ico')}`)

  console.log('[icon] done.')
}

main().catch((err) => {
  console.error('[icon] failed:', err)
  process.exit(1)
})
