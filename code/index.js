
let path = require("path");

let { get, on } = require("./utils/aliases.js");
let Renderer = require("./rendering/renderer.js");

let TimeManager = require("./utils/time.js");
let { StateManager } = require("./state.js");

let { ModuleManager } = require("./modules/module.js");

let API = require("./api.js");
const api = API.get();

let { GameInput, InputBinding, AxisRule } = require("./input/gameinput.js");
let gameInput = GameInput.get();
gameInput.createBinding("escape")
  .addKey("Escape")
  .addPadButton(1);

gameInput.createBinding("forward")
  .addKey("w")
  .createPadAxisRule(1, AxisRule.LESS_THAN, -0.5);

gameInput.createBinding("backward")
  .addKey("s")
  .createPadAxisRule(1, AxisRule.GREATER_THAN, 0.5);

gameInput.createBinding("left")
  .addKey("a")
  .createPadAxisRule(0, AxisRule.LESS_THAN, -0.5);

gameInput.createBinding("right")
  .addKey("d")
  .createPadAxisRule(0, AxisRule.GREATER_THAN, 0.5);

const Component = require("./rendering/component.js");

const cannon = require("../libs/cannon-es/cannon-es.cjs");

api.setPhysicsEngine(cannon);

api.setRenderer(new Renderer());

api.setTimeManager(new TimeManager().start());

api.setStateManager(new StateManager());

api.setHeadless(false);

let container = new Component()
  .useNative(get("container"));

api.getRenderer().mount(container);

api.renderer.resize(container.rect.width, container.rect.height);
api.renderer.start();

on(window, "resize", () => {
  api.renderer.resize(container.rect.width, container.rect.height);
});

api.getTimeManager().listen((delta) => {
  if (api.hasWorld()) api.getWorld().update(delta);
});

let _modspath = path.resolve("./code/modules");

let moduleManager = ModuleManager.get();
api.setModuleManager(moduleManager);
moduleManager.loadModuleFolder(_modspath);
