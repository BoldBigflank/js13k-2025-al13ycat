import { Sprite, GameLoop } from 'kontra'
import * as THREE from 'https://js13kgames.com/2025/webxr/three.module.js'

export type GameManager = {
    canvas: HTMLCanvasElement
    context: CanvasRenderingContext2D
    sprites: Sprite[]
    loop: GameLoop
}

export interface InteractiveObject3D extends THREE.Object3D {
    onPointerPick?: (selectedController?: THREE.Group) => void
    onPointerMove?: (selectedController?: THREE.Group) => void
    onPointerDrop?: (selectedController?: THREE.Group) => void
}
