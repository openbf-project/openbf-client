
import { get, on } from "./aliases.js";
import Component from "./rendering/component.js";

import API from "./api.js";
const api = API.get();

import Renderer from "./rendering/renderer.js";
import { TimeManager } from "./utils/time.js";
import { ModuleManager } from "./resources/module.js";

import { GameInput, InputBinding, AxisRule } from "./input/gameinput.js";

let gameInput = GameInput.get();

gameInput.createBinding("escape")
  .addKey("Escape")
  .addPadButton(1);

gameInput.createBinding("ok")
  .addKey("e")
  .addPadButton(0);

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

gameInput.createBinding("steer-left")
  .createPadAxisRule(3, AxisRule.LESS_THAN, -0.5);

gameInput.createBinding("steer-right")
  .createPadAxisRule(3, AxisRule.GREATER_THAN, 0.5);

gameInput.createBinding("steer-up")
  .createPadAxisRule(4, AxisRule.LESS_THAN, -0.5);

gameInput.createBinding("steer-down")
  .createPadAxisRule(4, AxisRule.GREATER_THAN, 0.5);

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

setTimeout(() => {
  api.getTimeManager().listen((delta) => {

  });

}, 2000);

let moduleManager = ModuleManager.get();
api.setModuleManager(moduleManager);