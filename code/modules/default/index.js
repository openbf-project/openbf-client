
const API = require("../../api.js");
const api = API.get();

const { FreeCam } = require("./freecam.js");

/**called by openbf
 * @param {string} _modpath path to this module not including last slash
 */
async function register(_modpath) {
  let menuModelFile = api.pathJoin(_modpath, "menu-model.glb");
  let menuModel = await api.loadModel(menuModelFile, false);

  menuModel.scene.position.set(0, 0, -1);

  api.getRenderer().setBackgroundColor("#12141c");
  api.getRenderer().useDefaultCamera();

  let freecam = new FreeCam();
  freecam.setFieldOfView(90);
  freecam.mount(
    api.getRenderer().getScene(),
    api.getRenderer()
  );

  api.getTimeManager().listen((delta) => {
    menuModel.scene.rotateX(0.001);
    menuModel.scene.rotateZ(-0.001);
    menuModel.scene.rotateY(0.002);

    freecam.update();
  });

  api.getRenderer().getScene().add(menuModel.scene);

  console.log(
    api.getModuleManager().listModules()
  );
}
module.exports.register = register;
