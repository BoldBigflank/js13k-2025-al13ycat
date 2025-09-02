// @ts-ignore
import * as THREE from 'https://js13kgames.com/2025/webxr/three.module.js'
import { INCHES_TO_METERS_SCALE, initCanvas } from '../scripts/Utils'
import { BLACK, BLUE, GREEN, MAGENTA } from '../scripts/Colors'
import { ColorMaterial } from '../scripts/TextureUtils'

type VinylProps = {
    color: string
    artist: string
    title: string
}

const LabelMaterial = (artist: string, title: string) => {
    const RES = 1024
    const [canvas, ctx] = initCanvas()
    // ctx.fillStyle = MAGENTA;
    // ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = BLACK

    // Outlines
    ctx.strokeStyle = BLACK
    ctx.lineWidth = 8
    ctx.beginPath()
    ctx.arc(RES / 2, RES / 2, 20, 0, 2 * Math.PI)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(RES / 2, RES / 2, 288, 0, 2 * Math.PI)
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
    geometry.scale(INCHES_TO_METERS_SCALE, INCHES_TO_METERS_SCALE, INCHES_TO_METERS_SCALE)
    // const material = new THREE.MeshPhongMaterial({
    //     color: color,
    //     side: THREE.DoubleSide,
    //     emissive: 0x000000,
    //     specular: 0x111111,
    //     shininess: 50,
    // })
    const material = ColorMaterial(color, { glow: true })

    result.add(new THREE.Mesh(geometry, material))

    // Inner ring
    const innerRingGeometry = new THREE.RingGeometry(0.25, 4, 32)
    innerRingGeometry.scale(INCHES_TO_METERS_SCALE, INCHES_TO_METERS_SCALE, INCHES_TO_METERS_SCALE)
    const innerRingMaterial = ColorMaterial(0xffffff, {})
    result.add(new THREE.Mesh(innerRingGeometry, innerRingMaterial))

    // Artist Label
    const labelGeometry = new THREE.PlaneGeometry(14, 14)
    labelGeometry.translate(0, 0, 0.001)
    labelGeometry.scale(INCHES_TO_METERS_SCALE, INCHES_TO_METERS_SCALE, INCHES_TO_METERS_SCALE)
    const labelMaterial = LabelMaterial(artist, title, 1)
    result.add(new THREE.Mesh(labelGeometry, labelMaterial))

    const result2 = result.clone()
    result2.rotation.set(0, Math.PI, 0)
    result2.position.set(0, 0, -0.002)
    result.add(result2)

    return result
}
