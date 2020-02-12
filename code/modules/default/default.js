
let three = require("three");
let cannon = require("cannon");

let AnimationMixer = three.AnimationMixer;
import GLTFLoader from "../../GLTFLoader.js";

import Player from "./player.js";

/**Auxiliary register function for calling API/fetching resources/setup
 * @param {import("../../api.js").default} api api object containing references to apis
 * @param {String} _modpath path to this module not including last slash
 */
export function register(api, _modpath) {
  api.world.gravity.set(0, -9.82*2, 0);
  api.renderer.webgl.setClearColor("#112233");
  let fLoader = new GLTFLoader();

  api.renderer.scene.add(
    new three.DirectionalLight(0xffffff, 1)
  );
  api.renderer.scene.add(
    new three.AmbientLight(0xffffff, 1)
  );
  api.renderer.scene.add(
    new three.PointLight(0xffffff, 1, 100)
  );
  
  let mixer;

  let localPlayer = new Player(api, _modpath, "RepComm", true);

  fLoader.load(_modpath + "/gfx/demo-map.glb", (gltf)=>{
    gltf.scene.traverse((child)=>{
      if (child.userData.collision) {
        let collision = JSON.parse(child.userData.collision);
        let shape;
        switch (collision.shape.type) {
          case "mesh":
            if (collision.trimesh) {
              shape = new cannon.Trimesh(
                child.geometry.attributes.position.array,
                child.geometry.index.array
              );
            } else {
              let pos = child.geometry.attributes.position;
              let cannonPos = new Array(pos.count);
              let vi = 0;
              for (let i=0; i<pos.array.length; i+=3) {
                cannonPos[vi] = new cannon.Vec3(
                  pos.array[i],
                  pos.array[i+1],
                  pos.array[i+2]
                );
                vi++;
              }
              
              let index = child.geometry.index;
              let cannonInd = new Array();
              for (let i=0; i<index.count; i+=3) {
                cannonInd.push([
                  index.array[i],
                  index.array[i+1],
                  index.array[i+2]
                ]);
              }

              shape = new cannon.ConvexPolyhedron(
                cannonPos,
                cannonInd
              );
            }
            break;
          case "sphere":
            shape = new cannon.Sphere(
              collision.shape.radius||1
            )
            break;
          default:
            throw "Shape not supported " + child.userData.collision.type;
        }
        let body = new cannon.Body({
          mass:collision.mass||0
        });
        body.position.copy(child.position);
        body.quaternion.copy(child.quaternion);
        body.real = child;
        body.addShape(shape);
        api.world.addBody(body);
      }
      if (child.userData.hide) {
        child.visible = false;
      }
    });
    api.renderer.scene.add(gltf.scene);

    mixer = new AnimationMixer(gltf.scene);
    gltf.animations.forEach((clip)=>{
      mixer.clipAction(clip).play();
    });

    localPlayer.teleport(0, 5, 0);

  });

  localPlayer.teleport(0, 2, 0);
  console.log(localPlayer);
  localPlayer.mount(api.renderer.scene, api.renderer);

  api.timeManager.listen(()=>{
    localPlayer.update();
    if (mixer) mixer.update(api.timeManager.delta);
  });
}
