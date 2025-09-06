import * as THREE from 'three'
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
    parent.name = 'p'

    const mesh = createModel(pawModel(), { palette: { ...DEFAULT_PALETTE, ...palette } }) as THREE.Object3D
    mesh.scale.set(0.03125, 0.03125, 0.03125)
    mesh.rotation.set((3 * Math.PI) / 2, 0, 0)
    parent.attach(mesh)

    const pointLight = new THREE.PointLight(NEON_RED, 0.5, 4)
    parent.attach(pointLight)

    return parent
}
