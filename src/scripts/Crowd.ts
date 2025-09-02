// @ts-ignore
import * as THREE from 'https://js13kgames.com/2025/webxr/three.module.js'
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

type Pose = {
    camera?: THREE.Matrix4
    controllers: THREE.Matrix4[]
}

export const Crowd = (renderer: THREE.WebGLRenderer) => {
    const parent = new THREE.Group()
    parent.name = 'Crowd'
    const dummy = new THREE.Object3D()

    // Instanced meshes
    const rows = 8
    const cols = 10
    const headsGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5)
    const headsMaterial = new THREE.MeshStandardMaterial()
    const headsMesh = new THREE.InstancedMesh(headsGeometry, headsMaterial, rows * cols)
    headsMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)

    // const handsGeometry = new THREE.SphereGeometry(0.3, 8, 8)
    const handsGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.6)
    const handsMaterial = new THREE.MeshStandardMaterial()
    const handsMesh = new THREE.InstancedMesh(handsGeometry, handsMaterial, rows * cols * 2)
    handsMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)

    // Color setup for instances
    const headColor = new THREE.Color()
    const handColor = new THREE.Color()

    // Add instanced meshes to parent
    parent.add(headsMesh)
    parent.add(handsMesh)

    // Store instance data
    const catOffset = new THREE.Vector3(0, -1, 0)
    const instanceData: Array<{
        positionOffset: THREE.Vector3
        poseDelay: number
        palette: any
    }> = []

    const poses: Pose[] = []

    // Initialize instance data and set up matrices
    for (let z = 0; z < rows; z++) {
        for (let x = 0; x < cols; x++) {
            const i = x + z * rows
            const palette = sample(CAT_COLORS)
            const positionOffset = new THREE.Vector3(2 * x - cols + 0.5, 0, 2 * z - rows + 0.5)
            if (Math.abs(positionOffset.x) >= 5) positionOffset.y += 5
            const jank = new THREE.Vector3(
                THREE.MathUtils.randFloatSpread(0.3),
                THREE.MathUtils.randFloatSpread(0.1),
                THREE.MathUtils.randFloatSpread(0.3),
            )
            positionOffset.add(jank)

            // Set up head instance
            dummy.position.copy(positionOffset).add(catOffset)
            dummy.lookAt(0, 6, 0)
            dummy.updateMatrix()
            headsMesh.setMatrixAt(i, dummy.matrix)

            // Set head color
            headColor.setStyle(palette.Purple)
            headsMesh.setColorAt(i, headColor)

            // Set up hand instances
            for (let n = 0; n < 2; n++) {
                const handIndex = i * 2 + n
                dummy.position.copy(positionOffset)
                dummy.updateMatrix()
                handsMesh.setMatrixAt(handIndex, dummy.matrix)

                // Set hand color
                handColor.setStyle(palette.Purple)
                handsMesh.setColorAt(handIndex, handColor)
            }

            instanceData.push({
                positionOffset,
                poseDelay: THREE.MathUtils.randInt(0, 15),
                palette,
            })
        }
    }

    Events.Instance.on('tick', () => {
        // Record the current pose
        if (!renderer.xr?.getCamera()) return
        const camera = renderer.xr?.getCamera()
        const pose: Pose = {
            controllers: [],
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
        })
        // Save the camera matrix
        if (camera) {
            pose.camera = camera.matrix.clone()
            poses.push(pose)
            if (poses.length > 60) poses.shift()
        }

        // Cut short when we haven't saved anything
        if (poses.length == 0) {
            headsMesh.visible = false
            handsMesh.visible = false
            return
        }

        // Update instanced meshes
        instanceData.forEach((data, i) => {
            const pose = poses[Math.max(0, poses.length - 1 - data.poseDelay)]
            if (!pose?.camera) return

            // Update head instance
            dummy.matrix.copy(pose.camera)
            dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale)
            dummy.position.add(data.positionOffset).add(catOffset)
            // dummy.lookAt(0, 6, 0)
            dummy.updateMatrix()
            headsMesh.setMatrixAt(i, dummy.matrix)

            // Update hand instances
            pose.controllers.forEach((controller, controllerIndex) => {
                const handIndex = i * 2 + controllerIndex
                dummy.matrix.copy(controller)
                dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale)
                dummy.position.add(data.positionOffset).add(catOffset)
                // Position hands slightly offset from the head
                dummy.position.add(new THREE.Vector3(controllerIndex === 0 ? -0.1 : 0.1, 0.2, -0.3))
                dummy.updateMatrix()
                handsMesh.setMatrixAt(handIndex, dummy.matrix)
            })
        })

        // Mark matrices as needing update
        headsMesh.instanceMatrix.needsUpdate = true
        handsMesh.instanceMatrix.needsUpdate = true
    })

    return parent
}
