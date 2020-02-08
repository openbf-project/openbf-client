
let Object3D = require("three").Object3D;
let cannon = require("cannon");

import LookCamera from "./lookcamera.js";

export default class Player {
  name = "";
  /**@type {import("../../entity.js").Entity} */
  entity = undefined;

  /**@param {import("../../api.js").default} api 
   * @param {String} name of the player
  */
  constructor(api, name = "Player 1", isLocal = false) {
    this.api = api;
    this.name = name;
    this.isLocal = isLocal;

    //Threejs representation (may be reused for anything)
    this.display = new Object3D();

    if (this.isLocal) {
      this.lookCamera = new LookCamera(this.api);
      this.lookCamera.pitch.position.y = 1;
      this.lookCamera.camera.position.set(0, 0, 1);
      this.lookCamera.mount(this.display);
    }

    this.walkForce = 100;
    this.jumpForce = 80;

    this.VEC_FWD = new cannon.Vec3(0, 0, -this.walkForce);
    this.VEC_BWD = new cannon.Vec3(0, 0, this.walkForce);
    this.VEC_LFT = new cannon.Vec3(-this.walkForce, 0, 0);
    this.VEC_RGT = new cannon.Vec3(this.walkForce, 0, 0);
    this.VEC_JMP = new cannon.Vec3(0, this.jumpForce, 0);

    let mat = new cannon.Material("player");
    mat.friction = 0.0;
    this.physics = new cannon.Body({mass:5, fixedRotation:false, material:mat});
    let size = new cannon.Vec3(0.5, 0.5, 0.5);
    let shape = new cannon.Sphere(0.5);
    //let shape = new cannon.Box(size);
    this.physics.addShape(shape);
    this.physics.linearDamping = 0.95;
    api.world.addBody(this.physics);
    
    document.addEventListener("click", () => {
      this.api.input.tryLock(this.api.renderer.webgl.domElement);
    });
    document.addEventListener("keyup", (evt) => {
      if (evt.code === "Escape") {
        this.api.input.unlock();
      }
    });
    document.addEventListener("keyup", (evt) => {
      if (evt.code === "Space") {
        this.physics.applyLocalImpulse(this.VEC_JMP, cannon.Vec3.ZERO);
      }
    });

    let tempId = 33;
    this.entity = this.api.entityManager.createEntity(tempId, 1, this);
    console.log("Init");
  }

  teleport (x=0, y=0, z=0) {
    this.display.position.set(x, y, z);
    this.physics.position.copy(this.display.position);
    this.physics.velocity.setZero();
  }

  update () {
    if (this.isLocal) {
      this.lookCamera.update();
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
      this.display.position.copy(this.physics.position);
      //this.display.quaternion.copy(this.physics.quaternion);
      this.physics.quaternion.copy(this.lookCamera.yaw.quaternion);
    }
  }

  /**Mount the player to the scene
   * @param {Object3D} parent
   * @param {Renderer} renderer
   */
  mount(parent, renderer=undefined) {
    parent.add(this.display);
    if (this.isLocal) this.lookCamera.mountToRenderer(renderer);
  }
}


