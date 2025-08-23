import * as THREE from 'https://js13kgames.com/2025/webxr/three.module.js'

export const Clamp = (value: number, min: number, max: number) => {
    return Math.min(Math.max(value, min), max)
}

export const initCanvas = (size = 512): [HTMLCanvasElement, CanvasRenderingContext2D] => {
    const canvas = document.createElement('canvas') as HTMLCanvasElement
    canvas.width = size
    canvas.height = size
    // document.getElementById("extra")?.appendChild(canvas)
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    return [canvas, ctx]
}
