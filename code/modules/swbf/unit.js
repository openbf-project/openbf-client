
let { Object3D, AnimationMixer } = require("three");

/**A character in the game (may represent AI, players, and NPCs)
 * Meant to mimick SWBF units
 * Capable of running in headless mode w/ state updates
 */
module.exports = class Unit extends Object3D {
  /**@param {import("../../api.js")} api access to API
   */
  constructor(api) {
    super();
    this.api = api;
    this.stateInstance = api.stateManager.createStateInstance();
    this.entity = this.api.entityManager.createEntity(-1, 1, this);

    /**@type {import("three").AnimationMixer} */
    this.animationMixer;

    /**@type {Array<Item>}*/
    this.items = new Array();
    this.handPrimaryIndex = 0;
    this.handSecondaryIndex = 1;
  }

  /**Mount the unit to a Scene or Object3D
   * @param {Object3D} p new parent to set
   */
  mount(p) {
    p.add(this);
  }

  /**Remove from parent node*/
  unmount() {
    this.parent.remove(this);
  }

  onSuperUpdate() {
    this.physics.velocity.x *= 0.5;
    this.physics.velocity.z *= 0.5;
    this.position.copy(this.physics.position);
    this.position.y += 0.5;

    if (this.mixer) this.mixer.update(this.api.timeManager.delta);
  }

  teleport(x, y, z) {
    this.position.x = x;
    this.position.y = y;
    this.position.z = z;
    this.physics.position.copy(this.position);
  }
}
