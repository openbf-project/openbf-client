
let LookCamera = require("./lookcamera.js");

const API = require("../../api.js");
const api = API.get();

module.exports = class FreeCam extends LookCamera {
  constructor() {
    super();
    
    this.mount(api.getRenderer().getScene());
    this.mountToRenderer(api.getRenderer());

    document.addEventListener("click", () => {
      api.input.tryLock(api.getRenderer().webgl.domElement);
    });
    document.addEventListener("keyup", (evt) => {
        if (evt.code === "Escape") {
            api.input.unlock();
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
    if (api.input.getKey("w")) {
      this.yaw.position.add(this.lookDir);
    } else if (api.input.getKey("s")) {
      this.yaw.position.sub(this.lookDir);
    }
    if (api.input.getKey("a")) {
      this.lookDirRight.set(
        this.lookDir.x,
        0, //this.cameraLookingDirection.y,
        this.lookDir.z
      );
      this.lookDirRight.applyAxisAngle(this.RIGHT, this.radRight);
      this.yaw.position.add(this.lookDirRight);
    } else if (api.input.getKey("d")) {
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
