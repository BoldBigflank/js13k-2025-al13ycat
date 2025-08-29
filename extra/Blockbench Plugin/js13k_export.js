let button

Plugin.register('js13k_export', {
    title: 'JS13k Export',
    author: 'Alex Swan',
    description: 'Exports the current project to a JS13k compatible .js file',
    icon: 'fa-gamepad',
    version: '0.0.2',
    variant: 'both',
    onload() {
        // round to two decimal places and return as a string
        const roundHundredth = (num) => {
            const roundedFloat = Math.round(num * 100) / 100
            const roundedString = roundedFloat.toFixed(2)
            // Remove trailing zeroes and decimal point if there are no decimal places
            if (roundedFloat === 0) return ''
            return parseFloat(roundedString)
        }
        const roundWhole = (num) => {
            const roundedFloat = Math.round(num)
            const roundedString = roundedFloat.toFixed(0)
            if (roundedFloat === 0) return ''
            return parseInt(roundedString)
        }
        const codec = new Codec('js13k_export', {
            name: 'JS13k Mesh',
            remember: true,
            extension: 'js',
            export_action: button,
            compile() {
                const convertPyramid = (pyramid) => {
                    const name = pyramid.name.replace('pyramid_', '') || 'pyramid'
                    const width = roundHundredth(
                        pyramid.mesh.geometry.boundingBox.max.x - pyramid.mesh.geometry.boundingBox.min.x,
                    )
                    const height = roundHundredth(
                        pyramid.mesh.geometry.boundingBox.max.y - pyramid.mesh.geometry.boundingBox.min.y,
                    )
                    const depth = roundHundredth(
                        pyramid.mesh.geometry.boundingBox.max.z - pyramid.mesh.geometry.boundingBox.min.z,
                    )
                    const [x, y, z] = pyramid.position
                    const [rX, rY, rZ] = pyramid.rotation
                    const [oX, oY, oZ] = pyramid.origin
                    const color = pyramid.color
                    return `py,${name},${roundHundredth(width)},${roundHundredth(height)},${roundHundredth(depth)},${roundHundredth(x)},${roundHundredth(y)},${roundHundredth(z)},${roundWhole(rX)},${roundWhole(rY)},${roundWhole(rZ)},${roundHundredth(oX)},${roundHundredth(oY)},${roundHundredth(oZ)},${color}`
                }
                const convertCylinder = (cylinder) => {
                    const name = cylinder.name.replace('cylinder_', '') || 'cylinder'
                    const width = roundHundredth(
                        cylinder.mesh.geometry.boundingBox.max.x - cylinder.mesh.geometry.boundingBox.min.x,
                    )
                    const height = roundHundredth(
                        cylinder.mesh.geometry.boundingBox.max.y - cylinder.mesh.geometry.boundingBox.min.y,
                    )
                    const depth = roundHundredth(
                        cylinder.mesh.geometry.boundingBox.max.z - cylinder.mesh.geometry.boundingBox.min.z,
                    )
                    const [x, y, z] = cylinder.position
                    const [rX, rY, rZ] = cylinder.rotation
                    const [oX, oY, oZ] = cylinder.origin
                    const color = cylinder.color
                    return `cy,${name},${width},${height},${depth},${roundHundredth(x)},${roundHundredth(y)},${roundHundredth(z)},${roundWhole(rX)},${roundWhole(rY)},${roundWhole(rZ)},${roundHundredth(oX)},${roundHundredth(oY)},${roundHundredth(oZ)},${color}`
                }
                const convertPlane = (plane) => {
                    const name = plane.name.replace('plane_', '') || 'plane'
                    const width = plane.mesh.geometry.boundingBox.max.x - plane.mesh.geometry.boundingBox.min.x
                    const height = plane.mesh.geometry.boundingBox.max.z - plane.mesh.geometry.boundingBox.min.z
                    const depth = 0

                    const [x, y, z] = plane.position
                    const [rX, rY, rZ] = plane.rotation
                    const [oX, oY, oZ] = plane.origin
                    const color = plane.color
                    return `p,${name},${roundHundredth(width)},${roundHundredth(height)},${roundHundredth(depth)},${roundHundredth(x)},${roundHundredth(y)},${roundHundredth(z)},${roundHundredth(rX)},${roundHundredth(rY)},${roundHundredth(rZ)},${roundHundredth(oX)},${roundHundredth(oY)},${roundHundredth(oZ)},${color}`
                }

                const convertSphere = (sphere) => {
                    const name = sphere.name.replace('sphere_', '') || 'sphere'
                    // position
                    const [x, y, z] = sphere.position
                    const { x: x0, y: y0, z: z0 } = sphere.mesh.geometry.boundingBox.min
                    const { x: x1, y: y1, z: z1 } = sphere.mesh.geometry.boundingBox.max

                    // size
                    const width = roundHundredth(x1 - x0)
                    const height = roundHundredth(y1 - y0)
                    const depth = roundHundredth(z1 - z0)

                    // rotation
                    const rX = roundWhole(sphere.rotation[0])
                    const rY = roundWhole(sphere.rotation[1])
                    const rZ = roundWhole(sphere.rotation[2])

                    // pivot
                    const oX = roundHundredth(sphere.origin[0])
                    const oY = roundHundredth(sphere.origin[1])
                    const oZ = roundHundredth(sphere.origin[2])

                    const color = sphere.color

                    return `s,${name},${width},${height},${depth},${roundHundredth(x)},${roundHundredth(y)},${roundHundredth(z)},${roundWhole(rX)},${roundWhole(rY)},${roundWhole(rZ)},${roundHundredth(oX)},${roundHundredth(oY)},${roundHundredth(oZ)},${color}`
                }

                const convertCube = (cube) => {
                    const name = cube.name.replace('cube_', '') || 'cube'
                    // size
                    const width = roundHundredth(cube.to[0] - cube.from[0])
                    const height = roundHundredth(cube.to[1] - cube.from[1])
                    const depth = roundHundredth(cube.to[2] - cube.from[2])

                    // position
                    const x = roundHundredth(cube.from[0] + 0.5 * width)
                    const y = roundHundredth(cube.from[1] + 0.5 * height)
                    const z = roundHundredth(cube.from[2] + 0.5 * depth)

                    // rotation
                    const rX = roundWhole(cube.rotation[0])
                    const rY = roundWhole(cube.rotation[1])
                    const rZ = roundWhole(cube.rotation[2])

                    // pivot
                    const oX = roundHundredth(cube.origin[0])
                    const oY = roundHundredth(cube.origin[1])
                    const oZ = roundHundredth(cube.origin[2])
                    const color = cube.color

                    return `c,${name},${width},${height},${depth},${x},${y},${z},${rX},${rY},${rZ},${oX},${oY},${oZ},${color}`
                }

                const handleObject = (obj) => {
                    if (obj instanceof Cube) {
                        return convertCube(obj)
                    } else if (obj instanceof Mesh) {
                        // TODO: Figure out type of mesh
                        if (obj.name.startsWith('sphere')) {
                            return convertSphere(obj)
                        } else if (obj.name.startsWith('plane')) {
                            return convertPlane(obj)
                        } else if (obj.name.startsWith('cylinder')) {
                            return convertCylinder(obj)
                        } else if (obj.name.startsWith('pyramid')) {
                            return convertPyramid(obj)
                        } else {
                            Blockbench.showQuickMessage(`Unknown mesh type: ${obj.name}`)
                            return null
                        }
                    } else if (obj instanceof Group) {
                        const arr = []
                        obj.children.forEach((child) => {
                            if (!child.visibility) return
                            arr.push(handleObject(child))
                        })
                        return arr
                    }
                }

                let model = `export const ${Project.name}Model = () => \n`
                const meshes = []
                Outliner.root.forEach((obj) => {
                    if (!obj.visibility) return
                    meshes.push(handleObject(obj))
                })
                model += JSON.stringify(meshes, null, 2)
                return model
            },
            parse(model, path) {
                console.log(model, path)
            },
        })
        button = new Action('js13k_export', {
            name: 'Export to JS13k Primitives',
            description: 'Exports the current project to a JS13k compatible JS file',
            icon: 'fa-gamepad',
            click: function () {
                codec.export()
            },
        })
        MenuBar.addAction(button, 'file.export')
    },
    onunload() {
        button.delete()
    },
})
