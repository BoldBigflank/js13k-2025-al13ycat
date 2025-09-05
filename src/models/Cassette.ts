import * as THREE from 'three'
import { AnimationFactory } from '../scripts/AnimationFactory'
import { createModel } from '../scripts/ModelLoader'
import { cassetteModel } from './exported/cassette'
import { BLUE, LIGHT_GREY, NEON_BROWN, NEON_ORANGE, NEON_RED, NEON_YELLOW } from '../scripts/Colors'

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
        glow: true,
    }) as THREE.Object3D
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
