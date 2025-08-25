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
    color: string
    bgColor: string
}

export const TextMaterial = (lines: string[], color: string | number) => {
    c.set(color)
    const hexColor = typeof color === 'string' ? color : `#${c.getHexString()}`
    const key = `text-${hexColor}-${lines.join('')}`
    if (textures[key]) return textures[key]
    const RES = 1024
    const [canvas, ctx] = initCanvas(RES)

    // TODO: Container fill

    // The Text
    ctx.textAlign = 'center'
    lines.forEach((line, i) => {
        const fontSize = 64
        ctx.strokeStyle = BLACK
        ctx.font = `${fontSize}px monospace`
        ctx.textBaseline = 'middle'
        ctx.lineWidth = 8
        ctx.strokeText(line, 0.5 * RES, 0.5 * (RES - fontSize * lines.length) + fontSize * i)
        ctx.fillStyle = hexColor
        ctx.fillText(line, 0.5 * RES, 0.5 * (RES - fontSize * lines.length) + fontSize * i)
    })

    const texture = new THREE.CanvasTexture(canvas)
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
    })

    textures[key] = material
    return material
}
