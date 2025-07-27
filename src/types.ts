import { Sprite, GameLoop } from "kontra"

export type GameManager = {
    canvas: HTMLCanvasElement
    context: CanvasRenderingContext2D
    sprites: Sprite[]
    loop: GameLoop
}