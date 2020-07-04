
let path = require("path");
let Renderer = require("./ui/renderer.js");
let { get, on } = require("./aliases.js");
let TimeManager = require("./time.js");
let API = require("./api.js");
let { StateManager } = require("./state.js");

const Component = require("./ui/component.js");

const cannon = require("cannon");

const api = API.get();
api.setPhysicsEngine(cannon);

api.setRenderer(new Renderer());

api.setTimeManager(new TimeManager().start());

api.setStateManager (new StateManager());

api.setHeadless(false);

let container = new Component()
  .useNative(get("container"));

api.getRenderer().mount(container);

api.renderer.resize(container.rect.width, container.rect.height);
api.renderer.start();

on(window, "resize", ()=>{
  api.renderer.resize(container.rect.width, container.rect.height);
});

api.getTimeManager().listen((delta)=>{
  if (api.hasWorld()) api.getWorld().update(delta);
});

let _modspath = "./code/modules";
let _modpath;
let importModules = (cb)=> {
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
            mod.register(_modpath);
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
