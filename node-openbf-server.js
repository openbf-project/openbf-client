import Input from "./code/input/input.js";
import TimeManager from "./code/time.js";
import API from "./code/api.js";

const path = require("path");
const cannon = require("cannon");

let physics = new cannon.World();
physics.gravity.set(0, -9.82, 0);

let timeManager = new TimeManager();
timeManager.start();

const api = new API(cannon, physics, undefined, timeManager, input);

let _modspath = "./code/modules";
let _modpath;
let importModules = (cb)=> {
  let result = new Array();
  fetch(_modspath + "/package.json").then((res)=>{
    res.json().then((json)=>{
      let names = Object.keys(json.active);
      let def;
      for (let modName of names) {
        def = json.active[modName];
        if (def.file) {
          import("./modules/" + def.file).then((mod)=>{
            if (mod.register) {
              let t = def.file.split(path.sep); //Path to array
              t.pop(); //Remove file
              t.join(path.sep); //Join path again
              _modpath = _modspath + "/" + t;
              mod.register(api, _modpath);
            }
            cb(modName, mod);
          });
        } else {
          console.log(modName, "module not loaded, no file attribute.");
        }
      }
      cb(result);
    });
  });
}

let loadedModules = new Map();

importModules((name, mod)=>{
  loadedModules.set(name, mod);
});
