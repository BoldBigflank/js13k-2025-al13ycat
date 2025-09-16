import * as THREE from 'three'

export interface InteractiveObject3D extends THREE.Object3D {
    onPointerPick?: (selectedController?: THREE.Group) => void
    onPointerMove?: (selectedController?: THREE.Group) => void
    onPointerDrop?: (selectedController?: THREE.Group) => void
}

export const BeatEvent = 0
export const ComboBrokenEvent = 1
export const DebugEvent = 2
export const DownbeatEvent = 3
export const FishJuggledEvent = 4
export const ProgressEvent = 5
export const RoomGlowEvent = 6
export const SplashEvent = 7
export const TickEvent = 8
export const LaserEvent = 9
