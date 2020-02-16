
/**Pre-alpha zombie-demo!
 * This is the module responsible for the pre-alpha zombie-demo
 * 
 * The code here is documented in case you're interested in how it works
 * Due to how early of a version we're in, APIs may not be current with todays
 * Please look them up if you're going to use them:
 * https://github.com/node-openbf-project/node-openbf-client/wiki
 */

//The default 'player' module
let Player = require("../default/player.js");

//Some GUI modules
let {UILabel, UIButton} = require("../../ui.js");

/**Register - called when the engine is ready for this mod to load
 * @param {import("../../api.js")} api api object containing references to apis
 * @param {String} _modpath path to this module not including last slash
 */
function register (api, _modpath) {
  //====Game setup

  //====Physics configurations
  api.world.gravity.set(0, -9.82 * 2, 0);

  //Execute code if we can run client code (UI, rendering, importing textures.. etc)
  if (!api.headless) {
    new UILabel("Enter your name:").mount(api.renderer.hud);
    
    new UILabel("Server Address:").mount(api.renderer.hud);

    new UIButton("Connect").onclick(() => {
      let udp = require("dgram");
      let client = udp.createSocket("udp4");
      
      client.on("message", (data)=>{
        console.log("[Client] Got", data.toString(), data.length, "bytes");
      })
      client.on("connect", ()=>{
        console.log("[Client] Connected");
        console.log(localPlayer.entity);
        client.send(Buffer.from(localPlayer.entity.getData()));
      });
      client.on("error", (ex)=>{
        console.error("[Client]", ex);
      });
      client.on("close", ()=>{
        console.log("[Client] Closed");
      });
      client.connect(10209);
    }).mount(api.renderer.hud);

    let localPlayer = new Player(api, _modpath, "Player 1", true);
    localPlayer.mount(api.renderer.scene, api.renderer);
  }
  
}

module.exports = { register };
