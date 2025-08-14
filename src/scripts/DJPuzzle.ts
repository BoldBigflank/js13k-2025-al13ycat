const SEQUENCE_COLOR = [
    'red',
    'orange',
    'yellow',
    'green',
    'blue',
    'violet'
]

const SEQUENCE_TITLE = [
    '1 2',
    '2 3',
    '3 4',
    '4 5',
    '5 6',
    '6 1'
]

const SEQUENCE_ARTIST = [
    'A B',
    'B C',
    'C D',
    'D E',
    'E F',
    'F A'
]

const RECORD_INDEXES = [ // Manual shuffling :/
    [0,1,2,3,4,5],
    [0,2,4,1,5,3],
    [0,3,5,1,4,2]
]

const SEQUENCES = {
    color: SEQUENCE_COLOR,
    title: SEQUENCE_TITLE,
    artist: SEQUENCE_ARTIST
}

type SequenceType = 'color' | 'title' | 'artist'

type Record = {
    color: string,
    title: string,
    artist: string
}

type DJPuzzleState = {
    currentRecord: Record | null,
    comboType: 'color' | 'title' | 'artist' | null,
    comboCount: number,
    comboStartIndex: number
}

export class DJPuzzle {
    currentRecord: Record|null
    comboType: SequenceType|null
    comboCount: number
    comboStartIndex: number
    records: Record[]
    solvedCombos: {}

    constructor() {
        this.currentRecord = null
        this.comboType = null
        this.records = []
        this.reset()
    }
    
    addRecord(record: Record) {
        if (!this.currentRecord) {
            this.currentRecord = record
            return
        }
        // If there is a comboType, increment the combo or remove the comboType
        if (this.comboType) {
            this.currentRecord[this.comboType]
            if (this.recordsMatchSequence(this.currentRecord, record, this.comboType)) {
                this.currentRecord = record
                this.comboCount += 1
                if (this.comboCount >= this.records.length) this.solvedCombos[this.comboType] = true
            } else {
                this.comboType = null
                this.comboCount = 1
            }
        }
        // If there's not a comboType, see if the two records match a combo
        if (!this.comboType) {
            this.comboType = this.recordsMatchSequence(this.currentRecord, record)
        }
    }

    recordsMatchSequence(record1: Record, record2: Record, type?: SequenceType): SequenceType|null {
        let foundMatch: SequenceType|null = null
        const sequenceTypes: SequenceType[] = ['color', 'title', 'artist']
        sequenceTypes.forEach((sequenceType) => {
            if (type && type !== sequenceType) return
            const index1 = SEQUENCES[sequenceType].indexOf[record1[sequenceType]]
            const index2 = SEQUENCES[sequenceType].indexOf[record2[sequenceType]]
            if (index2 === (index1 + 1) % SEQUENCES[sequenceType].length) foundMatch = sequenceType
        })

        return foundMatch
    }

    isSolved(comboType) {
        return this.solvedCombos[comboType]
    }

    reset() {
        this.currentRecord = null
        this.comboType = null
        this.comboCount = 0
        this.comboStartIndex = -1
        const [ colorIndex, titleIndex, artistIndex ] = RECORD_INDEXES
        this.records = SEQUENCE_COLOR.map((color, index) => {
            return {
                color: SEQUENCE_COLOR[colorIndex[index]], 
                title: SEQUENCE_TITLE[titleIndex[index]],
                artist: SEQUENCE_ARTIST[artistIndex[index]]
            }
        })
    }
}

export default DJPuzzle