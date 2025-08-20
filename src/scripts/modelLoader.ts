import { cassetteModel } from "../models/cassette";
import { arenaModel } from "../models/arena";
import * as THREE from "https://js13kgames.com/2025/webxr/three.module.js";

import { BasicShader } from "../shaders/BasicShader";

type Model = (string | string[])[];

const createModel = (modelArray: Model): THREE.Group => {
    const parent = new THREE.Group();
    parent.position.set(0, 0, 0);
    parent.rotation.set(0, 0, 0);
    parent.scale.set(1, 1, 1);

    const parseCubeGeometry = (item: string) => {
        const [
            shape,
            name,
            width,
            height,
            depth,
            x,
            y,
            z,
            rX,
            rY,
            rZ,
            oX,
            oY,
            oZ,
            color,
        ] = item.split("_");
        const geometry = new THREE.BoxGeometry(width, height, depth);
        geometry.translate(x - oX, y - oY, z - oZ);
        geometry.rotateX(THREE.MathUtils.degToRad(rX));
        geometry.rotateY(THREE.MathUtils.degToRad(rY));
        geometry.rotateZ(THREE.MathUtils.degToRad(rZ));
        return geometry;
    };

    const parseSphereGeometry = (item: string) => {
        const [
            shape,
            name,
            width,
            height,
            depth,
            x,
            y,
            z,
            rX,
            rY,
            rZ,
            oX,
            oY,
            oZ,
            color,
        ] = item.split("_");
        const geometry = new THREE.SphereGeometry(
            parseFloat(width) / 2,
            32,
            16,
        );
        geometry.scale(width / width, height / width, depth / width);
        geometry.translate(x - oX, y - oY, z - oZ);
        geometry.rotateX(THREE.MathUtils.degToRad(rX));
        geometry.rotateY(THREE.MathUtils.degToRad(rY));
        geometry.rotateZ(THREE.MathUtils.degToRad(rZ));
        return geometry;
    };
    const parsePlaneGeometry = (item: string) => {
        const [
            shape,
            name,
            width,
            height,
            depth,
            x,
            y,
            z,
            rX,
            rY,
            rZ,
            oX,
            oY,
            oZ,
            color,
        ] = item.split("_");
        const geometry = new THREE.PlaneGeometry(width, height);
        // Three planes are upright, Blockbench planes are horizontal
        geometry.rotateX(THREE.MathUtils.degToRad(-90));
        geometry.translate(x - oX, y - oY, z - oZ);
        geometry.rotateX(THREE.MathUtils.degToRad(rX));
        geometry.rotateY(THREE.MathUtils.degToRad(rY));
        geometry.rotateZ(THREE.MathUtils.degToRad(rZ));
        return geometry;
    };

    const parseCylinderGeometry = (item: string) => {
        const [
            shape,
            name,
            width,
            height,
            depth,
            x,
            y,
            z,
            rX,
            rY,
            rZ,
            oX,
            oY,
            oZ,
            color,
        ] = item.split("_");
        const radius = width / 2;
        const geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
        geometry.translate(x - oX, y - oY, z - oZ);
        geometry.rotateX(THREE.MathUtils.degToRad(rX));
        geometry.rotateY(THREE.MathUtils.degToRad(rY));
        geometry.rotateZ(THREE.MathUtils.degToRad(rZ));
        return geometry;
    };

    modelArray.forEach((item) => {
        if (Array.isArray(item)) {
            parent.add(createModel(item));
        } else {
            const [
                shape,
                name,
                width,
                height,
                depth,
                x,
                y,
                z,
                rX,
                rY,
                rZ,
                oX,
                oY,
                oZ,
                color,
            ] = item.split("_");

            let geometry: THREE.BufferGeometry | null = null;
            switch (shape) {
                case "cube":
                    geometry = parseCubeGeometry(item);
                    break;
                case "sphere":
                    geometry = parseSphereGeometry(item);
                    break;
                case "plane":
                    geometry = parsePlaneGeometry(item);
                    break;
                case "cylinder":
                    geometry = parseCylinderGeometry(item);
                    break;
                default:
                    throw new Error(`Unknown shape: ${shape}`);
            }

            let material: THREE.Material | null = null;
            if (name.startsWith("case")) {
                material = new THREE.ShaderMaterial({
                    uniforms: {
                        ...BasicShader.uniforms,
                        // tDiffuse: { value: new THREE.Color(color) },
                    },
                    vertexShader: BasicShader.vertexShader,
                    fragmentShader: BasicShader.fragmentShader,
                });
            } else {
                material = new THREE.MeshStandardMaterial({
                    color: color,
                    side: THREE.DoubleSide,
                }); // TODO: use color
            }

            const mesh = new THREE.Mesh(geometry, material);

            mesh.name = name;
            mesh.position.set(oX, oY, oZ);
            parent.add(mesh);
        }
    });
    return parent;
};

export const createCube = (options) => {
    const { width, height, depth, color } = options;
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshBasicMaterial({ color });

    const cubeA = new THREE.Mesh(geometry, material);
    return cubeA;
};

export const createCylinder = (options) => {
    const { radius, depth, color } = options;
    const geometry = new THREE.CylinderGeometry(radius, radius, depth, 32);
    const material = new THREE.MeshBasicMaterial({ color });
    return new THREE.Mesh(geometry, material);
};

export const loadModelByName = (name: string) => {
    if (name === "cassette") {
        const model = createModel(cassetteModel());
        model.name = "cassette";
        return model;
    } else if (name === "arena") {
        const model = createModel(arenaModel());
        model.name = "arena";
        return model;
    }
    return null;
};
