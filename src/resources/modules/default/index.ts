
import API from "../../../api.js";
import { Mesh, BoxGeometry, MeshBasicMaterial } from "../../../libs/three/Three.js";
import { GameInput } from "../../../input/gameinput.js";

let api = API.get();

let physics = api.getPhysicsManager();
let renderer = api.getRenderer();
let input = GameInput.get();

let visual = new Mesh(
  new BoxGeometry(2, 2, 2),
  new MeshBasicMaterial({ color: 0x55ffff })
);
let body = physics.makeBody({
  mass: 1,
  shape: new Ammo.btBoxShape(new Ammo.btVector3(1, 1, 1))
}).setNativeObject3D(visual);
renderer.getScene().add(body.getNativeObject3D());
physics.addBody(body);

let groundVisual = new Mesh(
  new BoxGeometry(2, 2, 2),
  new MeshBasicMaterial({ color: 0x55ffff })
);
let groundBody = physics.makeBody({
  mass: 0,
  shape: new Ammo.btBoxShape(new Ammo.btVector3(1, 1, 1)),
  x:0,
  y:-1,
  z:0
}).setNativeObject3D(groundVisual);

renderer.getScene().add(groundBody.getNativeObject3D());
physics.addBody(groundBody);

api.renderer.camera.position.set(0, 0, 40);

api.getTimeManager().listen((delta) => {
  if (input.getButton("forward")) {
    api.renderer.camera.position.z -= 0.5;
  } else if (input.getButton("backward")) {
    api.renderer.camera.position.z += 0.5;
  }
  if (input.getButton("left")) {
    api.renderer.camera.position.x -= 0.5;
  } else if (input.getButton("right")) {
    api.renderer.camera.position.x += 0.5;
  }
});
