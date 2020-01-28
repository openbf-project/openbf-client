
import { Entity } from "../entity.js";

let three = require("three");
let Object3D = three.Object3D;
let Vector3 = three.Vector3;
let PerspectiveCamera = three.PerspectiveCamera;

/**Auxiliary register function for calling API/fetching resources/setup
 * @param {import("../api.js").default} api api object containing references to apis
 * @param {String} _modpath path to this module not including last slash
 */
export function register(api, _modpath) {
  let freecam = new FreeCam(api);
  api.renderer.setCamera(freecam.camera);
  api.renderer.scene.add(freecam.yaw);

  api.timeManager.listen(()=>freecam.update());
}

class FreeCam {
  /**@param {import("../api.js").default} api 
   */
  constructor(api) {
    /**@type {import("../api.js").default} */
    this.api = api;
    this.camera = new PerspectiveCamera(75, api.renderer.aspect, 0.1, 200);
    this.pitchLowLimit = -1.5;
    this.pitchHighLimit = 1.5;

    this.pitch = new Object3D();
    this.yaw = new Object3D();
    this.lookDir = new Vector3();

    this.posY = 0;

    this.sensitivity = 0.002;

    this.lookDirRight = new Vector3();
    this.RIGHT = new Vector3(0, 1, 0);
    this.radRight = three.Math.degToRad(90);

    this.pitch.add(this.camera);
    this.yaw.add(this.pitch);

    document.addEventListener("click", () => {
      this.api.input.tryLock(this.api.renderer.webgl.domElement);
    });
    document.addEventListener("keyup", (evt) => {
        if (evt.code === "Escape") {
            this.api.input.unlock();
        }
    });

    this.entity = api.entityManager.createEntity(0, 1, this.yaw.position);

    this.entity
      .track("x", Entity.TYPE_FLOAT)
      .track("y", Entity.TYPE_FLOAT)
      .track("z", Entity.TYPE_FLOAT);
  }
  update() {
    if (this.api.input.mouse.locked) {
      this.yaw.rotation.y -= this.api.input.mouse.movementX * this.sensitivity;
      this.pitch.rotation.x -= this.api.input.mouse.movementY * this.sensitivity;
      this.api.input.consumeMovement();
      if (this.pitch.rotation.x < this.pitchLowLimit) {
        this.pitch.rotation.x = this.pitchLowLimit;
      } else if (this.pitch.rotation.x > this.pitchHighLimit) {
        this.pitch.rotation.x = this.pitchHighLimit;
      }
    }

    this.camera.getWorldDirection(this.lookDir);
    this.lookDir.multiplyScalar(0.3);
    if (this.api.input.getKey("w")) {
      this.yaw.position.add(this.lookDir);
    } else if (this.api.input.getKey("s")) {
      this.yaw.position.sub(this.lookDir);
    }
    if (this.api.input.getKey("a")) {
      this.lookDirRight.set(
        this.lookDir.x,
        0, //this.cameraLookingDirection.y,
        this.lookDir.z
      );
      this.lookDirRight.applyAxisAngle(this.RIGHT, this.radRight);
      this.yaw.position.add(this.lookDirRight);
    } else if (this.api.input.getKey("d")) {
      this.lookDirRight.set(
        this.lookDir.x,
        0, //this.cameraLookingDirection.y,
        this.lookDir.z
      );
      this.lookDirRight.applyAxisAngle(this.RIGHT, this.radRight);
      this.yaw.position.sub(this.lookDirRight);
    }

    //console.log(this.entity.getData());
  }
}
