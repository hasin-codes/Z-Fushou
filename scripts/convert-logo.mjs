import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const colorfulLogoSvgPath = join(root, 'public', 'Z Fushou Logo', 'Colorful Logo - Black BG.svg')
const logoSvgPath = join(root, 'public', 'Logo.svg')
const mainLogoSvgPath = join(root, 'public', 'MainLogo.svg')
const pngMax = { quality: 100, compressionLevel: 0, effort: 10, palette: false }

async function renderSvgToBuffer(svgPath, size) {
  return sharp(readFileSync(svgPath))
    .resize(size, size, {
      fit: 'contain',
      kernel: 'lanczos3',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .ensureAlpha()
    .png(pngMax)
    .toBuffer()
}

function makeIco(sizes, pngBuffers) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(sizes.length, 4)

  const entries = []
  let offset = 6 + sizes.length * 16

  for (let i = 0; i < sizes.length; i += 1) {
    const entry = Buffer.alloc(16)
    entry.writeUInt8(sizes[i] >= 256 ? 0 : sizes[i], 0)
    entry.writeUInt8(sizes[i] >= 256 ? 0 : sizes[i], 1)
    entry.writeUInt8(0, 2)
    entry.writeUInt8(0, 3)
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(pngBuffers[i].length, 8)
    entry.writeUInt32LE(offset, 12)
    entries.push(entry)
    offset += pngBuffers[i].length
  }

  return Buffer.concat([header, ...entries, ...pngBuffers])
}

async function convertLogo() {
  const buildDir = join(root, 'build')
  if (!existsSync(buildDir)) mkdirSync(buildDir, { recursive: true })

  const appIconSizes = [16, 20, 24, 32, 40, 48, 64, 128, 256]
  const faviconSizes = [16, 32, 48, 256]

  const appIconBuffers = await Promise.all(
    appIconSizes.map((size) => renderSvgToBuffer(colorfulLogoSvgPath, size))
  )
  writeFileSync(join(root, 'build', 'icon.ico'), makeIco(appIconSizes, appIconBuffers))
  console.log('Created build/icon.ico from Colorful Logo - Black BG.svg')

  await sharp(await renderSvgToBuffer(colorfulLogoSvgPath, 1024))
    .png(pngMax)
    .toFile(join(root, 'build', 'icon.png'))
  console.log('Created build/icon.png from Colorful Logo - Black BG.svg')

    await sharp(await renderSvgToBuffer(logoSvgPath, 1024))
    .png(pngMax)
    .toFile(join(root, 'public', 'logo.png'))
  console.log('Created public/logo.png from Logo.svg')

  const faviconBuffers = await Promise.all(
    faviconSizes.map((size) => renderSvgToBuffer(logoSvgPath, size))
  )
  writeFileSync(join(root, 'app', 'favicon.ico'), makeIco(faviconSizes, faviconBuffers))
  console.log('Created app/favicon.ico from Logo.svg')

  await sharp(await renderSvgToBuffer(logoSvgPath, 180))
    .png(pngMax)
    .toFile(join(root, 'public', 'apple-touch-icon.png'))
  console.log('Created public/apple-touch-icon.png from Logo.svg')

  await sharp(await renderSvgToBuffer(logoSvgPath, 32))
    .png(pngMax)
    .toFile(join(root, 'public', 'favicon-32x32.png'))
  console.log('Created public/favicon-32x32.png from Logo.svg')

  await sharp(await renderSvgToBuffer(logoSvgPath, 16))
    .png(pngMax)
    .toFile(join(root, 'public', 'favicon-16x16.png'))
  console.log('Created public/favicon-16x16.png from Logo.svg')
}

convertLogo().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})
