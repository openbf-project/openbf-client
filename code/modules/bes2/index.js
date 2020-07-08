
const path = require("path");
const API = require("../../api.js");
const api = API.get();
const World = require("../../world/world.js");

let three = require("three");
let { FreeCam } = require("../default/freecam.js");

/**called by openbf
 * @param {string} _modpath path to this module not including last slash
 */
async function register(_modpath) {
  let worldDir = path.join(_modpath, "map");
  let worldFile = path.join(worldDir, "bes2.json");
  
  api.setWorld(await World.load(worldFile, worldDir));

  let lightSun = new three.DirectionalLight(0xffffff, 1.5);
  api.getRenderer().getScene().add(lightSun);
  let lightAmb = new three.AmbientLight(0xffffff, 1.5);
  api.getRenderer().getScene().add(lightAmb);

  api.getWorld().getPhysics().gravity.set(0, -9.82 * 2, 0);

  if (api.getHeadless()) return;
  api.getRenderer().setBackgroundColor("#12141c");

  let freecam = new FreeCam();
  freecam.setFieldOfView(90);
  freecam.mount(
    api.getRenderer().getScene(),
    api.getRenderer()
  );

  freecam.setPosition(132, -32, -143);

  let skyDome = await api.loadModel(
    path.join(worldDir, "models", "bes2_sky_dome.glb")
  );
  skyDome.scene.scale.set(120, 120, 120);
  api.getWorld().addModel("bes2_sky_dome", skyDome.scene);
  api.getWorld().getVisual().add(skyDome.scene);

  // let bespinFog = new three.Fog(0xadadad, 10, 100);
  // api.getRenderer().getScene().fog = bespinFog;
  
  api.getTimeManager().listen((delta)=>{
    freecam.update();
    skyDome.scene.position.copy(freecam.yaw.position);
  });

}

module.exports = { register };
