import { Events } from '../libraries/Events'
import CPlayer from '../libraries/player-small'

import { zzfx } from '../libraries/zzfx'
import { GameProgress } from '../scripts/DJPuzzle'
import { DownbeatEvent, ProgressEvent } from '../types'
import song from './song(4)'

const audioContext = new AudioContext()
let currentSequenceNumber = 0

Events.Instance.on(ProgressEvent, (progress: GameProgress) => {
    // Map bestComboCount to sequence numbers (0-6)
    // bestComboCount can be 0-3, so we need to map it appropriately
    const rawCount = progress.bestComboCount || 0
    currentSequenceNumber = Math.min(rawCount, 6) // Cap at 6 for the 12-second buffer
})

export const RecordSFX = () => zzfx(...[, , 143, 0.03, 0.17, 0.09, 2, 1.5, 10, -17, , , , , 4, , , 0.73, 0.09]) // Shoot 95
export const CorrectSFX = () => zzfx(...[, 0, , , 0.07, 0.12, , 3.4, , , 109, 0.07, , , , , , 0.6, 0.05, , -1428]) // Pickup 116
export const LaserSFX = () => zzfx(...[0.6, 0, 110, 0.2, 0.6, 0.36, 1, 1.8, , , , , , 0.3, , , , 0.33, 0.4, , -1500]) // Music 121

export const BlipSFX = () => zzfx(...[, , 76, 0.02, 0.02, 0.01, 1, 0.44, , , , , , 0.5, , , , , 0.01, 0.57]) // Blip 60
export const SolvedSFX = () =>
    zzfx(...[2.07, 0, 130.81, 0.01, 0.26, 0.47, 3, 1.15, , 0.1, , , 0.05, , , , 0.14, 0.26, 0.15, 0.02]) // Music 112 - Mutation 2
export const PickupSFX = () =>
    zzfx(...[1.01, , 275, 0.01, 0.01, 0.15, 1, 1.03, -3.7, , -93, 0.07, , , , -0.1, , 0.5, 0.04, 0.09]) // Pickup 121 - Mutation 2

interface Song3Controller {
    source: AudioBufferSourceNode | null
    stop: () => void
    playSequence: (sequenceNumber: number) => void
    getCurrentSequence: () => number
    isPlaying: () => boolean
}

export const Song3 = async (): Promise<Song3Controller> => {
    const player = new CPlayer()
    await player.init(song)
    await player.generate()

    // Create 4-second buffers (4 * 44100 = 176400 samples)
    const fourSecondBuffers = []
    for (let i = 0; i < 6; i++) {
        const startIndex = i * 176400
        const endIndex = startIndex + 176400
        const buffer = player.createAudioBufferRange(audioContext, startIndex, endIndex)
        fourSecondBuffers.push(buffer)
    }

    // Create 16-second buffer (16 * 44100 = 705600 samples)
    const startIndex16Sec = 6 * 176400 // Start after the six 4-second buffers
    const endIndex16Sec = startIndex16Sec + 705600
    const sixteenSecondBuffer = player.createAudioBufferRange(audioContext, startIndex16Sec, endIndex16Sec)

    // Store all buffers in an array for easy access
    const allBuffers = [...fourSecondBuffers, sixteenSecondBuffer]

    let currentSource: AudioBufferSourceNode | null = null
    let isPlaying = false

    const playBuffer = (sequenceNumber: number) => {
        if (currentSource) {
            currentSource.stop()
            currentSource.disconnect()
        }

        // Determine which buffer to play based on sequence number
        let bufferIndex: number
        if (sequenceNumber < 6) {
            // Play one of the 4-second buffers (sequences 0-5)
            bufferIndex = sequenceNumber
        } else {
            // Play the 12-second buffer (sequence 6)
            bufferIndex = 6
        }

        const buffer = allBuffers[bufferIndex]
        currentSource = audioContext.createBufferSource()
        currentSource.buffer = buffer
        currentSource.connect(audioContext.destination)

        // Set up the loop
        currentSource.loop = true
        currentSource.start()

        // Check for sequence changes periodically since looping buffers never end
        const checkInterval = setInterval(() => {
            Events.Instance.emit(DownbeatEvent)
            if (currentSequenceNumber !== sequenceNumber) {
                clearInterval(checkInterval)
                playBuffer(currentSequenceNumber)
            }
        }, 2000) // Check every 2 seconds

        isPlaying = true
    }

    // Start playing the buffer that matches currentSequenceNumber
    playBuffer(currentSequenceNumber)

    // Return an object with control methods
    const controller = {
        source: currentSource,
        stop: () => {
            isPlaying = false
            if (currentSource) {
                currentSource.stop()
                currentSource.disconnect()
                currentSource = null
            }
        },
        playSequence: (sequenceNumber: number) => {
            currentSequenceNumber = sequenceNumber
            playBuffer(sequenceNumber)
        },
        getCurrentSequence: () => currentSequenceNumber,
        isPlaying: () => isPlaying,
    }

    return controller
}
