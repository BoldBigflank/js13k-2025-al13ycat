// @ts-ignore
import * as THREE from 'https://js13kgames.com/2025/webxr/three.module.js'

export type AnimationTransform = {
    position?: THREE.Vector3
    rotation?: THREE.Euler
    scaling?: THREE.Vector3
}

export interface AnimateTransformOpts {
    mesh: THREE.Object3D
    end: AnimationTransform
    ease?: (t: number) => number
    duration: number
    delay?: number
    loop?: boolean
}

type Animating = {
    mesh: THREE.Object3D
    start: AnimationTransform
    end: AnimationTransform
    easeFunc: (t: number) => number
    startTime: number
    endTime: number
    loop: boolean
    resolve?: () => void
    reject?: (reason?: any) => void
}

// Default easing function (quadratic ease)
export const defaultEase = (t: number): number => t * t

export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3)

export const easeInOutCubic = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

export const sinusoidal = (t: number): number => 0.5 * Math.cos(2 * t * Math.PI + Math.PI) + 0.5 // 0 to 1 to 0

export class AnimationFactory {
    private static _instance: AnimationFactory
    private animations: Animating[]
    private scene: THREE.Scene | null
    private clock: THREE.Clock

    private constructor() {
        this.animations = []
        this.scene = null
        this.clock = new THREE.Clock()
    }

    public static get Instance(): AnimationFactory {
        if (!AnimationFactory._instance) {
            AnimationFactory._instance = new AnimationFactory()
        }
        return AnimationFactory._instance
    }

    public initScene(scene: THREE.Scene) {
        if (this.scene) return
        this.scene = scene
        this.clock.start()
    }

    public update() {
        const now = this.clock.getElapsedTime() * 1000 // Convert to milliseconds
        this.animations = this.animations.filter((animation) => {
            const { mesh, start, end, easeFunc, loop } = animation
            const msElapsed = now - animation.startTime
            const duration = animation.endTime - animation.startTime
            const lerpAmount = THREE.MathUtils.clamp(msElapsed / duration, 0, 1)

            if (end.position) mesh.position.lerpVectors(start.position!, end.position, easeFunc(lerpAmount))
            if (end.rotation) {
                // Lerp individual Euler angles directly
                const startEuler = start.rotation!
                const endEuler = end.rotation
                const currentEuler = new THREE.Euler()

                // Preserve the rotation order from the start Euler, fallback to default if not set
                currentEuler.order = startEuler.order || THREE.Euler.DefaultOrder

                // Interpolate each axis independently
                currentEuler.x = startEuler.x + (endEuler.x - startEuler.x) * easeFunc(lerpAmount)
                currentEuler.y = startEuler.y + (endEuler.y - startEuler.y) * easeFunc(lerpAmount)
                currentEuler.z = startEuler.z + (endEuler.z - startEuler.z) * easeFunc(lerpAmount)

                mesh.rotation.copy(currentEuler)
            }
            if (end.scaling) mesh.scale.lerpVectors(start.scaling!, end.scaling, easeFunc(lerpAmount))

            // It's over
            if (now >= animation.endTime) {
                if (loop) {
                    animation.startTime = now
                    animation.endTime = now + duration
                    if (end.position) {
                        mesh.position.copy(start.position)
                    }
                    if (end.rotation) {
                        mesh.rotation.copy(start.rotation!)
                    }
                    if (end.scaling) {
                        mesh.scale.copy(start.scaling)
                    }
                    return true
                }

                // Resolve the promise if it exists and this is not a looped animation
                if (animation.resolve) {
                    animation.resolve()
                    // Clean up the promise references
                    animation.resolve = undefined
                    animation.reject = undefined
                }

                return false
            }

            return true
        })
    }

    public animateTransform(opts: AnimateTransformOpts): Promise<void> {
        const { mesh, end } = opts
        const duration = opts.duration || 1000
        const delay = opts.delay || 0
        const ease = opts.ease || defaultEase
        const now = this.clock.getElapsedTime() * 1000

        // Create a promise that resolves when the animation completes
        let resolve: (() => void) | undefined
        let reject: ((reason?: any) => void) | undefined

        const promise = new Promise<void>((res, rej) => {
            resolve = res
            reject = rej
        })

        this.animations.push({
            mesh,
            start: {
                position: mesh.position.clone(),
                rotation: mesh.rotation.clone(),
                scaling: mesh.scale.clone(),
            },
            end,
            easeFunc: ease,
            startTime: now + delay,
            endTime: now + delay + duration,
            loop: opts.loop || false,
            resolve,
            reject,
        })

        return promise
    }

    public cancelAnimation(mesh: THREE.Object3D, jumpToEnd: boolean = false) {
        const animations = this.animations.filter((animation) => animation.mesh === mesh)
        if (!animations.length) return

        animations.forEach((animation) => {
            const { end } = animation
            if (jumpToEnd) {
                if (end.position) {
                    mesh.position.copy(end.position)
                }
                if (end.rotation) {
                    mesh.rotation.copy(end.rotation)
                }
                if (end.scaling) {
                    mesh.scale.copy(end.scaling)
                }
            }

            // Resolve the promise if it exists (animation was cancelled)
            if (animation.reject) {
                animation.reject()
                // Clean up the promise references
                animation.resolve = undefined
                animation.reject = undefined
            }
        })

        this.animations = this.animations.filter((animation) => animation.mesh !== mesh)
    }
}
