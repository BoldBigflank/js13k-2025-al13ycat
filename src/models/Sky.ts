import * as THREE from 'https://js13kgames.com/2025/webxr/three.module.js'
import { vectorFromRadians } from '../scripts/Utils'
import { Events } from '../libraries/Events'

export const Sky = (): THREE.Group => {
    const parent = new THREE.Group()
    parent.name = 'Sky'
    const dummy = new THREE.Object3D()
    const size = 30
    const speed = 0.05

    const geometry = new THREE.BoxGeometry()
    const material = new THREE.MeshStandardMaterial()

    const seeds = []
    const baseColors = []
    let offset = 0

    const mesh = new THREE.InstancedMesh(geometry, material, size * size)
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    const color = new THREE.Color()
    const colors = [new THREE.Color(0x00ffff), new THREE.Color(0xffff00), new THREE.Color(0xff00ff)]

    let i = 0 // Mesh Index
    for (let z = 0; z < size; z++) {
        for (let x = 0; x < size; x++) {
            const pos = vectorFromRadians(0, (2 * x * Math.PI) / size, 15)
            pos.z = -z * 4

            dummy.position.copy(pos)

            dummy.scale.set(1, 1, 2)
            dummy.updateMatrix()

            color.setHSL(1, 0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5)
            baseColors.push(color.getHex())

            mesh.setMatrixAt(i, dummy.matrix)
            mesh.setColorAt(i, color.multiply(colors[0]))

            i++

            seeds.push(Math.random())
        }
    }

    parent.add(mesh)

    Events.Instance.on('tick', (dt: number) => {
        offset += dt
        for (let i = 0; i < mesh.count; i++) {
            mesh.getMatrixAt(i, dummy.matrix)
            dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale)

            const zCol = Math.floor(i / size)
            const x = i % size
            const bPos = (2 * x * Math.PI) / size // Original b angle
            const bOffset = speed * (zCol % 2 ? 1 : -1) * offset // Offset
            const zPos = dummy.position.z
            dummy.position.copy(vectorFromRadians(0, bPos + bOffset, 15))
            dummy.position.z = zPos
            dummy.updateMatrix()
            mesh.setMatrixAt(i, dummy.matrix)
        }
        mesh.instanceMatrix.needsUpdate = true
    })
    return parent
}
