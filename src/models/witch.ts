import * as THREE from 'https://js13kgames.com/2025/webxr/three.module.js'

import type { InteractiveObject3D } from '../types'
import { PickupSFX } from '../audio/music'
import { Events } from '../libraries/Events'
import { loadModelByName } from '../scripts/modelLoader'

let pc = 0

export const Witch = (scene: THREE.Scene, renderer: THREE.WebGLRenderer): InteractiveObject3D => {
    const parent = new THREE.Group() as InteractiveObject3D
    parent.name = `Witch${++pc}`
    const lookAtPos: THREE.Quaternion[] = []

    // Meta
    let attention = false

    const cat = loadModelByName('cat')
    cat.scale.set(0.03, 0.03, 0.03)
    parent.add(cat)
    cat.position.set(0, -0.25, -0.05)

    // Animation loop
    const animate = () => {
        if (!renderer.xr?.getCamera()) return
        // TODO: Rotate 180deg on the Y axis
        if (renderer.xr?.getCamera()) {
            const camera = renderer.xr?.getCamera()
            // Get the camera's orientation, turn it 180 degrees around the Y axis, then push it to lookAtPos
            const yAxisRot = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0))
            const rotatedQuat = yAxisRot.multiply(camera.quaternion.clone())
            lookAtPos.push(rotatedQuat)

            if (lookAtPos.length > 60) {
                let q = lookAtPos.shift()
                if (q) {
                    parent.quaternion.copy(q)
                }
            }
        }
    }
    Events.Instance.on('tick', animate)

    // Add interaction
    parent.userData.isPickable = true
    parent.onPointerPick = () => {
        PickupSFX()
    }

    scene.add(parent)
    return parent
}
