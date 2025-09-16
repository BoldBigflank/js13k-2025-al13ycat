import * as THREE from 'three'
import { createModel } from '../scripts/ModelLoader'
import { tunaModel } from './exported/tuna'
import { NEON_RED, NEON_BLUE, WHITE } from '../scripts/Colors'
import { InteractiveObject3D, LaserEvent } from '../types'
import { PickupSFX } from '../audio/music'
import { Events } from '../libraries/Events'

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
        Events.Instance.emit(LaserEvent)
    }
    return mesh
}
