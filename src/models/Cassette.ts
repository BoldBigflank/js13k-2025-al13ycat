import * as THREE from 'https://js13kgames.com/2025/webxr/three.module.js'
import { AnimationFactory } from '../scripts/AnimationFactory'
import { loadModelByName } from '../scripts/modelLoader'

export const Cassette = (): THREE.Object3D => {
    const mesh = loadModelByName('cassette') as THREE.Object3D
    AnimationFactory.Instance.animateTransform({
        mesh: mesh,
        end: {
            rotation: new THREE.Euler(0, 2 * Math.PI - 0.01, 0),
        },
        duration: 3000,
        ease: (t) => t,
        loop: true,
    })
    return mesh
}
