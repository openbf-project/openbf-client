
import Component from "./component.js";
import {
  Camera,
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  Object3D,
  BoxGeometry,
  MeshBasicMaterial,
  Mesh
} from "../libs/three/Three.js";

import { Body } from "../physics/body.js";

//EW, KILL IT
var tAmmoPromise: ()=>Promise<any> = window["Ammo"];

//I hate this
declare interface AmmoInterface {
  btDefaultCollisionConfiguration;
  btCollisionDispatcher;
  btDbvtBroadphase;
  btSequentialImpulseConstraintSolver;
  btDiscreteDynamicsWorld;
  btVector3;
  btBoxShape;
  btTransform;
  btDefaultMotionState;
  btRigidBodyConstructionInfo;
  btRigidBody;
  btSphereShape;
}

declare const Ammo: AmmoInterface;

export default class Renderer extends Component {
  webgl: WebGLRenderer;
  scene: Scene;
  camera: Camera;
  aspect: number = 1;
  needsRender: boolean = false;
  renderLoop: boolean = false;
  defaultCamera: Camera;
  renderCallback: FrameRequestCallback;

  bodies: Set<Body>;

  ammoIsReady: boolean = false;
  ammoColConfig:any;
  ammoDispatcher:any;
  ammoPairCache:any;
  ammoSolver:any;
  ammoWorld:any;
  ammoTempBodyTransform: any;

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

    this.bodies = new Set();

    //Set up ammo, DISGUSTING.
    tAmmoPromise().then((mod)=> {
      // this.ammoIsReady = false;
      this.ammoColConfig = new Ammo.btDefaultCollisionConfiguration();
      this.ammoDispatcher = new Ammo.btCollisionDispatcher(this.ammoColConfig);
      this.ammoPairCache = new Ammo.btDbvtBroadphase();
      this.ammoSolver = new Ammo.btSequentialImpulseConstraintSolver(),
      this.ammoWorld = new Ammo.btDiscreteDynamicsWorld(
        this.ammoDispatcher,
        this.ammoPairCache,
        this.ammoSolver,
        this.ammoColConfig
      );
      this.ammoWorld.setGravity(new Ammo.btVector3(0, -10, 0));

      //Container for grabbing data from ammo and rendering it, recycling
      this.ammoTempBodyTransform = new Ammo.btTransform();

      this.ammoIsReady = true;

      //Test ammo
      //Add ground body
      let groundShape = new Ammo.btBoxShape(new Ammo.btVector3(10, 10, 10));
      let groundTransform = new Ammo.btTransform();
      groundTransform.setIdentity();
      groundTransform.setOrigin(new Ammo.btVector3(0, -10, 0));
      let groundInertia  = new Ammo.btVector3(0, 0, 0);
      let groundState = new Ammo.btDefaultMotionState(groundTransform);
      let groundInfo = new Ammo.btRigidBodyConstructionInfo(0, groundState, groundShape, groundInertia);
      let groundBody = new Ammo.btRigidBody(groundInfo);

      let body = new Body()
        .setNativeBody(groundBody)
        .setNativeObject3D(
          new Mesh(
            new BoxGeometry( 10, 20, 10 ),
            new MeshBasicMaterial( {color: 0x00ffff} )
          )
        );
      this.addBody(body);

      //Add player body
      let playerShape = new Ammo.btBoxShape(new Ammo.btVector3(1, 1, 1));
      // let playerShape = new Ammo.btSphereShape(2);
      let playerTransform = new Ammo.btTransform();

      playerTransform.setIdentity();
      
      let playerMass = 1;
      let dynamic = true;
      let playerInertia = new Ammo.btVector3(0, 0, 0);

      if (dynamic) playerShape.calculateLocalInertia(playerMass, playerInertia);

      playerTransform.setOrigin(new Ammo.btVector3(0, 10, 0));

      let playerState = new Ammo.btDefaultMotionState(playerTransform);
      let playerInfo = new Ammo.btRigidBodyConstructionInfo(
        playerMass,
        playerState, 
        playerShape,
        playerInertia
      );
      let playerBody = new Ammo.btRigidBody(playerInfo);

      body = new Body()
        .setNativeBody(playerBody)
        .setNativeObject3D(
          new Mesh(
            new BoxGeometry( 1, 1, 1 ),
            new MeshBasicMaterial( {color: 0xff00ff} )
          )
        );
      this.addBody(body);
    });
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
    if (this.ammoIsReady) {
      //TODO - add delta here
      this.ammoWorld.stepSimulation(1/60, 10);

      for (let body of this.bodies) {
        if (body.canUpdateFromNative()) body.updateFromNative(this.ammoTempBodyTransform);
      }
    }
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
  hasBody (body: Body): boolean {
    return this.bodies.has(body);
  }
  addBody (body: Body): Renderer {
    if (this.hasBody(body)) throw "Cannot add body twice!";
    this.bodies.add(body);
    this.scene.add(body.getNativeObject3D());
    this.ammoWorld.addRigidBody(body.getNativeBody());
    return this;
  }
}