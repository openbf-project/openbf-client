
let { UIPanel } = require("./ui.js");

const three = require("three");

class Renderer extends UIPanel {
  constructor () {
    super();
    //Create a threejs webgl renderer
    this.webgl = new three.WebGLRenderer();
    this.element.appendChild(this.webgl.domElement);

    //Add a panel for Heads Up Display
    this.hud = new UIPanel();
    this.hud.mount(this);
    //Absolute position it
    this.hud.absolute = true;
    this.hud.fill = "both";
    this.hud.transparent = true;

    this.webgl.setClearColor("#eeeeff");
    this.webgl.setSize(100, 100);
    this.scene = new three.Scene();
    this.camera;
    
    this.aspect = 1;
    this.needsRender = false;
    this.renderLoop = false;

    this.renderCallback = ()=>{
      if (this.needsRender && this.camera) this.render();
      if (this.renderLoop) requestAnimationFrame(this.renderCallback);
    }
  }

  /**Set current rendering camera
   * @param {import("three").Camera} camera 
   */
  setCamera (camera) {
    this.camera = camera;
  }

  /**Resize the canvas
   * @param {Integer} w 
   * @param {Integer} h 
   */
  resize (w, h) {
    this.aspect = w/h;
    this.webgl.setSize(w, h);
    if (this.camera && this.camera.aspect) {
      this.camera.aspect = this.aspect;
      this.camera.updateProjectionMatrix();
    }
  }

  render () {
    this.webgl.render(this.scene, this.camera);
    //this.needsRender = false;
  }

  start () {
    this.renderLoop = true;
    this.needsRender = true;
    requestAnimationFrame(this.renderCallback);
  }
  stop () {
    this.renderLoop = false;
    this.needsRender = false;
  }
}

module.exports = Renderer;
