
import { get, on } from "./aliases.js";
import Component from "./rendering/component.js";

import API from "./api.js";

import Renderer from "./rendering/renderer.js";
import { TimeManager } from "./utils/time.js";
import { ModuleManager, ResourceManager } from "./resources/resources.js";
import { GameInput, AxisRule } from "./input/gameinput.js";
import { PhysicsManager } from "./physics/physics.js";

const api = API.get();
let input = GameInput.get();

function setupDefaultInput() {
  input.createBinding("escape")
    .addKey("Escape")
    .addPadButton(1);

  input.createBinding("ok")
    .addKey("e")
    .addPadButton(0);

  input.createBinding("forward")
    .addKey("w")
    .createPadAxisRule(1, AxisRule.LESS_THAN, -0.5);

  input.createBinding("backward")
    .addKey("s")
    .createPadAxisRule(1, AxisRule.GREATER_THAN, 0.5);

  input.createBinding("left")
    .addKey("a")
    .createPadAxisRule(0, AxisRule.LESS_THAN, -0.5);

  input.createBinding("right")
    .addKey("d")
    .createPadAxisRule(0, AxisRule.GREATER_THAN, 0.5);

  input.createBinding("steer-left")
    .createPadAxisRule(3, AxisRule.LESS_THAN, -0.5);

  input.createBinding("steer-right")
    .createPadAxisRule(3, AxisRule.GREATER_THAN, 0.5);

  input.createBinding("steer-up")
    .createPadAxisRule(4, AxisRule.LESS_THAN, -0.5);

  input.createBinding("steer-down")
    .createPadAxisRule(4, AxisRule.GREATER_THAN, 0.5);

}

setupDefaultInput();

api.setRenderer(new Renderer());
api.setTimeManager(new TimeManager().start());
api.setHeadless(false);
let container = new Component()
  .useNative(get("container"));
api.getRenderer().mount(container);

on(window, "resize", () => {
  api.renderer.resize(container.rect.width, container.rect.height);
});

api.renderer.resize(container.rect.width, container.rect.height);
api.renderer.useDefaultCamera();
api.renderer.start();

const physics = new PhysicsManager();
api.setPhysicsManager(physics);

async function userLand() {
  //Load up physics engine
  await physics.init(); //Can throw if physics error, this is fine

  //Prepare resources to load
  let resourceManager = ResourceManager.get();
  api.setResourceManager(resourceManager);

  //Prepare modules to load
  let moduleManager = ModuleManager.get();
  api.setModuleManager(moduleManager);

  //Prepares user modules resources (lazy load)
  let resources = await moduleManager.queryModules();

  //Actually loads the modules if they aren't loaded
  for (let name of resources) {
    //You can perform getModule(key) without fear of duplication
    let mod = await moduleManager.getModule(name);
    // console.log("Loaded module", mod);
  }

  api.getTimeManager().listen((delta) => {
    physics.step(delta);
  });
}

//Async!
userLand();