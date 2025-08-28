import * as THREE from 'https://js13kgames.com/2025/webxr/three.module.js'
import { Events } from '../libraries/Events'
import { initCanvas } from '../scripts/Utils'
import { GameProgress, Progress } from '../scripts/DJPuzzle'
import { TextMaterial } from '../scripts/TextureUtils'

export const GameOverDialog = (): THREE.Object3D => {
    const result = new THREE.Group()
    result.name = 'debugScreen'
    result.renderOrder = 1
    const lines: string[] = ['You win!', 'Thanks for playing', 'Created by Alex Swan']
    const geometry = new THREE.PlaneGeometry(5, 5)
    geometry.translate(0, -2, 0)

    // const [canvas, ctx] = initCanvas()
    // const texture = new THREE.CanvasTexture(canvas)
    // texture.encoding = THREE.LinearSRGBColorSpace
    // const material = new THREE.MeshBasicMaterial({
    //     map: texture,
    // })
    const material = TextMaterial(lines, { color: 'white' })
    const mesh = new THREE.Mesh(geometry, material)
    result.add(mesh)
    mesh.position.set(0, 0, 0)
    mesh.visible = false

    Events.Instance.on('progress', (progress: GameProgress) => {
        if (progress.color.solved && progress.artist.solved && progress.title.solved) {
            console.log('time to show')
            mesh.userData.solved = true
            mesh.visible = true
            mesh.material.needsUpdate = true
        }
    })
    return result
}
