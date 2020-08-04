
import { Object3D, Vector3, PerspectiveCamera } from "../../../libs/three/Three.js";
import API from "../../../api.js";
const api = API.get();

let radians = (degrees: number): number => degrees * (Math.PI / 180);
let degrees = (radians: number): number => radians * (180 / Math.PI);
export const VEC3_RIGHT = new Vector3(0, 1, 0);
export const RAD_90 = radians(90);

export class LookCamera {
  camera: PerspectiveCamera;
  pitch: Object3D;
  yaw: Object3D;
  lookDir: Vector3;
  posY: number = 0;
  sensitivity: number = 0.002;
  gpLookSensitivity: number = 10;
  lookDirRight: Vector3;
  pitchLowLimit: number = - 1.5;
  pitchHighLimit: number = 1.5;

  constructor () {
    this.camera = new PerspectiveCamera(75, api.renderer.aspect, 0.1, 1000);

    this.pitch = new Object3D();
    this.yaw = new Object3D();
    this.lookDir = new Vector3();

    this.lookDirRight = new Vector3();

    this.pitch.add(this.camera);
    this.yaw.add(this.pitch);
  }
  get position (): Vector3 {
    return this.yaw.position;
  }
  addRotationInput (deltaX: number, deltaY: number) {
    this.yaw.rotation.y -= deltaX * this.sensitivity;
    this.pitch.rotation.x -= deltaY * this.sensitivity;

    if (this.pitch.rotation.x < this.pitchLowLimit) {
      this.pitch.rotation.x = this.pitchLowLimit;
    } else if (this.pitch.rotation.x > this.pitchHighLimit) {
      this.pitch.rotation.x = this.pitchHighLimit;
    }
  }
  setRotationInput (x: number, y: number) {
    this.yaw.rotation.y = x * this.sensitivity;
    this.pitch.rotation.x = y * this.sensitivity;

    if (this.pitch.rotation.x < this.pitchLowLimit) {
      this.pitch.rotation.x = this.pitchLowLimit;
    } else if (this.pitch.rotation.x > this.pitchHighLimit) {
      this.pitch.rotation.x = this.pitchHighLimit;
    }
  }
  setFov (fov: number) {
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
  }
  mount (parent) {
    parent.add(this.yaw);
  }
  unmount () {
    this.yaw.parent.remove(this.yaw);
  }
}
