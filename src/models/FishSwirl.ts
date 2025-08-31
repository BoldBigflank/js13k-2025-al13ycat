import * as THREE from 'https://js13kgames.com/2025/webxr/three.module.js'
import { AnimationFactory } from '../scripts/AnimationFactory'
import { createModel } from '../scripts/modelLoader'
import { goldfishModel } from './exported/goldfish'
import { Events } from '../libraries/Events'
import { GameProgress } from '../scripts/DJPuzzle'
import { INCHES_TO_METERS_SCALE } from '../scripts/Utils'
import { BLACK, NEON_BLUE, NEON_PURPLE } from '../scripts/Colors'

const FISH_PALETTES = [
    {},
    {
        Orange: NEON_PURPLE, // Body
        Purple: BLACK, // Eyes
        Silver: NEON_BLUE, // Fins
    },
]

const FISH_SCALE = new THREE.Vector3(0.05, 0.05, 0.05)

export const FishSwirl = (): THREE.Group => {
    const axis = new THREE.Vector3(1, 0, 0)
    const parent = new THREE.Group()
    parent.name = 'FishSwirl'
    const fishPond: THREE.Group[] = []
    let visible = true

    const swirl = new THREE.Group()

    const mesh = createModel(goldfishModel(), FISH_PALETTES[THREE.MathUtils.randInt(0, FISH_PALETTES.length)])

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

                // Turn to center
                // Get direction to center (0,0,0) from fish's current position
                const toCenter = new THREE.Vector3(Math.random() * 4 - 2, 0, Math.random() * 4 - 2)
                    .sub(fish.position)
                    .normalize()
                // Create rotation to face that direction
                const targetRotation = new THREE.Quaternion()
                targetRotation.setFromUnitVectors(new THREE.Vector3(0, 0, -1), toCenter)
                fish.quaternion.copy(targetRotation)
                fish.position.y = 0
                // Use y rotation to set velocity

                const forward = new THREE.Vector3(0, 0, -1)
                forward.applyQuaternion(fish.quaternion)
                forward.multiplyScalar(5) // Keep same speed as before
                fish.userData.velocity.x = forward.x
                fish.userData.velocity.z = forward.z
                fish.userData.velocity.y = 5 + 6 * Math.random()
            }
            // Set the fish rotation to the direction of the velocity
            // quaternion setfrom unitvectors
            const fishFaceQuaternion = new THREE.Quaternion()
            fishFaceQuaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), fish.userData.velocity)
            fish.quaternion.copy(fishFaceQuaternion)
        })
    })
    Events.Instance.on('progress', (progress: GameProgress) => {
        const showFish = progress.bestComboCount >= 4
        const shouldUpdate = showFish !== visible
        fishPond.forEach((fish) => {
            if (shouldUpdate) {
                AnimationFactory.Instance.cancelAnimation(fish)
                AnimationFactory.Instance.animateTransform({
                    mesh: fish,
                    end: {
                        scaling: showFish ? FISH_SCALE : new THREE.Vector3(0, 0, 0),
                    },
                    duration: showFish ? 2000 : 1000,
                })
            }
        })
        visible = showFish
    })
    return parent
}
