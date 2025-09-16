import * as THREE from 'three'
import { Events } from '../libraries/Events'
import { RED } from '../scripts/Colors'
import { AnimationFactory } from '../scripts/AnimationFactory'
import { LaserEvent } from '../types'
import { V3_ZERO } from '../scripts/Utils'
import { LaserSFX } from '../audio/music'

export const Lasers = (): THREE.Object3D => {
    const parent = new THREE.Group()

    const count = 6
    const spread = 18

    const geometry = new THREE.BufferGeometry().setFromPoints([V3_ZERO, new THREE.Vector3(0, 0, -25)])
    for (let i = 0; i < count; i++) {
        const line = new THREE.Line(geometry)
        line.material.color.set(RED)
        line.lookAt(new THREE.Vector3((spread / count) * i - 0.5 * spread, 0, 25))
        parent.add(line)
    }
    parent.visible = false

    Events.Instance.on(LaserEvent, () => {
        LaserSFX()
        parent.rotation.set(Math.PI / 4, 0, 0)
        parent.visible = true
        AnimationFactory.Instance.cancelAnimation(parent)
        AnimationFactory.Instance.animateTransform({
            mesh: parent,
            end: {
                rotation: new THREE.Euler(-Math.PI / 4, 0, 0),
            },
            duration: 1999,
        }).then(() => (parent.visible = false))
    })

    return parent
}
