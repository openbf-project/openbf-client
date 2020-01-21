
const three = require("three");
let WebGLRenderer = three.WebGLRenderer;
let Scene = three.Scene;

class Renderer {
  constructor () {
    this.webgl = new WebGLRenderer();
    this.webgl.setClearColor("#eeeeff");
    this.webgl.setSize(100, 100);
    this.scene = new Scene();
    this.camera;
    
    this.aspect = 1;
    this.needsRender = false;
    this.renderLoop = false;

    this.renderCallback = ()=>{
      if (this.needsRender && this.camera) this.render();
      if (this.renderLoop) requestAnimationFrame(this.renderCallback);
    }
  }

  mount (parent) {
    parent.appendChild(this.webgl.domElement);
  }

  setCamera (camera) {
    this.camera = camera;
  }

  resize (w, h) {
    this.aspect = w/h;
    this.webgl.setSize(w, h);
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

export default Renderer;
