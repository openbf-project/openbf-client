
let path = require("path");

let { Bundle } = require("node-openbf-bundle");
let THREE = require("three");
let cannon = require("cannon");

class AddonMap extends Bundle {
    constructor(game, name, displayName) {
        super(game, name, displayName);
    }

    onReady() {
        console.log("[Addon][Corellia Courtyard] I loaded!");
        let light = new THREE.DirectionalLight(0xffffff, 0.8);

        this.game.currentScene.add(light);
        this.game.currentScene.add(new THREE.AmbientLight(0xffffff, 0.2));

        //CREATE A DEMO PHYSICS CUBE
        let tex = new THREE.TextureLoader().load(path.join(__dirname, "test.png"));
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.LinearMipMapLinearFilter;
        let cube = new THREE.Mesh(
            new THREE.BoxBufferGeometry(
                2,
                2,
                2,
                1,
                1,
                1
            ),
            new THREE.MeshLambertMaterial({
                map: tex,
                color: 0xffffff,
                reflectivity: 2,
                transparent: true
            })
        );
        this.game.currentScene.add(cube);

        let pcube = new cannon.Body({
            mass: 5, // kg
            shape: new cannon.Box(new cannon.Vec3(1, 1, 1)),
            velocity: new cannon.Vec3(0, 1, 0)
        });
        cube.position.set(0, 20, 0);
        cube.quaternion.setFromEuler(new THREE.Euler(10, 10, 10, 'XYZ'));
        pcube.quaternion.copy(cube.quaternion);
        this.game.pworld.addBody(pcube);
        pcube.position.copy(cube.position);
        cube.physics = pcube;
        this.cube = cube;

        //CREATE A PLANE
        let ground = new THREE.Mesh(
            new THREE.BoxBufferGeometry(
                1000,
                1,
                1000,
                1,
                1,
                1
            ),
            new THREE.MeshPhongMaterial({ color: 0x808080 })
        );
        ground.pbody = new cannon.Body({
            mass: 0,
            shape: new cannon.Box(new cannon.Vec3(1000, 0.5, 1000))
        });
        ground.pbody.quaternion.copy(ground.quaternion);
        this.game.pworld.addBody(ground.pbody);
        this.game.currentScene.add(ground);
    }

    onUpdate() {
        this.cube.position.copy(this.cube.physics.position);
        this.cube.quaternion.copy(this.cube.physics.quaternion);
    }
}

module.exports = AddonMap;
