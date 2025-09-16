import * as THREE from 'three'

const clock = new THREE.Clock()
export const V3_ZERO = new THREE.Vector3(0, 0, 0).clone()

export const LocalStorageKey = 'AL13YCAT'

// Three functions to shorten
export const d2r = THREE.MathUtils.degToRad
export const randF = THREE.MathUtils.randFloatSpread

export const Intro = [
    'You are a cat DJ creating purrfect setlists.',
    'The vinyl you choose to play after the previous one',
    'will either build up your combo or break all progress.',
    'Fill the meter to lock in a sequence.',
    'Finish all three sequences to win!',
]

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

export const sample = (arr: any[]): any => arr[Math.floor(Math.random() * arr.length)]

export const DEBUG = import.meta.env.DEV

export const waveHeight = (x: number, z: number) => {
    const time = clock.getElapsedTime()
    return 0.5 * Math.sin(Math.sqrt(x * x + z * z) - 2 * time)
}

export const randomUnitCirclePoint = (radius = 1) => {
    // Random point in circle - https://stackoverflow.com/a/50746409
    const t = 2 * Math.PI * Math.random()
    const r = radius * Math.sqrt(Math.random())
    return new THREE.Vector3(r * Math.cos(t), 0, r * Math.sin(t))
}
