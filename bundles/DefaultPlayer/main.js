
let { Bundle } = require("node-openbf-bundle");
let THREE = require("three");

class DefaultPlayer extends Bundle {
    constructor(game, name, displayName) {
        super(game, name, displayName);

        this.cameraPitch = new THREE.Object3D();
        this.cameraYaw = new THREE.Object3D();
        this.cameraLookingDirection = new THREE.Vector3();

        this.cameraPosY = 0;

        this.cameraSensitivityVer = 0.05;
        this.cameraSensitivityHor = 0.05;

        this.cameraRightOfLooking = new THREE.Vector3();
        this.VEC_RIGHT = new THREE.Vector3(0, 1, 0);
        this.radOf90 = THREE.Math.degToRad(90);
    }

    onReady() {
        this.game.currentScene.add(new THREE.AmbientLight(0xffffff, 0.2));

        this.cameraPitch.add(this.game.currentCamera);
        this.cameraYaw.add(this.cameraPitch);
        this.cameraYaw.position.set(0, 5, 20);

        this.game.currentScene.add(this.cameraYaw);

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
        if (!this.game || !this.game.inputManager || !this.cameraLookingDirection) {
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
