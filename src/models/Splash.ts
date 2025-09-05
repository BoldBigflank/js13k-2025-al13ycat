import * as THREE from 'three'
import { Events } from '../libraries/Events'
import { TextMaterial } from '../scripts/TextureUtils'
import { randomUnitCirclePoint } from '../scripts/Utils'

export const Splash = () => {
    const parent = new THREE.Group()
    const speed = 0.2
    let ttl = 0
    const maxTTL = 1.0
    const minTTL = 0.5
    const meshScale = 0.04

    // Make a InstancedMesh of rings
    const geometry = new THREE.RingGeometry(0.5, 1, 32)

    // Make the material TextMaterial of 🎉
    const material = TextMaterial(['🎉'], { textAlign: 'center', fontSize: 1024, ratio: 1 })
    const count = 24
    const mesh = new THREE.InstancedMesh(geometry, material, count)
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage) // will be updated every frame

    const dummy = new THREE.Object3D()

    parent.add(mesh)

    const seeds: number[] = []
    for (let i = 0; i < count; i++) {
        seeds.push(maxTTL - Math.random() * (maxTTL - minTTL))
    }

    Events.Instance.on('splash', (pos: THREE.Vector3) => {
        // Reset everything
        parent.position.copy(pos)
        for (let i = 0; i < count; i++) {
            const radius = 0.17
            dummy.position.copy(randomUnitCirclePoint(radius))
            dummy.position.y = 0.05
            dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
            const scale = meshScale
            dummy.scale.set(scale, scale, scale)
            dummy.updateMatrix()
            mesh.setMatrixAt(i, dummy.matrix)
        }
        mesh.instanceMatrix.needsUpdate = true
        mesh.visible = true
        ttl = 1.0
    })

    Events.Instance.on('tick', (delta: number) => {
        ttl -= delta
        if (ttl < 0) {
            mesh.visible = false
            return
        }
        for (let i = 0; i < count; i++) {
            mesh.getMatrixAt(i, dummy.matrix)
            dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale)
            dummy.position.y += delta * speed

            const scale = seeds[i] < ttl ? meshScale : 0
            dummy.scale.set(scale, scale, scale)
            dummy.updateMatrix()
            mesh.setMatrixAt(i, dummy.matrix)
        }
        mesh.instanceMatrix.needsUpdate = true
    })

    return parent
}
