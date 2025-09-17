import * as THREE from 'three'
import { Events } from '../libraries/Events.js'
import {
    BLACK,
    BROWN,
    CAT_BLACK,
    CAT_GREY,
    DARK_GREY,
    MID_GREY,
    NEON_BLUE,
    NEON_BROWN,
    NEON_ORANGE,
    NEON_PURPLE,
    ORANGE,
    TYPE_COLORS,
} from './Colors.js'
import { randF, sample, waveHeight } from './Utils.js'
import { GameProgress } from './DJPuzzle.js'
import { ProgressEvent, TickEvent } from '../types.js'
import { CrowdHead, CrowdPaw } from '../models/CrowdHead.js'

const CAT_COLORS = [
    CAT_BLACK,
    ORANGE,
    MID_GREY,
    NEON_BROWN,
    NEON_PURPLE,
    DARK_GREY,
    NEON_BLUE,
    CAT_GREY,
    BROWN,
    NEON_ORANGE,
]

const MIN_POS = new THREE.Vector3(-1, 1, -1)
const MAX_POS = new THREE.Vector3(1, 2, 1)

type Pose = {
    camera?: THREE.Matrix4
    controllers: THREE.Matrix4[]
}

export const Crowd = (renderer: THREE.WebGLRenderer) => {
    const parent = new THREE.Group()
    const dummy = new THREE.Object3D()
    let shouldWave = false

    // Instanced meshes
    const rows = 8
    const cols = 10

    // Head
    const crowdHead = CrowdHead()

    const headsMaterial = new THREE.MeshStandardMaterial()
    const headsMesh = new THREE.InstancedMesh(crowdHead, headsMaterial, rows * cols)
    headsMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)

    // const handsGeometry = new THREE.SphereGeometry(0.3, 8, 8)
    const handsGeometry = CrowdPaw()
        .rotateX(Math.PI / 2)
        .translate(0, 2, 0)
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
        color: any
    }> = []

    const poses: Pose[] = []

    // Initialize instance data and set up matrices
    for (let z = 0; z < rows; z++) {
        for (let x = 0; x < cols; x++) {
            const i = x + z * rows
            const color = sample(CAT_COLORS)
            const positionOffset = new THREE.Vector3(2 * x - cols + 0.5 + (z % 2) * 1, 0, 2 * z - rows + 0.5)
            if (Math.abs(positionOffset.x) >= 5) {
                positionOffset.y += 5
            }
            const jank = new THREE.Vector3(randF(0.3), randF(0.1), randF(0.3))
            positionOffset.add(jank)

            // Set up head instance
            dummy.position.copy(positionOffset).add(catOffset)
            dummy.lookAt(0, 6, 0)
            dummy.updateMatrix()
            headsMesh.setMatrixAt(i, dummy.matrix)

            // Set head color
            headColor.setStyle(color)
            headsMesh.setColorAt(i, headColor)

            // Set up hand instances
            for (let n = 0; n < 2; n++) {
                const handIndex = i * 2 + n
                dummy.position.copy(positionOffset)
                dummy.updateMatrix()
                handsMesh.setMatrixAt(handIndex, dummy.matrix)

                // Set hand color
                handColor.setStyle(color)
                handsMesh.setColorAt(handIndex, handColor)
            }

            instanceData.push({
                positionOffset,
                poseDelay: THREE.MathUtils.randInt(0, 15),
                color,
            })
        }
    }

    Events.Instance.on(ProgressEvent, (progress: GameProgress) => {
        shouldWave = progress.bestComboCount >= 3
        handsMaterial.emissive.set(progress.bestComboCount >= 4 ? TYPE_COLORS[progress.bestComboType] : BLACK)
        handsMaterial.emissiveIntensity = progress.bestComboCount >= 4 ? 0.8 : 0
    })

    Events.Instance.on(TickEvent, () => {
        // Record the current pose
        const camera = renderer.xr?.getCamera()
        if (!camera) return
        const pose: Pose = {
            controllers: [],
        }
        // Save the controller matrix
        ;[0, 1].forEach((controllerIndex) => {
            const controller = renderer.xr?.getController(controllerIndex)
            if (controller) {
                const pawMesh = controller.getObjectByName('p')
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
            dummy.position.clamp(MIN_POS, MAX_POS).add(data.positionOffset).add(catOffset)
            if (shouldWave && dummy.position.y < 4) {
                dummy.position.y += waveHeight(dummy.position.x, dummy.position.z)
            }
            dummy.updateMatrix()
            headsMesh.setMatrixAt(i, dummy.matrix)

            // Update hand instances
            pose.controllers.forEach((controller, controllerIndex) => {
                const handIndex = i * 2 + controllerIndex
                dummy.matrix.copy(controller)
                dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale)
                dummy.position.clamp(MIN_POS, MAX_POS).add(data.positionOffset).add(catOffset)
                // Position hands slightly offset from the head
                dummy.position.add(new THREE.Vector3(controllerIndex === 0 ? -0.1 : 0.1, 0.2, -0.3))
                if (shouldWave && dummy.position.y < 4) {
                    dummy.position.y += waveHeight(dummy.position.x, dummy.position.z)
                }
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
