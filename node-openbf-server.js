
let TimeManager = require("./code/time.js");
let API = require("./code/api.js");
let { EntityManager } = require("./code/entity.js");

//let net = require("net");
let three = require("three");
let udp = require("dgram");
let path = require("path");
let cannon = require("cannon");
let fs = require("fs");

let physics = new cannon.World();
physics.gravity.set(0, -9.82, 0);

let timeManager = new TimeManager();
timeManager.start();

let entityManager = new EntityManager();

const api = new API(
  cannon,
  physics,
  {scene:new three.Scene()},
  timeManager,
  undefined,
  entityManager,
  undefined
);
api.headless = true;

let _modspath = "./code/modules";
let _modpath;
let importModules = (cb) => {
  let result = new Array();
  let json = JSON.parse(
    fs.readFileSync(_modspath + "/package.json").toString()
  );

  let names = Object.keys(json.active);
  let def;
  for (let modName of names) {
    def = json.active[modName];
    if (def.file) {
      let mod = require("./code/modules/" + def.file);
      if (mod.register) {
        let t = def.file.split(path.sep); //Path to array
        t.pop(); //Remove file
        t.join(path.sep); //Join path again
        _modpath = _modspath + "/" + t;
        mod.register(api, _modpath);
        cb(modName, mod);
      }
    } else {
      console.log(modName, "module not loaded, no file attribute.");
    }
  }
}

let loadedModules = new Map();

importModules((name, mod) => {
  console.log(`Module active:${name}`);
  loadedModules.set(name, mod);
});

let udpPort = 10209;
let udpServer = udp.createSocket("udp4");
udpServer.on("error", (error) => {
  console.error("[UDP Server] " + error);
  server.close();
});
udpServer.on("message", (buffer, info) => {
  console.log("[UDP Server] Msg: " + buffer.toString());
  udpServer.send(buffer, info.port, 'localhost', (error) => {
    if (error) {
      console.log("[UDP Server] " + error);
    } else {
      console.log("[UDP Server] Echoed");
    }
  });
});
udpServer.on('listening', () => {
  let adr = udpServer.address();
  console.log(`[UDP Server] Listening @ ${adr.address}:${adr.port}`);
});
udpServer.on('close', () => {
  console.log("Closed udpServer");
});
udpServer.bind(udpPort);
