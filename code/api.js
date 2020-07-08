
const fs = require("fs");
const path = require("path");
let GLTFLoader = require("../libs/three-extras/GLTFLoader.js");

const { makeCannonConvexMesh } = require("./utils/math.js");

/**@typedef {import("./rendering/renderer.js")} Renderer*/
/**@typedef {import("../libs/cannon-es/cannon-es.cjs")} PhysicsEngine*/
/**@typedef {import("./state.js").StateManager} StateManager*/
/**@typedef {import("./rendering/ui.js").UIManager} UI*/
/**@typedef {import("./utils/time.js")} TimeManager*/
/**@typedef {import("./world/world.js")} World*/
/**@typedef {import("./modules/module.js").ModuleManager} ModuleManager*/

module.exports = class API {
  /**@type {API}*/
  static SINGLETON = undefined;
  constructor() {
    /**@type {PhysicsEngine|undefined}*/
    this.engine = undefined;

    /**@type {Renderer|undefined} */
    this.renderer = undefined;

    /**@type {boolean} headless is true when rendering, false when server*/
    this.headless = false;

    /**@type {StateManager}*/
    this.stateManager = undefined;

    /**@type {UI}*/
    this.ui = undefined;

    /**@type {TimeManager}*/
    this.timeManager = undefined;

    /**@type {World}*/
    this.world = undefined;

    /**@type {GLTFLoader}*/
    this.gltfLoader = undefined;

    /**@type {ModuleManager}*/
    this.moduleManager = undefined;

    /**@param {import("three").Object3D} child*/
    this.onParseModelExtras = (child)=>{
      switch (child.type) {
        case "SpotLight":
          break;
        case "":
          break;
        default:
          break;
      }
      let data = child.userData["openbf-data"];
      if (!data) return;
      if ( typeof(data) !== "object" ) {
        try {
          data = JSON.parse(data);
        } catch (ex) {
          throw `Child of imported model openBFData is not valid json or json string, try to use Revalidate User Data in node-openbf-edit blender plugin`;
        }
      }
      let shape;
      let body;
      let col = data.collision;
      if (col && col.shape) {
        switch (col.shape.type) {
          case "MESH":
            shape = new cannon.Trimesh(
              child.geometry.attributes.position.array,
              child.geometry.index.array
            );
            break;
          case "CONVEX_HULL":
            shape = makeCannonConvexMesh(
              child.geometry.attributes.position,
              child.geometry.index.array
            );
            break;
          case "SPHERE":
            shape = new cannon.Sphere(
              col.shape.radius || 1
            );
            break;
          default:
            throw `userData["openbf-data"].collision.shape ${shapeType} is not supported`;
            break;
        }
        body = new cannon.Body({
          mass: data.collision.mass || 0
        });
        body.addShape(shape);
        body.position.copy(child.position);
        body.quaternion.copy(child.quaternion);
        body.userData.visual = child;
        child.userData.physics = body;
      }
    }
  }
  /**Set the time manager
   * @param {TimeManager} tm 
   */
  setTimeManager(tm) {
    this.timeManager = tm;
  }
  /**Get the time manager
   * @returns {TimeManager}
   */
  getTimeManager() {
    return this.timeManager;
  }
  /**Get the gltfloader
   * @returns {GLTFLoader}
   */
  getGLTFLoader() {
    if (!this.gltfLoader) this.gltfLoader = new GLTFLoader(undefined, this.getHeadless());
    return this.gltfLoader;
  }
  setStateManager(sm) {
    this.stateManager = sm;
  }
  getStateManager() {
    return this.stateManager;
  }
  /**Get the world
   * @returns {World}
   */
  getWorld() {
    return this.world;
  }
  /**Set the world reference
   * @param {World|undefined} world 
   */
  setWorld(world) {
    this.world = world;
    this.getRenderer().setScene(
      this.getWorld().getVisual()
    );
    console.log("Set world", world);
  }
  /**Check if a world is loaded
   * @returns {boolean} true if a world is present
   */
  hasWorld() {
    return this.world !== undefined;
  }
  /**Set the ui reference
   * @param {UI} ui 
   */
  setUI(ui) {
    this.ui = ui;
  }
  /**Get the UI
   * @returns {UI}
   */
  getUI() {
    return this.ui;
  }
  /**Set the headless reference (please know what you're doing)
   * @param {boolean} headless is true when rendering, false when server*/
  setHeadless(headless) {
    this.headless = headless;
  }
  /**Returns whether we're working in headless mode or not
   * @returns {boolean} headless
   */
  getHeadless() {
    return this.headless;
  }
  /**Set the physics engine reference
   * @param {PhysicsEngine|undefined} engine 
   */
  setPhysicsEngine(engine) {
    this.engine = engine;
  }
  /**Get the physics engine
   * @returns {PhysicsEngine|undefined}
   */
  getPhysicsEngine() {
    return this.engine;
  }
  get physicsEngine() {
    return this.engine;
  }
  /**Set the renderer reference
   * @param {Renderer|undefined} renderer 
   */
  setRenderer(renderer) {
    this.renderer = renderer;
  }
  /**Get the renderer
   * @returns {Renderer|undefined}
   */
  getRenderer() {
    return this.renderer;
  }
  /**Get (and create if doesn't exist) the API
   * @returns {API}
   */
  static get() {
    if (!API.SINGLETON) API.SINGLETON = new API();
    return API.SINGLETON;
  }
  /**Reads a text file
   * @param {string} url
   * @returns {Promise<string>}
   */
  readTextFile(url) {
    return new Promise((resolve, reject) => {
      try {
        let result = fs.readFileSync(url).toString();
        resolve(result);
      } catch (ex) {
        reject(ex);
      }
    });
  }
  /**Reads a text file
   * @param {string} url
   * @returns {Promise<any>}
   */
  readJsonFile(url) {
    return new Promise((resolve, reject) => {
      try {
        let result = JSON.parse(fs.readFileSync(url).toString());
        resolve(result);
      } catch (ex) {
        reject(ex);
      }
    });
  }
  /**Reads a data file
   * @param {string} url
   * @returns {Promise<Buffer>}
   */
  readBufferFile(url) {
    return new Promise((resolve, reject) => {
      try {
        let result = fs.readFileSync(url);
        resolve(result);
      } catch (ex) {
        reject(ex);
      }
    });
  }
  /**Reads a data file
   * @param {string} url
   * @returns {Promise<ArrayBuffer>}
   */
  readArrayBufferFile(url) {
    return new Promise((resolve, reject) => {
      try {
        let result = fs.readFileSync(url).buffer;
        resolve(result);
      } catch (ex) {
        reject(ex);
      }
    });
  }
  /**Parses extras on model (collision, lights, etc)
   * @param {{scene:import("three").Scene}} model
   */
  parseModelExtras (model) {
    model.scene.traverse (this.onParseModelExtras);
    // mixer = new AnimationMixer(gltf.scene);
    // gltf.animations.forEach((clip) => {
    //   mixer.clipAction(clip).play();
    // });
  }
  /**Currently supports only GLTF and GLB files
   * @param {string} fname model file to load
   * @returns {Promise<model>}
   */
  loadModel(fname, parseExtras=false) {
    return new Promise((resolve, reject) => {
      try {
        this.getGLTFLoader().load(fname, (model)=>{
          if (parseExtras) this.parseModelExtras(model);
          resolve(model);
        }, undefined, reject);
      } catch (ex) {
        reject(ex);
      }
    });
  }
  /**Read a directory
   * @param {string} dir
   * @returns {Promise<{files:Array<string>, dirs:Array<string>}>}
   */
  readDir(dir) {
    return new Promise((resolve, reject) => {
      try {
        let result = {
          files: new Array(),
          dirs: new Array()
        };
        let items = fs.readdirSync(dir);
        let stat;
        let itemAbs;
        for (let item of items) {
          itemAbs = path.join(dir, item);
          stat = fs.statSync(itemAbs);
          if (stat.isDirectory()) {
            result.dirs.push(item);
          } else if (stat.isFile()) {
            result.files.push(item);
          }
        }
        resolve(result);
      } catch (ex) {
        console.log(ex);
        reject(ex);
      }
    });
  }
  /**Join file path
   * @param  {...string} strs path to join
   */
  pathJoin (...strs) {
    return path.join(...strs);
  }
  setModuleManager (manager) {
    this.moduleManager = manager;
  }
  getModuleManager () {
    return this.moduleManager;
  }
}
