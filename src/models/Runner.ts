import * as THREE from 'https://js13kgames.com/2025/webxr/three.module.js'
import { AnimationFactory } from '../scripts/AnimationFactory'
import { loadModelByName } from '../scripts/modelLoader'
import { Events } from '../libraries/Events'
import { BLACK, BLUE, GREEN, ORANGE, RED, VIOLET, YELLOW } from '../scripts/Colors'

export const Runner = (length: number): THREE.Group => {
    const parent = new THREE.Group()
    parent.name = 'Runner'
    let colors = [RED, ORANGE, YELLOW, GREEN, BLUE, VIOLET]
    while (colors.length < length) {
        colors.push(...colors)
    }
    colors = colors.slice(0, length)
    let offset = 0

    const geometry = new THREE.BoxGeometry()
    geometry.translate(0.5, 0.5, 0.5)
    for (let i = 0; i < length; i++) {
        const material = new THREE.MeshBasicMaterial({ color: BLACK })
        const mesh = new THREE.Mesh(geometry, material)
        mesh.name = `runner-${i}`
        mesh.userData.index = i
        mesh.position.set(-length / 2 + i, 0, 0)
        parent.attach(mesh)
    }

    Events.Instance.on('beat', () => {
        offset += 1
        parent.children.forEach((mesh) => {
            const colorIndex = offset % colors.length
            const color = colorIndex === mesh.userData.index ? colors[colorIndex] : BLACK
            colors[mesh.userData.index]
            mesh.material.color.set(color)
        })
    })
    return parent
}
