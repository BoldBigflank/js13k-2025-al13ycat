import * as THREE from "https://js13kgames.com/2025/webxr/three.module.js";
import { Events } from "../libraries/Events";
import { initCanvas } from "../scripts/Utils";

export const DebugScreen = (): THREE.Object3D => {
    const result = new THREE.Group();
    result.name = "debugScreen";
    result.renderOrder = 1;
    const lines: string[] = [];
    const geometry = new THREE.PlaneGeometry(5, 5);
    const [canvas, ctx] = initCanvas(1024);
    const texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.LinearSRGBColorSpace 
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    result.add(mesh);
    mesh.position.set(0, 0, 0);


    const update = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
        const fontSize = 32;
        ctx.fillStyle = "white";
        ctx.textBaseline = "top";
        ctx.textAlign = "left";
        ctx.font = `${fontSize}px monospace`;
        lines.forEach((line, index) => {
            ctx.fillText(line, 0, fontSize * index);
        });
        texture.needsUpdate = true;
    }
    Events.Instance.on("debug", (message: string = "") => {
        if (typeof message !== "string") return;
        lines.unshift(message);
        // If the lines array is longer than 10, remove the last one
        if (lines.length > 10) {
            lines.pop();
        }
        // Update the mesh
        update();
    });
    return result;
}