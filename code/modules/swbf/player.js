
let cannon = require("cannon");

let Unit = require("./unit.js");
let LookCamera = require("../default/lookcamera.js");

module.exports = class Player extends Unit {
  /**@param {import("../../api.js")} api
   * @param {String} path of this module
   * @param {String} name of the player
   * @param {Boolean} isLocal represents a local player
  */
  constructor(api, _path, name = "Player 1", isLocal = false) {
    super(api);
    this.api = api;
    this.name = name;
    this.isLocal = isLocal;

    this.currentAction;
    this.currentClip;
    this.walkForce = 3200;
    this.jumpForce = 8000;

    this.VEC_FWD = new cannon.Vec3(0, 0, -this.walkForce);
    this.VEC_BWD = new cannon.Vec3(0, 0, this.walkForce);
    this.VEC_LFT = new cannon.Vec3(-this.walkForce, 0, 0);
    this.VEC_RGT = new cannon.Vec3(this.walkForce, 0, 0);
    this.VEC_JMP = new cannon.Vec3(0, this.jumpForce, 0);

    this.physics = new cannon.Body({
      mass: 10,
      fixedRotation: false
    });

    let shape = new cannon.Sphere(0.5);
    this.physics.addShape(shape);
    this.physics.addShape(shape, new cannon.Vec3(0, 0.25, 0));
    this.physics.linearDamping = 0.1;
    api.world.addBody(this.physics);

    if (!this.api.headless) {
      if (this.isLocal) {
        this.lookCamera = new LookCamera(this.api);
        this.lookCamera.sensitivity = 0.003;
        this.lookCamera.pitch.position.y = 1;
        this.lookCamera.camera.position.set(0, 0, 1);
        this.lookCamera.mount(this);

        document.addEventListener("click", () => {
          this.api.input.tryLock(this.api.renderer.webgl.domElement);
        });
        document.addEventListener("keyup", (evt) => {
          if (evt.code === "Escape") {
            this.api.input.unlock();
          } else if (evt.code === "Space") {
            console.log("Space");
            this.physics.applyLocalForce(this.VEC_JMP, cannon.Vec3.ZERO);
          }
        });
      }
    }
  }

  onUpdate () {
    if (this.isLocal) {
      this.lookCamera.update();
      this.physics.quaternion.copy(this.lookCamera.yaw.quaternion);
      if (this.api.input.getKey("w")) {
        this.physics.applyLocalForce(this.VEC_FWD, cannon.Vec3.ZERO);
      } else if (this.api.input.getKey("s")) {
        this.physics.applyLocalForce(this.VEC_BWD, cannon.Vec3.ZERO);
      }
      if (this.api.input.getKey("a")) {
        this.physics.applyLocalForce(this.VEC_LFT, cannon.Vec3.ZERO);
      } else if (this.api.input.getKey("d")) {
        this.physics.applyLocalForce(this.VEC_RGT, cannon.Vec3.ZERO);
      }
    }
    this.onSuperUpdate();
  }

  /**Mount the player to the scene
   * @param {Object3D} parent
   * @param {Renderer} renderer
   */
  mount(parent, renderer = undefined) {
    parent.add(this);
    if (this.isLocal) this.lookCamera.mountToRenderer(renderer);
  }
}
