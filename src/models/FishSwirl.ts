import * as THREE from 'three'
import { AnimationFactory } from '../scripts/AnimationFactory'
import { createModel } from '../scripts/ModelLoader'
import { goldfishModel } from './exported/goldfish'
import { Events } from '../libraries/Events'
import { GameProgress } from '../scripts/DJPuzzle'
import {
    BLACK,
    CAT_GREY,
    NEON_BLUE,
    NEON_BROWN,
    NEON_GREEN,
    NEON_ORANGE,
    NEON_PURPLE,
    NEON_YELLOW,
} from '../scripts/Colors'
import { FishJuggledEvent, InteractiveObject3D, ProgressEvent, SplashEvent, TickEvent } from '../types'
import { PickupSFX, SolvedSFX } from '../audio/music'
import { V3_ZERO } from '../scripts/Utils'

const FISH_PALETTES = [
    {
        Orange: NEON_ORANGE,
        Purple: BLACK,
        Silver: NEON_YELLOW,
    },
    {
        Orange: NEON_PURPLE, // Body
        Purple: BLACK, // Eyes
        Silver: NEON_BLUE, // Fins
    },
    {
        Orange: NEON_GREEN, // Body
        Purple: NEON_BROWN, // Eyes
        Silver: CAT_GREY, // Fins
    },
]

const FISH_SCALE = new THREE.Vector3(0.05, 0.05, 0.05)

export const FishSwirl = (): THREE.Group => {
    const parent = new THREE.Group()
    const fishPond: InteractiveObject3D[] = []
    let visible = true

    for (let i = 0; i < 10; i++) {
        const palette = FISH_PALETTES[THREE.MathUtils.randInt(0, FISH_PALETTES.length - 1)]
        const mesh = createModel(goldfishModel(), { palette, glow: true }) as InteractiveObject3D
        const clone = mesh.clone(true)
        clone.userData.velocity = new THREE.Vector3(0, 5 + 3 * Math.random(), -5)
        clone.userData.isPickable = true
        clone.userData.shot = 0
        clone.onPointerPick = () => {
            PickupSFX()
            clone.userData.shot += 1
            clone.userData.velocity.set(0, 10, 0)
            Events.Instance.emit(SplashEvent, clone.getWorldPosition(new THREE.Vector3()))
            Events.Instance.emit(FishJuggledEvent, clone.userData.shot)
        }
        clone.position.set(Math.random() * 10 - 5, 0, 0)
        fishPond.push(clone)
        parent.attach(clone)
        clone.scale.set(0, 0, 0)
    }

    Events.Instance.on(TickEvent, (dt: number) => {
        fishPond.forEach((fish) => {
            // Update the velocity
            fish.userData.velocity.y -= 10 * dt
            fish.position.addScaledVector(fish.userData.velocity, dt)
            if (fish.position.y < -2) {
                // Reset, go again
                if (fish.userData.shot > 0) {
                    SolvedSFX()
                    Events.Instance.emit(FishJuggledEvent, 0)
                }
                fish.userData.shot = 0

                // Turn to center
                // Get direction to center (0,0,0) from fish's current position
                const toCenter = new THREE.Vector3(Math.random() * 4 - 2, 0, Math.random() * 4 - 2)
                    .sub(fish.position)
                    .normalize()
                // Create rotation to face that direction
                const targetRotation = new THREE.Quaternion()
                targetRotation.setFromUnitVectors(new THREE.Vector3(0, 0, -1), toCenter)
                fish.quaternion.copy(targetRotation)
                fish.position.y = -2
                // Use y rotation to set velocity

                const forward = new THREE.Vector3(0, 0, -1)
                forward.applyQuaternion(fish.quaternion)
                forward.multiplyScalar(5) // Keep same speed as before
                fish.userData.velocity.x = forward.x
                fish.userData.velocity.z = forward.z
                fish.userData.velocity.y = 7 + 6 * Math.random()
            }
            // Set the fish rotation to the direction of the velocity
            const fishFaceQuaternion = new THREE.Quaternion()
            fishFaceQuaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), fish.userData.velocity)
            fish.quaternion.copy(fishFaceQuaternion)
        })
    })
    Events.Instance.on(ProgressEvent, (progress: GameProgress) => {
        const showFish = progress.bestComboCount >= 5
        const shouldUpdate = showFish !== visible
        fishPond.forEach((fish) => {
            if (shouldUpdate) {
                AnimationFactory.Instance.cancelAnimation(fish)
                AnimationFactory.Instance.animateTransform({
                    mesh: fish,
                    end: {
                        scaling: showFish ? FISH_SCALE : V3_ZERO,
                    },
                    duration: showFish ? 2000 : 1000,
                })
            }
        })
        visible = showFish
    })
    return parent
}
