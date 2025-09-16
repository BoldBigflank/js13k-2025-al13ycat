import * as THREE from 'three'
import DJPuzzle from './scripts/DJPuzzle'
import { VRButton } from './libraries/VRButton'
import { Vinyl } from './models/Vinyl'
import { AnimationFactory } from './scripts/AnimationFactory'
import { DebugScreen } from './models/DebugScreen'
import { Events } from './libraries/Events'
import { CorrectSFX, RecordSFX, Song3 } from './audio/music'
import { Arena } from './models/Arena'
import { Paw } from './models/Paw'
import { FishSwirl } from './models/FishSwirl'
import { Sky } from './models/Sky'
import { BLACK, CAT_GREY, NEON_BLUE, NEON_PURPLE, RED, WHITE } from './scripts/Colors'
import {
    BeatEvent,
    ComboBrokenEvent,
    DebugEvent,
    DownbeatEvent,
    FishJuggledEvent,
    InteractiveObject3D,
    ProgressEvent,
    RoomGlowEvent,
    SplashEvent,
    TickEvent,
} from './types'
import { Splash } from './models/Splash'
import { sleep, DEBUG, Intro, LocalStorageKey, V3_ZERO } from './scripts/Utils'
import { TextMaterial } from './scripts/TextureUtils'

const CLOCK = new THREE.Clock()
let beat = 0
let fishCount = 0
let maxFishCount = 0

let camera: THREE.Camera | undefined,
    scene: THREE.Scene | undefined,
    raycaster: THREE.Raycaster | undefined,
    renderer: THREE.WebGLRenderer | undefined
let selectedController: THREE.Group | undefined
let controller1: THREE.Group | undefined, controller2: THREE.Group | undefined
const intersected: THREE.Object3D[] = []

let baseReferenceSpace
const START_POSITION = new THREE.Vector3(0, 0, 0.3)
const END_POSITION = new THREE.Vector3(0, 5, 0)
const c = new THREE.Color()

const initGame = async () => {
    maxFishCount = JSON.parse(localStorage.getItem(LocalStorageKey) || '{}').maxFishCount || 0
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(NEON_PURPLE, 1)
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
    scene.add(camera)
    AnimationFactory.Instance.initScene(scene)

    const ambientLightBaseColor = new THREE.Color().setStyle(CAT_GREY)
    const ambientLight = new THREE.AmbientLight(ambientLightBaseColor, 0.2)
    scene.add(ambientLight)
    const directionalLightBaseColor = new THREE.Color().setStyle(WHITE)
    const directionalLight = new THREE.DirectionalLight(directionalLightBaseColor, 0.3)
    directionalLight.position.set(6, 10, 8)
    directionalLight.castShadow = true
    directionalLight.target.position.set(0, 0, 0)
    scene.add(directionalLight)
    scene.add(directionalLight.target)

    const splash = Splash()
    scene.add(splash)

    const skyMesh = Sky()
    skyMesh.position.set(0, 0, 5)
    scene.add(skyMesh)

    const arenaMesh = Arena(renderer)
    scene.add(arenaMesh)

    const pad = arenaMesh.getObjectByName('pad')
    const fishProgress = arenaMesh.getObjectByName('fish')
    fishProgress.material = TextMaterial(['', '💥🐟'], { ratio: 1.5 })

    const fishSwirl = FishSwirl()
    fishSwirl.position.set(0, 0, -10)
    scene.attach(fishSwirl)

    djPuzzle.vinyls.forEach((record, i) => {
        const mesh = Vinyl(record)
        const originalPosition = new THREE.Vector3(0.7, 1.15, -0.2 - 0.125 * i)
        mesh.position.copy(originalPosition)
        mesh.userData.originalPosition = originalPosition
        mesh.userData.isPickable = true
        mesh.userData.recordIndex = i
        mesh.userData.endMove = () => {
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
            if (djPuzzle.isSolved()) return
            djPuzzle.selected[controller.id] = i
            const target = controller.getObjectByName('t')
            if (target) {
                AnimationFactory.Instance.cancelAnimation(mesh)
                target.attach(mesh)
                AnimationFactory.Instance.animateTransform({
                    mesh,
                    end: {
                        position: V3_ZERO,
                        rotation: new THREE.Euler(0, Math.PI / 2, 0),
                    },
                    duration: 60,
                })
                controller.userData.selected = mesh

                // Light up the pad
                pad.material.emissive.setStyle(NEON_BLUE)
            }
        }
        mesh.onPointerDrop = (controller: THREE.Group) => {
            // If it's near a pad mesh
            AnimationFactory.Instance.cancelAnimation(mesh, true)
            pad.material.emissive.setStyle(BLACK)
            const padDistance = mesh
                .getWorldPosition(new THREE.Vector3())
                .distanceTo(pad.getWorldPosition(new THREE.Vector3()))
            if (padDistance < 0.3) {
                // Move the selected vinyl to the pad
                djPuzzle.addVinylByIndex(mesh.userData.recordIndex)
                delete djPuzzle.selected[controller.id]
                controller.userData.selected = undefined
                pad.children.forEach((child: THREE.Object3D) => {
                    if (child.userData.endMove) {
                        child.userData.endMove()
                    }
                })
                // Move any other meshes
                pad.attach(mesh)
                AnimationFactory.Instance.animateTransform({
                    mesh,
                    end: {
                        position: new THREE.Vector3(0, 0.02, 0),
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
                mesh.userData.endMove()
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

    Events.Instance.on(ComboBrokenEvent, (isComboBroken: boolean) => {
        isComboBroken ? RecordSFX() : CorrectSFX()
        if (!isComboBroken) {
            Events.Instance.emit(SplashEvent, pad?.getWorldPosition(new THREE.Vector3()))
        }
    })

    Events.Instance.on(RoomGlowEvent, (color: string) => {
        c.setStyle(color)
        ambientLight.color.set(c.add(ambientLightBaseColor).multiplyScalar(0.5))
    })

    Events.Instance.on(DownbeatEvent, () => {
        if (beat > 100) {
            Events.Instance.emit(BeatEvent)
            beat = 0
        }
    })
    Events.Instance.on(ProgressEvent, () => {
        if (!djPuzzle.isSolved()) return
        xrMoveToLocation(END_POSITION)
        END_POSITION.set(0, 0, 0)
    })

    // Fish Game Events
    Events.Instance.on(FishJuggledEvent, (count: number) => {
        fishCount = count > 0 ? fishCount + 1 : 0
        maxFishCount = Math.max(maxFishCount, fishCount)
        localStorage.setItem(LocalStorageKey, JSON.stringify({ maxFishCount }))
        // juggles
        fishProgress.material = TextMaterial(['', '💥🐟', '', `JUGGLES: ${fishCount}`, '', `BEST: ${maxFishCount}`], {
            ratio: 1.5,
            color: WHITE,
        })
    })

    Song3()
    djPuzzle.reset()

    if (DEBUG) {
        // // Cover art
        // const titleVinyl = Vinyl({
        //     color: 'Red',
        //     artist: 'Alex Swan',
        //     title: 'AL13YCAT',
        // })
        // scene.add(titleVinyl)
        // camera.position.set(0, 0, 0)
        // titleVinyl.position.set(0, 0, -0.3)
        // arenaMesh.position.set(0, -100, 0)
        // camera.lookAt(new THREE.Vector3(0, 0, -1))
        // document.getElementById('VRButton')!.style.display = 'none'

        const debugScreen = DebugScreen()
        debugScreen.position.set(0, 1, 5)
        debugScreen.rotation.set(0, Math.PI, 0)
        if (DEBUG) Events.Instance.emit(DebugEvent, 'Hello🔒, world!')
        scene.add(debugScreen)
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
}

function onXRSessionStart() {
    xrMoveToLocation(START_POSITION)
}

function xrMoveToLocation(position: THREE.Vector3) {
    baseReferenceSpace = renderer.xr.getReferenceSpace()
    const offsetPosition = {
        x: -1 * position.x,
        y: -1 * position.y,
        z: -1 * position.z,
        w: 1,
    }
    const offsetRotation = new THREE.Quaternion()
    const transform = new XRRigidTransform(offsetPosition, offsetRotation)
    baseReferenceSpace = baseReferenceSpace.getOffsetReferenceSpace(transform)
    renderer.xr.setReferenceSpace(baseReferenceSpace)
}

function onControllerConnected(event) {
    const controller = event.target
    const handedness = event.data.handedness === 'left' ? -1 : 1
    if (DEBUG) Events.Instance.emit(DebugEvent, `Hand: ${event.data.hand}`)

    // TODO: Move target to the controller's grip space
    const targetMesh = controller.getObjectByName('t')
    if (!targetMesh) {
        const target = new THREE.Group()
        target.name = 't'
        target.rotation.set(0, 0, 0)
        target.position.set(-1 * handedness * 0.035, 0.05, -0.12)
        controller.add(target)
    }

    let pawMesh = controller.getObjectByName('p')
    if (!pawMesh) {
        pawMesh = Paw()
        pawMesh.position.set(0, 0, 0.15)
        controller.add(pawMesh)
    }

    // line
    let line = controller.getObjectByName('l')
    if (!line) {
        const geometry = new THREE.BufferGeometry().setFromPoints([V3_ZERO, new THREE.Vector3(0, 0, -1)])
        line = new THREE.Line(geometry)
        line.material.color.set(RED)
        line.name = 'l'
        line.scale.z = 5

        controller.add(line)
    }
}

// Starts pulling trigger
function onSelectStart(event) {
    selectedController = event.target
    if (!selectedController) return
    const intersections = getIntersections(selectedController)
    if (intersections.length > 0) {
        let collided = false
        intersections.forEach(({ object, distance }) => {
            if (collided) return
            let focusedObject = object as InteractiveObject3D
            while (focusedObject) {
                if (focusedObject.onPointerPick) {
                    focusedObject.onPointerPick(selectedController)
                    collided = true
                    // hide the line
                    const line = selectedController!.getObjectByName('l')
                    if (line) line.visible = false
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
    const line = selectedController.getObjectByName('l')
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
    const line = controller.getObjectByName('l')
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
                    const highlight = focusedObject.getObjectByName('h')
                    if (highlight) highlight.visible = true
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
        const highlight = object.getObjectByName('h')
        if (highlight) highlight.visible = false
    }
}

function animate() {
    const d = CLOCK.getDelta()
    beat += d
    if (beat >= 0.5) {
        Events.Instance.emit(BeatEvent)
        beat -= 0.5
    }
    AnimationFactory.Instance.update()
    Events.Instance.emit(TickEvent, d)
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

const setLoading = async (isLoading: boolean) => {
    const b = document.getElementById('p')!
    if (isLoading) {
        b.setAttribute('disabled', 'true')
        b.innerHTML = 'LOADING...'
    } else {
        b.removeAttribute('disabled')
        b.innerHTML = 'JOIN'
    }
}

function setupButton() {
    const b = document.getElementById('p') as HTMLButtonElement
    b.style.display = 'inline-block'
    if (b)
        b.onclick = async () => {
            await setLoading(true)
            await sleep(1) // Wait a tick for the UI to update
            await initGame()
            setLoading(false)
            // Update the UI
            document.getElementById('i')!.style.display = 'none'
            document.getElementById('c')!.style.display = 'block'
        }
    const intro = document.createElement('p')
    intro.innerHTML = Intro.join('<br>')
    document.getElementById('i')?.insertBefore(intro, b)
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', setupButton)
} else {
    setupButton()
}
