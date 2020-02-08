
import { Entity } from "../../entity.js";
import LookCamera from "./lookcamera.js";

export class FreeCam extends LookCamera {
  /**@param {import("../../api.js").default} api 
   */
  constructor(api) {
    super(api);
    
    this.mount(api.renderer.scene);
    this.mountToRenderer(api.renderer);

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
  }
}
