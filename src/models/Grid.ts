import * as THREE from 'https://js13kgames.com/2025/webxr/three.module.js'
import { Events } from '../libraries/Events'
import { GameProgress } from '../scripts/DJPuzzle'
import { AnimationFactory, easeInOutCubic } from '../scripts/AnimationFactory'

export class Grid {
    clock: THREE.Clock
    parent: THREE.Group
    _mesh: THREE.Object3D
    geometry: THREE.Geometry

    constructor() {
        this.clock = new THREE.Clock()
        this.parent = new THREE.Group()
        this.parent.name = 'Grid'
        this.geometry = new THREE.PlaneGeometry(20, 26, 20, 26)
        this.geometry.rotateX(Math.PI / 2)
        this._mesh = new THREE.Mesh(
            this.geometry,
            new THREE.MeshBasicMaterial({
                color: '#ff00ff',
                wireframe: true,
            }),
        )
        this.parent.add(this._mesh)

        Events.Instance.on('tick', (delta) => {
            const positions = this.geometry.getAttribute('position')
            for (let i = 0; i < positions.array.length; i += 3) {
                const x = positions.array[i]
                const z = positions.array[i + 2]
                positions.array[i + 1] = 0.5 * Math.sin(Math.sqrt(x * x + z * z) - 2 * this.clock.getElapsedTime())
            }
            positions.needsUpdate = true
        })
        Events.Instance.on('progress', (progress: GameProgress) => {
            const visible = this._mesh.material.visible
            if (!visible && progress.bestComboCount > 5) {
                this._mesh.position.set(0, -5, 0)
                AnimationFactory.Instance.animateTransform({
                    mesh: this._mesh,
                    end: {
                        position: new THREE.Vector3(0, 0, 0),
                    },
                    ease: easeInOutCubic,
                    duration: 2000,
                })
            }

            this._mesh.material.visible = progress.bestComboCount > 5
        })
    }

    get mesh() {
        return this.parent
    }
}
