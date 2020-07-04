
let fs = require("fs");
let GLTFLoader = require("./GLTFLoader.js");

/**@typedef {import("./ui/renderer.js")} Renderer*/
/**@typedef {import("cannon")} PhysicsEngine*/
/**@typedef {import("./state.js").StateManager} StateManager*/
/**@typedef {import("./ui/ui.js").UIManager} UI*/
/**@typedef {import("./time.js")} TimeManager*/
/**@typedef {import("./world/world.js")} World*/

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
  }
  /**Set the time manager
   * @param {TimeManager} tm 
   */
  setTimeManager (tm) {
    this.timeManager = tm;
  }
  /**Get the time manager
   * @returns {TimeManager}
   */
  getTimeManager () {
    return this.timeManager;
  }
  /**Get the gltfloader
   * @returns {GLTFLoader}
   */
  getGLTFLoader() {
    if (!this.gltfLoader) this.gltfLoader = new GLTFLoader(undefined, this.getHeadless());
    return this.gltfLoader;
  }
  setStateManager (sm) {
    this.stateManager = sm;
  }
  getStateManager () {
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
  hasWorld () {
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
  readBufferFile (url) {
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
  readArrayBufferFile (url) {
    return new Promise((resolve, reject) => {
      try {
        let result = fs.readFileSync(url).buffer;
        resolve(result);
      } catch (ex) {
        reject(ex);
      }
    });
  }
  /**Currently supports only GLTF and GLB files
   * @param {string} fname model file to load
   * @returns {Promise<model>}
   */
  loadModel(fname) {
    return new Promise((resolve, reject) => {
      try {
        this.getGLTFLoader().load(fname, resolve, undefined, reject);
        //let ab = this.readArrayBufferFile(fname);
        //this.getGLTFLoader().parse(ab, fname, resolve, reject);
      } catch (ex) {
        reject(ex);
      }
    });
  }
}

