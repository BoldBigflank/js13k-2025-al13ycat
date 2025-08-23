import * as THREE from 'https://js13kgames.com/2025/webxr/three.module.js'
import { Events } from '../libraries/Events'
import { initCanvas } from '../scripts/Utils'

export const GameOverDialog = (): THREE.Object3D => {
    const result = new THREE.Group()
    result.name = 'debugScreen'
    result.renderOrder = 1
    const lines: string[] = ['You win!', 'Thanks for playing', 'Created by Alex Swan']
    const geometry = new THREE.PlaneGeometry(5, 5)
    geometry.translate(0, -2, 0)
    const [canvas, ctx] = initCanvas(1024)
    const texture = new THREE.CanvasTexture(canvas)
    texture.encoding = THREE.LinearSRGBColorSpace
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
    })
    const mesh = new THREE.Mesh(geometry, material)
    result.add(mesh)
    mesh.position.set(0, 0, 0)

    const update = () => {
        if (!mesh.userData.solved) return
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.globalAlpha = 0.5
        ctx.fillStyle = 'black'
        ctx.fillRect(0, 0, canvas.width, canvas.height * 0.2)
        ctx.globalAlpha = 1
        const fontSize = 64
        ctx.fillStyle = 'white'
        ctx.textBaseline = 'top'
        ctx.textAlign = 'center'
        ctx.font = `${fontSize}px monospace`
        lines.forEach((line, index) => {
            ctx.fillText(line, canvas.width / 2, fontSize * index)
        })
        texture.needsUpdate = true
    }
    Events.Instance.on('solved', (solvedCombo: Record<string, boolean>) => {
        if (solvedCombo.color && solvedCombo.artist && solvedCombo.title) {
            mesh.userData.solved = true
        }
        update()
    })
    return result
}
