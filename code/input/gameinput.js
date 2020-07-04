
const Input = require("./input.js");

module.exports.InputBinding = class InputBinding {
  constructor () {
    /**@type {Set<string>}*/
    this.keys = new Set();
    /**@type {Set<TouchRect}*/
    this.rects = new Set();
  }
  /**Overwrite/sets the keys to the binding
   * @param  {...string} keys to use for this binding
   * @returns {InputBinding} self
   */
  setKeys (...keys) {
    if (keys.length < 1) throw "Use at least one key";
    this.keys.clear();
    this.addKeys(...keys);
    return this;
  }
  /**Adds a list of keys to this input binding
   * @param  {...string} keys
   * @returns {InputBinding} self
   */
  addKeys (...keys) {
    for (let k of keys) {
      this.addKey(k);
    }
  }
  /**Adds a keyboard key to this input binding
   * @param {string} key
   * @returns {InputBinding} self
   */
  addKey (key) {
    if (typeof(key) !== "string") throw `Key must be type of string, got ${typeof(key)}`;
    if (this.keys.has(key)) throw `Cannot add keyboard key ${key} twice!`;
    this.keys.add(key);
    return this;
  }
  /**Add a touch area to this input binding
   * @param {TouchRect} r
   * @returns {InputBinding} self
   */
  addRect (r) {
    if (!r instanceof TouchRect) throw `${r} not an instance of TouchRect`;
    if (this.rects.has(r)) throw "Cannot add TouchRect twice!";
    this.rects.add(r);
    return this;
  }
  /**Test the binding against input
   * @param {GameInput} input
   * @returns {boolean} true if any of the binding keys were used
   */
  test (input) {
    //Test keyboard (quick when no keys have been pressed)
    for (let k of this.keys) {
      if (input.raw.keyboard.get(k)) return true;
    }
    //Check touch rectangles
    if (!input.pointerPrimary) return false;
    for (let r of this.rects) {
      if (r.pointInside(input.pointerNormalizedX, input.pointerNormalizedY)) return true;
    }
    return false;
  }
}

module.exports.TouchRect = class TouchRect {
  constructor (left=0, top=0, width=1, height=1) {
    if (typeof(top) !== "number") throw "top must be a number";
    if (typeof(left) !== "number") throw "left must be a number";
    if (typeof(width) !== "number") throw "width must be a number";
    if (typeof(height) !== "number") throw "height must be a number";
    this.top = top;
    this.left = left;
    this.width = width;
    this.height = height;
  }
  setPosition (top, left) {
    this.top = top;
    this.left = left;
    return this;
  }
  setSize (width, height) {
    this.width = width;
    this.height = height;
    return this;
  }
  pointInside (nx, ny) {
    return (
      nx > this.left &&
      nx < this.left + this.width &&
      ny > this.top &&
      ny < this.top + this.height
    );
  }
}

module.exports.GameInput = class GameInput {
  /**@type {GameInput}*/
  static SINGLETON = undefined;
  constructor () {
    if (!GameInput.SINGLETON) {
      GameInput.SINGLETON = this;
    } else {
      throw "GameInput should not be instantiated more than once";
    }
    this.raw = new Input();
    this.raw.registerEvents();

    /**@type {Map<string, InputBinding>}*/
    this.inputBindings = new Map();

    /**@type {import("../renderer.js").Renderer}*/
    this.renderer = undefined;
  }
  /**@type {import("../renderer.js").Renderer}*/
  setRenderer (renderer) {
    this.renderer = renderer;
  }
  /**Get or create the game client input
   * @returns {GameInput}
   */
  static get () {
    if (!GameInput.SINGLETON) {
      new GameInput();
    }
    return GameInput.SINGLETON;
  }
  /**Adds a key binding
   * @param {string} name 
   * @param {InputBinding} binding
   */
  addBinding (name, binding) {
    if (this.inputBindings.has(name)) throw `Cannot add ${key} as it is in use already`;
    this.inputBindings.set(name, binding);
  }
  /**Gets a binding by its name
   * @param {string} name
   * @returns {InputBinding}
   */
  getBinding (name) {
    return this.inputBindings.get(name);
  }
  /**Tests whether a button is activated or not
   * @param {string} name of button
   * @returns {boolean} true if down, false if up
   */
  getButton (name) {
    return this.getBinding(name).test(this);
  }
  /**STATIC version (convenience), please make sure to use 'get' at least once before using this
   * Tests whether a button is activated or not
   * @param {string} name of button
   * @returns {boolean} true if down, false if up
   */
  static getButton (name) {
    try {
      return GameInput.SINGLETON.getButton(name);
    } catch (ex) {
      throw `Please addButton("${name}") before using it with getButton`;
    }
  }
  /**@type {number} the same as GameInput.get().raw.pointer.x
   * Gets the raw pointer offset in the renderer (screen)
   */
  get pointerScreenX () {
    return this.raw.pointer.x;
  }
  /**STATIC version (convenience), please make sure to use 'get' at least once before using this
   * @type {number} the same as GameInput.get().raw.pointer.x
   * Gets the raw pointer offset in the renderer (screen)
   */
  static get pointerScreenX () {
    return GameInput.SINGLETON.pointerScreenX;
  }
  /**@type {number} the same as GameInput.get().raw.pointer.y
   * Gets the raw pointer offset in the renderer (screen)
   */
  get pointerScreenY () {
    return this.raw.pointer.y;
  }
  /**STATIC version (convenience), please make sure to use 'get' at least once before using this
   * @type {number} the same as GameInput.get().raw.pointer.y
   * Gets the raw pointer offset in the renderer (screen)
   */
  static get pointerScreenY () {
    return GameInput.SINGLETON.pointerScreenY;
  }
  /**@type {number} pointer corrected for renderer zoom, width, height
   * Offset in pixels in the world
   */
  get pointerWorldX () {
    return this.pointerScreenCenteredX - this.renderer.center.x;
  }
  /**STATIC version (convenience), please make sure to use 'get' at least once before using this
   * @type {number} pointer corrected for renderer zoom, width, height
   * Offset in pixels in the world
   */
  static get pointerWorldX () {
    return GameInput.SINGLETON.pointerWorldX;
  }
  /**@type {number} pointer corrected for renderer zoom, width, height
   * Offset in pixels in the world
   */
  get pointerWorldY () {
    return this.pointerScreenCenteredY - this.renderer.center.y;
  }
  /**STATIC version (convenience), please make sure to use 'get' at least once before using this
   * @type {number} pointer corrected for renderer zoom, width, height
   * Offset in pixels in the world
   */
  static get pointerWorldY () {
    return GameInput.SINGLETON.pointerWorldY;
  }
  /**@type {number} pointer corrected for renderer zoom, width, height
   * Centered in the renderer (screen)
   */
  get pointerScreenCenteredX () {
    return (this.pointerScreenX - (this.renderer.rect.width/2))/this.renderer.zoom;
  }
  /**STATIC version (convenience), please make sure to use 'get' at least once before using this
   * @type {number} pointer corrected for renderer zoom, width, height
   * Centered in the renderer (screen)
   */
  static get pointerScreenCenteredX () {
    return GameInput.SINGLETON.pointerScreenCenteredX;
  }
  /**@type {number} pointer corrected for renderer zoom, width, height
   * Centered in the renderer (screen)
   */
  get pointerScreenCenteredY () {
    return (this.pointerScreenY - (this.renderer.rect.height/2))/this.renderer.zoom;
  }
  /**STATIC version (convenience), please make sure to use 'get' at least once before using this
   * @type {number} pointer corrected for renderer zoom, width, height
   * Centered in the renderer (screen)
   */
  static get pointerScreenCenteredY () {
    return GameInput.SINGLETON.pointerScreenCenteredY;
  }
  /**Is the primary pointer button down
   * @type {boolean}
   */
  get pointerPrimary () {
    return this.raw.pointer.leftDown;
  }
  /**STATIC version (convenience), please make sure to use 'get' at least once before using this
   * Is the primary pointer button down
   * @type {boolean}
   */
  static get pointerPrimary () {
    return GameInput.SINGLETON.pointerPrimary;
  }
  /**Is the secondary pointer button down
   * @type {boolean}
   */
  get pointerSecondary () {
    return this.raw.pointer.rightDown;
  }
  /**STATIC version (convenience), please make sure to use 'get' at least once before using this
   * Is the secondary pointer button down
   * @type {boolean}
   */
  static get pointerSecondary () {
    return GameInput.SINGLETON.pointerSecondary;
  }
  /**@type {number} between 0 and 1, 0 being leftmost and 1 being rightmost
   * Normalized to screen width
   */
  get pointerNormalizedX () {
    return this.raw.pointer.x / this.renderer.rect.width;
  }
  /**STATIC version (convenience), please make sure to use 'get' at least once before using this
   * @type {number} between 0 and 1, 0 being leftmost and 1 being rightmost
   * Normalized to screen width
   */
  static get pointerNormalizedX () {
    return GameInput.SINGLETON.pointerNormalizedX;
  }
  /**@type {number} between 0 and 1, 0 being leftmost and 1 being rightmost
   * Normalized to screen height
   */
  get pointerNormalizedY () {
    return this.raw.pointer.y / this.renderer.rect.height;
  }
  /**STATIC version (convenience), please make sure to use 'get' at least once before using this
   * @type {number} between 0 and 1, 0 being leftmost and 1 being rightmost
   * Normalized to screen height
   */
  static get pointerNormalizedY () {
    return GameInput.SINGLETON.pointerNormalizedY;
  }
}
