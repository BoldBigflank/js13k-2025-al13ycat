import * as THREE from 'three'
import { Events } from '../libraries/Events'
import { GameProgress } from '../scripts/DJPuzzle'
import { AnimationFactory, easeInOutCubic } from '../scripts/AnimationFactory'
import { TYPE_COLORS } from '../scripts/Colors'
import { V3_ZERO, waveHeight } from '../scripts/Utils'
import { ProgressEvent, TickEvent } from '../types'

export class Grid {
    parent: THREE.Group
    _mesh: THREE.Object3D
    _geometry: THREE.Geometry
    _material: THREE.Material
    _shouldShow: boolean

    constructor() {
        this._shouldShow = false
        this.parent = new THREE.Group()
        this._geometry = new THREE.PlaneGeometry(20, 29, 20, 29)
        this._geometry.rotateX(Math.PI / 2)
        this._material = new THREE.MeshStandardMaterial({
            wireframe: true,
        })
        this._material.emissiveIntensity = 1
        this._mesh = new THREE.Mesh(this._geometry, this._material)
        this.parent.add(this._mesh)

        Events.Instance.on(TickEvent, (delta) => {
            const positions = this._geometry.getAttribute('position')
            for (let i = 0; i < positions.array.length; i += 3) {
                const x = positions.array[i]
                const z = positions.array[i + 2]
                positions.array[i + 1] = waveHeight(x, z)
            }
            positions.needsUpdate = true
        })
        Events.Instance.on(ProgressEvent, (progress: GameProgress) => {
            this._shouldShow = progress.bestComboCount >= 3
            const visible = this._mesh.material.visible
            if (!visible && this._shouldShow) {
                this._mesh.position.set(0, -5, 0)
                this._material.emissive.set(TYPE_COLORS[progress.bestComboType])
                AnimationFactory.Instance.animateTransform({
                    mesh: this._mesh,
                    end: {
                        position: V3_ZERO,
                    },
                    ease: easeInOutCubic,
                    duration: 2000,
                })
            }

            this._mesh.material.visible = this._shouldShow
        })
    }

    get mesh() {
        return this.parent
    }
}
