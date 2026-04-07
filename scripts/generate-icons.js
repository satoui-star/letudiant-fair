// Run with: node scripts/generate-icons.js
// Generates placeholder PWA icons using canvas (requires: npm install canvas)
const { createCanvas } = require('canvas')
const fs = require('fs')
const path = require('path')

const iconsDir = path.join(__dirname, '..', 'public', 'icons')
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true })

function generateIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Background
  ctx.fillStyle = '#E3001B'
  ctx.fillRect(0, 0, size, size)

  // White circle
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size * 0.38, 0, Math.PI * 2)
  ctx.fill()

  // "E" text
  ctx.fillStyle = '#E3001B'
  ctx.font = `bold ${size * 0.35}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('É', size / 2, size / 2 + size * 0.02)

  const buffer = canvas.toBuffer('image/png')
  fs.writeFileSync(path.join(iconsDir, `icon-${size}.png`), buffer)
  console.log(`Generated icon-${size}.png`)
}

generateIcon(192)
generateIcon(512)
console.log('Done! Icons saved to public/icons/')
