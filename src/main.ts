import * as THREE from "three";
window.THREE = THREE;
import "./style.css";
import { loadModelByName } from "./scripts/modelLoader";

const initGame = async () => {
    console.log("initGame");
    document.getElementById("intro")!.style.display = "none";
    const canvasElement = document.getElementById("c");
    const canvas: HTMLCanvasElement | null =
        canvasElement as unknown as HTMLCanvasElement;
    if (!canvas) return;
    canvas.style.display = "block";

    // ------------------------------------------------
    // BASIC SETUP
    // ------------------------------------------------

    // Create an empty scene
    var scene = new THREE.Scene();

    // Create a basic perspective camera
    var camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000,
    );
    camera.position.z = 20;
    camera.position.y = 8;

    // Create a renderer with Antialiasing
    var renderer = new THREE.WebGLRenderer({ antialias: true });

    // Configure renderer clear color
    renderer.setClearColor("#000000");

    // Configure renderer size
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Append Renderer to DOM
    document.body.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(6, 10, 8);
    directionalLight.castShadow = true;
    directionalLight.target.position.set(0, 0, 0);
    scene.add(directionalLight);
    scene.add(directionalLight.target);

    // // Create a Cube Mesh with basic material
    // var geometry = new THREE.BoxGeometry( 1, 1, 1 );
    // var material = new THREE.MeshBasicMaterial( { color: "#433F81" } );
    // var cube = new THREE.Mesh( geometry, material );

    // // Add cube to Scene
    // scene.add( cube );

    const cassetteMesh = loadModelByName("cassette");
    scene.add(cassetteMesh);

    // Render Loop
    var render = function () {
        requestAnimationFrame(render);

        cassetteMesh.rotation.y += 0.005;

        // Render the scene
        renderer.render(scene, camera);
    };

    render();
};

window.addEventListener("DOMContentLoaded", () => {
    const b = document.getElementById("playButton") as HTMLButtonElement;
    b.onclick = initGame;
});
