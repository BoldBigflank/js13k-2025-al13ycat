import * as THREE from 'https://js13kgames.com/2025/webxr/three.module.js'
import { AnimationFactory } from '../scripts/AnimationFactory'
import { loadModelByName } from '../scripts/modelLoader'

export const Paw = (): THREE.Object3D => {
    const mesh = loadModelByName('paw') as THREE.Object3D
    return mesh
}
