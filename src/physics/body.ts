
import { Object3D } from "../libs/three/Three.js";

/**A helper class because working with Ammo is UGH*/
export class Body {
  nativeBody: any;
  nativeObject3D: Object3D;

  constructor () {

  }
  canUpdateFromNative (): boolean {
    return (
      this.nativeBody != undefined &&
      this.nativeBody != null &&
      this.nativeObject3D != undefined &&
      this.nativeObject3D != null
    );
  }
  getNativeObject3D (): Object3D {
    return this.nativeObject3D;
  }
  setNativeObject3D(obj: Object3D): Body {
    this.nativeObject3D = obj;
    return this;
  }
  getNativeBody (): any {
    return this.nativeBody;
  }
  setNativeBody (body: any): Body {
    this.nativeBody = body;
    return this;
  }
  _getMotionState (): any {
    return this.getNativeBody().getMotionState();
  }
  _getWorldTransform (out): any {
    return this._getMotionState().getWorldTransform(out);
  }
  get x (): number {
    return this.nativeObject3D.position.x;
  }
  get y (): number {
    return this.nativeObject3D.position.y;
  }
  get z (): number {
    return this.nativeObject3D.position.z;
  }
  stringifyPosition (): string {
    return `${this.x.toFixed(2)}, ${this.y.toFixed(2)}, ${this.z.toFixed(2)}`;
  }
  updateFromNative (outTransform): Body {
    this._getWorldTransform(outTransform);
    this.nativeObject3D.position.set(
      outTransform.getOrigin().x(),
      outTransform.getOrigin().y(),
      outTransform.getOrigin().z()
    );
    return this;
  }
}
