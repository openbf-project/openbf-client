
let three = require("three");
let cannon = require("cannon");

let AnimationMixer = three.AnimationMixer;
import GLTFLoader from "../../GLTFLoader.js";

/**Auxiliary register function for calling API/fetching resources/setup
 * @param {import("../../api.js").default} api api object containing references to apis
 * @param {String} _modpath path to this module not including last slash
 */
export function register(api, _modpath) {
  api.renderer.scene.add(
    new three.DirectionalLight(0xffffff, 1)
  );
  api.renderer.scene.add(
    new three.AmbientLight(0xffffff, 1)
  );
  api.renderer.scene.add(
    new three.PointLight(0xffffff, 1, 100)
  );
  
  let updateBodies = new Array();
  let fLoader = new GLTFLoader();
  fLoader.load(_modpath + "/gfx/demo-map.glb", (gltf)=>{
    gltf.scene.traverse((child)=>{
      if (child.userData.collision) {
        let collision = JSON.parse(child.userData.collision);
        let shape;
        switch (collision.shape.type) {
          case "mesh":
            shape = new cannon.Trimesh(
              child.geometry.attributes.position.array,
              child.geometry.index.array
            );
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

        if (collision.mass && collision.mass !== 0) {
          updateBodies.push(body);
        }
      }
      if (child.userData.hide) {
        child.visible = false;
      }
    });
    api.renderer.scene.add(gltf.scene);

    let mixer = new AnimationMixer(gltf.scene);
    gltf.animations.forEach((clip)=>{
      mixer.clipAction(clip).play();
    });

    api.timeManager.listen(()=>{
      for (let body of updateBodies) {
        body.real.position.copy(body.position);
        body.real.quaternion.copy(body.quaternion);
      }
      mixer.update(api.timeManager.delta);
    });
  });
}
