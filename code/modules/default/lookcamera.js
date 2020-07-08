
let three = require("three");
let Object3D = three.Object3D;
let Vector3 = three.Vector3;
let PerspectiveCamera = three.PerspectiveCamera;

const API = require("../../api.js");
const api = API.get();

module.exports = class LookCamera {
  constructor () {
    this.camera = new PerspectiveCamera(75, api.renderer.aspect, 0.1, 1000);

    this.pitch = new Object3D();
    this.yaw = new Object3D();
    this.lookDir = new Vector3();

    this.posY = 0;

    this.sensitivity = 0.002;
    this.gpLookSensitivity = 10;

    this.lookDirRight = new Vector3();
    this.RIGHT = new Vector3(0, 1, 0);
    this.radRight = three.Math.degToRad(90);

    this.pitch.add(this.camera);
    this.yaw.add(this.pitch);

    this.pitchLowLimit = -1.5;
    this.pitchHighLimit = 1.5;
  }
  /**Set the camera's position
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   */
  setPosition (x, y, z) {
    this.yaw.position.set(x, y, z);
  }
  /**Add rotation input
   * Takes sensitivity into account
   * @param {number} movementX 
   * @param {number} movementY 
   */
  addRotationInput (movementX, movementY) {
    this.yaw.rotation.y -= movementX * this.sensitivity;
    this.pitch.rotation.x -= movementY * this.sensitivity;

    if (this.pitch.rotation.x < this.pitchLowLimit) {
      this.pitch.rotation.x = this.pitchLowLimit;
    } else if (this.pitch.rotation.x > this.pitchHighLimit) {
      this.pitch.rotation.x = this.pitchHighLimit;
    }
  }
  /**Set rotation input
   * Takes sensitivity into account
   * @param {number} x
   * @param {number} y
   */
  setRotationInput (x, y) {
    this.yaw.rotation.y = x * this.sensitivity;
    this.pitch.rotation.x = y * this.sensitivity;

    if (this.pitch.rotation.x < this.pitchLowLimit) {
      this.pitch.rotation.x = this.pitchLowLimit;
    } else if (this.pitch.rotation.x > this.pitchHighLimit) {
      this.pitch.rotation.x = this.pitchHighLimit;
    }
  }

  setFieldOfView (fov) {
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
  }

  /**Mount this camera controller to a parent object
   * Will also set the current renderer camera if passed the renderer
   * @param {Object3D} parent
   * @param {import("../../rendering/renderer.js")} renderer to set camera of
   */
  mount (parent, renderer=false) {
    parent.add(this.yaw);
    if (renderer) this.mountToRenderer(renderer);
  }

  /**Mounts the three Camera of this module to a renderer
   * @param {import("../../rendering/renderer.js")} renderer to set camera of*/
  mountToRenderer (renderer) {
    renderer.setCamera(this.camera);
  }
}
