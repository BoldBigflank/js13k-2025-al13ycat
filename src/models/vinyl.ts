import * as THREE from "https://js13kgames.com/2025/webxr/three.module.js";
import { inchesToMeters, initCanvas } from "../scripts/Utils";
import { BLACK, MAGENTA } from "../scripts/Colors";

const INCHES_TO_METERS_SCALE = .0254

type VinylProps = {
    color: string
    artist: string
    title: string
}

const LabelMaterial = (title, artist) => {
    const lines = [title, artist]
    const [canvas, ctx] = initCanvas()
    ctx.fillStyle = MAGENTA
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = BLACK

    ctx.font = `64px Helvetica`
    ctx.scale(1.0, lines.length)
    ctx.textBaseline = 'top'
    ctx.textAlign = 'left'
    let fontSize = 64
    if (lines.length > 0) {
        const m = ctx.measureText(lines[0])
        fontSize = Math.min((64 * (512 - 64)) / m.width, 512)
        ctx.font = `${fontSize}px Helvetica`
    }
    lines.forEach((line, index) => {
        ctx.fillText(`${line}`, 32, 32 + fontSize * index)
    })
    const texture = new THREE.CanvasTexture(canvas)
    const material = new THREE.MeshBasicMaterial({
        map: texture
    })
    return material
}

export const Vinyl = ({color, title, artist}: VinylProps): THREE.Object3D => {
    const result = new THREE.Group()
    // Outer ring
    
    // innerRadius, outerRadius, thetaSegments, phiSegments, thetaStart, thetaLength
    const geometry = new THREE.RingGeometry(4, 7, 32)
    geometry.scale(INCHES_TO_METERS_SCALE, INCHES_TO_METERS_SCALE, INCHES_TO_METERS_SCALE)
    const material = new THREE.MeshStandardMaterial({ color: color, side: THREE.DoubleSide });
    result.add(new THREE.Mesh(geometry, material)) // Remember to scene.add later
    
    // Inner ring
    const innerRingGeometry = new THREE.RingGeometry(0.25, 4, 32)
    innerRingGeometry.scale(INCHES_TO_METERS_SCALE, INCHES_TO_METERS_SCALE, INCHES_TO_METERS_SCALE)
    const innerRingMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    result.add(new THREE.Mesh(innerRingGeometry, innerRingMaterial))
    
    // Label
    const labelGeometry = new THREE.PlaneGeometry(5, 2)
    labelGeometry.translate(0, 2, 0.001)
    labelGeometry.scale(INCHES_TO_METERS_SCALE, INCHES_TO_METERS_SCALE, INCHES_TO_METERS_SCALE)
    const labelMaterial = LabelMaterial(title, artist)
    result.add(new THREE.Mesh(labelGeometry, labelMaterial))
    
    const result2 = result.clone()
    result2.rotation.set(0, Math.PI, 0)
    result2.position.set(0, 0, -.002)
    result.add(result2)
    
    return result
}