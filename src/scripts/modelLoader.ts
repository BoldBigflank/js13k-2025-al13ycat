import { cassetteModel } from '../models/exported/cassette'
import { arenaModel } from '../models/exported/arena'
import { catModel } from '../models/exported/cat'
import { pawModel } from '../models/exported/paw'
import * as BufferGeometryUtils from '../libraries/BufferGeometryUtils.js'
import * as THREE from 'https://js13kgames.com/2025/webxr/three.module.js'

import { BasicShader } from '../shaders/BasicShader'

type Model = (string | string[])[]

// Shared parse geometry functions
const parsePyramidGeometry = (item: string): THREE.BufferGeometry => {
    const [shape, name, width, height, depth, x, y, z, rX, rY, rZ, oX, oY, oZ, color] = item.split('_')
    // Pyramid width is one side, cylinder radius is the hypotenuse
    const widthNum = parseFloat(width)
    const heightNum = parseFloat(height)
    const depthNum = parseFloat(depth)
    const xNum = parseFloat(x)
    const yNum = parseFloat(y)
    const zNum = parseFloat(z)
    const oXNum = parseFloat(oX)
    const oYNum = parseFloat(oY)
    const oZNum = parseFloat(oZ)
    const rXNum = parseFloat(rX)
    const rYNum = parseFloat(rY)
    const rZNum = parseFloat(rZ)

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
    const [shape, name, width, height, depth, x, y, z, rX, rY, rZ, oX, oY, oZ, color] = item.split('_')
    const widthNum = parseFloat(width)
    const heightNum = parseFloat(height)
    const depthNum = parseFloat(depth)
    const xNum = parseFloat(x)
    const yNum = parseFloat(y)
    const zNum = parseFloat(z)
    const oXNum = parseFloat(oX)
    const oYNum = parseFloat(oY)
    const oZNum = parseFloat(oZ)
    const rXNum = parseFloat(rX)
    const rYNum = parseFloat(rY)
    const rZNum = parseFloat(rZ)

    const geometry = new THREE.BoxGeometry(widthNum, heightNum, depthNum)
    geometry.translate(xNum - oXNum, yNum - oYNum, zNum - oZNum)
    geometry.rotateX(THREE.MathUtils.degToRad(rXNum))
    geometry.rotateY(THREE.MathUtils.degToRad(rYNum))
    geometry.rotateZ(THREE.MathUtils.degToRad(rZNum))

    geometry.computeBoundingBox()
    return geometry
}

const parseSphereGeometry = (item: string): THREE.BufferGeometry => {
    const [shape, name, width, height, depth, x, y, z, rX, rY, rZ, oX, oY, oZ, color] = item.split('_')
    const widthNum = parseFloat(width)
    const heightNum = parseFloat(height)
    const depthNum = parseFloat(depth)
    const xNum = parseFloat(x)
    const yNum = parseFloat(y)
    const zNum = parseFloat(z)
    const oXNum = parseFloat(oX)
    const oYNum = parseFloat(oY)
    const oZNum = parseFloat(oZ)
    const rXNum = parseFloat(rX)
    const rYNum = parseFloat(rY)
    const rZNum = parseFloat(rZ)

    const geometry = new THREE.SphereGeometry(widthNum / 2, 32, 16)
    geometry.scale(widthNum / widthNum, heightNum / widthNum, depthNum / widthNum)
    geometry.translate(xNum - oXNum, yNum - oYNum, zNum - oZNum)
    geometry.rotateX(THREE.MathUtils.degToRad(rXNum))
    geometry.rotateY(THREE.MathUtils.degToRad(rYNum))
    geometry.rotateZ(THREE.MathUtils.degToRad(rZNum))
    return geometry
}

const parsePlaneGeometry = (item: string): THREE.BufferGeometry => {
    const [shape, name, width, height, depth, x, y, z, rX, rY, rZ, oX, oY, oZ, color] = item.split('_')
    const widthNum = parseFloat(width)
    const heightNum = parseFloat(height)
    const xNum = parseFloat(x)
    const yNum = parseFloat(y)
    const zNum = parseFloat(z)
    const oXNum = parseFloat(oX)
    const oYNum = parseFloat(oY)
    const oZNum = parseFloat(oZ)
    const rXNum = parseFloat(rX)
    const rYNum = parseFloat(rY)
    const rZNum = parseFloat(rZ)

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
    const [shape, name, width, height, depth, x, y, z, rX, rY, rZ, oX, oY, oZ, color] = item.split('_')
    const widthNum = parseFloat(width)
    const heightNum = parseFloat(height)
    const depthNum = parseFloat(depth)
    const xNum = parseFloat(x)
    const yNum = parseFloat(y)
    const zNum = parseFloat(z)
    const oXNum = parseFloat(oX)
    const oYNum = parseFloat(oY)
    const oZNum = parseFloat(oZ)
    const rXNum = parseFloat(rX)
    const rYNum = parseFloat(rY)
    const rZNum = parseFloat(rZ)

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
    const [shape] = item.split('_')

    switch (shape) {
        case 'cube':
            return parseCubeGeometry(item)
        case 'sphere':
            return parseSphereGeometry(item)
        case 'plane':
            return parsePlaneGeometry(item)
        case 'cylinder':
            return parseCylinderGeometry(item)
        case 'pyramid':
            return parsePyramidGeometry(item)
        default:
            throw new Error(`Unknown shape: ${shape}`)
    }
}

// Function to create merged geometry from model array
export const createGeometry = (modelArray: Model): THREE.BufferGeometry => {
    const geometries: THREE.BufferGeometry[] = []

    const processItem = (item: string | string[]) => {
        if (item === null) {
            console.error('ITEM IS NULL')
            return
        }

        if (Array.isArray(item)) {
            // Recursively process nested arrays
            const nestedGeometry = createGeometry(item)
            geometries.push(nestedGeometry)
        } else {
            // Parse single item and add to geometries array
            const geometry = parseGeometry(item)
            geometries.push(geometry)
        }
    }

    modelArray.forEach(processItem)

    // Merge all geometries into one
    if (geometries.length === 0) {
        return new THREE.BufferGeometry()
    } else if (geometries.length === 1) {
        return geometries[0]
    } else {
        return BufferGeometryUtils.mergeGeometries(geometries)
    }
}

const createModel = (modelArray: Model): THREE.Group => {
    const parent = new THREE.Group()
    parent.position.set(0, 0, 0)
    parent.rotation.set(0, 0, 0)
    parent.scale.set(1, 1, 1)

    modelArray.forEach((item) => {
        if (item === null) {
            console.error('ITEM IS NULL')
            return
        }
        if (Array.isArray(item)) {
            parent.add(createModel(item))
        } else {
            const [shape, name, width, height, depth, x, y, z, rX, rY, rZ, oX, oY, oZ, color] = item.split('_')

            const geometry = parseGeometry(item)

            let material: THREE.Material | null = null
            if (typeof name === 'string' && name.startsWith('case')) {
                material = new THREE.ShaderMaterial({
                    uniforms: {
                        ...BasicShader.uniforms,
                        // tDiffuse: { value: new THREE.Color(color) },
                    },
                    vertexShader: BasicShader.vertexShader,
                    fragmentShader: BasicShader.fragmentShader,
                })
            } else {
                material = new THREE.MeshStandardMaterial({
                    color: color,
                    side: THREE.DoubleSide,
                }) // TODO: use color
            }

            const mesh = new THREE.Mesh(geometry, material)

            mesh.name = name
            mesh.position.set(oX, oY, oZ)
            parent.add(mesh)
        }
    })
    return parent
}

export const createCube = (options: { width: number; height: number; depth: number; color: string | number }) => {
    const { width, height, depth, color } = options
    const geometry = new THREE.BoxGeometry(width, height, depth)
    const material = new THREE.MeshBasicMaterial({ color })

    const cubeA = new THREE.Mesh(geometry, material)
    return cubeA
}

export const createCylinder = (options: { radius: number; depth: number; color: string | number }) => {
    const { radius, depth, color } = options
    const geometry = new THREE.CylinderGeometry(radius, radius, depth, 32)
    const material = new THREE.MeshBasicMaterial({ color })
    return new THREE.Mesh(geometry, material)
}

export const loadModelByName = (name: string) => {
    if (name === 'cassette') {
        const model = createModel(cassetteModel())
        model.name = 'cassette'
        return model
    } else if (name === 'arena') {
        const model = createModel(arenaModel())
        model.name = 'arena'
        return model
    } else if (name === 'cat') {
        const model = createModel(catModel())
        model.name = 'cat'
        return model
    } else if (name === 'paw') {
        const model = createModel(pawModel())
        model.name = 'paw'
        model.scale.set(0.03125, 0.03125, 0.03125)
        return model
    }
    return null
}
