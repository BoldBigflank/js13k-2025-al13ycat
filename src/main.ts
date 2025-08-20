import "./style.css";
import {
    loadModelByName,
    createCylinder,
} from "./scripts/modelLoader";
import DJPuzzle from "./scripts/DJPuzzle";
import * as THREE from "https://js13kgames.com/2025/webxr/three.module.js";
import { VRButton } from "./libraries/VRButton";

import { InteractiveObject3D } from "./types";
import { Vinyl } from "./models/vinyl";
// import { XRControllerModelFactory } from "./libraries/XRControllerModelFactory";
const clock = new THREE.Clock();

let camera, scene, raycaster, renderer;
let selectedController;
let controller1, controller2;
let controllerGrip1, controllerGrip2;
let cassetteMesh;
const intersected = [];

let controls, baseReferenceSpace;

const initGame = async () => {
    // Clean up intro and start canvas
    document.getElementById("intro")!.style.display = "none";
    const canvasElement = document.getElementById("c");
    const canvas: HTMLCanvasElement | null =
        canvasElement as unknown as HTMLCanvasElement;
    if (!canvas) return;
    canvas.style.display = "block";

    // Init Puzzle
    const djPuzzle = new DJPuzzle();

    // Create a scene and populate it
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000,
    );
    camera.position.set(0, 2, 1);
    camera.rotation.set(-1 * Math.PI / 12, 0, 0);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(6, 10, 8);
    directionalLight.castShadow = true;
    directionalLight.target.position.set(0, 0, 0);
    scene.add(directionalLight);
    scene.add(directionalLight.target);

    cassetteMesh = loadModelByName("cassette") as InteractiveObject3D;
    cassetteMesh.position.set(0, 0, -20);
    cassetteMesh.userData.isPickable = true;
    cassetteMesh.onPointerPick = () => {
        console.log("PICK");
    };
    cassetteMesh.onPointerMove = () => {
        console.log("MOVE");
    };
    scene.add(cassetteMesh);

    const arenaMesh = loadModelByName("arena") as InteractiveObject3D;
    const tableA = arenaMesh.getObjectByName('tableA') as InteractiveObject3D;
    const tableB = arenaMesh.getObjectByName('tableB') as InteractiveObject3D;
    [tableA, tableB].forEach((tableMesh) => {
        // Drop a record
        tableMesh.onPointerPick = (controller) => {
            // Update the puzzle
            const selectedVinyl = djPuzzle.selected[controller.id]
            if (selectedVinyl) {
                djPuzzle.addVinylByIndex(selectedVinyl)
                delete djPuzzle.selected[controller.id]
            }
            
            // Update the meshes
            tableMesh.userData.loaded = true
        }
    })

    scene.add(arenaMesh);

    djPuzzle.vinyls.forEach((record, i) => {
        const mesh = Vinyl(record);
        mesh.position.set(0.7, 1.25, -0.2 - 0.125 * i);
        mesh.userData.isPickable = true;
        mesh.userData.recordIndex = i
        // Select a record
        mesh.onPointerPick = (controller) => {
            console.log("picked", mesh, controller);
            djPuzzle.selected[controller.id] = i
            const target = controller.getObjectByName('target')
            if (target) {
                target.add(mesh)
                mesh.position.set(0, 0, 0)
            }
        };
        scene.add(mesh);
    });

    djPuzzle.addVinylByIndex(2)
    console.log(djPuzzle.comboCount)
    djPuzzle.addVinylByIndex(4)
    console.log(djPuzzle.comboCount)
    djPuzzle.addVinylByIndex(1)
    console.log(djPuzzle.comboCount)
    djPuzzle.addVinylByIndex(3)
    console.log(djPuzzle.comboCount)
    djPuzzle.addVinylByIndex(0)
    console.log(djPuzzle.comboCount)
    
    

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor("#000000");
    renderer.xr.addEventListener(
        "sessionstart",
        () => (baseReferenceSpace = renderer.xr.getReferenceSpace()),
    );
    renderer.xr.enabled = true;
    renderer.setAnimationLoop(animate);
    document.body.appendChild(VRButton.createButton(renderer));
    document.body.appendChild(renderer.domElement);

    // Controllers

    controller1 = renderer.xr.getController(0);
    controller1.addEventListener("selectstart", onSelectStart);
    controller1.addEventListener("selectend", onSelectEnd);
    scene.add(controller1);

    controller2 = renderer.xr.getController(1);
    controller2.addEventListener("selectstart", onSelectStart);
    controller2.addEventListener("selectend", onSelectEnd);
    scene.add(controller2);

    // const controllerModelFactory = new XRControllerModelFactory();

    controllerGrip1 = renderer.xr.getControllerGrip(0);
    
    // Visual representation of the controller
    const controllerMesh1 = createCylinder({
        radius: 0.01,
        depth: 0.2,
        color: 0xff00ff,
    });
    controllerMesh1.name = "controllerMesh1";
    controllerMesh1.rotateX(Math.PI / 4);
    controllerGrip1.add(controllerMesh1);
    scene.add(controllerGrip1);

    // Visual representation of the controller
    controllerGrip2 = renderer.xr.getControllerGrip(1);
    const controllerMesh2 = createCylinder({
        radius: 0.01,
        depth: 0.2,
        color: 0x00ff00,
    });
    controllerMesh2.rotateX(Math.PI / 4);
    controllerGrip2.add(controllerMesh2);
    scene.add(controllerGrip2);

    const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -1),
    ]);

    const line = new THREE.Line(geometry);
    line.name = "line";
    line.scale.z = 5;

    controller1.add(line.clone());
    controller2.add(line.clone());

    // Target for selected records to go
    const target = new THREE.Object3D();
    target.rotation.set(-1 * Math.PI / 2, 0, 0)
    target.position.set(0, -0.05, -.12)
    target.name = "target";

    controller1.add(target.clone());
    controller2.add(target.clone());


    raycaster = new THREE.Raycaster();

    // Event listeners
    window.addEventListener("resize", onWindowResize, false);
};

// Starts pulling trigger
function onSelectStart(event) {
    console.log("onSelectStart");
    selectedController = event.target;
    const intersections = getIntersections(selectedController);
    if (intersections.length > 0) {
        let collided = false;
        intersections.forEach(({ object, distance }) => {
            if (collided) return;
            let focusedObject = object;
            while (focusedObject) {
                if (focusedObject.onPointerPick) {
                    focusedObject.onPointerPick(selectedController);
                    collided = true;
                    break;
                }
                focusedObject = focusedObject.parent;
            }
        });
    }
    selectedController.userData.targetRayMode = event.data.targetRayMode;
}

// Releases the trigger
function onSelectEnd(event) {
    console.log("onSelectEnd");
    selectedController = event.target;
    if (selectedController.userData.selected !== undefined) {
        const object = selectedController.userData.selected;
        selectedController.userData.selected = undefined;
    }
}

function getIntersections(controller) {
    controller.updateMatrixWorld();
    raycaster.setFromXRController(controller);
    return raycaster.intersectObjects(scene.children, true);
}

// Used for hovering objects
function intersectObjects(controller) {
    // Do not highlight in mobile-ar
    if (controller.userData.targetRayMode === "screen") return;
    // Do not highlight when already selected
    if (controller.userData.selected !== undefined) return;
    const line = controller.getObjectByName("line");
    const intersections = getIntersections(controller);
    line.scale.z = 5;
    if (intersections.length > 0) {
        // for each of the intersections, look for userData.isPickable
        let collided = false;
        intersections.forEach(({ object, distance }) => {
            if (collided) return;
            let focusedObject = object;
            while (focusedObject) {
                if (focusedObject.userData.isPickable) {
                    line.scale.z = distance;
                    intersected.push(focusedObject);
                    collided = true;
                    break;
                }
                focusedObject = focusedObject.parent;
            }
        });
    }
}

function cleanIntersected() {
    while (intersected.length) {
        const object = intersected.pop();
        // object.material.emissive.r = 0;
    }
}

function animate() {
    cassetteMesh.rotation.y += 0.005;
    cleanIntersected();

    intersectObjects(controller1);
    intersectObjects(controller2);

    renderer.render(scene, camera);
}

const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
};

window.addEventListener("DOMContentLoaded", () => {
    const b = document.getElementById("playButton") as HTMLButtonElement;
    b.onclick = initGame;
});
