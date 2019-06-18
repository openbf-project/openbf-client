
let path = require("path");

let { nodemsh } = require("node-openbf-io");
let { Bundle } = require("node-openbf-bundle");
let THREE = require("three");
let cannon = require("cannon");

class DefaultPlayer extends Bundle {
    constructor(game, name, displayName) {
        super(game, name, displayName);
    }

    onReady() {
        console.log("[Bundle][DefaultPlayer] I loaded!");
        let light = new THREE.DirectionalLight(0xffffff, 0.8);

        this.game.currentScene.add(light);
        this.game.currentScene.add(new THREE.AmbientLight(0xffffff, 0.2));

        this.cameraPitch = new THREE.Object3D();
        this.cameraPitch.add(this.game.currentCamera);
        this.cameraYaw = new THREE.Object3D();
        this.cameraYaw.add(this.cameraPitch);
        this.cameraYaw.position.set(0, 5, 20);

        this.cameraLookingDirection = new THREE.Vector3();
        this.cameraPosY = 0;

        this.cameraSensitivityVer = 0.002;
        this.cameraSensitivityHor = 0.002;

        this.cameraRightOfLooking = new THREE.Vector3();
        this.VEC_RIGHT = new THREE.Vector3(0, 1, 0);
        this.radOf90 = THREE.Math.degToRad(90);

        this.game.currentScene.add(this.cameraYaw);

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

        document.addEventListener("click", () => {
            this.game.inputManager.lockMouse(this.game.renderer.domElement);
        });
        document.addEventListener("keyup", (evt) => {
            if (evt.code === "Escape") {
                this.game.inputManager.unlockMouse();
            }
        });
    }

    onUpdate() {
        if (!this.game && !this.game.inputManager) {
            console.log(this.game, this.game.inputManager);
            return;
        }

        if (this.game.inputManager.mouse.isLocked) {
            this.cameraYaw.rotation.y -= this.game.inputManager.mouse.xdelta * this.cameraSensitivityHor;
            this.cameraPitch.rotation.x -= this.game.inputManager.mouse.ydelta * this.cameraSensitivityVer;
            if (this.cameraPitch.rotation.x < -1) {
                this.cameraPitch.rotation.x = -1;
            } else if (this.cameraPitch.rotation.x > 1) {
                this.cameraPitch.rotation.x = 1;
            }
        }

        this.cube.position.copy(this.cube.physics.position);
        this.cube.quaternion.copy(this.cube.physics.quaternion);

        this.game.currentCamera.getWorldDirection(this.cameraLookingDirection);
        //console.log(this.cameraLookingDirection);
        this.cameraLookingDirection.multiplyScalar(0.3);
        if (this.game.inputManager.isKeyDown("w")) {
            this.cameraYaw.position.add(this.cameraLookingDirection);
        } else if (this.game.inputManager.isKeyDown("s")) {
            this.cameraYaw.position.sub(this.cameraLookingDirection);
        }
        if (this.game.inputManager.isKeyDown("a")) {
            this.cameraRightOfLooking.set(
                this.cameraLookingDirection.x,
                0, //this.cameraLookingDirection.y,
                this.cameraLookingDirection.z
            );
            this.cameraRightOfLooking.applyAxisAngle(this.VEC_RIGHT, this.radOf90);
            this.cameraYaw.position.add(this.cameraRightOfLooking);
        } else if (this.game.inputManager.isKeyDown("d")) {
            this.cameraRightOfLooking.set(
                this.cameraLookingDirection.x,
                0, //this.cameraLookingDirection.y,
                this.cameraLookingDirection.z
            );
            this.cameraRightOfLooking.applyAxisAngle(this.VEC_RIGHT, this.radOf90);
            this.cameraYaw.position.sub(this.cameraRightOfLooking);
        }
    }
}

module.exports = DefaultPlayer;
