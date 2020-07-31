
import { get, on } from "./aliases.js";
import Component from "./rendering/component.js";

import API from "./api.js";

import Renderer from "./rendering/renderer.js";
import { TimeManager } from "./utils/time.js";
import { ModuleManager, ResourceManager } from "./resources/resources.js";
import { GameInput, AxisRule } from "./input/gameinput.js";

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
api.renderer.defaultCamera.position.set(0, 10, 40);
api.renderer.useDefaultCamera();
api.renderer.start();

setTimeout(() => {
  api.getTimeManager().listen((delta) => {
    if (input.getButton("forward")) {
      api.renderer.camera.position.z -= 0.5;
    } else if (input.getButton("backward")) {
      api.renderer.camera.position.z += 0.5;
    }
    if (input.getButton("left")) {
      api.renderer.camera.position.x -= 0.5;
    } else if (input.getButton("right")) {
      api.renderer.camera.position.x += 0.5;
    }
  });
}, 100);

let resourceManager = ResourceManager.get();
api.setResourceManager(resourceManager);

let moduleManager = ModuleManager.get();
api.setModuleManager(moduleManager);

moduleManager.queryModules().then((json) => {
  let keys = Object.keys(json.data);
  for (let key of keys) {
    moduleManager.getModule(key).then((mod) => {
      console.log("Loaded mod", mod);
    });
  }
});