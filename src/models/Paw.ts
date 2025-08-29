import * as THREE from 'https://js13kgames.com/2025/webxr/three.module.js'
import { AnimationFactory } from '../scripts/AnimationFactory'
import { createModel } from '../scripts/modelLoader'
import { pawModel } from './exported/paw'

export const Paw = (): THREE.Object3D => {
    const mesh = createModel(pawModel()) as THREE.Object3D
    mesh.scale.set(0.03125, 0.03125, 0.03125)
    return mesh
}
