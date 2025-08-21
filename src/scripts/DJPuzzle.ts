import { BLUE, GREEN, ORANGE, RED, VIOLET, YELLOW } from "./Colors";
import { comboCorrectCount } from "./Utils";

const SEQUENCE_COLOR = [RED, ORANGE, YELLOW, GREEN, BLUE, VIOLET];

const SEQUENCE_TITLE = [
    "OFFSIDE", // -> sideshow ->
    "SHOWCASE", // -> caseload ->
    "LOADOUT", // -> outback ->
    "BACKHAND", // -> handbook ->
    "BOOKMARKS", // -> marksman ->
    "MANPOWER", // -> power off ->
];
// work space suit case load out back hand shake down town home
// NOTE: This one has the incorrect "download"
// off side  show  case load out back hand book marks man power
// NOTE: This one has the incorrect "outman"
const SEQUENCE_ARTIST = [
    "Shiny Toy Guns",
    "B.B. King",
    "Jack White",
    "Black Sabbath",
    "Faith Hill",
    "Cliff Sheen",
];

const VINYL_INDEXES = [
    // Manual shuffling :/
    [0, 1, 2, 3, 4, 5],
    [0, 2, 4, 1, 5, 3],
    [0, 3, 5, 1, 4, 2],
];

const SEQUENCES = {
    color: SEQUENCE_COLOR,
    title: SEQUENCE_TITLE,
    artist: SEQUENCE_ARTIST,
};

type SequenceType = "color" | "title" | "artist";

type Vinyl = {
    index: number;
    color: string;
    title: string;
    artist: string;
};

type DJPuzzleState = {
    currentVynil: Vinyl | null;
    comboType: "color" | "title" | "artist" | null;
    comboCount: number;
};

export class DJPuzzle {
    queue: number[]
    rack: number[]
    selected: Record<string,number>;
    vinyls: Vinyl[];
    comboCount: {
        color: number,
        artist: number,
        title: number
    };
    solvedCombo: {
        color: boolean,
        artist: boolean,
        title: boolean
    }
    
    constructor() {
        this.reset();
    }

    addVinylByIndex(index: number) {
        this.queue.unshift(index)
        this.updateComboCount()
    }

    updateComboCount() {
        // Looking backwards at the queue, see how much the queue follows the VINYL_INDICES
        const [COLOR_COMBO, ARTIST_COMBO, TITLE_COMBO] = VINYL_INDEXES
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
    }

    isSolved(comboType: "color" | "artist" | "title") {
        return this.solvedCombo[comboType];
    }

    reset() {
        this.queue = []
        this.rack = []
        this.selected = {}
        const [colorIndex, titleIndex, artistIndex] = VINYL_INDEXES;
        this.vinyls = SEQUENCE_COLOR.map((_color, index) => {
            this.rack.push(index)
            return {
                index,
                color: SEQUENCE_COLOR[colorIndex[index]],
                title: SEQUENCE_TITLE[titleIndex[index]],
                artist: SEQUENCE_ARTIST[artistIndex[index]],
            };
        });
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

    }
}

export default DJPuzzle;
