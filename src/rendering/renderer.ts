
import Component from "./component.js";
import { Camera, WebGLRenderer, Scene, PerspectiveCamera } from "../libs/three/Three.js";

export default class Renderer extends Component {
  webgl: WebGLRenderer;
  scene: Scene;
  camera: Camera;
  aspect: number = 1;
  needsRender: boolean = false;
  renderLoop: boolean = false;
  defaultCamera: Camera;
  renderCallback: FrameRequestCallback;

  constructor() {
    super();
    this.webgl = new WebGLRenderer();
    this.useNative(this.webgl.domElement);

    this.webgl.setClearColor("#eeeeff");
    this.webgl.setSize(100, 100);
    this.scene = new Scene();

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
  setBackgroundColor (c) {
    this.webgl.setClearColor(c);
  }
  getAspect (): number {
    return this.aspect;
  }
  setScene (scene: Scene) {
    this.scene = scene;
  }
  getScene (): Scene {
    return this.scene;
  }
  setCamera(camera: Camera) {
    this.camera = camera;
  }
  getCamera (): Camera {
    return this.camera;
  }
  getDefaultCamera (): Camera {
    return this.defaultCamera;
  }
  useDefaultCamera () {
    this.setCamera(this.getDefaultCamera());
  }
  resize(w: number, h: number) {
    this.aspect = w / h;
    this.webgl.setSize(w, h, true);
    if (this.camera && this.camera instanceof PerspectiveCamera) {
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