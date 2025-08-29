import * as THREE from 'https://js13kgames.com/2025/webxr/three.module.js'
import { createModel } from './modelLoader'
import { catModel } from '../models/exported/cat'
import { Events } from '../libraries/Events.js'
import { CAT_BLACK, CAT_GREY, LIGHT_GREY } from './Colors.js'

const CAT_COLORS = [
    {
        Purple: CAT_BLACK,
        Silver: CAT_GREY,
        Yellow: LIGHT_GREY,
    },
]

export const Crowd = (renderer: THREE.WebGLRenderer) => {
    const catMeshes: THREE.Object3D[] = []
    let pc = 0
    const lookAtPos: THREE.Quaternion[] = []
    const parent = new THREE.Group()
    const cat = createModel(catModel(), CAT_COLORS[0]) // TODO: More cat colors, randomize
    cat.scale.set(0.03125, 0.03125, 0.03125)
    // Raise the box floor.height units up
    // const xSpan = 10
    // const ySpan = 1
    // const zSpan = 10
    const xSpan = 6
    const ySpan = 1
    const zSpan = 6

    for (let i = 0; i < 10; i++) {
        const model = cat.clone()
        parent.add(model)
        // Randomly position the model within the floor bounding box
        model.position.set(
            xSpan * Math.random() - 0.5 * xSpan,
            ySpan * Math.random() - 0.5 * ySpan,
            zSpan * Math.random() - 0.5 * zSpan,
        )
        model.userData.offset = 60 * THREE.MathUtils.randInt(0, 1000)
        model.lookAt(0, 6, 0)
        catMeshes.push(model)
    }

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
