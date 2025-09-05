import * as THREE from 'three'

import { floatVal } from './Utils'
import { BB_DEFAULT_PALETTE } from './Colors'

type Model = (string | string[])[]

const BB_PALETTE_KEYS = ['Light Blue', 'Yellow', 'Orange', 'Red', 'Purple', 'Blue', 'Green', 'Lime', 'Pink', 'Silver']

// Shared parse geometry functions
const parsePyramidGeometry = (item: string): THREE.BufferGeometry => {
    const [shape, name, width, height, depth, x, y, z, rX, rY, rZ, oX, oY, oZ, color] = item.split(',')
    // Pyramid width is one side, cylinder radius is the hypotenuse
    const widthNum = floatVal(width)
    const heightNum = floatVal(height)
    const depthNum = floatVal(depth)
    const xNum = floatVal(x)
    const yNum = floatVal(y)
    const zNum = floatVal(z)
    const oXNum = floatVal(oX)
    const oYNum = floatVal(oY)
    const oZNum = floatVal(oZ)
    const rXNum = floatVal(rX)
    const rYNum = floatVal(rY)
    const rZNum = floatVal(rZ)

    const radius = Math.sqrt(widthNum * widthNum + widthNum * widthNum) / 2
    const geometry = new THREE.CylinderGeometry(0, radius, heightNum, 4, 1, false, Math.PI / 4)
    geometry.scale(1, 1, depthNum / widthNum)
    // Three origin is midpoint, Blockbench origin is center of mass (lower 3 vs 1.2)
    geometry.translate(xNum - oXNum, yNum - oYNum + 0.3 * heightNum, zNum - oZNum)
    geometry.rotateX(THREE.MathUtils.degToRad(rXNum))
    geometry.rotateY(THREE.MathUtils.degToRad(rYNum))
    geometry.rotateZ(THREE.MathUtils.degToRad(rZNum))
    return geometry
}

const parseCubeGeometry = (item: string): THREE.BufferGeometry => {
    const [shape, name, width, height, depth, x, y, z, rX, rY, rZ, oX, oY, oZ, color] = item.split(',')
    const widthNum = floatVal(width)
    const heightNum = floatVal(height)
    const depthNum = floatVal(depth)
    const xNum = floatVal(x)
    const yNum = floatVal(y)
    const zNum = floatVal(z)
    const oXNum = floatVal(oX)
    const oYNum = floatVal(oY)
    const oZNum = floatVal(oZ)
    const rXNum = floatVal(rX)
    const rYNum = floatVal(rY)
    const rZNum = floatVal(rZ)

    const geometry = new THREE.BoxGeometry(widthNum, heightNum, depthNum)
    geometry.translate(xNum - oXNum, yNum - oYNum, zNum - oZNum)
    geometry.rotateX(THREE.MathUtils.degToRad(rXNum))
    geometry.rotateY(THREE.MathUtils.degToRad(rYNum))
    geometry.rotateZ(THREE.MathUtils.degToRad(rZNum))

    geometry.computeBoundingBox()
    return geometry
}

const parseSphereGeometry = (item: string): THREE.BufferGeometry => {
    const [shape, name, width, height, depth, x, y, z, rX, rY, rZ, oX, oY, oZ, color] = item.split(',')
    const widthNum = floatVal(width)
    const heightNum = floatVal(height)
    const depthNum = floatVal(depth)
    const xNum = floatVal(x)
    const yNum = floatVal(y)
    const zNum = floatVal(z)
    const oXNum = floatVal(oX)
    const oYNum = floatVal(oY)
    const oZNum = floatVal(oZ)
    const rXNum = floatVal(rX)
    const rYNum = floatVal(rY)
    const rZNum = floatVal(rZ)

    const geometry = new THREE.SphereGeometry(widthNum / 2, 32, 16)
    geometry.scale(widthNum / widthNum, heightNum / widthNum, depthNum / widthNum)
    geometry.translate(xNum - oXNum, yNum - oYNum, zNum - oZNum)
    geometry.rotateX(THREE.MathUtils.degToRad(rXNum))
    geometry.rotateY(THREE.MathUtils.degToRad(rYNum))
    geometry.rotateZ(THREE.MathUtils.degToRad(rZNum))
    return geometry
}

const parsePlaneGeometry = (item: string): THREE.BufferGeometry => {
    const [shape, name, width, height, depth, x, y, z, rX, rY, rZ, oX, oY, oZ, color] = item.split(',')
    const widthNum = floatVal(width)
    const heightNum = floatVal(height)
    const xNum = floatVal(x)
    const yNum = floatVal(y)
    const zNum = floatVal(z)
    const oXNum = floatVal(oX)
    const oYNum = floatVal(oY)
    const oZNum = floatVal(oZ)
    const rXNum = floatVal(rX)
    const rYNum = floatVal(rY)
    const rZNum = floatVal(rZ)

    const geometry = new THREE.PlaneGeometry(widthNum, heightNum)
    // Three planes are upright, Blockbench planes are horizontal
    geometry.rotateX(THREE.MathUtils.degToRad(-90))
    geometry.translate(xNum - oXNum, yNum - oYNum, zNum - oZNum)
    geometry.rotateX(THREE.MathUtils.degToRad(rXNum))
    geometry.rotateY(THREE.MathUtils.degToRad(rYNum))
    geometry.rotateZ(THREE.MathUtils.degToRad(rZNum))
    geometry.computeBoundingBox()
    return geometry
}

const parseCylinderGeometry = (item: string): THREE.BufferGeometry => {
    const [shape, name, width, height, depth, x, y, z, rX, rY, rZ, oX, oY, oZ, color] = item.split(',')
    const widthNum = floatVal(width)
    const heightNum = floatVal(height)
    const depthNum = floatVal(depth)
    const xNum = floatVal(x)
    const yNum = floatVal(y)
    const zNum = floatVal(z)
    const oXNum = floatVal(oX)
    const oYNum = floatVal(oY)
    const oZNum = floatVal(oZ)
    const rXNum = floatVal(rX)
    const rYNum = floatVal(rY)
    const rZNum = floatVal(rZ)

    const radius = widthNum / 2
    const geometry = new THREE.CylinderGeometry(radius, radius, heightNum, 32)
    geometry.translate(xNum - oXNum, yNum - oYNum, zNum - oZNum)
    geometry.scale(1, 1, depthNum / widthNum)
    const qX = THREE.MathUtils.degToRad(rXNum)
    const qY = THREE.MathUtils.degToRad(rYNum)
    const qZ = THREE.MathUtils.degToRad(rZNum)
    const rotEuler = new THREE.Euler(qX, qY, qZ)
    geometry.applyQuaternion(new THREE.Quaternion().setFromEuler(rotEuler))
    geometry.computeBoundingBox()
    return geometry
}

// Helper function to parse geometry from item string
const parseGeometry = (item: string): THREE.BufferGeometry => {
    const [shape] = item.split(',')

    switch (shape) {
        case 'c':
            return parseCubeGeometry(item)
        case 's':
            return parseSphereGeometry(item)
        case 'p':
            return parsePlaneGeometry(item)
        case 'cy':
            return parseCylinderGeometry(item)
        case 'py':
            return parsePyramidGeometry(item)
        default:
            throw new Error(`Unknown shape: ${shape}`)
    }
}

type CreateModelOpts = {
    palette?: Partial<typeof BB_DEFAULT_PALETTE>
    glow?: boolean
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
        if (Array.isArray(item)) {
            parent.add(createModel(item, { palette: modelPalette, glow }))
        } else {
            const [shape, name, width, height, depth, x, y, z, rX, rY, rZ, oX, oY, oZ, color] = item.split(',')

            const geometry = parseGeometry(item)

            let material: THREE.Material | null = new THREE.MeshStandardMaterial({
                color: modelPalette[BB_PALETTE_KEYS[color] as keyof typeof modelPalette],
                side: THREE.DoubleSide,
            }) // TODO: use color

            if (glow) {
                material.emissive = new THREE.Color(modelPalette[BB_PALETTE_KEYS[color] as keyof typeof modelPalette])
                material.emissiveIntensity = 1.0
            }

            const mesh = new THREE.Mesh(geometry, material)

            mesh.name = name
            mesh.position.set(oX, oY, oZ)
            parent.add(mesh)
        }
    })
    return parent
}
