import * as THREE from 'three'

const head = [
    [0, 8],
    [2, 7],
    [8, 11],
    [9, 4],
    [10, 0],
    [9, -4],
    [5, -6],
    [0, -7],
]

const paw = [
    [0, 6],
    [1, 7],
    [2, 7],
    [2, 5],
    [3, 6],
    [4, 5],
    [3, 2],
    [3, -5],
]

const extrudeSettings = {
    depth: 1.6,
    bevelSize: 0.2,
    bevelOffset: -0.2,
}

const makeShape = (points: number[][]) => {
    const shape = new THREE.Shape()
    const p = [...points, ...points.reverse().map(([x, y]) => [-x, y])]
    p.forEach(([x, y], index) => {
        if (index === 0) shape.moveTo(x, y)
        shape.lineTo(x, y)
    })
    return shape
}

export const CrowdHead = (): THREE.BufferGeometry => {
    const shape = makeShape(head)
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    geometry.scale(0.05, 0.05, 0.05)
    return geometry
}

export const CrowdPaw = (): THREE.BufferGeometry => {
    const shape = makeShape(paw)
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    geometry.scale(0.05, 0.05, 0.05)
    geometry.rotateX((-1 * Math.PI) / 2)
    return geometry
}
