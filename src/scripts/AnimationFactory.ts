import * as THREE from "https://js13kgames.com/2025/webxr/three.module.js";
import { Clamp } from "./Utils";

export type AnimationTransform = {
    position?: THREE.Vector3;
    rotation?: THREE.Vector3;
    scaling?: THREE.Vector3;
};

export interface AnimateTransformOpts {
    mesh: THREE.Object3D;
    end: AnimationTransform;
    ease?: (t: number) => number;
    duration: number;
    delay?: number;
}

type Animating = {
    mesh: THREE.Object3D;
    start: AnimationTransform;
    end: AnimationTransform;
    easeFunc: (t: number) => number;
    startTime: number;
    endTime: number;
};

// Default easing function (quadratic ease)
const defaultEase = (t: number): number => t * t;

export class AnimationFactory {
    private static _instance: AnimationFactory;
    private animations: Animating[];
    private scene: THREE.Scene | null;
    private clock: THREE.Clock;

    private constructor() {
        this.animations = [];
        this.scene = null;
        this.clock = new THREE.Clock();
    }

    public static get Instance(): AnimationFactory {
        if (!AnimationFactory._instance) {
            AnimationFactory._instance = new AnimationFactory();
        }
        return AnimationFactory._instance;
    }

    public initScene(scene: THREE.Scene) {
        if (this.scene) return;
        this.scene = scene;
        this.clock.start();
    }

    public update() {
        const now = this.clock.getElapsedTime() * 1000; // Convert to milliseconds
        this.animations = this.animations.filter((animation) => {
            const msElapsed = now - animation.startTime;
            const duration = animation.endTime - animation.startTime;
            const lerpAmount = Clamp(msElapsed / duration, 0, 1);

            // It's over
            if (now >= animation.endTime) {
                if (animation.end.position)
                    animation.mesh.position.copy(animation.end.position);
                if (animation.end.rotation)
                    animation.mesh.rotation.copy(animation.end.rotation);
                if (animation.end.scaling)
                    animation.mesh.scale.copy(animation.end.scaling);
                return false;
            }

            if (animation.end.position)
                animation.mesh.position.lerpVectors(
                    animation.start.position!,
                    animation.end.position,
                    animation.easeFunc(lerpAmount),
                );
            if (animation.end.rotation) {
                // Convert Euler rotations to quaternions for smooth interpolation
                const startQuat = new THREE.Quaternion().setFromEuler(
                    animation.start.rotation!,
                );
                const endQuat = new THREE.Quaternion().setFromEuler(
                    animation.end.rotation,
                );
                const currentQuat = new THREE.Quaternion();
                currentQuat.slerpQuaternions(
                    startQuat,
                    endQuat,
                    animation.easeFunc(lerpAmount),
                );
                animation.mesh.rotation.setFromQuaternion(currentQuat);
            }
            if (animation.end.scaling)
                animation.mesh.scale.lerpVectors(
                    animation.start.scaling!,
                    animation.end.scaling,
                    animation.easeFunc(lerpAmount),
                );
            return true;
        });
    }

    public animateTransform(opts: AnimateTransformOpts) {
        const { mesh, end } = opts;
        const duration = opts.duration || 1000;
        const delay = opts.delay || 0;
        const ease = opts.ease || defaultEase;
        const now = this.clock.getElapsedTime() * 1000;

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
        });
    }
}
