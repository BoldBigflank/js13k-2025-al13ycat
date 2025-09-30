// Use https://github.com/ElementalSystems/WakeTheCat/blob/main/js/mouse.js as a reference for the mouse script.
import * as THREE from 'three'
import { InteractiveObject3D } from '../types'

export class Mouse {
    dragStart = new THREE.Vector2()
    dragR = new THREE.Vector2()
    raycaster = new THREE.Raycaster()
    mouse = new THREE.Vector2()

    selectedObject: THREE.Object3D | null = null
    canvas: HTMLCanvasElement
    scene: THREE.Scene
    camera: THREE.Camera
    intersected: THREE.Object3D[] = []
    controller: THREE.Group = new THREE.Group()
    isMouseDown = false
    pad: THREE.Object3D | null = null

    constructor(canvas: HTMLCanvasElement, scene: THREE.Scene, camera: THREE.Camera) {
        this.canvas = canvas
        this.raycaster = new THREE.Raycaster()
        this.dragStart = new THREE.Vector2()
        this.dragR = new THREE.Vector2()
        this.mouse = new THREE.Vector2()
        this.scene = scene
        this.pad = scene.getObjectByName('pad') as THREE.Object3D
        this.camera = camera
        this.intersected = []
        this.isMouseDown = false
        this.controller = new THREE.Group()
        const target = new THREE.Group()
        target.name = 't'
        target.position.set(0, 1.8, 0)
        target.scale.set(2, 2, 2)
        target.rotation.set(0, -Math.PI / 2, 0)
        this.controller.add(target)

        // Initialize target position
        this.updateTargetPosition()

        // Mouse events
        canvas.addEventListener('mousedown', this.onMouseDown.bind(this))
        canvas.addEventListener('mouseup', this.onMouseUp.bind(this))
        canvas.addEventListener('mousemove', this.onMouseMove.bind(this))
        canvas.addEventListener('mouseleave', this.onMouseLeave.bind(this))
        // Touch events
        canvas.addEventListener('touchstart', this.onTouchStart.bind(this))
        canvas.addEventListener('touchend', this.onTouchEnd.bind(this))
        canvas.addEventListener('touchmove', this.onTouchMove.bind(this))
    }

    // Convert mouse coordinates to normalized device coordinates
    getMousePosition(event: MouseEvent | Touch) {
        const rect = this.canvas.getBoundingClientRect()
        return new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1,
        )
    }

    getIntersections(mousePosition?: THREE.Vector2) {
        const position = mousePosition || this.mouse
        this.raycaster.setFromCamera(position, this.camera)
        const intersections = this.raycaster.intersectObjects(this.scene.children, true)

        // Filter out objects with LabelMaterial (like text labels)
        return intersections.filter((intersection) => {
            const object = intersection.object as THREE.Mesh
            if (object.material) {
                // Check if it's an array of materials
                if (Array.isArray(object.material)) {
                    return !object.material.some((mat: THREE.Material) => mat.userData.type === 'LabelMaterial')
                }
                // Check if single material is LabelMaterial
                return object.material.userData.type !== 'LabelMaterial'
            }
            return true
        })
    }

    updateTargetPosition() {
        const target = this.controller.getObjectByName('t')
        if (target && this.pad) {
            // Create a vertical plane (XY plane) at the pad's Z position
            const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -this.pad.position.z)
            const intersection = new THREE.Vector3()

            // Get the ray from camera through mouse position
            this.raycaster.setFromCamera(this.mouse, this.camera)

            // Find intersection with the vertical XY plane at pad's Z position
            this.raycaster.ray.intersectPlane(plane, intersection)

            if (intersection) {
                // Update target position to the intersection point
                target.position.copy(intersection)
                target.position.z = this.pad.position.z // Ensure it's on the same Z level as pad
                target.position.y += 0.14
            }
        }
    }

    intersectObjects() {
        // Clean previous highlights
        this.cleanIntersected()

        const intersects = this.getIntersections()
        if (intersects.length > 0) {
            this.selectedObject = intersects[0].object

            // Find the parent object that contains the highlight (like main.ts does)
            let focusedObject = this.selectedObject as InteractiveObject3D
            while (focusedObject) {
                if (focusedObject.userData.isPickable) {
                    const highlight = focusedObject.getObjectByName('h')
                    if (highlight) {
                        highlight.visible = true
                        this.intersected.push(focusedObject)
                        break
                    }
                }
                focusedObject = focusedObject.parent as InteractiveObject3D
            }
        } else {
            this.selectedObject = null
        }
    }

    cleanIntersected() {
        while (this.intersected.length) {
            const object = this.intersected.pop()
            if (object) {
                const highlight = object.getObjectByName('h')
                if (highlight) highlight.visible = false
            }
        }
    }

    onMouseDown(event: MouseEvent) {
        this.isMouseDown = true
        this.mouse = this.getMousePosition(event)
        this.dragStart.copy(this.mouse)
        this.selectedObject = null

        // Update target position based on mouse position
        this.updateTargetPosition()

        // Handle pointer pick (similar to XR controller selectstart)
        const intersections = this.getIntersections()
        if (intersections.length > 0) {
            let collided = false
            intersections.forEach(({ object }) => {
                if (collided) return
                let focusedObject = object as InteractiveObject3D
                while (focusedObject) {
                    if (focusedObject.onPointerPick) {
                        focusedObject.onPointerPick(this.controller)
                        collided = true
                        break
                    }
                    focusedObject = focusedObject.parent as InteractiveObject3D
                }
            })
        }
    }

    onMouseUp(event: MouseEvent) {
        this.isMouseDown = false
        this.mouse = this.getMousePosition(event)
        this.dragR.copy(this.mouse)

        // Handle pointer drop (similar to XR controller selectend)
        const focusedObject = this.controller.userData.selected
        if (focusedObject?.onPointerDrop) {
            focusedObject.onPointerDrop(this.controller)
        }
        this.selectedObject = null
    }

    onMouseMove(event: MouseEvent) {
        this.mouse = this.getMousePosition(event)
        this.dragR.copy(this.mouse)

        // Update target position based on mouse position
        this.updateTargetPosition()

        // Handle hover highlighting (similar to XR controller hover)
        this.intersectObjects()

        if (this.selectedObject && !this.isMouseDown) {
            const focusedObject = this.selectedObject as InteractiveObject3D
            if (focusedObject?.onPointerMove) {
                focusedObject.onPointerMove(this.controller)
            }
        }
    }

    onMouseLeave() {
        // Clean up highlights when mouse leaves canvas
        this.cleanIntersected()
        this.selectedObject = null
    }
    onTouchStart(event: TouchEvent) {
        event.preventDefault()
        this.isMouseDown = true
        this.mouse = this.getMousePosition(event.touches[0])
        this.dragStart.copy(this.mouse)
        this.selectedObject = null

        // Update target position based on touch position
        this.updateTargetPosition()

        // Handle pointer pick (similar to XR controller selectstart)
        const intersections = this.getIntersections()
        if (intersections.length > 0) {
            let collided = false
            intersections.forEach(({ object }) => {
                if (collided) return
                let focusedObject = object as InteractiveObject3D
                while (focusedObject) {
                    if (focusedObject.onPointerPick) {
                        focusedObject.onPointerPick(this.controller)
                        collided = true
                        break
                    }
                    focusedObject = focusedObject.parent as InteractiveObject3D
                }
            })
        }
    }

    onTouchEnd(event: TouchEvent) {
        event.preventDefault()
        this.isMouseDown = false
        if (event.changedTouches.length > 0) {
            this.mouse = this.getMousePosition(event.changedTouches[0])
            this.dragR.copy(this.mouse)
        }

        // Handle pointer drop (similar to XR controller selectend)
        const focusedObject = this.controller.userData.selected
        if (focusedObject?.onPointerDrop) {
            focusedObject.onPointerDrop(this.controller)
        }
        this.selectedObject = null
    }

    onTouchMove(event: TouchEvent) {
        event.preventDefault()
        if (event.touches.length > 0) {
            this.mouse = this.getMousePosition(event.touches[0])
            this.dragR.copy(this.mouse)

            // Update target position based on touch position
            this.updateTargetPosition()

            // Handle hover highlighting (similar to XR controller hover)
            this.intersectObjects()

            if (this.selectedObject && !this.isMouseDown) {
                const focusedObject = this.selectedObject as InteractiveObject3D
                if (focusedObject?.onPointerMove) {
                    focusedObject.onPointerMove(this.controller)
                }
            }
        }
    }
}
