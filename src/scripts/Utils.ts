import * as THREE from 'https://js13kgames.com/2025/webxr/three.module.js'

export const INCHES_TO_METERS_SCALE = 0.0254

export const Clamp = (value: number, min: number, max: number) => {
    return Math.min(Math.max(value, min), max)
}

export const initCanvas = (width = 1024, height = 1024): [HTMLCanvasElement, CanvasRenderingContext2D] => {
    const canvas = document.createElement('canvas') as HTMLCanvasElement
    canvas.width = width
    canvas.height = height
    // document.getElementById("extra")?.appendChild(canvas)
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    return [canvas, ctx]
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
