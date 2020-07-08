
let LookCamera = require("./lookcamera.js");

const API = require("../../api.js");
const api = API.get();
const { GameInput } = require("../../input/gameinput.js");
const gameInput = GameInput.get();

class FreeCam extends LookCamera {
  constructor() {
    super();
    this.speed = 0.5;//0.08;
  }
  update() {
    if (gameInput.raw.pointer.locked) {
      if (GameInput.getButton("escape")) {
        gameInput.raw.unlock();
      }

      if (GameInput.getButton("steer-left")) {
        gameInput.raw.pointer.mx -= this.gpLookSensitivity;
      } else if (GameInput.getButton("steer-right")) {
        gameInput.raw.pointer.mx += this.gpLookSensitivity;
      }

      if (GameInput.getButton("steer-up")) {
        gameInput.raw.pointer.my -= this.gpLookSensitivity;
      } else if (GameInput.getButton("steer-down")) {
        gameInput.raw.pointer.my += this.gpLookSensitivity;
      }

      this.addRotationInput(
        gameInput.raw.consumeMovementX(),
        gameInput.raw.consumeMovementY()
      );
    } else {
      if (GameInput.getButton("ok")) {//GameInput.pointerPrimary) {
        gameInput.raw.tryLock(api.getRenderer().webgl.domElement);
      }
    }
    if (!gameInput.raw.pointer.locked) return;
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
