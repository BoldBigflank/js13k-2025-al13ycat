// @ts-ignore
import * as THREE from 'https://js13kgames.com/2025/webxr/three.module.js'
import { Events } from '../libraries/Events'
import { GameProgress } from '../scripts/DJPuzzle'
import { TextMaterial } from '../scripts/TextureUtils'
import { AnimationFactory } from '../scripts/AnimationFactory'

export const GameOverDialog = (): THREE.Object3D => {
    const result = new THREE.Group()
    result.name = 'debugScreen'
    result.renderOrder = 1
    const lines: string[] = ['You win!', 'Thanks for playing', 'Created by Alex Swan']
    const geometry = new THREE.PlaneGeometry(5, 5)
    geometry.translate(0, -2, 0)

    const material = TextMaterial(lines, { color: 'white' })
    const mesh = new THREE.Mesh(geometry, material)
    result.add(mesh)
    mesh.position.set(0, 0, -20)
    mesh.scale.set(0.1, 0.1, 0.1)
    mesh.rotation.set(-Math.PI / 2, 0, 0)
    mesh.visible = false

    Events.Instance.on('progress', (progress: GameProgress) => {
        if (progress.color.solved && progress.artist.solved && progress.title.solved) {
            console.log('time to show')
            mesh.userData.solved = true
            mesh.visible = true
            mesh.material.needsUpdate = true
            AnimationFactory.Instance.animateTransform({
                mesh,
                end: {
                    position: {
                        x: 0,
                        y: 0,
                        z: 0,
                    },
                    scaling: {
                        x: 1,
                        y: 1,
                        z: 1,
                    },
                    rotation: new THREE.Euler(0, 0, 0),
                },
                duration: 1000,
            })
        }
    })
    return result
}
