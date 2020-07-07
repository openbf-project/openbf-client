
const Component = require("./component.js");
const three = require("three");
let PerspectiveCamera = three.PerspectiveCamera;

module.exports = class Renderer extends Component {
  constructor() {
    super();
    //Create a threejs webgl renderer
    this.webgl = new three.WebGLRenderer();
    this.useNative(this.webgl.domElement);

    this.webgl.setClearColor("#eeeeff");
    this.webgl.setSize(100, 100);
    this.scene = new three.Scene();
    this.camera;

    this.aspect = 1;
    this.needsRender = false;
    this.renderLoop = false;

    this.defaultCamera = new PerspectiveCamera(
      75,
      this.aspect,
      0.1,
      1000
    );

    this.renderCallback = () => {
      if (this.needsRender && this.camera) this.render();
      if (this.renderLoop) requestAnimationFrame(this.renderCallback);
    }
  }
  /**Set the renderer clear color
   * @param {number|string} c
   */
  setBackgroundColor (c) {
    this.webgl.setClearColor(c);
  }
  getAspect () {
    return this.aspect;
  }
  setScene (scene) {
    this.scene = scene;
  }
  /**Get the scene
   */
  getScene () {
    return this.scene;
  }
  /**Set current rendering camera
   * @param {import("three").Camera} camera 
   */
  setCamera(camera) {
    this.camera = camera;
  }
  getCamera () {
    return this.camera;
  }
  getDefaultCamera () {
    return this.defaultCamera;
  }
  useDefaultCamera () {
    this.setCamera(this.getDefaultCamera());
  }
  /**Resize the canvas
   * @param {Integer} w 
   * @param {Integer} h 
   */
  resize(w, h) {
    this.aspect = w / h;
    this.webgl.setSize(w, h);
    if (this.camera && this.camera.aspect) {
      this.camera.aspect = this.aspect;
      this.camera.updateProjectionMatrix();
    }
  }

  render() {
    this.webgl.render(this.scene, this.camera);
    //this.needsRender = false;
  }

  start() {
    this.renderLoop = true;
    this.needsRender = true;
    requestAnimationFrame(this.renderCallback);
  }
  stop() {
    this.renderLoop = false;
    this.needsRender = false;
  }
}
