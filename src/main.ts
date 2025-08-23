import * as THREE from 'https://js13kgames.com/2025/webxr/three.module.js'
import { loadModelByName, createCylinder } from './scripts/modelLoader'
import DJPuzzle from './scripts/DJPuzzle'
import { SequenceType } from './scripts/DJPuzzle'
import { VRButton } from './libraries/VRButton'
import { Witch } from './models/witch'
import { InteractiveObject3D } from './types'
import { Vinyl } from './models/vinyl'
import { AnimationFactory } from './scripts/AnimationFactory'
import { DebugScreen } from './models/DebugScreen'
import { GameOverDialog } from './models/GameOverDialog'
import { Events } from './libraries/Events'
import { BLUE, GREEN, RED } from './scripts/Colors'
import { TestMusic } from './audio/music'
// import { XRControllerModelFactory } from "./libraries/XRControllerModelFactory";

const DEBUG = false

const COMBO_COLORS = {
    color: RED,
    artist: GREEN,
    title: BLUE,
}

let camera: THREE.Camera | undefined,
    scene: THREE.Scene | undefined,
    raycaster: THREE.Raycaster | undefined,
    renderer: THREE.Renderer | undefined
let selectedController: THREE.Group | undefined
let controller1: THREE.Group | undefined, controller2: THREE.Group | undefined
let controllerGrip1, controllerGrip2
let cassetteMesh
const intersected: THREE.Object3D[] = []

let controls, baseReferenceSpace
const START_POSITION = new THREE.Vector3(0, 0, 0.3)

const initGame = async () => {
    if (DEBUG) TestMusic()
    // Clean up intro and start canvas
    document.getElementById('intro')!.style.display = 'none'
    const canvasElement = document.getElementById('c')
    const canvas: HTMLCanvasElement | null = canvasElement as unknown as HTMLCanvasElement
    if (!canvas) return
    canvas.style.display = 'block'

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor('#000000')
    renderer.xr.addEventListener('sessionstart', onXRSessionStart)
    renderer.xr.enabled = true
    renderer.setAnimationLoop(animate)
    document.body.appendChild(VRButton.createButton(renderer))
    document.body.appendChild(renderer.domElement)

    // Init Puzzle
    const djPuzzle = new DJPuzzle()

    // Create a scene and populate it
    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(0, 2, 1)
    camera.rotation.set((-1 * Math.PI) / 12, 0, 0)
    camera.name = 'camera'
    scene.add(camera)
    AnimationFactory.Instance.initScene(scene)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(ambientLight)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(6, 10, 8)
    directionalLight.castShadow = true
    directionalLight.target.position.set(0, 0, 0)
    scene.add(directionalLight)
    scene.add(directionalLight.target)

    const debugScreen = DebugScreen()
    debugScreen.position.set(0, 1, -5)
    Events.Instance.emit('debug', 'Hello🔒, world!')
    scene.add(debugScreen)

    const gameOverDialog = GameOverDialog()
    gameOverDialog.position.set(0, 1.5, -1)
    scene.add(gameOverDialog)

    cassetteMesh = loadModelByName('cassette') as InteractiveObject3D
    cassetteMesh.position.set(0, 0, -20)
    cassetteMesh.userData.isPickable = true
    scene.add(cassetteMesh)
    AnimationFactory.Instance.animateTransform({
        mesh: cassetteMesh,
        end: {
            rotation: new THREE.Euler(0, 2 * Math.PI - 0.01, 0),
        },
        duration: 3000,
        ease: (t) => t,
        loop: true,
    })

    const arenaMesh = loadModelByName('arena') as InteractiveObject3D
    const tableA = arenaMesh.getObjectByName('tableA') as InteractiveObject3D
    scene.add(arenaMesh)

    const catMesh = loadModelByName('cat')
    catMesh.position.set(-3, 1, 0)
    catMesh.scale.set(0.1, 0.1, 0.1)
    scene.add(catMesh)
    const catMesh2 = catMesh.clone(true)
    catMesh2.name = 'catMesh2'
    catMesh2.position.set(3, 1, -1)
    catMesh2.rotation.set(0, Math.PI / 2, 0)
    scene.add(catMesh2)

    const witch = Witch(scene, renderer)
    witch.position.set(0, 1.5, -1)
    witch.rotation.set(0, Math.PI, 0)

    djPuzzle.vinyls.forEach((record, i) => {
        const mesh = Vinyl(record)
        mesh.name = `vinyl-${i}`
        const originalPosition = new THREE.Vector3(0.7, 1.15, -0.2 - 0.125 * i)
        mesh.position.copy(originalPosition)
        mesh.userData.originalPosition = originalPosition
        mesh.userData.isPickable = true
        mesh.userData.recordIndex = i
        mesh.userData.returnToOriginalPosition = () => {
            scene.attach(mesh)
            AnimationFactory.Instance.cancelAnimation(mesh)
            AnimationFactory.Instance.animateTransform({
                mesh,
                end: {
                    position: mesh.userData.originalPosition,
                    rotation: new THREE.Euler(0, 0, 0),
                },
                duration: 100,
            })
        }
        // Select a record
        mesh.onPointerPick = (controller: THREE.Group) => {
            if (controller.userData.selected) return // Don't let it grab twice
            djPuzzle.selected[controller.id] = i
            const target = controller.getObjectByName('target')
            if (target) {
                AnimationFactory.Instance.cancelAnimation(mesh)
                target.attach(mesh)
                AnimationFactory.Instance.animateTransform({
                    mesh,
                    end: {
                        position: new THREE.Vector3(0, 0, 0),
                        rotation: new THREE.Euler(0, 0, 0),
                    },
                    duration: 60,
                })
                controller.userData.selected = mesh
            }
        }
        mesh.onPointerDrop = (controller: THREE.Group) => {
            // If it's near an open table mesh
            AnimationFactory.Instance.cancelAnimation(mesh, true)
            const tableDistance = mesh
                .getWorldPosition(new THREE.Vector3())
                .distanceTo(tableA.getWorldPosition(new THREE.Vector3()))
            if (tableDistance < 0.3) {
                // Move the selected vinyl to the table
                djPuzzle.addVinylByIndex(mesh.userData.recordIndex)
                delete djPuzzle.selected[controller.id]
                controller.userData.selected = undefined
                tableA.children.forEach((child: THREE.Object3D) => {
                    if (child.userData.returnToOriginalPosition) {
                        child.userData.returnToOriginalPosition()
                    }
                })
                // Move any other meshes
                tableA.attach(mesh)
                AnimationFactory.Instance.animateTransform({
                    mesh,
                    end: {
                        position: new THREE.Vector3(0, 0.01, 0),
                        rotation: new THREE.Euler((-1 * Math.PI) / 2, 0, 0),
                    },
                    duration: 60,
                }).then(() => {
                    AnimationFactory.Instance.animateTransform({
                        mesh,
                        end: {
                            rotation: new THREE.Euler((-1 * Math.PI) / 2, 0, -2 * Math.PI),
                        },
                        ease: (t) => t,
                        duration: 1800,
                        loop: true,
                    })
                })
                return
            } else {
                // Else move back to its original position
                mesh.userData.returnToOriginalPosition()
                controller.userData.selected = undefined
            }
        }
        scene.add(mesh)
    })

    // Controllers

    controller1 = renderer.xr.getController(0)
    controller1.addEventListener('selectstart', onSelectStart)
    controller1.addEventListener('selectend', onSelectEnd)
    controller1.addEventListener('squeezestart', onSelectStart)
    controller1.addEventListener('squeezeend', onSelectEnd)
    scene.add(controller1)

    controller2 = renderer.xr.getController(1)
    controller2.addEventListener('selectstart', onSelectStart)
    controller2.addEventListener('selectend', onSelectEnd)
    controller2.addEventListener('squeezestart', onSelectStart)
    controller2.addEventListener('squeezeend', onSelectEnd)
    scene.add(controller2)

    // const controllerModelFactory = new XRControllerModelFactory();

    controllerGrip1 = renderer.xr.getControllerGrip(0)

    // Visual representation of the controller
    const controllerMesh1 = createCylinder({
        radius: 0.01,
        depth: 0.2,
        color: 0xff00ff,
    })
    controllerMesh1.name = 'controllerMesh1'
    controllerMesh1.rotateX(Math.PI / 4)
    controllerGrip1.add(controllerMesh1)
    scene.add(controllerGrip1)

    // Visual representation of the controller
    controllerGrip2 = renderer.xr.getControllerGrip(1)
    const controllerMesh2 = createCylinder({
        radius: 0.01,
        depth: 0.2,
        color: 0x00ff00,
    })
    controllerMesh2.rotateX(Math.PI / 4)
    controllerGrip2.add(controllerMesh2)
    scene.add(controllerGrip2)

    const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)])

    const line = new THREE.Line(geometry)
    line.name = 'line'
    line.scale.z = 5

    controller1.add(line.clone())
    controller2.add(line.clone())

    // Target for selected records to go
    const target = new THREE.Group()
    target.rotation.set((-1 * Math.PI) / 2, 0, 0)
    target.position.set(0, -0.05, -0.12)
    target.name = 'target'

    controller1.add(target.clone())
    controller2.add(target.clone())

    raycaster = new THREE.Raycaster()

    // Event listeners
    window.addEventListener('resize', onWindowResize, false)

    Events.Instance.on('combo', () => {
        let bestCombo = 'color'
        if (djPuzzle.comboCount.artist >= djPuzzle.comboCount[bestCombo]) {
            bestCombo = 'artist'
        }
        if (djPuzzle.comboCount.title >= djPuzzle.comboCount[bestCombo]) {
            bestCombo = 'title'
        }

        for (let i = 0; i < 6; i++) {
            const progressMesh = arenaMesh.getObjectByName(`progress-${i}`)
            const color = i < djPuzzle.comboCount[bestCombo] ? COMBO_COLORS[bestCombo] : 0x000000
            if (progressMesh) {
                progressMesh.visible = true
                progressMesh.material.color.set(color)
                progressMesh.material.emissive.set(color)
                progressMesh.material.needsUpdate = true
            }
        }
    })
    Events.Instance.on('solved', () => {
        const puzzleKeys = Object.keys(djPuzzle.solvedCombo) as SequenceType[]
        for (let i = 0; i < puzzleKeys.length; i++) {
            const puzzleKey = puzzleKeys[i]
            const completeMesh = arenaMesh.getObjectByName(`complete-${i}`)
            const color = djPuzzle.solvedCombo[puzzleKey] ? COMBO_COLORS[puzzleKey] : 0x000000
            if (completeMesh) {
                completeMesh.visible = true
                completeMesh.material.color.set(color)
                completeMesh.material.emissive.set(color)
                completeMesh.material.needsUpdate = true
            }
        }
    })
    djPuzzle.reset()
    djPuzzle.addVinylByIndex(2)
    djPuzzle.addVinylByIndex(4)
    djPuzzle.addVinylByIndex(1)
    djPuzzle.addVinylByIndex(5)
    djPuzzle.addVinylByIndex(2)
}

function onXRSessionStart() {
    baseReferenceSpace = renderer.xr.getReferenceSpace()
    // Move to the dj station
    const offsetPosition = {
        x: -1 * START_POSITION.x,
        y: -1 * START_POSITION.y,
        z: -1 * START_POSITION.z,
        w: 1,
    }
    const offsetRotation = new THREE.Quaternion()
    const transform = new XRRigidTransform(offsetPosition, offsetRotation)
    const teleportSpaceOffset = baseReferenceSpace.getOffsetReferenceSpace(transform)
    renderer.xr.setReferenceSpace(teleportSpaceOffset)
}

// Starts pulling trigger
function onSelectStart(event) {
    selectedController = event.target
    const intersections = getIntersections(selectedController)
    if (intersections.length > 0) {
        let collided = false
        intersections.forEach(({ object, distance }) => {
            if (collided) return
            let focusedObject = object
            while (focusedObject) {
                if (focusedObject.onPointerPick) {
                    focusedObject.onPointerPick(selectedController)
                    collided = true
                    // hide the line
                    const line = selectedController.getObjectByName('line')
                    line.visible = false
                    break
                }
                focusedObject = focusedObject.parent
            }
        })
    }
    selectedController.userData.targetRayMode = event.data.targetRayMode
}

// Releases the trigger
function onSelectEnd(event) {
    selectedController = event.target
    const focusedObject = selectedController.userData.selected
    if (focusedObject?.onPointerDrop) {
        focusedObject.onPointerDrop(selectedController)
    }
    const line = selectedController.getObjectByName('line')
    line.visible = true
}

function getIntersections(controller) {
    controller.updateMatrixWorld()
    raycaster.setFromXRController(controller)
    return raycaster.intersectObjects(scene.children, true)
}

// Used for hovering objects
function intersectObjects(controller) {
    // Do not highlight in mobile-ar
    if (controller.userData.targetRayMode === 'screen') return
    // Do not highlight when already selected
    if (controller.userData.selected !== undefined) return
    const line = controller.getObjectByName('line')
    const intersections = getIntersections(controller)
    line.scale.z = 5
    if (intersections.length > 0) {
        // for each of the intersections, look for userData.isPickable
        let collided = false
        intersections.forEach(({ object, distance }) => {
            if (collided) return
            let focusedObject = object
            while (focusedObject) {
                if (focusedObject.userData.isPickable) {
                    line.scale.z = distance
                    intersected.push(focusedObject)
                    collided = true
                    break
                }
                focusedObject = focusedObject.parent
            }
        })
    }
}

function cleanIntersected() {
    while (intersected.length) {
        const object = intersected.pop()
        // object.material.emissive.r = 0;
    }
}

function animate() {
    AnimationFactory.Instance.update()
    Events.Instance.emit('tick')
    cleanIntersected()

    intersectObjects(controller1)
    intersectObjects(controller2)

    renderer.render(scene, camera)
}

const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
}

window.addEventListener('DOMContentLoaded', () => {
    const b = document.getElementById('playButton') as HTMLButtonElement
    b.onclick = initGame
})
