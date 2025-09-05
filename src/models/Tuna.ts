import * as THREE from 'three'
import { createModel } from '../scripts/ModelLoader'
import { tunaModel } from './exported/tuna'
import { NEON_RED, NEON_BLUE, WHITE } from '../scripts/Colors'
import { InteractiveObject3D } from '../types'
import { RecordSFX } from '../audio/music'

export const Tuna = (): THREE.Object3D => {
    const mesh = createModel(tunaModel(), {
        palette: {
            Blue: NEON_BLUE,
            Red: NEON_RED,
            Silver: WHITE,
        },
    }) as InteractiveObject3D
    mesh.scale.set(0.03125, 0.03125, 0.03125)
    mesh.userData.isPickable = true
    mesh.onPointerPick = (controller) => {
        RecordSFX()
    }
    return mesh
}
