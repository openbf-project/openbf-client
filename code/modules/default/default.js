
let three = require("three");
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

  let fLoader = new GLTFLoader();
  fLoader.load(_modpath + "/gfx/demo-map.glb", (gltf)=>{
    api.renderer.scene.add(gltf.scene);
    console.log(gltf);
    let mixer = new AnimationMixer(gltf.scene);
    gltf.animations.forEach((clip)=>{
      mixer.clipAction(clip).play();
    });

    api.timeManager.listen(()=>{
      mixer.update(api.timeManager.delta);
    });
  });
}
