
const path = require("path");
const API = require("../api.js");
const api = API.get();

const three = require("three");
const Scene = three.Scene;
const Vector3 = three.Vector3;

const VEC3_UP = new Vector3(0, 1, 0);
const VEC3_RIGHT = new Vector3(1, 0, 0);

function degToRad(deg) {
  return deg * (Math.PI / 180);
}

/**@typedef {any} Entity*/
/**@typedef {any} PhysicsWorld*/
/**@typedef {any} VisualWorld*/
/**@typedef {import("../ui/renderer.js")} Renderer*/

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
    this.models.set(id, model);
  }
  /**@param {string} id*/
  hasModel(id) {
    return this.models.has(id);
  }
  /**Place model
   * @param {Placement} placement 
   */
  placeModel(placement) {
    let p = { x: placement.p[0], y: placement.p[1], z: placement.p[2] };
    let r = { x: placement.r[0], y: placement.r[1], z: placement.r[2], w: placement.r[3] };
    let m = this.getModel(placement.m);

    m.scene.position.set(-p.x, p.y, p.z);
    m.scene.quaternion.set(r.x, r.y, r.z, r.w);

    m.scene.rotateOnAxis(VEC3_RIGHT, degToRad(180));

    this.getVisual().add(m.scene);
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
        console.log(json);

        if (json.placements) {
          for (let placement of json.placements) {
            if (!placement.m) {
              console.warn("Placement invalid", placement);
              continue;
            }
            modelFile = path.join(dir, "models", placement.m + ".glb");
            if (true) {//!result.hasModel(placement.m)) {
              let model = await api.loadModel(modelFile);
              result.addModel(placement.m, model);
            }
            result.placeModel(placement);
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
