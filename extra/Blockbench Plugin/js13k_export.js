let button;

Plugin.register("js13k_export", {
    title: "JS13k Export",
    author: "Alex Swan",
    description: "Exports the current project to a JS13k compatible .js file",
    icon: "fa-gamepad",
    version: "0.0.2",
    variant: "both",
    onload() {
        const roundHundredth = (num) => Math.round(num * 100) / 100;
        const roundWhole = (num) => Math.round(num);
        const codec = new Codec("js13k_export", {
            name: "JS13k Mesh",
            remember: true,
            extension: "js",
            export_action: button,
            compile() {
                const CUBE_COLORS = [
                    "#9999ff", //light blue
                    "#fffb00", //yellow
                    "#ff7300", //orange
                    "#ff0000", //red
                    "#c300ff", // purple
                    "#0000ff", // blue
                    "#00ff00", //green
                    "#b0ffb0", // lime green
                    "#ff00ff", //pink
                    "#d3d3d3", //silver
                ];

                const convertCylinder = (cylinder) => {
                    const name = cylinder.name.replace("cylinder_", "") || "cylinder";
                    const width = cylinder.mesh.geometry.boundingBox.max.x - cylinder.mesh.geometry.boundingBox.min.x;
                    const height = cylinder.mesh.geometry.boundingBox.max.y - cylinder.mesh.geometry.boundingBox.min.y;
                    const depth = cylinder.mesh.geometry.boundingBox.max.z - cylinder.mesh.geometry.boundingBox.min.z;
                    const [x, y, z] = cylinder.position;
                    const [rX, rY, rZ] = cylinder.rotation;
                    const [oX, oY, oZ] = cylinder.origin;
                    const color = CUBE_COLORS[cylinder.color];
                    return `cylinder_${name}_${width}_${height}_${depth}_${x}_${y}_${z}_${rX}_${rY}_${rZ}_${oX}_${oY}_${oZ}_${color}`;
                }
                const convertPlane = (plane) => {
                    const name = plane.name.replace("plane_", "") || "plane";
                    const width = plane.mesh.geometry.boundingBox.max.x - plane.mesh.geometry.boundingBox.min.x;
                    const height = plane.mesh.geometry.boundingBox.max.z - plane.mesh.geometry.boundingBox.min.z;
                    const depth = 0

                    const [x, y, z] = plane.position;
                    const [rX, rY, rZ] = plane.rotation;
                    const [oX, oY, oZ] = plane.origin;
                    const color = CUBE_COLORS[plane.color];
                    return `plane_${name}_${width}_${height}_${depth}_${x}_${y}_${z}_${rX}_${rY}_${rZ}_${oX}_${oY}_${oZ}_${color}`;
                };

                const convertSphere = (sphere) => {
                    const name = sphere.name.replace("sphere_", "") || "sphere";
                    // position
                    const [x, y, z] = sphere.position;
                    const {
                        x: x0,
                        y: y0,
                        z: z0,
                    } = sphere.mesh.geometry.boundingBox.min;
                    const {
                        x: x1,
                        y: y1,
                        z: z1,
                    } = sphere.mesh.geometry.boundingBox.max;

                    // size
                    const width = x1 - x0;
                    const height = y1 - y0;
                    const depth = z1 - z0;

                    // rotation
                    const rX = roundWhole(sphere.rotation[0]);
                    const rY = roundWhole(sphere.rotation[1]);
                    const rZ = roundWhole(sphere.rotation[2]);

                    // pivot
                    const oX = roundHundredth(sphere.origin[0]);
                    const oY = roundHundredth(sphere.origin[1]);
                    const oZ = roundHundredth(sphere.origin[2]);

                    const color = CUBE_COLORS[sphere.color];

                    return `sphere_${name}_${width}_${height}_${depth}_${x}_${y}_${z}_${rX}_${rY}_${rZ}_${oX}_${oY}_${oZ}_${color}`;
                };

                const convertCube = (cube) => {
                    // size
                    const width = roundHundredth(cube.to[0] - cube.from[0]);
                    const height = roundHundredth(cube.to[1] - cube.from[1]);
                    const depth = roundHundredth(cube.to[2] - cube.from[2]);

                    // position
                    const x = roundHundredth(cube.from[0] + 0.5 * width);
                    const y = roundHundredth(cube.from[1] + 0.5 * height);
                    const z = roundHundredth(cube.from[2] + 0.5 * depth);

                    // rotation
                    const rX = roundWhole(cube.rotation[0]);
                    const rY = roundWhole(cube.rotation[1]);
                    const rZ = roundWhole(cube.rotation[2]);

                    // pivot
                    const oX = roundHundredth(cube.origin[0]);
                    const oY = roundHundredth(cube.origin[1]);
                    const oZ = roundHundredth(cube.origin[2]);
                    const color = CUBE_COLORS[cube.color];

                    return `cube_${cube.name}_${width}_${height}_${depth}_${x}_${y}_${z}_${rX}_${rY}_${rZ}_${oX}_${oY}_${oZ}_${color}`;
                };

                const handleObject = (obj) => {
                    if (obj instanceof Cube) {
                        return convertCube(obj);
                    } else if (obj instanceof Mesh) {
                        // TODO: Figure out type of mesh
                        if (obj.name.startsWith("sphere")) {
                            return convertSphere(obj);
                        } else if (obj.name.startsWith("plane")) {
                            return convertPlane(obj);
                        } else if (obj.name.startsWith("cylinder")) {
                            return convertCylinder(obj);
                        } else {
                            Blockbench.showQuickMessage(`Unknown mesh type: ${obj.name}`);
                            return null;
                        }
                    } else if (obj instanceof Group) {
                        const arr = [];
                        obj.children.forEach((child) => {
                            arr.push(handleObject(child));
                        });
                        return arr;
                    }
                };

                let model = `export const ${Project.name}Model = () => \n`;
                const meshes = [];
                Outliner.root.forEach((obj) => {
                    meshes.push(handleObject(obj));
                });
                model += JSON.stringify(meshes, null, 2);
                return model;
            },
            parse(model, path) {
                console.log(model, path);
            },
        });
        button = new Action("js13k_export", {
            name: "Export to JS13k Primitives",
            description:
                "Exports the current project to a JS13k compatible JS file",
            icon: "fa-gamepad",
            click: function () {
                codec.export();
            },
        });
        MenuBar.addAction(button, "file.export");
    },
    onunload() {
        button.delete();
    },
});
