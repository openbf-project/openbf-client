
import { Component, OverlayPanel, Grid, ImagePanel, runOnce, get, on } from "@repcomm/exponent-ts";

import API from "./api";

import Renderer from "./rendering/renderer";
import { TimeManager } from "./utils/time";
import { ModuleManager, ResourceManager } from "./resources/resources";
import { GameInput, AxisRule } from "@repcomm/gameinput-ts";
import { PhysicsManager } from "./physics/physics";

//Inject exponent css
runOnce();

const api = API.get();
window["API"] = API;

import * as THREE from "./libs/three/Three.js";

API.THREE = THREE;
API.GameInput = GameInput;
let input = GameInput.get();
api.setInputManager(input);

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

let root = new OverlayPanel()
.mount(container) as OverlayPanel;

//TODO - make HUD a panel, and handle content with default mods
const hud = new Grid()
.setColumnCount(3)
.setRowCount(3);

hud.setCell(
  new ImagePanel()
  .setImage("./images/hud.svg")
  .styleItem("background-repeat", "no-repeat")
  .styleItem("background-position", "50% 0%") as ImagePanel,
  1, 1, 4
);

root.setElements(hud, api.getRenderer());

// api.getRenderer().mount(container);

on(window, "resize", () => {
  api.getRenderer().resize(container.rect.width, container.rect.height);
});

api.getRenderer().resize(container.rect.width, container.rect.height);
api.getRenderer().useDefaultCamera();
api.getRenderer().start();

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