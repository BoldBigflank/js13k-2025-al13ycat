import * as THREE from 'three'
import { vectorFromRadians } from '../scripts/Utils'
import { Events } from '../libraries/Events'
import { BLUE, NEON_BLUE, RED, WHITE } from '../scripts/Colors'
import { ProgressEvent, TickEvent } from '../types'
import { GameProgress } from '../scripts/DJPuzzle'

// https://dustinpfister.github.io/2021/06/18/threejs-vector3-apply-euler/
// https://threejs.org/examples/#webgl_instancing_dynamic
export const Sky = (): THREE.Group => {
    const parent = new THREE.Group()
    const dummy = new THREE.Object3D()
    const size = 30
    const speed = 0.05

    const geometry = new THREE.BoxGeometry()
    const material = new THREE.MeshStandardMaterial()
    material.emissive = new THREE.Color(BLUE)
    material.emissiveIntensity = 0.2

    const seeds = []
    const baseColors: string[] = []
    let pulses: number[] = [0]
    let offset = 0
    let zAmp = 0

    const mesh = new THREE.InstancedMesh(geometry, material, size * size)
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    const color = new THREE.Color()

    let i = 0 // Mesh Index
    for (let z = 0; z < size; z++) {
        for (let x = 0; x < size; x++) {
            const pos = vectorFromRadians(0, (2 * x * Math.PI) / size, 15)
            pos.z = -z * 4

            dummy.position.copy(pos)

            dummy.scale.set(1, 1, 2)
            dummy.updateMatrix()

            color.setHSL(0.6, 0.5 + Math.random() * 0.5, 0.25 + Math.random() * 0.5)
            baseColors.push(color.getHex())

            mesh.setMatrixAt(i, dummy.matrix)
            mesh.setColorAt(i, color)

            i++

            seeds.push(Math.random())
        }
    }

    parent.add(mesh)

    Events.Instance.on(TickEvent, (dt: number) => {
        offset += dt
        // Color pulse
        for (let i = 0; i < pulses.length; i++) {
            pulses[i] += dt * 4
        }
        pulses = pulses.filter((p) => p < 10)

        for (let i = 0; i < mesh.count; i++) {
            mesh.getMatrixAt(i, dummy.matrix)
            dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale)

            const zCol = Math.floor(i / size)
            const direction = zCol % 2 ? 1 : -1
            const x = i % size
            const z = -zCol * 4
            const bPos = (2 * x * Math.PI) / size // Original b angle
            const bOffset = speed * direction * offset // Offset

            const isPulsing = pulses.some((p) => zCol === Math.floor(p * 4))
            const r = 15
            dummy.position.copy(vectorFromRadians(0, bPos + bOffset, r))
            dummy.position.z = z + zAmp * direction * Math.sin(offset)
            dummy.updateMatrix()
            mesh.setMatrixAt(i, dummy.matrix)

            mesh.setColorAt(i, isPulsing ? color.setStyle(WHITE) : color.setHex(baseColors[i]))
        }
        mesh.instanceMatrix.needsUpdate = true
        mesh.instanceColor.needsUpdate = true
    })
    Events.Instance.on(ProgressEvent, (progress: GameProgress) => {
        zAmp = progress.bestComboCount >= 6 ? 1 : 0
        pulses.push(0)
    })
    return parent
}
