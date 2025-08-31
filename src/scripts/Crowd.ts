import * as THREE from 'https://js13kgames.com/2025/webxr/three.module.js'
import { createModel } from './modelLoader'
import { catModel } from '../models/exported/cat'
import { Events } from '../libraries/Events.js'
import {
    CAT_BLACK,
    CAT_GREY,
    LIGHT_GREEN,
    LIGHT_GREY,
    MID_GREY,
    NEON_RED,
    NEON_YELLOW,
    ORANGE,
    YELLOW,
} from './Colors.js'
import { sample } from './Utils.js'
import { Paw } from '../models/Paw.js'

const CAT_COLORS = [
    {
        Purple: CAT_BLACK,
        Silver: CAT_GREY,
        Yellow: LIGHT_GREY,
        Red: NEON_RED, // Paw Beans
    },
    {
        Purple: ORANGE, // Body
        Silver: YELLOW, // Whiskers
        Yellow: LIGHT_GREEN, // Eyes/ears
        Red: NEON_RED, // Paw Beans
    },
    {
        Purple: MID_GREY, // Body
        Silver: LIGHT_GREY, // Whiskers
        Yellow: NEON_YELLOW, // Eyes/ears
        Red: NEON_RED, // Paw Beans
    },
]

type Transform = {
    id: number
    position: THREE.Vector3
    rotation: THREE.Quaternion
}

type Pose = {
    camera?: THREE.Matrix4
    controllers: THREE.Matrix4[]
}

export const Crowd = (renderer: THREE.WebGLRenderer) => {
    const catOffset = new THREE.Vector3(0, -1, 0)
    const catMeshes: THREE.Object3D[] = []
    let pc = 0
    const poses: Pose[] = []
    const parent = new THREE.Group()
    // Raise the box floor.height units up
    const xSpan = 6
    const ySpan = 0.5
    const zSpan = 6

    for (let i = 0; i < 10; i++) {
        const palette = sample(CAT_COLORS)
        const cat = createModel(catModel(), palette)
        cat.scale.set(0.03125, 0.03125, 0.03125)
        parent.add(cat)

        for (let n = 0; n < 2; n++) {
            const paw = Paw(palette)
            paw.name = `paw-${i}-${n}`
            paw.position.copy(cat.position)
            paw.position.z += 1
            parent.add(paw)
        }

        // Randomly position the model within the floor bounding box
        cat.userData.positionOffset = new THREE.Vector3(
            xSpan * Math.random() - 0.5 * xSpan,
            ySpan * Math.random() - 0.5 * ySpan,
            zSpan * Math.random() - 0.5 * zSpan,
        )
        cat.userData.poseOffset = THREE.MathUtils.randInt(0, poses.length)
        cat.lookAt(0, 6, 0)
        catMeshes.push(cat)
    }

    Events.Instance.on('tick', () => {
        // Record the current pose
        if (!renderer.xr?.getCamera()) return
        const camera = renderer.xr?.getCamera()
        const dummy = new THREE.Object3D()
        const pose: Pose = {
            controllers: [],
        }
        // Save the camera matrix
        if (camera) {
            pc++
            pose.camera = camera.matrix.clone()
        }
        // Save the controller matrix
        ;[0, 1].forEach((controllerIndex) => {
            const controller = renderer.xr?.getController(controllerIndex)
            if (controller) {
                const pawMesh = controller.getObjectByName('paw')
                if (pawMesh) {
                    pose.controllers.push(pawMesh.matrixWorld.clone())
                }
            }
            poses.push(pose)
        })

        // Cut short when we haven't saved anything
        if (poses.length == 0) return

        // Play the pose back
        catMeshes.forEach((cat, i) => {
            const pose = poses[cat.userData.poseOffset]
            // Apply the camera matrix
            dummy.matrix.copy(pose.camera)
            dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale)
            cat.quaternion.copy(dummy.quaternion)
            cat.position.copy(dummy.position.add(cat.userData.positionOffset).add(catOffset))
            // Apply the controller matrices
            pose.controllers.forEach((controller, controllerIndex) => {
                const paw = parent.getObjectByName(`paw-${i}-${controllerIndex}`)
                if (paw) {
                    dummy.matrix.copy(controller)
                    dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale)
                    paw.position.copy(dummy.position.add(cat.userData.positionOffset))
                    paw.quaternion.copy(dummy.quaternion)
                }
            })
            cat.userData.poseOffset += 1
            if (cat.userData.poseOffset % 600 === 0) {
                cat.userData.poseOffset = THREE.MathUtils.randInt(0, Math.floor(poses.length / 600)) * 600
            }
        })
    })

    return parent
}
