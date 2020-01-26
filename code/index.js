
import Renderer from "./renderer/renderer.js";
import { get, rect, on } from "./aliases.js";
import Input from "./input/input.js";
import TimeManager from "./time.js";

const path = require("path");
const cannon = require("cannon");

let renderer = new Renderer();
let input = new Input(window);
let physics = new cannon.World();
physics.gravity.set(0, -9.82, 0);

let container = get("container");
let drawRect = rect(container);

renderer.mount(container);
renderer.resize(drawRect.width, drawRect.height);
renderer.start();

on(window, "resize", ()=>{
  drawRect = rect(container);
  renderer.resize(drawRect.width, drawRect.height);
});

let timeManager = new TimeManager();
timeManager.start();

//TODO - move to class for editor help
let api = {
  input:input,
  renderer:renderer,
  physics:physics,
  cannon:cannon,
  timeManager:timeManager
};

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
