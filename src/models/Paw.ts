// @ts-ignore
import * as THREE from 'https://js13kgames.com/2025/webxr/three.module.js'
import { createModel } from '../scripts/ModelLoader'
import { pawModel } from './exported/paw'
import { CAT_BLACK, NEON_RED, WHITE } from '../scripts/Colors'

const DEFAULT_PALETTE = {
    Purple: CAT_BLACK,
    Red: NEON_RED,
    Silver: WHITE,
}

export const Paw = (palette = {}): THREE.Object3D => {
    const parent = new THREE.Group()
    parent.name = 'paw'

    const mesh = createModel(pawModel(), { ...DEFAULT_PALETTE, ...palette }) as THREE.Object3D
    mesh.scale.set(0.03125, 0.03125, 0.03125)
    mesh.rotation.set((3 * Math.PI) / 2, 0, 0)
    parent.attach(mesh)

    return parent
}
