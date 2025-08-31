import * as THREE from 'https://js13kgames.com/2025/webxr/three.module.js'
import { Events } from '../libraries/Events'
import { BLACK, BLUE, GREEN, ORANGE, RED, VIOLET, YELLOW } from '../scripts/Colors'
import { AnimationFactory, sinusoidal } from '../scripts/AnimationFactory'

export const Runner = (length: number): THREE.Group => {
    const parent = new THREE.Group()
    parent.name = 'Runner'
    let colors = [RED, ORANGE, YELLOW, GREEN, BLUE, VIOLET]
    let functions = [
        (x, y) => x === 0 || y === 0,
        (x, y) => x === 1 || y === 1,
        (x, y) => x === 2 || y === 2,
        (x, y) => x === 3 || y === 3,
        (x, y) => x === 4 || y === 4,
        (x, y) => x === 5 || y === 5,
        (x, y) => y + x === 0 || 2 * length - x - y - 2 === 0,
        (x, y) => y + x === 1 || 2 * length - x - y - 2 === 1,
        (x, y) => y + x === 2 || 2 * length - x - y - 2 === 2,
        (x, y) => y + x === 3 || 2 * length - x - y - 2 === 3,
        (x, y) => y + x === 4 || 2 * length - x - y - 2 === 4,
        (x, y) => y + x === 5 || 2 * length - x - y - 2 === 5,
        (x, y) => (x + y) % 2 === 0,
        (x, y) => (x + y) % 2 === 1,
        (x, y) => (x + y) % 2 === 0,
        (x, y) => (x + y) % 2 === 1,
        (x, y) => (x + y) % 2 === 0,
        (x, y) => (x + y) % 2 === 1,
    ]
    while (colors.length < length) {
        colors.push(...colors)
    }
    colors = colors.slice(0, length)
    let offset = -2

    const geometry = new THREE.BoxGeometry()
    geometry.translate(0.5, 0.5, 0.5)
    geometry.scale(0.9, 1.1, 0.9)

    for (let y = 0; y < length; y++) {
        for (let x = 0; x < length; x++) {
            const material = new THREE.MeshStandardMaterial({ color: BLACK })
            const mesh = new THREE.Mesh(geometry, material)
            mesh.name = `runner-${x}-${y}`
            mesh.userData.x = x
            mesh.userData.y = y
            mesh.position.set(-length / 2 + x, 0, -length / 2 + y)
            parent.attach(mesh)
        }
    }

    Events.Instance.on('beat', () => {
        offset += 1
        if (offset < 0) return
        parent.children.forEach((mesh: THREE.Object3D) => {
            const { x, y } = mesh.userData
            const lit = functions[offset % functions.length](x, y)
            const color = lit ? colors[offset % colors.length] : BLACK
            mesh.material.needsUpdate = true
            mesh.material.color.set(color)
            mesh.material.emissive.set(lit ? color : BLACK)
            mesh.material.needsUpdate = true
            mesh.material.emissiveIntensity = lit ? 1 : 0
            if (lit) {
                AnimationFactory.Instance.animateTransform({
                    mesh,
                    end: {
                        scaling: new THREE.Vector3(1, lit ? 1.1 : 1, 1),
                    },
                    duration: 500,
                    ease: sinusoidal,
                })
            }
        })
    })
    return parent
}
