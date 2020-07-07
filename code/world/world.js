
const path = require("path");
const API = require("../api.js");
const api = API.get();

const three = require("three");
const Scene = three.Scene;
const Vector3 = three.Vector3;

const VEC3_RIGHT = new Vector3(1, 0, 0);

function degToRad(deg) {
  return deg * (Math.PI / 180);
}

/**@typedef {any} Entity*/
/**@typedef {import("../../libs/cannon-es/cannon-es.cjs").World} PhysicsWorld*/
/**@typedef {import("three").Scene} VisualWorld*/
/**@typedef {import("../rendering/renderer.js")} Renderer*/

/**@typedef {{p:{x:number,y:number,z:number},r:{x:number,y:number,z:number,w:number},m:string}} Placement*/

module.exports = class World {
  constructor() {
    /**@type {string}*/
    this.name = "";
    /**@type {PhysicsWorld}*/
    this.physics = undefined;

    /**@typedef {VisualWorld}*/
    this.visual = undefined;

    /**@type {Set<Entity>}*/
    this.entities = new Set();

    /**@type {Map<string, any>}*/
    this.models = new Map();

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
   * @returns {VisualWorld}
   */
  getVisual() {
    return this.visual;
  }
  /**Set the visual world
   * @param {VisualWorld} visual 
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
    if (!model.traverse) {
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
  /**Place model
   * Not cloning will move the original model
   * @param {Placement} placement
   * @param {boolean} useClone where to clone the model or not
   */
  placeModel(placement, useClone=false) {
    let p = { x: placement.p[0], y: placement.p[1], z: placement.p[2] };
    let r = { x: placement.r[0], y: placement.r[1], z: placement.r[2], w: placement.r[3] };
    let m = this.getModel(placement.m);
    if (useClone) {
      m = m.clone(true);
    }
    m.receiveShadow = true;
    
    m.position.set(-p.x, p.y, p.z);
    m.quaternion.set(r.x, r.y, r.z, r.w);

    m.rotateOnAxis(VEC3_RIGHT, degToRad(180));

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

    //Replace with entity code later
    this.physics.bodies.forEach((body) => {
      if (body.real) {
        body.real.position.copy(body.position);
        body.real.quaternion.copy(body.quaternion);
      }
    });

    //this.entities.forEach(performEntityUpdate);
  }
}
