
const path = require("path");
const API = require("../../api.js");
const api = API.get();
const World = require("../../world/world.js");

let three = require("three");
let FreeCam = require("../default/freecam.js");

/**called by openbf
 * @param {string} _modpath path to this module not including last slash
 */
async function register(_modpath) {
  let worldDir = path.join(_modpath, "map");
  let worldFile = path.join(worldDir, "bes2.json");

  api.setWorld(await World.load(worldFile, worldDir));

  let lightSun = new three.DirectionalLight(0xffffff, 2);
  api.getRenderer().getScene().add(lightSun);
  let lightAmb = new three.AmbientLight(0xffffff, 1);
  api.getRenderer().getScene().add(lightAmb);

  api.getWorld().getPhysics().gravity.set(0, -9.82 * 2, 0);

  if (api.getHeadless()) return;
  api.getRenderer().webgl.setClearColor("#010106");

  let freecam = new FreeCam();
  freecam.mount(
    api.getRenderer().getScene(),
    api.getRenderer()
  );

  api.getTimeManager().listen((delta)=>{
    freecam.update();
  });

  // api.getRenderer().setCamera(
  //   new PerspectiveCamera(75, api.getRenderer().getAspect(), 0.1, 500)
  // );
  
  // api.getRenderer().getCamera().position.set(180, 0, 0);

  // console.log(api.getRenderer(), lightSun, lightAmb);


  //let localPlayer = new Player(api, _modpath, "Player 1", true);
  
  //New version
  //api.getWorld().addEntity(localPlayer);

  // let gltfLoader = new GLTFLoader(undefined, api.headless);
  // fs.readFile(_modpath + "/zombie-demo-map.glb", (ex0, data) => {
  //   if (ex0) {
  //     console.log("File System Error", ex0);
  //     return;
  //   }
  //   let lights = new Array();
  //   gltfLoader.parse(data.buffer, _modpath + "/zombie-demo-map.glb", (gltf) => {
  //     gltf.scene.traverse((child) => {
  //       if (child.type === "SpotLight") {
  //         lights.push(child);
  //       }
  //       if (child.userData["openbf-data"]) {
  //         let data = child.userData["openbf-data"];
  //         if (typeof (data) !== "object") {
  //           if (typeof (data) === "string") {
  //             try {
  //               data = JSON.parse(data);
  //             } catch (ex) {
  //               console.error("JSON.parse of malformed openbf-data string, this can occure when openbf-data custom property is edited in blender. Please run 'Revalidate' in OpenBF tab of Blender Object Properties");
  //               throw ex;
  //             }
  //           } else {
  //             console.error("openbf-data", data, "needs to be either json or serialized json string. You can try the 'Revalidate' operator in blender object properties OpenBF tab");
  //             throw "openbf-data is not object or string, unsupported type:" + typeof (data);
  //           }
  //         }
  //         switch (data.collision.shape) {
  //           case "MESH":
  //             shape = new cannon.Trimesh(
  //               child.geometry.attributes.position.array,
  //               child.geometry.index.array
  //             );
  //             break;
  //           case "CONVEX_HULL":
  //             let pos = child.geometry.attributes.position;
  //             let cannonPos = new Array(pos.count);
  //             let vi = 0;
  //             for (let i = 0; i < pos.array.length; i += 3) {
  //               cannonPos[vi] = new cannon.Vec3(
  //                 pos.array[i],
  //                 pos.array[i + 1],
  //                 pos.array[i + 2]
  //               );
  //               vi++;
  //             }
  //             let index = child.geometry.index;
  //             let cannonInd = new Array();
  //             for (let i = 0; i < index.count; i += 3) {
  //               cannonInd.push([
  //                 index.array[i],
  //                 index.array[i + 1],
  //                 index.array[i + 2]
  //               ]);
  //             }
  //             shape = new cannon.ConvexPolyhedron(
  //               cannonPos,
  //               cannonInd
  //             );
  //             break;
  //           case "SPHERE":
  //             shape = new cannon.Sphere(
  //               data.collision.shape.radius || 1
  //             )
  //             break;
  //           default:
  //             throw "Shape not supported " + data.collision.shape;
  //         }
  //         let body = new cannon.Body({
  //           mass: data.collision.mass || 0
  //         });
  //         body.position.copy(child.position);
  //         body.quaternion.copy(child.quaternion);
  //         body.real = child;
  //         body.addShape(shape);
  //         api.world.addBody(body);
  //       }
  //     });
  //     api.renderer.scene.add(gltf.scene);
  //     if (!api.headless) {
  //       mixer = new AnimationMixer(gltf.scene);
  //       gltf.animations.forEach((clip) => {
  //         mixer.clipAction(clip).play();
  //       });
  //       setTimeout(() => {
  //         localPlayer.teleport(0, 1, 0);
  //       }, 1000);
  //     }
  //   }, (ex1) => {
  //     console.log("Formatting Error", ex1);
  //   });
  // });

}

module.exports = { register };
