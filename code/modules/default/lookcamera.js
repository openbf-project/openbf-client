
let three = require("three");
let Object3D = three.Object3D;
let Vector3 = three.Vector3;
let PerspectiveCamera = three.PerspectiveCamera;

export default class LookCamera {
  constructor (api) {
    this.api = api;
    this.camera = new PerspectiveCamera(75, api.renderer.aspect, 0.1, 200);

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

    this.pitchLowLimit = -1.5;
    this.pitchHighLimit = 1.5;

    /**
     * document.addEventListener("click", () => {
      this.api.input.tryLock(this.api.renderer.webgl.domElement);
    });
    document.addEventListener("keyup", (evt) => {
        if (evt.code === "Escape") {
            this.api.input.unlock();
        }
    });
     */
  }

  update () {
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
  }

  /**Mount this camera controller to a parent object
   * Will also set the current renderer camera if passed the renderer
   * @param {Object3D} parent
   * @param {import("../../renderer").default|false} renderer to set camera of
   */
  mount (parent, renderer=false) {
    parent.add(this.yaw);
    if (renderer) this.mountToRenderer(renderer);
  }

  /**Mounts the three Camera of this module to a renderer
   * @param {import("../../renderer").default|false} renderer to set camera of */
  mountToRenderer (renderer) {
    renderer.setCamera(this.camera);
  }
}
