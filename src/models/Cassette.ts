import * as THREE from 'three'
import { AnimationFactory } from '../scripts/AnimationFactory'
import { createModel } from '../scripts/ModelLoader'
import { cassetteModel } from './exported/cassette'
import {
    BLACK,
    BLUE,
    LIGHT_GREY,
    NEON_BROWN,
    NEON_ORANGE,
    NEON_PURPLE,
    NEON_RED,
    NEON_YELLOW,
    WHITE,
} from '../scripts/Colors'
import { TextMaterial } from '../scripts/TextureUtils'

export const Cassette = (): THREE.Object3D => {
    const mesh = createModel(cassetteModel(), {
        palette: {
            Blue: NEON_ORANGE, // Case
            Silver: NEON_YELLOW, // Label
            Red: NEON_RED, // Bottom
            Orange: LIGHT_GREY, // Spools
            Purple: NEON_BROWN, // Tape
            Green: BLUE, // Base
        },
        glow: [0, 1, 2, 3, 4, 5, 7, 8, 9],
    }) as THREE.Object3D
    const label = mesh.getObjectByName('label')
    label!.material = TextMaterial(['AL13YCAT'], { color: BLACK, fontSize: 224, ratio: 4, bgColor: NEON_PURPLE })
    AnimationFactory.Instance.animateTransform({
        mesh: mesh,
        end: {
            rotation: new THREE.Euler(0, 2 * Math.PI - 0.01, 0),
        },
        duration: 16000,
        ease: (t) => t,
        loop: true,
    })
    return mesh
}
