import * as THREE from 'three'
import { INCHES_TO_METERS_SCALE, initCanvas } from '../scripts/Utils'
import { BLACK, BLUE, GREEN, MAGENTA, TYPE_COLORS, WHITE } from '../scripts/Colors'
import { ColorMaterial } from '../scripts/TextureUtils'
import { Events } from '../libraries/Events'
import { GameProgress } from '../scripts/DJPuzzle'
import { ProgressEvent } from '../types'

type VinylProps = {
    color: string
    artist: string
    title: string
}

const LabelMaterial = (artist: string, title: string) => {
    const RES = 1024
    const [canvas, ctx] = initCanvas()
    ctx.fillStyle = BLACK

    // Outlines
    ctx.strokeStyle = BLACK
    ctx.lineWidth = 8

    ctx.beginPath()
    ctx.arc(RES / 2, RES / 2, 20, 0, 2 * Math.PI)
    ctx.stroke()

    // Spiral
    ctx.save()
    ctx.translate(RES / 2, RES / 2)
    ctx.beginPath()
    var gap = 4.5 // increase this for spacing between spiral lines
    var STEPS_PER_ROTATION = 60 // increasing this makes the curve smoother

    var increment = (2 * Math.PI) / STEPS_PER_ROTATION
    var theta = (3 / 2) * Math.PI + increment
    while (theta < 20 * Math.PI) {
        var newX = theta * Math.cos(theta) * gap
        var newY = theta * Math.sin(theta) * gap
        ctx.lineTo(newX, newY)
        theta = theta + increment
    }
    ctx.stroke()
    ctx.restore()

    ctx.beginPath()
    ctx.arc(RES / 2, RES / 2, 288, 0, 2 * Math.PI)
    ctx.stroke()

    ctx.lineWidth = 32
    ctx.beginPath()
    ctx.arc(RES / 2, RES / 2, 512 - 16, 0, 2 * Math.PI)
    ctx.stroke()

    // Artist is green, title is blue
    ctx.textAlign = 'center'
    if (artist) {
        ctx.font = `64px monospace`
        ctx.textBaseline = 'middle'
        ctx.strokeStyle = BLACK
        ctx.lineWidth = 8
        ctx.strokeText(artist, 0.5 * RES, 0.42 * RES)
        ctx.fillStyle = GREEN
        ctx.fillText(artist, 0.5 * RES, 0.42 * RES)
    }

    if (title) {
        ctx.font = `96px monospace`
        ctx.textBaseline = 'bottom'
        ctx.fillStyle = BLUE
        ctx.strokeText(title, 0.5 * RES, 0.68 * RES)
        ctx.fillText(title, 0.5 * RES, 0.68 * RES)
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.encoding = THREE.LinearSRGBColorSpace
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
    })
    return material
}

export const Vinyl = ({ color, artist, title }: VinylProps): THREE.Object3D => {
    const result = new THREE.Group()
    // Outer ring

    // innerRadius, outerRadius, thetaSegments, phiSegments, thetaStart, thetaLength
    const geometry = new THREE.RingGeometry(4, 7, 32)
    geometry.translate(0, 0, -0.001)
    geometry.scale(INCHES_TO_METERS_SCALE, INCHES_TO_METERS_SCALE, INCHES_TO_METERS_SCALE)
    const material = ColorMaterial(color, { glow: true })

    result.add(new THREE.Mesh(geometry, material))

    // Inner ring
    const innerRingGeometry = new THREE.RingGeometry(0.25, 4, 32)
    innerRingGeometry.scale(INCHES_TO_METERS_SCALE, INCHES_TO_METERS_SCALE, INCHES_TO_METERS_SCALE)
    innerRingGeometry.translate(0, 0, -0.001)
    const innerRingMaterial = ColorMaterial(new THREE.Color(WHITE), {})
    result.add(new THREE.Mesh(innerRingGeometry, innerRingMaterial))

    // Artist Label
    const labelGeometry = new THREE.PlaneGeometry(14.2, 14.2)
    labelGeometry.translate(0, 0, 0.102)
    labelGeometry.scale(INCHES_TO_METERS_SCALE, INCHES_TO_METERS_SCALE, INCHES_TO_METERS_SCALE)
    const labelMaterial = LabelMaterial(artist, title, 1)
    result.add(new THREE.Mesh(labelGeometry, labelMaterial))

    const result2 = result.clone()
    result2.rotation.set(0, Math.PI, 0)
    result.add(result2)

    // Highlight ring
    const highlightGeometry = new THREE.RingGeometry(7, 7.5, 32)
    highlightGeometry.scale(INCHES_TO_METERS_SCALE, INCHES_TO_METERS_SCALE, INCHES_TO_METERS_SCALE)
    const highlightMaterial = ColorMaterial(WHITE, { glow: true })
    highlightMaterial.emissiveIntensity = 1.0
    const highlightMesh = new THREE.Mesh(highlightGeometry, highlightMaterial)
    highlightMesh.visible = false
    highlightMesh.name = 'h'
    result.add(highlightMesh)

    // Combo ring
    const comboMesh = highlightMesh.clone()
    comboMesh.material = comboMesh.material.clone()
    result.add(comboMesh)

    Events.Instance.on(ProgressEvent, (progress: GameProgress) => {
        comboMesh.visible = progress.bestComboUsedVinyls.includes(result.userData.recordIndex)
        comboMesh.material.color.set(TYPE_COLORS[progress.bestComboType])
        comboMesh.material.needsUpdate = true
    })

    return result
}
