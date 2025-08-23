let button
let exportPath

Plugin.register('threejs_export', {
    title: 'Three.js Export',
    author: 'Alex Swan',
    description: 'Exports the current project to a Three.js compatible .js file',
    icon: 'fa-cubes',
    version: '0.0.2',
    variant: 'both',
    onload() {
        const codec = new Codec('threejs_export', {
            name: 'Three.js Mesh',
            remember: true,
            extension: 'js',
            export_action: button,
            compile() {
                const CUBE_COLORS = [
                    '0x9999ff', //light blue
                    '0xfffb00', //yellow
                    '0xff7300', //orange
                    '0xff0000', //red
                    '0xc300ff', // purple
                    '0x0000ff', // blue
                    '0x00ff00', //green
                    '0xb0ffb0', // lime green
                    '0xff00ff', //pink
                    '0xd3d3d3', //silver
                ]

                const convertSphere = (sphere) => {}

                const convertCube = (cube) => {
                    const width = cube.to[0] - cube.from[0]
                    const height = cube.to[1] - cube.from[1]
                    const depth = cube.to[2] - cube.from[2]

                    const x = cube.from[0] + 0.5 * width
                    const y = cube.from[1] + 0.5 * height
                    const z = cube.from[2] + 0.5 * depth

                    const origin = cube.origin
                    const tX = x - origin[0]
                    const tY = y - origin[1]
                    const tZ = z - origin[2]

                    let result = `geometry = new THREE.BoxGeometry(${width}, ${height}, ${depth});\n`
                    result += `geometry.translate(${tX}, ${tY}, ${tZ});\n`
                    result += `geometry.rotateX(THREE.MathUtils.degToRad(${cube.rotation[0]}));\n`
                    result += `geometry.rotateY(THREE.MathUtils.degToRad(${cube.rotation[1]}));\n`
                    result += `geometry.rotateZ(THREE.MathUtils.degToRad(${cube.rotation[2]}));\n`
                    result += `material = new THREE.MeshBasicMaterial({color: ${CUBE_COLORS[cube.color]}});\n`
                    result += `mesh = new THREE.Mesh(geometry, material);\n`
                    result += `mesh.name = '${cube.name}';\n`
                    result += `mesh.position.set(${x}, ${y}, ${z});\n`
                    result += `mesh.position.set(${origin[0]}, ${origin[1]}, ${origin[2]});\n`

                    result += `parent.add(mesh);\n`

                    return result
                }

                const handleObject = (obj) => {
                    const arr = []
                    if (obj instanceof Cube) {
                        arr.push(convertCube(obj))
                    } else if (obj instanceof Mesh) {
                        // TODO: Figure out type of mesh
                    } else if (obj instanceof Group) {
                        obj.children.forEach((child) => {
                            arr.push(...handleObject(child))
                        })
                    }
                    return arr
                }

                let model = `export const ${Project.name} = () => {\n`
                model += 'let geometry;\nlet material;\nlet mesh;\n'
                model += 'let parent = new THREE.Group();\n'
                Outliner.root.forEach((obj) => {
                    handleObject(obj).forEach((i) => (model += i))
                })
                model += 'return parent;\n}'
                return model
            },
            parse(model, path) {
                console.log(model, path)
            },
        })
        button = new Action('threejs_export', {
            name: 'Export to Three.js Primitives',
            description: 'Exports the current project to a Three.js compatible JSON file',
            icon: 'fa-cubes',
            click: function () {
                codec.export()
            },
        })
    },
})
