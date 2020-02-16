
let three = require("three");
let Object3D = three.Object3D;
let AnimationMixer = three.AnimationMixer;
let cannon = require("cannon");

let { Entity } = require("../../entity.js");

let GLTFLoader = require("../../GLTFLoader.js");
let LookCamera = require("./lookcamera.js");

module.exports = class Player {
  name = "";
  /**@type {import("../../entity.js").Entity} */
  entity = undefined;

  /**@param {import("../../api.js").default} api 
   * @param {String} name of the player
  */
  constructor(api, _path, name = "Player 1", isLocal = false) {
    this.api = api;
    this.name = name;
    this.isLocal = isLocal;

    this.currentAction;
    this.currentClip;

    this.viewHeightStand = 1;
    this.viewHeightCrouch = 0.75;
    this.viewHeightProne = 0.35;
    this.stanceState = 0; //Cycle state for stand (0), crouch(1), prone(2)
    this.STANCE_STAND = 0;
    this.STANCE_CROUCH = 1;
    this.STANCE_PRONE = 2;

    //Threejs representation (may be reused for anything)
    this.display = new Object3D();

    if (this.isLocal) {
      this.lookCamera = new LookCamera(this.api);
      this.lookCamera.sensitivity = 0.003;
      this.lookCamera.pitch.position.y = this.viewHeightCrouch;
      this.lookCamera.camera.position.set(0, 0, 1);
      this.lookCamera.mount(this.display);
    }

    this.walkForce = 800;
    this.jumpForce = 80;

    this.VEC_FWD = new cannon.Vec3(0, 0, -this.walkForce);
    this.VEC_BWD = new cannon.Vec3(0, 0, this.walkForce);
    this.VEC_LFT = new cannon.Vec3(-this.walkForce, 0, 0);
    this.VEC_RGT = new cannon.Vec3(this.walkForce, 0, 0);
    this.VEC_JMP = new cannon.Vec3(0, this.jumpForce, 0);

    this.physics = new cannon.Body({
      mass: 10,
      fixedRotation: false
    });

    let size = new cannon.Vec3(0.5, 0.5, 0.5);
    let shape = new cannon.Sphere(0.5);
    this.physics.addShape(shape);
    this.physics.addShape(shape, new cannon.Vec3(0, 0.25, 0));
    this.physics.linearDamping = 0.1;
    api.world.addBody(this.physics);

    document.addEventListener("click", () => {
      this.api.input.tryLock(this.api.renderer.webgl.domElement);
    });
    // document.addEventListener("keydown", (evt) => {
    //   if (evt.key === "w") {
    //     if (this.stanceState === this.STANCE_STAND) {
    //       this.walk();
    //     }
    //   } else if (evt.code === "Space") {
    //     if (this.stanceState === this.STANCE_STAND || this.stanceState === this.STANCE_WALK) {
    //       this.stand();
    //       this.physics.applyLocalImpulse(this.VEC_JMP, cannon.Vec3.ZERO);
    //     } else if (this.stanceState === this.STANCE_CROUCH) {
    //       this.stand();
    //     } else if (this.stanceState === this.STANCE_PRONE) {
    //       this.crouch();
    //     }
    //   }
    // });
    document.addEventListener("keyup", (evt) => {
      if (evt.code === "Escape") {
        this.api.input.unlock();
      } //else if (evt.key === "c") {
      //   if (this.stanceState === this.STANCE_STAND) {
      //     this.crouch();
      //   } else if (this.stanceState === this.STANCE_CROUCH) {
      //     this.prone();
      //   } else if (this.stanceState === this.STANCE_PRONE) {
      //     this.crouch();
      //   }
      // } else if (evt.key === "w") {
      //   this.stand();
      // }
    });

    let tempId = 33;
    this.entity = this.api.entityManager.createEntity(tempId, 1, this);
    console.log(this.entity);
    this.entity.track("jumpForce", Entity.TYPE_INT);
    /**@type {AnimationMixer} */
    this.mixer;

    // let fLoader = new GLTFLoader(undefined, this.api.headless);
    // console.log(fLoader);
    // fLoader.load(_path + "/gfx/trooper.glb", (gltf) => {
    //   gltf.scene.traverse((child) => {
    //     child.frustumCulled = false;
    //   });
    //   this.lookCamera.yaw.add(gltf.scene);
    //   this.mixer = new AnimationMixer(gltf.scene);
    //   this.animations = gltf.animations;

    //   //this.stand();
    //   this.currentClip = three.AnimationClip.findByName(this.animations, "stand");
    //   this.currentAction = this.mixer.clipAction(this.currentClip);
    //   this.currentAction.play();
    // });
  }

  walk() {
    this.lookCamera.pitch.position.y = this.viewHeightStand;
    this.lookCamera.camera.position.set(0, 0, 1.5);
    this.anim("walk", false);
    this.stanceState = this.STANCE_WALK;
  }

  crouch() {
    this.lookCamera.pitch.position.y = this.viewHeightCrouch;
    this.lookCamera.camera.position.set(0, 0, 1);
    this.anim("crouch");
    this.stanceState = this.STANCE_CROUCH;
  }

  prone() {
    this.lookCamera.pitch.position.y = this.viewHeightProne;
    this.lookCamera.camera.position.set(0, 0, 0.5);
    this.anim("prone");
    this.stanceState = this.STANCE_PRONE;
  }

  stand() {
    this.lookCamera.pitch.position.y = this.viewHeightStand;
    this.lookCamera.camera.position.set(0, 0, 1.5);
    this.anim("stand");
    this.stanceState = this.STANCE_STAND;
  }

  anim(name, fadein = false) {
    this.currentClip = three.AnimationClip.findByName(this.animations, name);
    this.lastAction = this.currentAction;
    this.currentAction = this.mixer.clipAction(this.currentClip);
    if (this.lastAction && fadein) {
      this.lastAction.reset();
      this.currentAction.reset();
      this.currentAction.crossFadeFrom(this.lastAction, 0.25, true);
    } else {
      this.lastAction.stop();
      this.lastAction.reset();
      this.currentAction.reset();
      this.currentAction.play();
    }
  }

  teleport(x = 0, y = 0, z = 0) {
    this.display.position.set(x, y, z);
    this.physics.position.copy(this.display.position);
    this.physics.velocity.setZero();
  }

  update() {
    if (this.isLocal) {
      this.physics.quaternion.copy(this.lookCamera.yaw.quaternion);
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
      this.physics.velocity.x *= 0.5;
      this.physics.velocity.z *= 0.5;
      this.display.position.copy(this.physics.position);
      this.display.position.y -= 0.5;

      if (this.mixer) this.mixer.update(this.api.timeManager.delta);
      //this.display.quaternion.copy(this.physics.quaternion);
    }
  }

  /**Mount the player to the scene
   * @param {Object3D} parent
   * @param {Renderer} renderer
   */
  mount(parent, renderer = undefined) {
    parent.add(this.display);
    if (this.isLocal) this.lookCamera.mountToRenderer(renderer);
  }

  /**@returns {Number} */
  get x() {
    return this.display.position.x;
  }
  /**@returns {Number} */
  get y() {
    return this.display.position.y;
  }
  /**@returns {Number} */
  get z() {
    return this.display.position.z;
  }
}
