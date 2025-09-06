import * as THREE from 'three'
import { Events } from '../libraries/Events'
import { GameProgress } from '../scripts/DJPuzzle'
import { AnimationFactory, easeInOutCubic } from '../scripts/AnimationFactory'
import { TYPE_COLORS } from '../scripts/Colors'
import { waveHeight } from '../scripts/Utils'
import { TickEvent } from '../types'

export class Grid {
    parent: THREE.Group
    _mesh: THREE.Object3D
    geometry: THREE.Geometry
    material: THREE.Material
    shouldShow: boolean

    constructor() {
        this.shouldShow = false
        this.parent = new THREE.Group()
        this.geometry = new THREE.PlaneGeometry(20, 29, 20, 29)
        this.geometry.rotateX(Math.PI / 2)
        this.material = new THREE.MeshStandardMaterial({
            wireframe: true,
        })
        this.material.emissiveIntensity = 1
        this._mesh = new THREE.Mesh(this.geometry, this.material)
        this.parent.add(this._mesh)

        Events.Instance.on(TickEvent, (delta) => {
            const positions = this.geometry.getAttribute('position')
            for (let i = 0; i < positions.array.length; i += 3) {
                const x = positions.array[i]
                const z = positions.array[i + 2]
                positions.array[i + 1] = waveHeight(x, z)
            }
            positions.needsUpdate = true
        })
        Events.Instance.on(ProgressEvent, (progress: GameProgress) => {
            this.shouldShow = progress.bestComboCount >= 3
            const visible = this._mesh.material.visible
            if (!visible && this.shouldShow) {
                this._mesh.position.set(0, -5, 0)
                this.material.emissive.set(TYPE_COLORS[progress.bestComboType])
                AnimationFactory.Instance.animateTransform({
                    mesh: this._mesh,
                    end: {
                        position: new THREE.Vector3(0, 0, 0),
                    },
                    ease: easeInOutCubic,
                    duration: 2000,
                })
            }

            this._mesh.material.visible = this.shouldShow
        })
    }

    get mesh() {
        return this.parent
    }
}
