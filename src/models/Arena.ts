import * as THREE from 'three'
import { createModel } from '../scripts/ModelLoader'
import { arenaModel } from './exported/arena'
import { catModel } from './exported/cat'
import { Crowd } from '../scripts/Crowd'
import { Cassette } from './Cassette'
import { Tuna } from './Tuna'
import { Grid } from './Grid'
import { GameOverDialog } from './GameOverDialog'
import { Progress } from './Progress'
import { Runner } from './Runner'
import { BLUE, DARK_GREY, GREY, LIGHT_GREY, WALL_GREEN } from '../scripts/Colors'

export const Arena = (renderer: THREE.renderer): THREE.Object3D => {
    // Main arena
    const mesh = createModel(arenaModel(), {
        palette: {
            Green: WALL_GREEN, // Awnings
            Yellow: LIGHT_GREY, // Pillars
            Orange: GREY,
            Red: DARK_GREY, // Dance floor
            'Light Blue': BLUE, // Records/Turntable
        },
    }) as THREE.Object3D

    // Progress console
    const progress = Progress()
    mesh.add(progress)
    progress.position.set(-0.1, 0.9, -0.7)

    // Tuna (100bytes)
    const tuna = Tuna()
    mesh.add(tuna)
    tuna.position.set(-0.4, 1.0, -0.3)

    // Crowd
    const crowd = Crowd(renderer)
    crowd.name = 'Crowd'
    // mesh.getObjectByName('floor').add(crowd)
    mesh.add(crowd)
    crowd.position.set(0, -1, -10)
    crowd.rotation.set(0, Math.PI, 0) // Just turn it around

    // Cats (440 bytes)
    const catMesh = createModel(catModel(), { palette: { Purple: '#333333', Silver: '#888888' } })
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
    cassetteMesh.position.set(0, 0, -30)

    const grid = new Grid()
    mesh.add(grid.mesh)
    grid.mesh.position.set(0, -1, -10)

    const gameOverDialog = GameOverDialog()
    mesh.add(gameOverDialog)
    gameOverDialog.position.set(0, 2, -1)

    // MAke a Runner for all the pillars
    const runner = Runner(6)
    mesh.add(runner)
    runner.position.set(0, -3, -10)
    runner.scale.set(2, 1, 2)
    return mesh
}
