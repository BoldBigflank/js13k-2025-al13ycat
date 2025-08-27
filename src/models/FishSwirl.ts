import * as THREE from 'https://js13kgames.com/2025/webxr/three.module.js'
import { AnimationFactory } from '../scripts/AnimationFactory'
import { loadModelByName } from '../scripts/modelLoader'
import { Events } from '../libraries/Events'
import { GameProgress } from '../scripts/DJPuzzle'
import { INCHES_TO_METERS_SCALE } from '../scripts/Utils'

export const FishSwirl = (): THREE.Group => {
    const axis = new THREE.Vector3(1, 0, 0)
    const parent = new THREE.Group()
    parent.name = 'FishSwirl'
    const fishPond: THREE.Group[] = []
    let visible = true

    const swirl = new THREE.Group()

    const mesh = loadModelByName('goldfish')

    for (let i = 0; i < 10; i++) {
        const clone = mesh.clone(true)
        clone.position.set(Math.random() * 10 - 5, 0, 0)
        fishPond.push(clone)
        swirl.attach(clone)
        clone.userData.velocity = new THREE.Vector3(0, 5 + 3 * Math.random(), -5)
        clone.scale.set(0, 0, 0)
    }
    swirl.rotation.set(0, 0, 0)

    parent.attach(swirl)

    Events.Instance.on('tick', (dt: number) => {
        fishPond.forEach((fish) => {
            // Update the velocity
            fish.userData.velocity.y -= 10 * dt
            fish.position.addScaledVector(fish.userData.velocity, dt)
            if (fish.position.y < 0) {
                // Reset, go again
                fish.position.y = 0

                fish.rotation.y += Math.PI
                fish.userData.velocity.y = 5 + 6 * Math.random()
                fish.userData.velocity.z = -1 * fish.userData.velocity.z
            }
        })
    })
    Events.Instance.on('progress', (progress: GameProgress) => {
        fishPond.forEach((fish) => {
            if (progress.bestComboCount >= 3 && !visible) {
                AnimationFactory.Instance.cancelAnimation(fish)
                AnimationFactory.Instance.animateTransform({
                    mesh: fish,
                    end: {
                        scaling: new THREE.Vector3(
                            INCHES_TO_METERS_SCALE,
                            INCHES_TO_METERS_SCALE,
                            INCHES_TO_METERS_SCALE,
                        ),
                    },
                    duration: 2000,
                })
            } else if (progress.bestComboCount < 3 && visible) {
                AnimationFactory.Instance.cancelAnimation(fish)
                AnimationFactory.Instance.animateTransform({
                    mesh: fish,
                    end: {
                        scaling: new THREE.Vector3(0, 0, 0),
                    },
                    duration: 1000,
                })
            }
        })
        visible = progress.bestComboCount >= 3
    })
    return parent
}
