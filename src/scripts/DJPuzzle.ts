import { Events } from '../libraries/Events'
import { BLUE, GREEN, ORANGE, RED, VIOLET, YELLOW } from './Colors'

export const TYPE_COLORS = {
    color: RED,
    artist: GREEN,
    title: BLUE,
}

export const SOLUTION_COLOR = [RED, ORANGE, YELLOW, GREEN, BLUE, VIOLET]

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
    color: 0,
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
    displayText: string
}

export type Progress = {
    currentIndex: number
    correctCount: number
    solved: boolean
}

export class DJPuzzle {
    queue: number[]
    selected: Record<string, number>
    vinyls: Vinyl[]
    progress: GameProgress

    constructor() {
        this.queue = []
        this.selected = {}
        this.vinyls = []
        this.reset()
        this.progress.bestComboType = 'color'
    }

    addVinylByIndex(index: number) {
        if (this.queue[0] === index) return

        const { color, artist, title } = this.vinyls[index]
        const colorIndex = SOLUTION_COLOR.indexOf(color)
        const artistIndex = SOLUTION_ARTIST.indexOf(artist)
        const titleIndex = SOLUTION_TITLE.indexOf(title)
        // TODO: Color also needs to start at 0
        if (colorIndex === this.progress.color.currentIndex + 1) {
            this.progress.color.correctCount++
            if (this.progress.color.correctCount === SOLUTION_COLOR.length) this.progress.color.solved = true
            this.progress.color.currentIndex = colorIndex
        } else {
            this.progress.color.currentIndex = -1 // Force them to put 0 first
            this.progress.color.correctCount = 0
        }

        if (artistIndex === (this.progress.artist.currentIndex + 1) % SOLUTION_ARTIST.length) {
            this.progress.artist.correctCount++
            if (this.progress.artist.correctCount === SOLUTION_ARTIST.length) this.progress.artist.solved = true
        } else {
            this.progress.artist.correctCount = 1
        }
        this.progress.artist.currentIndex = artistIndex

        if (titleIndex === (this.progress.title.currentIndex + 1) % SOLUTION_TITLE.length) {
            this.progress.title.correctCount++
            if (this.progress.title.correctCount === SOLUTION_TITLE.length) this.progress.title.solved = true
        } else {
            this.progress.title.correctCount = 1
        }
        this.progress.title.currentIndex = titleIndex

        const newBestComboCount = Math.max(
            this.progress.color.correctCount,
            this.progress.artist.correctCount,
            this.progress.title.correctCount,
        )
        if (this.progress.bestComboCount < 6 && newBestComboCount < this.progress.bestComboCount) {
            Events.Instance.emit('comboBroken')
        }
        this.progress.bestComboCount = newBestComboCount
        this.progress.bestComboType =
            this.progress.color.correctCount === this.progress.bestComboCount
                ? 'color'
                : this.progress.artist.correctCount === this.progress.bestComboCount
                  ? 'artist'
                  : 'title'

        this.queue.unshift(index)
        this.progress.displayText = this.getDisplayText()
        Events.Instance.emit('progress', this.progress)
        if (import.meta.env.DEV) Events.Instance.emit('debug', JSON.stringify(this.progress))
    }

    getVinylInQueue(index: number) {
        return this.vinyls[this.queue[index]]
    }

    isSolved(comboType?: 'color' | 'artist' | 'title') {
        if (!comboType) return
        this.progress.color.solved && this.progress.artist.solved && this.progress.title.solved
        return this.progress[comboType].solved
    }

    getDisplayText() {
        let result = ''

        const { currentIndex, correctCount, solved } = this.progress[this.progress.bestComboType]
        const solution = TYPE_SOLUTIONS[this.progress.bestComboType]
        for (let i = 0; i < correctCount; i++) {
            let index = currentIndex - i
            if (index < 0) index += solution.length
            result = `${solution[index]}→${result}`
        }

        return result
    }

    reset() {
        this.queue = []
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

        Events.Instance.emit('progress', this.progress)
    }
}

export default DJPuzzle
