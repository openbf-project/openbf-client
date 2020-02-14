
class API {
  /**
   * @param {import("cannon")} cannon physics engine reference
   * @param {import("cannon").World} world physics world reference
   * @param {import("./renderer.js").default} renderer for rendering things, obviously
   * @param {import("./time.js").default} timeManager for managing game loop/scheduling
   * @param {import("./input/input.js").default} input for getting game input
   * @param {import("./entity.js").EntityManager} entityManager for Entity Networking
   * @param {import("./ui.js").UIManager} ui for Interface management
   */
  constructor (cannon, world, renderer, timeManager, input, entityManager, ui) {
    this.cannon = cannon;
    this.world = world;
    this.renderer = renderer;
    this.timeManager = timeManager;
    this.input = input;
    this.entityManager = entityManager;
    this.ui = ui;
  }
}

export default API;
