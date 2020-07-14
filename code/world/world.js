
const path = require("path");
const API = require("../api.js");
const api = API.get();

const three = require("three");
const cannon = require("../../libs/cannon-es/cannon-es.cjs");
const Scene = three.Scene;
const Vector3 = three.Vector3;
const Object3D = three.Object3D;

const VEC3_RIGHT = new Vector3(1, 0, 0);

function degToRad(deg) {
  return deg * (Math.PI / 180);
}

/**@typedef {any} Entity*/
/**@typedef {import("../../libs/cannon-es/cannon-es.cjs").World} PhysicsWorld*/
/**@typedef {import("../rendering/renderer.js")} Renderer*/
/**@typedef {{p:{x:number,y:number,z:number},r:{x:number,y:number,z:number,w:number},m:string}} Placement*/

module.exports = class World {
  constructor() {
    /**@type {string}*/
    this.name = "";
    /**@type {PhysicsWorld}*/
    this.physics = undefined;

    /**@typedef {Scene}*/
    this.visual = undefined;

    /**@type {Set<Entity>}*/
    this.entities = new Set();

    /**@type {Map<string, any>}*/
    this.models = new Map();

    this.animMixers = new Set();

    this.performEntityUpdate = (e) => {
      e.update();
    }
  }
  setName(name) {
    this.name = name;
  }
  getName() {
    return this.name;
  }
  /**@param {Entity} e*/
  addEntity(e) {
    this.entities.add(e);
  }
  /**Get the visual world
   * @returns {Scene}
   */
  getVisual() {
    return this.visual;
  }
  /**Set the visual world
   * @param {Scene} visual 
   */
  setVisual(visual) {
    this.visual = visual;
  }
  /**Get the physics world
   * @returns {PhysicsWorld}
   */
  getPhysics() {
    return this.physics;
  }
  /**Set the physics world
   * @param {Physics}
   */
  setPhysics(physics) {
    this.physics = physics;
  }
  addModel(id, model) {
    if (!model.traverse || typeof (model.traverse) !== "function") {
      console.log(model);
      throw "Break";
    }
    model.traverse((child) => {
      if (child.isMesh && child.material) {
        if (child.material.metalness > 0.95) {
          // console.log("Set mesh metalness to average level");
          child.material.metalness = 0.88;
        }
      }
    });
    this.models.set(id, model);
  }
  /**@param {string} id*/
  hasModel(id) {
    return this.models.has(id);
  }
  /**Copies physics body
   * Will not copy listeners
   * @param {cannon.Body} body
   * @returns {cannon.Body}
   */
  static clonePhysicsBody(body) {
    let result = new cannon.Body({
      mass:body.mass
    });
    // result.aabb = body.aabb;
    for (let shape of body.shapes) {
      //TODO - Possibly doesn't handle shape offsets?
      result.addShape(shape);
    }
    result.position.copy(body.position);
    result.quaternion.copy(body.quaternion);
    result.userData = {};
    return result;
  }
  /**Clones user data with extra handling
   * @param {any} userData
   * If onCustomCloneKey is undefined, props that are Object will be set to warn message
   * @param {onCustomCloneKey} handleCustomClone 
   * @callback onCustomCloneKey
   * @param {string} key
   * @param {any} value
   * @param {onUseCallback} use
   * @callback onUseCallback
   * @param {any|undefined} valueToUse
   * If valueToUse is undefined the property will not be cloned
   */
  static cloneUserData(userData, handleCustomClone = undefined) {
    let result = {};
    let keys = Object.getOwnPropertyNames(userData);
    if (keys.length === 0) return result;
    let value;
    for (let key of keys) {
      value = userData[key];
      if (value instanceof Function) {
        //Copy functions and class references
        result[key] = userData[key];
      } else if (value instanceof Object) {
        //Try to handle objects using callback
        if (handleCustomClone) {
          handleCustomClone(key, value, (resolved) => {
            //Copy resolution if it isn't undefined
            if (resolved !== undefined) {
              result[key] = resolved;
            }
          });
        } else {
          //Fail with warning message
          result[key] = "uncloned userData";
        }
      } else {
        //Copy primitive values
        result[key] = userData[key];
      }
    }
    return result;
  }
  /**Clones a model (including physics / userData)
   * Same as three.Object3D.clone except it handles userData recursion
   * @param {Object3D} model
   * @param {boolean} recurse warning, heavy op
   * @returns {Object3D} clone
   */
  static cloneModel(model, recurse = false) {
    if (typeof (recurse) !== "boolean") throw `recurse is not boolean : ${recurse}`;

    //UserData fix part 0
    //Copies user data for use
    let userDataToCopy = model.userData;
    //Removes user data so clone doesn't fuck up the job
    model.userData = {};

    //Turn off recursion because we handle this manually
    let result = model.clone(false);

    //UserData fix part 1
    //Special userData handling functionality here
    result.userData = World.cloneUserData(userDataToCopy, (key, value, use) => {
      if (value instanceof cannon.Body) {
        let bodyClone = World.clonePhysicsBody(value);
        bodyClone.userData.visual = result;
        result.userData.physics = bodyClone;
        use(bodyClone);
      } else {
        use(undefined);
      }
    });

    //UserData fix part 2
    //Reassign the old user data to the clone's source
    model.userData = userDataToCopy;
    //Recursion!
    if (recurse === true && model.children && model.children.length > 0) {
      for (let child of model.children) {
        result.add(World.cloneModel(child, recurse));
      }
    }
    return result;
  }
  /**Place model
   * Not cloning will move the original model
   * @param {Placement} placement
   * @param {boolean} useClone where to clone the model or not
   */
  placeModel(placement, useClone = false) {
    let p = { x: placement.p[0], y: placement.p[1], z: placement.p[2] };
    let r = { x: placement.r[0], y: placement.r[1], z: placement.r[2], w: placement.r[3] };
    let m = this.getModel(placement.m);
    if (useClone) {
      m = World.cloneModel(m, true);
    }
    m.receiveShadow = true;

    m.position.set(-p.x, p.y, p.z);
    m.quaternion.set(r.x, r.y, r.z, r.w);

    let data;
    m.traverse((child) => {
      data = child.userData;
      if (data && data.physics && data.physics instanceof cannon.Body) {
        data.physics.position.copy(child.position);
        data.physics.quaternion.copy(child.quaternion);
        // this.getPhysics().removeBody(data.physics);
        this.getPhysics().addBody(data.physics);
      }
    })

    m.rotateOnAxis(VEC3_RIGHT, degToRad(180));

    if (m.userData.animMixer) {
      this.animMixers.add(m.userData.animMixer);
    }
    this.getVisual().add(m);
  }
  getModel(id) {
    return this.models.get(id);
  }

  /**Loads a map from a directory
   * @param {string} pkg
   * @param {string} dir
   * @returns {Promise<World>}
   */
  static async load(pkg, dir) {
    return new Promise(async (resolve, reject) => {
      try {
        let result = new World();
        let pe = api.getPhysicsEngine();
        result.setPhysics(new pe.World());
        result.setVisual(new Scene());

        let json = await api.readJsonFile(pkg);
        result.setName(json.name || "World");

        /**@type {string}*/
        let modelFile = undefined;

        if (json.placements) {
          for (let placement of json.placements) {
            if (!placement.m) {
              console.warn("Placement invalid", placement);
              continue;
            }
            if (!result.hasModel(placement.m)) {
              modelFile = path.join(dir, "models", placement.m + ".glb");
              let model = await api.loadModel(modelFile, true);
              result.addModel(placement.m, model.scene);

              //False for non-cloning mode
              result.placeModel(placement, false);
            } else {
              //TODO - implement mesh instancing here
              //For now we'll just clone (better than reading disk n*times)

              //True for cloning mode
              result.placeModel(placement, true);
            }
          }
        }
        resolve(result);
      } catch (ex) {
        reject(`Issue loading world ${ex}`);
      }
    });
  }

  /**Mount to the default renderer (using API)
   */
  mount() {
    API.get().setWorld(this);
  }

  /**Update the world
   * @param {number} delta millis
   */
  update(delta) {
    this.physics.step(delta);

    this.animMixers.forEach((mixer) => {
      // console.log(mixer);
      mixer.time += 1;
      mixer.update(delta);
    });

    //Replace with entity code later
    this.physics.bodies.forEach((body) => {
      if (body.userData && body.userData.visual) {
        body.userData.visual.position.copy(body.position);
        body.userData.visual.quaternion.copy(body.quaternion);
      }
    });

    //this.entities.forEach(performEntityUpdate);
  }
}
