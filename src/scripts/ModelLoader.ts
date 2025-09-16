import * as THREE from 'three'

import { floatVal, d2r } from './Utils'
import { BB_DEFAULT_PALETTE } from './Colors'
import { floorPowerOfTwo } from 'three/src/math/MathUtils.js'

type CubeDef = [
    string,
    string, // type, name
    number,
    number,
    number, // width, height, depth
    number,
    number,
    number, // x, y, z
    number,
    number,
    number, // rx, ry, rz
    number,
    number,
    number, // ox, oy, oz
    number, // color index
]

type Model = (CubeDef | CubeDef[])[]

const BB_PALETTE_KEYS = ['Light Blue', 'Yellow', 'Orange', 'Red', 'Purple', 'Blue', 'Green', 'Lime', 'Pink', 'Silver']

const expandCubeDef = (item: CubeDef): CubeDef => {
    const [shape, name, width, height, depth, x, y, z, rX, rY, rZ, oX, oY, oZ, color] = item
    // Pyramid width is one side, cylinder radius is the hypotenuse
    const widthNum = floatVal(width)
    const heightNum = floatVal(height)
    const depthNum = floatVal(depth)
    const xNum = floatVal(x)
    const yNum = floatVal(y)
    const zNum = floatVal(z)
    const rXNum = floatVal(rX)
    const rYNum = floatVal(rY)
    const rZNum = floatVal(rZ)
    const oXNum = floatVal(oX)
    const oYNum = floatVal(oY)
    const oZNum = floatVal(oZ)
    const colorNum = floatVal(color)
    return [
        shape,
        name,
        widthNum,
        heightNum,
        depthNum,
        xNum,
        yNum,
        zNum,
        rXNum,
        rYNum,
        rZNum,
        oXNum,
        oYNum,
        oZNum,
        colorNum,
    ]
}

// Shared parse geometry functions
const parsePyramidGeometry = (item: CubeDef): THREE.BufferGeometry => {
    const [shape, name, width, height, depth, x, y, z, rX, rY, rZ, oX, oY, oZ, color] = expandCubeDef(item)
    // Pyramid width is one side, cylinder radius is the hypotenuse

    const radius = Math.sqrt(width * width + width * width) / 2
    const geometry = new THREE.CylinderGeometry(0, radius, height, 4, 1, false, Math.PI / 4)
    geometry.scale(1, 1, depth / width)
    // Three origin is midpoint, Blockbench origin is center of mass (lower 3 vs 1.2)
    geometry.translate(x - oX, y - oY + 0.3 * height, z - oZ)
    geometry.rotateX(d2r(rX))
    geometry.rotateY(d2r(rY))
    geometry.rotateZ(d2r(rZ))
    return geometry
}

const parseCubeGeometry = (item: CubeDef): THREE.BufferGeometry => {
    const [shape, name, width, height, depth, x, y, z, rX, rY, rZ, oX, oY, oZ, color] = expandCubeDef(item)

    const geometry = new THREE.BoxGeometry(width, height, depth)
    geometry.translate(x - oX, y - oY, z - oZ)
    geometry.rotateX(d2r(rX))
    geometry.rotateY(d2r(rY))
    geometry.rotateZ(d2r(rZ))

    geometry.computeBoundingBox()
    return geometry
}

const parseSphereGeometry = (item: CubeDef): THREE.BufferGeometry => {
    const [shape, name, width, height, depth, x, y, z, rX, rY, rZ, oX, oY, oZ, color] = expandCubeDef(item)

    const geometry = new THREE.SphereGeometry(width / 2, 32, 16)
    geometry.scale(width / width, height / width, depth / width)
    geometry.translate(x - oX, y - oY, z - oZ)
    geometry.rotateX(d2r(rX))
    geometry.rotateY(d2r(rY))
    geometry.rotateZ(d2r(rZ))
    return geometry
}

const parsePlaneGeometry = (item: CubeDef): THREE.BufferGeometry => {
    const [shape, name, width, height, depth, x, y, z, rX, rY, rZ, oX, oY, oZ, color] = expandCubeDef(item)

    const geometry = new THREE.PlaneGeometry(width, height)
    // Three planes are upright, Blockbench planes are horizontal
    geometry.rotateX(d2r(-90))
    geometry.translate(x - oX, y - oY, z - oZ)
    geometry.rotateX(d2r(rX))
    geometry.rotateY(d2r(rY))
    geometry.rotateZ(d2r(rZ))
    geometry.computeBoundingBox()
    return geometry
}

const parseCylinderGeometry = (item: CubeDef): THREE.BufferGeometry => {
    const [shape, name, width, height, depth, x, y, z, rX, rY, rZ, oX, oY, oZ, color] = expandCubeDef(item)

    const radius = width / 2
    const geometry = new THREE.CylinderGeometry(radius, radius, height, 32)
    geometry.translate(x - oX, y - oY, z - oZ)
    geometry.scale(1, 1, depth / width)
    const qX = d2r(rX)
    const qY = d2r(rY)
    const qZ = d2r(rZ)
    const rotEuler = new THREE.Euler(qX, qY, qZ)
    geometry.applyQuaternion(new THREE.Quaternion().setFromEuler(rotEuler))
    geometry.computeBoundingBox()
    return geometry
}

// Shape code to geometry parser mapping
const SHAPE_PARSERS = {
    c: parseCubeGeometry,
    s: parseSphereGeometry,
    p: parsePlaneGeometry,
    cy: parseCylinderGeometry,
    py: parsePyramidGeometry,
} as const

// Helper function to parse geometry from item string
const parseGeometry = (item: CubeDef): THREE.BufferGeometry => {
    const [shape] = item
    const parser = SHAPE_PARSERS[shape as keyof typeof SHAPE_PARSERS]

    if (!parser) {
        throw new Error(`Unknown shape: ${shape}`)
    }

    return parser(item)
}

type CreateModelOpts = {
    palette?: Partial<typeof BB_DEFAULT_PALETTE>
    glow: boolean | number[]
}

export const createModel = (modelArray: Model, opts: CreateModelOpts): THREE.Group => {
    const { palette: customPalette = {}, glow = false } = opts
    const parent = new THREE.Group()
    parent.position.set(0, 0, 0)
    parent.rotation.set(0, 0, 0)
    parent.scale.set(1, 1, 1)

    const modelPalette = {
        ...BB_DEFAULT_PALETTE,
        ...customPalette,
    }

    modelArray.forEach((item) => {
        if (item === null) {
            console.error('ITEM IS NULL')
            return
        }
        const testItem = item[0]
        if (Array.isArray(testItem)) {
            parent.add(createModel(item, { palette: modelPalette, glow }))
        } else {
            const [shape, name, width, height, depth, x, y, z, rX, rY, rZ, oX, oY, oZ, color] = expandCubeDef(item)

            const geometry = parseGeometry(item)

            let material: THREE.MeshStandardMaterial | null = new THREE.MeshStandardMaterial({
                color: modelPalette[BB_PALETTE_KEYS[color] as keyof typeof modelPalette],
                side: THREE.DoubleSide,
            }) // TODO: use color
            if (glow === true || (Array.isArray(glow) && glow.includes(color))) {
                material.emissive = new THREE.Color(modelPalette[BB_PALETTE_KEYS[color] as keyof typeof modelPalette])
                material.emissiveIntensity = 1.0
            }

            const mesh = new THREE.Mesh(geometry, material)

            mesh.name = name
            mesh.position.set(floatVal(oX), floatVal(oY), floatVal(oZ))
            parent.add(mesh)
        }
    })
    return parent
}
