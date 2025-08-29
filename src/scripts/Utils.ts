import * as THREE from 'https://js13kgames.com/2025/webxr/three.module.js'

export const INCHES_TO_METERS_SCALE = 0.0254

export const initCanvas = (width = 1024, height = 1024): [HTMLCanvasElement, CanvasRenderingContext2D] => {
    const canvas = document.createElement('canvas') as HTMLCanvasElement
    canvas.width = width
    canvas.height = height
    // document.getElementById("extra")?.appendChild(canvas)
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    return [canvas, ctx]
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const vectorFromRadians = (a: number, b: number, len: number): THREE.Vector3 => {
    const start = new THREE.Vector3(1, 0, 0)
    const e = new THREE.Euler(0, a, -Math.PI / 2 + b)
    return start.applyEuler(e).normalize().multiplyScalar(len)
}

export const floatVal = (val: string | number | undefined) => parseFloat(`${val || 0}`)
