
let path = require("path");
let Renderer = require("./renderer.js");
let { get, rect, on } = require("./aliases.js");
let Input = require("./input.js");
let TimeManager = require("./time.js");
let API = require("./api.js");
let { EntityManager } = require("./entity.js");
let { UIManager } = require("./ui.js");
let { StateManager } = require("./state.js");

const cannon = require("cannon");
const three = require("three");

const api = new API();
api.cannon = cannon;

api.world = new cannon.World();

api.renderer = {scene:new three.Scene()};

api.timeManager = new TimeManager();
api.timeManager.start();

api.entityManager = new EntityManager();

api.stateManager = new StateManager();

api.headless = false;

api.renderer = new Renderer();
api.input = new Input(window);

let container = get("container");
let drawRect = rect(container);
api.ui = new UIManager(container);

//Add the renderer to our UI
api.ui.add(api.renderer);

api.renderer.resize(drawRect.width, drawRect.height);
api.renderer.start();

on(window, "resize", ()=>{
  drawRect = rect(container);
  api.renderer.resize(drawRect.width, drawRect.height);
});

api.timeManager.listen(()=>{
  api.world.step(api.timeManager.delta);
  api.world.bodies.forEach((body)=>{
    if (body.real) {
      body.real.position.copy(body.position);
      body.real.quaternion.copy(body.quaternion);
    }
  });
});

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
          let mod = require("./modules/" + def.file);
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
    });
  });
}

let loadedModules = new Map();

importModules((name, mod)=>{
  loadedModules.set(name, mod);
});
