import * as THREE from 'three'

export interface InteractiveObject3D extends THREE.Object3D {
    onPointerPick?: (selectedController?: THREE.Group) => void
    onPointerMove?: (selectedController?: THREE.Group) => void
    onPointerDrop?: (selectedController?: THREE.Group) => void
}
