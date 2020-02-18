
module.exports = class API {
  constructor () {
    /**@type {import("cannon")} cannon physics engine reference*/
    this.cannon;
    /**@type {import("cannon").World} physics world reference*/
    this.world;
    /**@type {import("./renderer.js")} for rendering things*/
    this.renderer;
    /**@type {import("./time.js")} for managing game loop/scheduling*/
    this.timeManager;
    /**@type {import("./input.js")} for getting game input*/
    this.input;
    /**@type {import("./entity.js").EntityManager} entityManager for networking*/
    this.entityManager;
    /**@type {import("./ui.js").UIManager} for Interface management*/
    this.ui;
    /**@type {import("./state.js").StateManager} for auto-updating StateInstances */
    this.stateManager;
    /**Client = false, Server = true */
    this.headless = false;
  }
}
