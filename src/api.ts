
import "./rendering/renderer.js";
import Renderer from "./rendering/renderer.js";
import { PhysicsEngine } from "./physics/engine.js";
import { ResourceManager } from "./resources/resources.js";
import { TimeManager } from "./utils/time.js";

import { ModuleManager } from "./resources/resources.js";

export default class API {
  static SINGLETON: API;
  physicsEngine: PhysicsEngine;
  renderer: Renderer;
  headless: boolean;
  timeManager: TimeManager;
  moduleManager: ModuleManager;
  resourceManager: ResourceManager;

  setTimeManager(tm: TimeManager) {
    this.timeManager = tm;
  }
  getTimeManager(): TimeManager {
    return this.timeManager;
  }
  setHeadless(headless: boolean) {
    this.headless = headless;
  }
  getHeadless(): boolean {
    return this.headless;
  }
  setPhysicsEngine(engine: PhysicsEngine) {
    this.physicsEngine = engine;
  }
  getPhysicsEngine(): PhysicsEngine {
    return this.physicsEngine;
  }
  setRenderer(renderer: Renderer) {
    this.renderer = renderer;
  }
  getRenderer(): Renderer {
    return this.renderer;
  }
  static get(): API {
    if (!API.SINGLETON) API.SINGLETON = new API();
    return API.SINGLETON;
  }
  getResourceManager(): ResourceManager {
    return this.resourceManager;
  }
  setResourceManager(v: ResourceManager) {
    this.resourceManager = v;
  }
  setModuleManager(v: ModuleManager) {
    this.moduleManager = v;
  }
  getModuleManager(): ModuleManager {
    return this.moduleManager;
  }
}