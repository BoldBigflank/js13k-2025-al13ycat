import * as THREE from 'https://js13kgames.com/2025/webxr/three.module.js'
import { initCanvas } from './Utils'
import { BLACK } from './Colors'

const textures: Record<string, THREE.Material> = {}
const c = new THREE.Color()

type ColorOpts = {
    glow?: boolean
}
export const ColorMaterial = (color: string, opts?: ColorOpts) => {
    const glow = opts?.glow == true
    const key = `color-${color}-${glow}`
    if (textures[key]) return textures[key]
    const MeshMaterial = glow ? THREE.MeshBasicMaterial : THREE.MeshStandardMaterial
    const material = new MeshMaterial({
        color,
        side: THREE.FrontSide,
    })
    // if (glow) {
    //     material.emissive.set(color)
    // }
    textures[key] = material
    return material
}

type TextOpts = {
    color: string | number
    bgColor?: string
    textAlign?: CanvasTextAlign
    ratio?: number
    fontSize?: number
}

export const TextMaterial = (lines: string[], opts: TextOpts) => {
    const { color, bgColor, textAlign, ratio, fontSize } = opts
    c.set(color)
    const hexColor = typeof color === 'string' ? color : `#${c.getHexString()}`
    const key = `text-${hexColor}-${lines.join('')}`
    if (textures[key]) return textures[key]
    const width = 1024
    const height = ratio ? width / ratio : width
    const [canvas, ctx] = initCanvas(width, height)

    // TODO: Container fill

    // The Text
    ctx.textAlign = textAlign || 'center'
    let x = 16
    if (ctx.textAlign === 'center') x = 0.5 * width
    let y = 16
    lines.forEach((line, i) => {
        const size = fontSize !== undefined ? fontSize : 64
        ctx.strokeStyle = BLACK
        ctx.font = `${size}px monospace`
        ctx.textBaseline = 'top'
        ctx.lineWidth = 8
        ctx.strokeText(line, x, y + size * i)
        ctx.fillStyle = hexColor
        ctx.fillText(line, x, y + size * i)
    })

    const texture = new THREE.CanvasTexture(canvas)
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
    })

    textures[key] = material
    return material
}
