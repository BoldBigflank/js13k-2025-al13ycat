import * as THREE from 'https://js13kgames.com/2025/webxr/three.module.js'
import { AnimationFactory } from '../scripts/AnimationFactory'
import { createModel } from '../scripts/modelLoader'
import { pawModel } from './exported/paw'
import { CAT_BLACK, NEON_RED, WHITE } from '../scripts/Colors'

export const Paw = (): THREE.Object3D => {
    const mesh = createModel(pawModel(), {
        Purple: CAT_BLACK,
        Red: NEON_RED,
        Silver: WHITE,
    }) as THREE.Object3D
    mesh.scale.set(0.03125, 0.03125, 0.03125)
    return mesh
}
