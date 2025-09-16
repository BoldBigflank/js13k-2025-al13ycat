import * as THREE from 'three'
import { createModel } from '../scripts/ModelLoader'
import { progressModel } from './exported/progress'
import { BLACK, BLUE, CAT_BLACK, LIGHT_GREY, MAGENTA } from '../scripts/Colors'
import { Events } from '../libraries/Events'
import { TYPE_COLORS } from '../scripts/Colors'
import { GameProgress, SequenceType, SequenceTypes, SOLUTION_COLOR_HEX, TYPE_FONTSIZES } from '../scripts/DJPuzzle'
import { TextMaterial } from '../scripts/TextureUtils'
import { ProgressEvent } from '../types'

export const Progress = (): THREE.Object3D => {
    const mesh = createModel(progressModel(), {
        palette: {
            Red: BLACK, // Display,
            Green: LIGHT_GREY, // Case
            Blue: BLUE, // Base
            Silver: BLACK, // LEDs
            Yellow: MAGENTA, // Glow
        },
        glow: [1],
    }) as THREE.Object3D
    mesh.scale.set(0.1, 0.1, 0.1)

    Events.Instance.on(ProgressEvent, (progress: GameProgress) => {
        // The label
        const display = mesh.getObjectByName('display')
        // 11.8 by 0.8
        display.material = TextMaterial([progress.displayText], {
            color: TYPE_COLORS[progress.bestComboType],
            textAlign: 'left',
            ratio: 11.8 / 0.8,
            fontSize: TYPE_FONTSIZES[progress.bestComboType],
        })

        // The lights
        SequenceTypes.forEach((type: SequenceType) => {
            for (let i = 0; i < 6; i++) {
                const progressMesh = mesh.getObjectByName(`p-${type}-${i}`)
                if (!progressMesh) continue

                let color = CAT_BLACK
                if (progress[type].solved || i < progress[type].correctCount) color = TYPE_COLORS[type]
                if ((progress[type].solved || i < progress[type].correctCount) && type === 'color')
                    color = SOLUTION_COLOR_HEX[i]
                const lit = color !== CAT_BLACK

                progressMesh.material.color.set(color)
                progressMesh.material.emissive.set(lit ? color : BLACK)
                progressMesh.material.emissiveIntensity = lit ? 1 : 0
                progressMesh.material.needsUpdate = true
            }
        })
    })

    return mesh
}
