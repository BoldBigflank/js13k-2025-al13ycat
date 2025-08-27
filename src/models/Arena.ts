import * as THREE from 'https://js13kgames.com/2025/webxr/three.module.js'
import { loadModelByName } from '../scripts/modelLoader'
import { Crowd } from '../scripts/Crowd'
import { Cassette } from './Cassette'
import { Grid } from './Grid'
import { GameOverDialog } from './GameOverDialog'
import { Runner } from './Runner'

export const Arena = (renderer: THREE.renderer): THREE.Object3D => {
    // Main arena
    const mesh = loadModelByName('arena') as THREE.Object3D

    // Crowd
    const crowd = Crowd(renderer)
    crowd.name = 'Crowd'
    mesh.getObjectByName('floor').add(crowd)

    // Cats
    const catMesh = loadModelByName('cat')
    catMesh.name = 'catMesh'
    catMesh.position.set(-3, 1, 0)
    catMesh.scale.set(0.1, 0.1, 0.1)
    catMesh.rotation.set(0, -Math.PI / 4, 0)
    mesh.attach(catMesh)

    const catMesh2 = catMesh.clone(true)
    catMesh2.name = 'catMesh2'
    catMesh2.position.set(3, 1, 0)
    catMesh2.rotation.set(0, Math.PI / 4, 0)
    mesh.attach(catMesh2)

    const cassetteMesh = Cassette()
    mesh.add(cassetteMesh)
    cassetteMesh.position.set(0, 0, -20)

    const grid = new Grid()
    mesh.add(grid.mesh)
    grid.mesh.position.set(0, -1, -5)

    const gameOverDialog = GameOverDialog()
    mesh.add(gameOverDialog)
    gameOverDialog.position.set(0, 4, -1)

    // MAke a Runner for all the pillars
    return mesh
}
