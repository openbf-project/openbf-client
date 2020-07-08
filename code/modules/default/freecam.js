
const three = require("three");

let LookCamera = require("./lookcamera.js");

const API = require("../../api.js");
const api = API.get();
const { GameInput } = require("../../input/gameinput.js");
const gameInput = GameInput.get();

//DEBUG
let raycaster = new three.Raycaster();

class FreeCam extends LookCamera {
  constructor() {
    super();
    this.speed = 0.3;
  }
  update() {
    if (gameInput.raw.pointer.locked) {
      if (GameInput.getButton("escape")) {
        gameInput.raw.unlock();
      }

      //DEBUG
      if (GameInput.pointerPrimary) {
        // raycaster.setFromCamera({
        //   x:0.5, y:0.5
        // }, this.camera);

        // let rayHits = raycaster.intersectObjects(
        //   api.getRenderer().getScene().children
        // );
        // console.log(rayHits);
        // for (let obj of rayHits) {
        //   obj.object.material.color.set(0xff0000);
        //   console.log(obj);
        // }
      }

      this.addRotationInput(
        gameInput.raw.consumeMovementX(),
        gameInput.raw.consumeMovementY()
      );
    } else {
      if (GameInput.pointerPrimary) {
        gameInput.raw.tryLock(api.getRenderer().webgl.domElement);
      }
    }

    //Get the facing direction
    this.camera.getWorldDirection(this.lookDir);

    this.lookDir.multiplyScalar(this.speed);

    if (GameInput.getButton("forward")) {
      this.yaw.position.add(this.lookDir);
    } else if (GameInput.getButton("backward")) {
      this.yaw.position.sub(this.lookDir);
    }

    if (GameInput.getButton("left")) {
      this.lookDirRight.set(
        this.lookDir.x,
        0, //this.cameraLookingDirection.y,
        this.lookDir.z
      );
      this.lookDirRight.applyAxisAngle(this.RIGHT, this.radRight);
      this.yaw.position.add(this.lookDirRight);
    } else if (GameInput.getButton("right")) {
      this.lookDirRight.set(
        this.lookDir.x,
        0, //this.cameraLookingDirection.y,
        this.lookDir.z
      );
      this.lookDirRight.applyAxisAngle(this.RIGHT, this.radRight);
      this.yaw.position.sub(this.lookDirRight);
    }
  }
}
module.exports.FreeCam = FreeCam;
