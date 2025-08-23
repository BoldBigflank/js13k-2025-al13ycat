import { Events } from '../libraries/Events'
import { BLUE, GREEN, ORANGE, RED, VIOLET, YELLOW } from './Colors'
import { comboCorrectCount } from './Utils'

const SEQUENCE_COLOR = [RED, ORANGE, YELLOW, GREEN, BLUE, VIOLET]

const SEQUENCE_ARTIST = ['Shiny Toy Guns', 'B.B. King', 'Jack White', 'Black Sabbath', 'Faith Hill', 'Cliff Sheen']

const SEQUENCE_TITLE = [
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

const VINYL_INDEXES = [
    // Manual shuffling :/
    [0, 1, 2, 3, 4, 5],
    [0, 2, 4, 1, 5, 3],
    [0, 3, 5, 1, 4, 2],
]

export type SequenceType = 'color' | 'artist' | 'title'

type Vinyl = {
    index: number
    color: string
    artist: string
    title: string
}

export class DJPuzzle {
    queue: number[]
    selected: Record<string, number>
    vinyls: Vinyl[]
    comboCount: {
        color: number
        artist: number
        title: number
    }
    solvedCombo: {
        color: boolean
        artist: boolean
        title: boolean
    }

    constructor() {
        this.reset()
    }

    addVinylByIndex(index: number) {
        this.queue.unshift(index)
        this.updateComboCount()
    }

    updateComboCount() {
        // Looking backwards at the queue, see how much the queue follows the VINYL_INDICES
        const [COLOR_COMBO, ARTIST_COMBO, TITLE_COMBO] = VINYL_INDEXES
        Events.Instance.emit('debug', `Queue is ${this.queue}`)
        Events.Instance.emit('debug', `Comparing to ${[...ARTIST_COMBO].reverse()}`)

        // TODO: This isn't the right array to compare
        this.comboCount = {
            color: comboCorrectCount(this.queue, [...COLOR_COMBO].reverse(), true),
            artist: comboCorrectCount(this.queue, [...ARTIST_COMBO].reverse()),
            title: comboCorrectCount(this.queue, [...TITLE_COMBO].reverse()),
        }
        this.solvedCombo = {
            color: this.solvedCombo.color || this.comboCount.color === COLOR_COMBO.length,
            artist: this.solvedCombo.artist || this.comboCount.artist === ARTIST_COMBO.length,
            title: this.solvedCombo.title || this.comboCount.title === TITLE_COMBO.length,
        }

        if (this.solvedCombo.color) this.comboCount.color = 0
        if (this.solvedCombo.artist) this.comboCount.artist = 0
        if (this.solvedCombo.title) this.comboCount.title = 0

        Events.Instance.emit('debug', `Combo: ${JSON.stringify(this.comboCount)}`)
        Events.Instance.emit('debug', `Solved: ${JSON.stringify(this.solvedCombo)}`)
        Events.Instance.emit('combo', this.comboCount)
        Events.Instance.emit('solved', this.solvedCombo)
    }

    isSolved(comboType: 'color' | 'artist' | 'title') {
        return this.solvedCombo[comboType]
    }

    reset() {
        this.queue = []
        this.selected = {}
        const [COLOR_COMBO, ARTIST_COMBO, TITLE_COMBO] = VINYL_INDEXES
        this.vinyls = SEQUENCE_COLOR.map((_color, index) => {
            return {
                index,
                color: SEQUENCE_COLOR[COLOR_COMBO[index]],
                artist: SEQUENCE_ARTIST[ARTIST_COMBO[index]],
                title: SEQUENCE_TITLE[TITLE_COMBO[index]],
            }
        })
        this.comboCount = {
            color: 0,
            artist: 0,
            title: 0,
        }
        this.solvedCombo = {
            color: false,
            artist: false,
            title: false,
        }
        Events.Instance.emit('combo', this.comboCount)
        Events.Instance.emit('solved', this.solvedCombo)
    }
}

export default DJPuzzle
