
import Renderer from "./rendering/renderer";

import { ResourceManager } from "./resources/resources";
import { TimeManager } from "./utils/time";
import { ModuleManager } from "./resources/resources";
import { PhysicsManager } from "./physics/physics";

export default class API {
  static SINGLETON: API;
  physicsManager: PhysicsManager;
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
  setPhysicsManager(engine: PhysicsManager) {
    this.physicsManager = engine;
  }
  getPhysicsManager(): PhysicsManager {
    return this.physicsManager;
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