import * as THREE from 'three'
import { Events } from '../libraries/Events'
import { GameProgress } from '../scripts/DJPuzzle'
import { TextMaterial } from '../scripts/TextureUtils'
import { AnimationFactory } from '../scripts/AnimationFactory'
import { DEBUG, Intro, V3_ZERO } from '../scripts/Utils'
import { ProgressEvent } from '../types'

export const GameOverDialog = (): THREE.Object3D => {
    const result = new THREE.Group()
    if (DEBUG) result.name = 'gameOverDialog'
    result.renderOrder = 1
    const lines: string[] = ['You win!', 'Thanks for playing', 'Created by Alex Swan']
    const geometry = new THREE.PlaneGeometry(5, 5)
    geometry.translate(0, -2, 0)

    const gameOverMat = TextMaterial(lines, { color: 'white' })
    const introMat = TextMaterial(Intro, { color: 'white', fontSize: 24 })
    const mesh = new THREE.Mesh(geometry, introMat)
    result.add(mesh)
    mesh.position.set(0, -5, 0)

    Events.Instance.on(ProgressEvent, (progress: GameProgress) => {
        if (progress.color.solved && progress.artist.solved && progress.title.solved) {
            mesh.userData.solved = true
            mesh.visible = true
            mesh.material = gameOverMat
            mesh.material.needsUpdate = true
            mesh.scale.set(0.1, 0.1, 0.1)
            mesh.rotation.set(-Math.PI / 2, 0, 0)
            mesh.position.set(0, 0, -20)
            AnimationFactory.Instance.animateTransform({
                mesh,
                end: {
                    position: V3_ZERO,
                    scaling: new THREE.Vector3(1, 1, 1),
                    rotation: new THREE.Euler(0, 0, 0),
                },
                duration: 1000,
            })
        } else if (progress.bestComboCount > 1) {
            mesh.visible = false
        }
    })
    return result
}
