import * as THREE from 'https://js13kgames.com/2025/webxr/three.module.js'
import DJPuzzle, { GameProgress, SOLUTION_COLOR } from './scripts/DJPuzzle'
import { SequenceType } from './scripts/DJPuzzle'
import { VRButton } from './libraries/VRButton'
import { Vinyl } from './models/vinyl'
import { AnimationFactory } from './scripts/AnimationFactory'
import { DebugScreen } from './models/DebugScreen'
import { Events } from './libraries/Events'
import { BLUE, GREEN, RED } from './scripts/Colors'
import { PickupSFX, RecordSFX, Song3 } from './audio/music'
import { TextMaterial } from './scripts/TextureUtils'
import { sleep } from './scripts/Utils'
import { Arena } from './models/Arena'
import { Runner } from './models/Runner'
import { Paw } from './models/Paw'

const CLOCK = new THREE.Clock()
let beat = 0

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
const intersected: THREE.Object3D[] = []

let baseReferenceSpace
const START_POSITION = new THREE.Vector3(0, 0, 0.3)

const initGame = async () => {
    Song3()
    // Clean up intro and start canvas
    document.getElementById('intro')!.style.display = 'none'
    document.getElementById('playButton')!.setAttribute('disabled', 'true')
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

    if (DEBUG) {
        const debugScreen = DebugScreen()
        debugScreen.position.set(0, 1, -5)
        Events.Instance.emit('debug', 'Hello🔒, world!')
        scene.add(debugScreen)
    }

    const arenaMesh = Arena(renderer)
    scene.add(arenaMesh)
    const tableA = arenaMesh.getObjectByName('tableA')

    const runner = Runner(6)
    runner.position.set(-4, -1, -11)
    scene.add(runner)
    const runner2 = Runner(6)
    runner2.position.set(4, -1, -11)
    scene.add(runner2)

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
                        rotation: new THREE.Euler(0, Math.PI / 2, 0),
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
                PickupSFX()
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
    controller1.addEventListener('connected', onControllerConnected)
    controller1.addEventListener('selectstart', onSelectStart)
    controller1.addEventListener('selectend', onSelectEnd)
    controller1.addEventListener('squeezestart', onSelectStart)
    controller1.addEventListener('squeezeend', onSelectEnd)
    scene.add(controller1)

    controller2 = renderer.xr.getController(1)
    controller2.addEventListener('connected', onControllerConnected)
    controller2.addEventListener('selectstart', onSelectStart)
    controller2.addEventListener('selectend', onSelectEnd)
    controller2.addEventListener('squeezestart', onSelectStart)
    controller2.addEventListener('squeezeend', onSelectEnd)
    scene.add(controller2)

    raycaster = new THREE.Raycaster()

    // Event listeners
    window.addEventListener('resize', onWindowResize, false)

    Events.Instance.on('comboBroken', () => {
        RecordSFX()
    })

    Events.Instance.on('progress', (progress: GameProgress) => {
        // Update combo
        let bestCombo: SequenceType = 'color'
        if (progress.artist.correctCount >= progress[bestCombo].correctCount) {
            bestCombo = 'artist'
        }
        if (progress.title.correctCount >= progress[bestCombo].correctCount) {
            bestCombo = 'title'
        }

        for (let i = 0; i < 6; i++) {
            const vinyl = djPuzzle.getVinylInQueue(progress[bestCombo].correctCount - i - 1)
            const progressMesh = arenaMesh.getObjectByName(`progress-${i}`)
            let color = i < progress[bestCombo].correctCount ? COMBO_COLORS[bestCombo] : 0x000000
            if (i < progress[bestCombo].correctCount && bestCombo === 'color') color = SOLUTION_COLOR[i]
            if (progressMesh) {
                progressMesh.visible = true
                progressMesh.material.color.set(color)
                progressMesh.material.emissive.set(color)
                progressMesh.material.needsUpdate = true

                // Progress label
                let progressLabel = progressMesh.getObjectByName('progress-label')
                if (!progressLabel) {
                    const labelGeometry = new THREE.PlaneGeometry(1, 1)
                    labelGeometry.translate(0.1, 0.1, 0.15)
                    labelGeometry.rotateZ(Math.PI / 8)
                    progressLabel = new THREE.Mesh(labelGeometry)
                    progressLabel.renderOrder = 1
                    progressLabel.name = 'progress-label'
                    progressMesh.add(progressLabel)
                }
                progressLabel.visible = i < progress[bestCombo].correctCount && vinyl ? true : false
                if (vinyl) progressLabel.material = TextMaterial([vinyl[bestCombo]], color)
                if (bestCombo === 'color') progressLabel.visible = false
                if (progress[bestCombo].solved) progressLabel.visible = false
            }
        }
        // Update solved
        const puzzleKeys = Object.keys(progress) as SequenceType[]
        for (let i = 0; i < puzzleKeys.length; i++) {
            const puzzleKey = puzzleKeys[i]
            const completeMesh = arenaMesh.getObjectByName(`complete-${i}`)
            const color = progress[puzzleKey].solved ? COMBO_COLORS[puzzleKey] : 0x000000
            if (completeMesh) {
                completeMesh.visible = true
                completeMesh.material.color.set(color)
                completeMesh.material.emissive.set(color)
                completeMesh.material.needsUpdate = true
            }
        }
    })

    djPuzzle.reset()
    // Color
    // djPuzzle.addVinylByIndex(0)
    // djPuzzle.addVinylByIndex(1)
    // djPuzzle.addVinylByIndex(2)
    // djPuzzle.addVinylByIndex(3)
    // djPuzzle.addVinylByIndex(4)
    // djPuzzle.addVinylByIndex(5)

    // Artist
    // djPuzzle.addVinylByIndex(0)
    // djPuzzle.addVinylByIndex(2)
    // djPuzzle.addVinylByIndex(4)
    // djPuzzle.addVinylByIndex(1)
    // djPuzzle.addVinylByIndex(5)
    // djPuzzle.addVinylByIndex(3)

    // Title
    // djPuzzle.addVinylByIndex(0)
    // djPuzzle.addVinylByIndex(3)
    // djPuzzle.addVinylByIndex(5)
    // djPuzzle.addVinylByIndex(1)
    // djPuzzle.addVinylByIndex(4)
    // djPuzzle.addVinylByIndex(2)
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

function onControllerConnected(event) {
    console.log('controller connected', event)
    const controller = event.target
    const handedness = event.data.handedness === 'left' ? -1 : 1
    const controllerRotation = event.data.hand ? 0 : (handedness * Math.PI) / 2
    Events.Instance.emit('debug', `Hand: ${event.data.hand}`)

    // TODO: Move target to the controller's grip space
    const targetMesh = controller.getObjectByName('target')
    if (!targetMesh) {
        const target = new THREE.Group()
        target.name = 'target'
        target.rotation.set(0, 0, 0)
        target.position.set(-1 * handedness * 0.035, 0.05, -0.12)
        controller.add(target)
    }

    let pawMesh = controller.getObjectByName('paw')
    if (!pawMesh) {
        pawMesh = Paw()
        pawMesh.position.set(0, 0, 0.15)
        pawMesh.rotation.set((3 * Math.PI) / 2, controllerRotation, 0)
        controller.add(pawMesh)
    }

    // line
    let line = controller.getObjectByName('line')
    if (!line) {
        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, -1),
        ])
        line = new THREE.Line(geometry)
        line.material.color.set(0xff0000)
        line.name = 'line'
        line.scale.z = 5

        controller.add(line)
    }
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
    if (line) line.scale.z = 5
    if (intersections.length > 0) {
        // for each of the intersections, look for userData.isPickable
        let collided = false
        intersections.forEach(({ object, distance }) => {
            if (collided) return
            let focusedObject = object
            while (focusedObject) {
                if (focusedObject.userData.isPickable) {
                    if (line) line.scale.z = distance
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
    const d = CLOCK.getDelta()
    beat += d
    if (beat >= 1) {
        Events.Instance.emit('beat')
        beat -= 1
    }
    AnimationFactory.Instance.update()
    Events.Instance.emit('tick', d)
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
