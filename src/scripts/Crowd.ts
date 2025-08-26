import * as THREE from 'https://js13kgames.com/2025/webxr/three.module.js'
import * as BufferGeometryUtils from '../libraries/BufferGeometryUtils.js'
import { catModel } from '../models/cat'
import { createGeometry, loadModelByName } from './modelLoader'
import { Events } from '../libraries/Events.js'

export const Crowd = (floor: THREE.Object3D, renderer: THREE.WebGLRenderer) => {
    const catMeshes: THREE.Object3D[] = []
    let pc = 0
    const lookAtPos: THREE.Quaternion[] = []
    const parent = new THREE.Group()
    const cat = loadModelByName('cat')
    cat.scale.set(0.03125, 0.03125, 0.03125)
    // Raise the box floor.height units up
    const xSpan = 12
    const ySpan = 1
    const zSpan = 10

    for (let i = 0; i < 10; i++) {
        const model = cat.clone()
        // Randomly position the model within the floor bounding box
        model.position.set(
            THREE.MathUtils.randFloat(-xSpan / 2, xSpan / 2),
            THREE.MathUtils.randFloat(2 - ySpan / 2, 2 + ySpan / 2),
            THREE.MathUtils.randFloat(-zSpan / 2, zSpan / 2),
        )
        model.rotation.set(0, THREE.MathUtils.randFloat(Math.PI, 3 * Math.PI), 0)
        model.userData.offset = 60 * THREE.MathUtils.randInt(0, 1000)
        parent.add(model)
        catMeshes.push(model)
    }
    floor.add(parent)

    Events.Instance.on('tick', () => {
        if (!renderer.xr?.getCamera()) return
        const camera = renderer.xr?.getCamera()
        if (camera) {
            pc++
            // Get the camera's orientation, turn it 180 degrees around the Y axis, then push it to lookAtPos
            const yAxisRot = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0))
            const rotatedQuat = yAxisRot.multiply(camera.quaternion.clone())
            lookAtPos.push(rotatedQuat)
        }
        catMeshes.forEach((cat) => {
            const q = lookAtPos[(cat.userData.offset + pc) % lookAtPos.length]
            if (q) {
                cat.quaternion.copy(q)
            }
        })
    })

    return parent
}
