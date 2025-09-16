import { Events } from '../libraries/Events'
import { ComboBrokenEvent, DebugEvent, LaserEvent, ProgressEvent } from '../types'
import { BLUE, GREEN, ORANGE, RED, VIOLET, YELLOW } from './Colors'

export const SOLUTION_COLOR_HEX = [RED, ORANGE, YELLOW, GREEN, BLUE, VIOLET]

const SOLUTION_COLOR = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Violet']

// TODO: Build one around Pussycat Dolls (or other cat bands)
//                                                                    Black eyed peas   Carrot Top  Cap Sheen
const SOLUTION_ARTIST = ['Shiny Toy Guns', 'B.B. King', 'Jack White', 'Black Sabbath', 'Faith Hill', 'Cliff Sheen']

const SOLUTION_TITLE = [
    'OFFSIDE', // -> sideshow ->
    'SHOWCASE', // -> caseload ->
    'LOADOUT', // -> outback ->
    'BACKHAND', // -> handbook ->
    'BOOKMARKS', // -> marksman ->
    'MANPOWER', // -> power off ->
]
// work space suit case load out back hand shake down town home
// NOTE: This one has the incorrect "download"
// off side  show  case load out back hand book marks man power
// NOTE: This one has the incorrect "outback/outman", "handbook/handoff"

const TYPE_SOLUTIONS = {
    color: SOLUTION_COLOR,
    artist: SOLUTION_ARTIST,
    title: SOLUTION_TITLE,
}

export const TYPE_FONTSIZES = {
    color: 42,
    artist: 24,
    title: 34,
}

const SOLUTION_INDEXES = [
    // Manual shuffling :/
    // Each column is a vinyl
    [0, 1, 2, 3, 4, 5],
    [0, 2, 4, 1, 5, 3],
    [0, 3, 5, 1, 4, 2],
]

export type SequenceType = 'color' | 'artist' | 'title'

export const SequenceTypes: SequenceType[] = ['color', 'artist', 'title']

type Vinyl = {
    index: number
    color: string
    artist: string
    title: string
}

export type GameProgress = {
    color: Progress
    artist: Progress
    title: Progress
    bestComboType: SequenceType
    bestComboCount: number
    bestComboUsedVinyls: number[]
    displayText: string
}

export type Progress = {
    currentIndex: number
    correctCount: number
    solved: boolean
}

export class DJPuzzle {
    _queue: number[]
    selected: Record<string, number>
    vinyls: Vinyl[]
    progress: GameProgress

    constructor() {
        this._queue = []
        this.selected = {}
        this.vinyls = []
        this.reset()
    }

    addVinylByIndex(index: number) {
        if (this._queue[0] === index) return
        // Add the vinyl to the front of the queue
        this._queue.unshift(index)

        // Update progress state
        const { color, artist, title } = this.vinyls[index]
        const colorIndex = SOLUTION_COLOR.indexOf(color)
        const artistIndex = SOLUTION_ARTIST.indexOf(artist)
        const titleIndex = SOLUTION_TITLE.indexOf(title)
        // Update color
        if (!this.progress.color.solved && colorIndex === this.progress.color.currentIndex + 1) {
            this.progress.color.correctCount++
            if (this.progress.color.correctCount === SOLUTION_COLOR.length) this.progress.color.solved = true
            Events.Instance.emit(LaserEvent)
            this.progress.color.currentIndex = colorIndex
        } else {
            this.progress.color.correctCount = 0
            this.progress.color.currentIndex = -1 // Force them to put 0 first
        }

        // Update artist
        if (
            !this.progress.artist.solved &&
            artistIndex === (this.progress.artist.currentIndex + 1) % SOLUTION_ARTIST.length
        ) {
            this.progress.artist.correctCount++
            if (this.progress.artist.correctCount === SOLUTION_ARTIST.length) this.progress.artist.solved = true
            Events.Instance.emit(LaserEvent)
        } else {
            this.progress.artist.correctCount = 1
        }
        this.progress.artist.currentIndex = artistIndex

        // Update title
        if (
            !this.progress.title.solved &&
            titleIndex === (this.progress.title.currentIndex + 1) % SOLUTION_TITLE.length
        ) {
            this.progress.title.correctCount++
            if (this.progress.title.correctCount === SOLUTION_TITLE.length) this.progress.title.solved = true
            Events.Instance.emit(LaserEvent)
        } else {
            this.progress.title.correctCount = 1
        }
        this.progress.title.currentIndex = titleIndex

        // Update best combo
        const newBestComboCount = Math.max(
            this.progress.color.correctCount,
            this.progress.artist.correctCount,
            this.progress.title.correctCount,
        )
        if (this.progress.bestComboCount < 6 && newBestComboCount < this.progress.bestComboCount) {
            Events.Instance.emit(ComboBrokenEvent, true)
        } else {
            Events.Instance.emit(ComboBrokenEvent, false)
        }
        this.progress.bestComboCount = newBestComboCount
        this.progress.bestComboType =
            this.progress.color.correctCount === this.progress.bestComboCount && !this.progress.color.solved
                ? 'color'
                : this.progress.artist.correctCount === this.progress.bestComboCount && !this.progress.artist.solved
                  ? 'artist'
                  : 'title'

        this.progress.bestComboUsedVinyls = this._queue.slice(0, this.progress.bestComboCount)

        this.progress.displayText = this.getDisplayText()
        Events.Instance.emit(ProgressEvent, this.progress)
        if (import.meta.env.DEV) Events.Instance.emit(DebugEvent, JSON.stringify(this.progress))
    }

    isSolved(comboType?: 'color' | 'artist' | 'title') {
        if (!comboType) {
            return this.progress.color.solved && this.progress.artist.solved && this.progress.title.solved
        }
        return this.progress[comboType].solved
    }

    getDisplayText() {
        const { currentIndex, correctCount, solved } = this.progress[this.progress.bestComboType]
        const solution = TYPE_SOLUTIONS[this.progress.bestComboType]
        let sequence = this._queue
            .slice(0, correctCount)
            .reverse()
            .map((index) => this.vinyls[index][this.progress.bestComboType])

        if (correctCount === 0) return 'Select a record to play → → → → →'
        for (let i = 0; i < correctCount; i++) {
            let index = currentIndex - i
            if (index < 0) index += solution.length

            // sequence.unshift(solution[index])
        }
        if (this.progress.color.solved && this.progress.artist.solved && this.progress.title.solved) {
            return '🎉 Game Over 🎉'
        }
        if (
            this.progress.color.correctCount === 6 ||
            this.progress.artist.correctCount === 6 ||
            this.progress.title.correctCount === 6
        ) {
            return '🎉 Sequence Complete 🎉'
        }
        if (sequence.length === 1) {
            return `What follows ${this.vinyls[this._queue[0]][this.progress.bestComboType]} best? → → → → →`
        }
        return sequence.join('→')
    }

    reset() {
        this._queue = []
        this.selected = {}
        const [COLOR_SOLUTION, ARTIST_SOLUTION, TITLE_SOLUTION] = SOLUTION_INDEXES
        this.progress = {
            color: {
                currentIndex: -1,
                correctCount: 0,
                solved: false,
            },
            artist: {
                currentIndex: -2,
                correctCount: 0,
                solved: false,
            },
            title: {
                currentIndex: -2,
                correctCount: 0,
                solved: false,
            },
            bestComboType: 'color',
            bestComboCount: 0,
            bestComboUsedVinyls: [],
            displayText: 'Select a record to play → → → → →',
        }
        this.vinyls = SOLUTION_COLOR.map((color, index) => {
            return {
                index,
                color,
                artist: '',
                title: '',
            }
        })

        COLOR_SOLUTION.forEach((correctPosition, index) => {
            this.vinyls[correctPosition].color = SOLUTION_COLOR[index]
        })

        ARTIST_SOLUTION.forEach((correctPosition, index) => {
            this.vinyls[correctPosition].artist = SOLUTION_ARTIST[index]
        })

        TITLE_SOLUTION.forEach((correctPosition, index) => {
            this.vinyls[correctPosition].title = SOLUTION_TITLE[index]
        })

        Events.Instance.emit(ProgressEvent, this.progress)
    }
}

export default DJPuzzle
