
/**Pre-alpha zombie-demo!
 * This is the module responsible for the pre-alpha zombie-demo
 * 
 * The code here is documented in case you're interested in how it works
 * Due to how early of a version we're in, APIs may not be current with todays
 * Please look them up if you're going to use them:
 * https://github.com/node-openbf-project/node-openbf-client/wiki
 */

//The default 'player' module
let Player = require("../swbf/player.js");

//File system access
let fs = require("fs");

//Blender glTF model loader
let GLTFLoader = require("../../GLTFLoader.js");

//Some GUI modules
let { UILabel, UIButton } = require("../../ui.js");

let three = require("three");
let AnimationMixer = three.AnimationMixer;
let cannon = require("cannon");

/**Register - called when the engine is ready for this mod to load
 * @param {import("../../api.js")} api api object containing references to apis
 * @param {String} _modpath path to this module not including last slash
 */
function register(api, _modpath) {
  //====Game setup

  //====Physics configurations
  api.world.gravity.set(0, -9.82 * 2, 0);
  let mixer;

  //Execute code if we can run client code (UI, rendering, importing textures.. etc)
  if (!api.headless) {
    api.renderer.webgl.setClearColor("#010106");

    api.renderer.scene.add(
      new three.DirectionalLight(0xffffff, 1)
    );
    api.renderer.scene.add(
      new three.AmbientLight(0xffffff, 0.07)
    );
    new UILabel("Enter your name:").mount(api.renderer.hud);

    new UILabel("Server Address:").mount(api.renderer.hud);

    new UIButton("Connect").onclick(() => {
      let udp = require("dgram");
      let client = udp.createSocket("udp4");

      client.on("message", (data) => {
        console.log("[Client] Got", data.toString(), data.length, "bytes");
      })
      client.on("connect", () => {
        console.log("[Client] Connected");
        console.log(localPlayer.entity);
        client.send(Buffer.from(localPlayer.entity.getData()));
      });
      client.on("error", (ex) => {
        console.error("[Client]", ex);
      });
      client.on("close", () => {
        console.log("[Client] Closed");
      });
      client.connect(10209);
    }).mount(api.renderer.hud);

    let localPlayer = new Player(api, _modpath, "Player 1", true);
    localPlayer.mount(api.renderer.scene, api.renderer);
    console.log(localPlayer);
    api.timeManager.listen(() => {
      localPlayer.onUpdate();
    });

    let gltfLoader = new GLTFLoader(undefined, api.headless);
    fs.readFile(_modpath + "/zombie-demo-map.glb", (ex0, data) => {
      if (ex0) {
        console.log("File System Error", ex0);
        return;
      }
      let lights = new Array();
      gltfLoader.parse(data.buffer, _modpath + "/zombie-demo-map.glb", (gltf) => {
        gltf.scene.traverse((child) => {
          if (child.type === "SpotLight") {
            lights.push(child);
          }
          if (child.userData["openbf-data"]) {
            let data = JSON.parse(child.userData["openbf-data"]);
            console.log(data);
            switch (data.collision.shape) {
              case "MESH":
                shape = new cannon.Trimesh(
                  child.geometry.attributes.position.array,
                  child.geometry.index.array
                );
                break;
              case "CONVEX_HULL":
                let pos = child.geometry.attributes.position;
                let cannonPos = new Array(pos.count);
                let vi = 0;
                for (let i = 0; i < pos.array.length; i += 3) {
                  cannonPos[vi] = new cannon.Vec3(
                    pos.array[i],
                    pos.array[i + 1],
                    pos.array[i + 2]
                  );
                  vi++;
                }
                let index = child.geometry.index;
                let cannonInd = new Array();
                for (let i = 0; i < index.count; i += 3) {
                  cannonInd.push([
                    index.array[i],
                    index.array[i + 1],
                    index.array[i + 2]
                  ]);
                }
                shape = new cannon.ConvexPolyhedron(
                  cannonPos,
                  cannonInd
                );
                break;
              case "SPHERE":
                shape = new cannon.Sphere(
                  data.collision.shape.radius || 1
                )
                break;
              default:
                throw "Shape not supported " + data.collision.shape;
            }
            let body = new cannon.Body({
              mass: data.collision.mass || 0
            });
            body.position.copy(child.position);
            body.quaternion.copy(child.quaternion);
            body.real = child;
            body.addShape(shape);
            api.world.addBody(body);
          }
        });
        api.renderer.scene.add(gltf.scene);
        if (!api.headless) {
          mixer = new AnimationMixer(gltf.scene);
          gltf.animations.forEach((clip) => {
            mixer.clipAction(clip).play();
          });
          setTimeout(() => {
            localPlayer.teleport(0, 1, 0);
          }, 1000);
        }
      }, (ex1) => {
        console.log("Formatting Error", ex1);
      });
    });
  }

}

module.exports = { register };
