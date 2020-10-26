
import { LookCamera, VEC3_RIGHT, RAD_90 } from "./lookcamera";

import API from "../../../api";
const api = API.get();

import { GameInput } from "../../../input/gameinput";
const input = GameInput.get();

export class FreeCam extends LookCamera {
  speed: number = 0.5;
  constructor() {
    super();
  }
  update() {
    if (input.raw.pointer.locked) {
      if (GameInput.getButton("escape")) {
        input.raw.unlock();
      }

      // if (GameInput.getButton("steer-left")) {
      //   input.raw.pointer.mx -= this.gpLookSensitivity;
      // } else if (GameInput.getButton("steer-right")) {
      //   input.raw.pointer.mx += this.gpLookSensitivity;
      // }

      // if (GameInput.getButton("steer-up")) {
      //   input.raw.pointer.my -= this.gpLookSensitivity;
      // } else if (GameInput.getButton("steer-down")) {
      //   input.raw.pointer.my += this.gpLookSensitivity;
      // }

      this.addRotationInput(
        input.raw.consumeMovementX(),
        input.raw.consumeMovementY()
      );
    } else {
      if (GameInput.getButton("ok")) {
        input.raw.tryLock(api.getRenderer().webgl.domElement);
      }
    }
    if (!input.raw.pointer.locked) return;
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
      this.lookDirRight.applyAxisAngle(VEC3_RIGHT, RAD_90);
      this.yaw.position.add(this.lookDirRight);
    } else if (GameInput.getButton("right")) {
      this.lookDirRight.set(
        this.lookDir.x,
        0, //this.cameraLookingDirection.y,
        this.lookDir.z
      );
      this.lookDirRight.applyAxisAngle(VEC3_RIGHT, RAD_90);
      this.yaw.position.sub(this.lookDirRight);
    }
  }
}
