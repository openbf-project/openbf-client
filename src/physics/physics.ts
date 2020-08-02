
import { Object3D } from "../libs/three/Three.js";

/**A helper class because working with Ammo is UGH*/
export class Body {
  nativeTransform: Ammo.btTransform;
  nativeBody: Ammo.btRigidBody;
  nativeObject3D: Object3D;

  constructor() {
    this.nativeTransform = new Ammo.btTransform();
  }
  canUpdateFromNative(): boolean {
    return (
      this.nativeBody != undefined &&
      this.nativeBody != null &&
      this.nativeObject3D != undefined &&
      this.nativeObject3D != null
    );
  }
  getNativeObject3D(): Object3D {
    return this.nativeObject3D;
  }
  setNativeObject3D(obj: Object3D): Body {
    this.nativeObject3D = obj;
    return this;
  }
  hasNativeObject3D (): boolean {
    return this.nativeObject3D != undefined && this.nativeObject3D != null;
  }
  getNativeBody(): Ammo.btRigidBody {
    return this.nativeBody;
  }
  setNativeBody(body: any): Body {
    this.nativeBody = body;
    return this;
  }
  hasNativeBody (): boolean {
    return this.nativeBody != undefined && this.nativeBody != null;
  }
  _getMotionState(): Ammo.btMotionState {
    return this.getNativeBody().getMotionState();
  }
  _getWorldTransform(out: Ammo.btTransform) {
    return this._getMotionState().getWorldTransform(out);
  }
  get x(): number {
    return this.nativeObject3D.position.x;
  }
  get y(): number {
    return this.nativeObject3D.position.y;
  }
  get z(): number {
    return this.nativeObject3D.position.z;
  }
  setPosition (x: number, y: number, z: number): Body {
    //TODO - implement
    return this;
  }
  stringifyPosition(): string {
    return `${this.x.toFixed(2)}, ${this.y.toFixed(2)}, ${this.z.toFixed(2)}`;
  }
  updateFromNative(outTransform: Ammo.btTransform): Body {
    this._getWorldTransform(outTransform);
    this.nativeObject3D.position.set(
      outTransform.getOrigin().x(),
      outTransform.getOrigin().y(),
      outTransform.getOrigin().z()
    );
    return this;
  }
}

export interface CreateBodyOptions {
  shape: Ammo.btCollisionShape;
  mass: number;
  x?: number;
  y?: number;
  z?: number;
}

//Just a hack to get ts to ignore ammo's weird loading behaviour.
interface AmmoPromise {
  (): Promise<any>;
}

export class PhysicsManager {
  static SINGLETON: PhysicsManager = undefined;
  /**
   * Warning, PhysicsManager.init must have been called once before using instance methods
   * 
   * This should have been handled by openbf-ts index.ts already, which does this
   * before modules are loaded by default
   */
  static get (): PhysicsManager {
    if (!PhysicsManager.SINGLETON) PhysicsManager.SINGLETON = new PhysicsManager();
    return PhysicsManager.SINGLETON;
  }
  bodies: Set<Body>;
  ammoIsReady: boolean = false;
  ammoColConfig: Ammo.btDefaultCollisionConfiguration;
  ammoDispatcher: Ammo.btCollisionDispatcher;
  ammoPairCache: Ammo.btDbvtBroadphase;
  ammoSolver: Ammo.btSequentialImpulseConstraintSolver;
  ammoWorld: Ammo.btDiscreteDynamicsWorld;
  ammoTempBodyTransform: Ammo.btTransform;
  constructor() {
    if (PhysicsManager.SINGLETON) throw "Cannot instance physics manager twice!";
    this.bodies = new Set();
  }
  init(): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      //Hack to get ts to ignore that Ammo is a namespace in ammo.d.ts, but returns a promise in reality
      let tAmmo: AmmoPromise = Ammo as any;
      await tAmmo();

      this.ammoColConfig = new Ammo.btDefaultCollisionConfiguration();
      this.ammoDispatcher = new Ammo.btCollisionDispatcher(this.ammoColConfig);
      this.ammoPairCache = new Ammo.btDbvtBroadphase();
      this.ammoSolver = new Ammo.btSequentialImpulseConstraintSolver();
      this.ammoWorld = new Ammo.btDiscreteDynamicsWorld(
        this.ammoDispatcher,
        this.ammoPairCache,
        this.ammoSolver,
        this.ammoColConfig
      );

      //Container for grabbing data from ammo and rendering it, recycling
      this.ammoTempBodyTransform = new Ammo.btTransform();

      this.ammoIsReady = true;
      resolve(this.ammoIsReady);
    });
  }
  makeBody(options: CreateBodyOptions): Body {
    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(
      options.x||0, options.y||0, options.z||0
    ));
    let inertia = new Ammo.btVector3(0, 0, 0);

    //If dynamic
    if (options.mass > 0) options.shape.calculateLocalInertia(options.mass, inertia);

    let state = new Ammo.btDefaultMotionState(transform);
    let rbInfo = new Ammo.btRigidBodyConstructionInfo(
      options.mass,
      state,
      options.shape,
      inertia
    );
    let nativeBody = new Ammo.btRigidBody(rbInfo);

    let result = new Body().setNativeBody(nativeBody);
    return result;
  }
  setGravity(x: number, y: number, z: number) {
    this.ammoWorld.setGravity(new Ammo.btVector3(0, -10, 0));
  }
  step(delta: number) {
    this.ammoWorld.stepSimulation(delta, 10);

    for (let body of this.bodies) {
      if (body.canUpdateFromNative()) body.updateFromNative(this.ammoTempBodyTransform);
    }
  }
  hasBody(body: Body): boolean {
    return this.bodies.has(body);
  }
  addBody(body: Body): PhysicsManager {
    if (this.hasBody(body)) throw "Cannot add body twice!";
    this.bodies.add(body);
    this.ammoWorld.addRigidBody(body.getNativeBody());
    return this;
  }
  removeBody (body: Body): PhysicsManager {
    if (!this.hasBody(body)) throw "Cannot remove body if it was not added / already removed";
    if (body.hasNativeBody()) {
      console.warn("No native rigidbody for Body");
      this.ammoWorld.removeRigidBody(body.getNativeBody());
    }
    return this;
  }
}
