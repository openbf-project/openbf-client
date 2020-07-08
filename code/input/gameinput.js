
const Input = require("./input.js");
const { on } = require("../utils/aliases.js");

class InputBinding {
  constructor() {
    /**@type {Set<string>}*/
    this.keys = new Set();
    /**@type {Set<TouchRect}*/
    this.rects = new Set();

    /**@type {Set<number>}*/
    this.gpBtns = new Set();

    /**@type {Set<AxisRule>}*/
    this.padAxes = new Set();
  }
  /**Overwrite/sets the keys to the binding
   * @param  {...string} keys to use for this binding
   * @returns {InputBinding} self
   */
  setKeys(...keys) {
    if (keys.length < 1) throw "Use at least one key";
    this.keys.clear();
    this.addKeys(...keys);
    return this;
  }
  /**Adds a list of keys to this input binding
   * @param  {...string} keys
   * @returns {InputBinding} self
   */
  addKeys(...keys) {
    for (let k of keys) {
      this.addKey(k);
    }
  }
  /**Adds a keyboard key to this input binding
   * @param {string} key
   * @returns {InputBinding} self
   */
  addKey(key) {
    if (typeof (key) !== "string") throw `Key must be type of string, got ${typeof (key)}`;
    if (this.keys.has(key)) throw `Cannot add keyboard key ${key} twice!`;
    this.keys.add(key);
    return this;
  }
  /**Add a touch area to this input binding
   * @param {TouchRect} r
   * @returns {InputBinding} self
   */
  addRect(r) {
    if (!r instanceof TouchRect) throw `${r} not an instance of TouchRect`;
    if (this.rects.has(r)) throw "Cannot add TouchRect twice!";
    this.rects.add(r);
    return this;
  }
  /**Adds a gamepad button to this binding
   * @param {number} btn
   * @returns {InputBinding} self
   */
  addPadButton(btn) {
    if (typeof (btn) !== "number") throw `${btn} not a number: is ${typeof (btn)}`;
    if (this.gpBtns.has(btn)) throw `Cannot add gamepad button ${btn} twice!`;
    this.gpBtns.add(btn);
    return this;
  }
  /**Add a list of buttons to this input binding
   * @param  {...number} btns
   * @returns {InputBinding} self
   */
  addPadButtons(...btns) {
    for (let btn of btns) {
      this.addPadButton(btn);
    }
    return this;
  }
  addPadAxisRule(rule) {
    if (!rule instanceof AxisRule) throw `${rule} not instanceof AxisRule`;
    if (this.padAxes.has(rule)) throw "Cannot add axis rule twice";
    this.padAxes.add(rule);
    return this;
  }
  /**Create pad axis rule and add it to the binding
   * Convenience method
   * @param {number} axisId axis id
   * @param {number} rule see AxisRule.GREATER_THAN, etc
   * @param {number} compareValue to compare against
   */
  createPadAxisRule(axisId, rule, compareValue) {
    let result = new AxisRule()
      .setAxisId(axisId)
      .setCompareRule(rule)
      .setCompareValue(compareValue);
    this.addPadAxisRule(result);
    return result;
  }
  /**Test the binding against input
   * @param {GameInput} input
   * @returns {boolean} true if any of the binding keys were used
   */
  test(input) {
    //Test keyboard (quick when no keys have been pressed)
    for (let k of this.keys) {
      if (input.raw.keyboard.get(k)) return true;
    }
    //console.log("Gamepad found");
    //Test all the gamepad buttons assigned
    for (let gpBtn of this.gpBtns) {
      if (input.getGamePadManager().getPrimaryButton(gpBtn)) {
        return true;
      }
    }
    if (input.getGamePadManager().ensure()) {
      //Test all the gamepad axis rules
      for (let rule of this.padAxes) {
        let gp = input.getGamePadManager().getPrimary();
        if (rule.test(gp)) {
          if (gp.vibrationActuator) {
              gp.vibrationActuator.playEffect("dual-rumble", {
                startDelay: 0,
                duration: parseInt(30*Math.random()),
                weakMagnitude: Math.random(),
                strongMagnitude: Math.random()
              })
            }
          return true;
        }
      }
    } else {
      //console.log("No gamepad found");
    }

    //Check touch rectangles
    if (!input.pointerPrimary) return false;
    for (let r of this.rects) {
      if (r.pointInside(input.pointerNormalizedX, input.pointerNormalizedY)) return true;
    }
    return false;
  }
}
module.exports.InputBinding = InputBinding;

class GamePadManager {
  /**@type {GamePadManager}*/
  static SINGLETON = undefined;
  constructor() {
    if (!GamePadManager.SINGLETON) {
      GamePadManager.SINGLETON = this;
    } else {
      throw "GamePadManager should not be instantiated more than once";
    }
    /**@type {Gamepad}*/
    this.primary = undefined;

    /**@type {Array<Gamepad>}*/
    this.allGamePadsFix = new Array();

    /**@param {GamepadEvent} evt*/
    this.onGamePadConnected = (evt) => {
      if (evt.gamepad !== null) {
        this.allGamePadsFix.push(evt.gamepad);
        console.log("Added gamepad", evt.gamepad);
      } else {
        console.log("Couldn't add null gamepad");
      }
    }
    /**@param {GamepadEvent} evt*/
    this.onGamePadDisconnected = (evt) => {
      let ind = this.allGamePadsFix.indexOf(evt.gamepad);
      if (ind === -1) {
        console.warn("Cannot remove disconnected controller that was never added");
        return;
      }
      this.allGamePadsFix.splice(ind, 1);
    }
    this.registerEvents();
  }
  /**Get or create the game client input
   * @returns {GamePadManager}
   */
  static get() {
    if (!GamePadManager.SINGLETON) {
      new GamePadManager();
    }
    return GamePadManager.SINGLETON;
  }
  registerEvents() {
    // on(window, "gamepadconnected", this.onGamePadConnected);
    // on(window, "gamepaddisconnected", this.onGamePadDisconnected);
  }
  unregisterEvents() {
    off(window, "gamepadconnected", this.onGamePadConnected);
    off(window, "gamepaddisconnected", this.onGamePadDisconnected);
  }
  /**UGH.
   * @returns {Array<Gamepad>}
   */
  nativeGetAllGamepads() {
    // return navigator.getGamepads(); //Doesn't work in electron..
    // return this.allGamePadsFix; //Doesn't work in electron properly

    let result = new Array();
    let list = navigator.getGamepads();
    let item = undefined;
    for (let i=0; i < list.length; i++) {
      item = list.item(i);
      if (item) {
        result.push ( item );
      }
    }
    return result;
  }
  /**Tries to get a valid gamepad
   * @returns {Gamepad|false}
   */
  findGamepad() {
    let gps = this.nativeGetAllGamepads();
    for (let gp of gps) {
      if (gp && gp.connected) {
        return gp;
      }
    }
    return false;
  }
  /**Tries to populate the primary controller
   * Returns success or not
   */
  ensure() {
    //TODO - remove after electron fixes their shit
    //https://github.com/electron/electron/issues/24453
    if (true) {//!this.primary || !this.primary.connected) {
      this.primary = this.findGamepad();
      if (this.primary === false) {
        //console.warn("Couldn't find any valid game pads in navigator..");
        return false;
      }
      return true;
    }
    return true;
  }
  getPrimary() {
    return this.primary;
  }
  /**Get primary button pressed state
   * @param {number} btn
   * @returns {boolean}
   */
  getPrimaryButton(btn) {
    if (this.ensure()) {
      return this.getPrimary().buttons[btn].pressed;
    }
    return false;
  }
}
module.exports.GamePadManager = GamePadManager;

class AxisRule {
  static GREATER_THAN = 0;
  static LESS_THAN = 1;
  constructor() {
    this.axisId = 0;
    this.rule = AxisRule.GREATER_THAN;
    this.compareValue = 0.5;
  }
  /**Set axis id
   * @param {number} id
   * @returns {AxisRule}
   */
  setAxisId(id) {
    this.axisId = id;
    return this;
  }
  /**Get axis id
   * @returns {number}
   */
  getAxisId() {
    return this.axisId;
  }
  /**Set compare vaule
   * @param {number} v
   * @returns {AxisRule}
   */
  setCompareValue(v) {
    this.compareValue = v;
    return this;
  }
  /**Get the value to compare against
   * @returns {number}
   */
  getCompareValue() {
    return this.compareValue;
  }
  /**Set the compare rule
   * @param {number} rule AxisRule.GREATER_THAN, AxisRule.LESS_THAN
   * @returns {AxisRule}
   */
  setCompareRule(rule) {
    if (typeof (rule) !== "number") throw `Rule ${rule} not a number`;
    this.rule = rule;
    return this;
  }
  /**@returns {number}*/
  getCompareRule() {
    return this.rule;
  }
  /**Test an axisrule against a gamepad
   * @param {Gamepad} gp
   * @returns {boolean}
   */
  test(gp) {
    let ax = gp.axes[this.axisId];
    if (this.rule === AxisRule.GREATER_THAN) {
      return (ax > this.compareValue);
    } else if (this.rule === AxisRule.LESS_THAN) {
      return (ax < this.compareValue);
    }
  }
}
module.exports.AxisRule = AxisRule;

class TouchRect {
  constructor(left = 0, top = 0, width = 1, height = 1) {
    if (typeof (top) !== "number") throw "top must be a number";
    if (typeof (left) !== "number") throw "left must be a number";
    if (typeof (width) !== "number") throw "width must be a number";
    if (typeof (height) !== "number") throw "height must be a number";
    this.top = top;
    this.left = left;
    this.width = width;
    this.height = height;
  }
  setPosition(top, left) {
    this.top = top;
    this.left = left;
    return this;
  }
  setSize(width, height) {
    this.width = width;
    this.height = height;
    return this;
  }
  pointInside(nx, ny) {
    return (
      nx > this.left &&
      nx < this.left + this.width &&
      ny > this.top &&
      ny < this.top + this.height
    );
  }
}
module.exports.TouchRect = TouchRect;

class GameInput {
  /**@type {GameInput}*/
  static SINGLETON = undefined;
  constructor() {
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

    /**@type {GamePadManager} */
    this.gamePadManager = GamePadManager.get();
  }
  /**@type {import("../renderer.js").Renderer}*/
  setRenderer(renderer) {
    this.renderer = renderer;
  }
  /**Get or create the game client input
   * @returns {GameInput}
   */
  static get() {
    if (!GameInput.SINGLETON) {
      new GameInput();
    }
    return GameInput.SINGLETON;
  }
  /**Adds a key binding
   * @param {string} name 
   * @param {InputBinding} binding
   */
  addBinding(name, binding) {
    if (this.inputBindings.has(name)) throw `Cannot add ${key} as it is in use already`;
    this.inputBindings.set(name, binding);
  }
  /**Creates an input binding (convenience function)
   * @param {string} name
   * @returns {InputBinding}
   */
  createBinding(name) {
    let result = new InputBinding();
    this.addBinding(name, result);
    return result;
  }
  /**Gets a binding by its name
   * @param {string} name
   * @returns {InputBinding}
   */
  getBinding(name) {
    return this.inputBindings.get(name);
  }
  /**Tests whether a button is activated or not
   * @param {string} name of button
   * @returns {boolean} true if down, false if up
   */
  getButton(name) {
    return this.getBinding(name).test(this);
  }
  /**STATIC version (convenience), please make sure to use 'get' at least once before using this
   * Tests whether a button is activated or not
   * @param {string} name of button
   * @returns {boolean} true if down, false if up
   */
  static getButton(name) {
    try {
      return GameInput.SINGLETON.getButton(name);
    } catch (ex) {
      throw `getButton error: ${ex}`;
    }
  }
  /**@type {number} the same as GameInput.get().raw.pointer.x
   * Gets the raw pointer offset in the renderer (screen)
   */
  get pointerScreenX() {
    return this.raw.pointer.x;
  }
  /**STATIC version (convenience), please make sure to use 'get' at least once before using this
   * @type {number} the same as GameInput.get().raw.pointer.x
   * Gets the raw pointer offset in the renderer (screen)
   */
  static get pointerScreenX() {
    return GameInput.SINGLETON.pointerScreenX;
  }
  /**@type {number} the same as GameInput.get().raw.pointer.y
   * Gets the raw pointer offset in the renderer (screen)
   */
  get pointerScreenY() {
    return this.raw.pointer.y;
  }
  /**STATIC version (convenience), please make sure to use 'get' at least once before using this
   * @type {number} the same as GameInput.get().raw.pointer.y
   * Gets the raw pointer offset in the renderer (screen)
   */
  static get pointerScreenY() {
    return GameInput.SINGLETON.pointerScreenY;
  }
  /**@type {number} pointer corrected for renderer zoom, width, height
   * Offset in pixels in the world
   */
  get pointerWorldX() {
    return this.pointerScreenCenteredX - this.renderer.center.x;
  }
  /**STATIC version (convenience), please make sure to use 'get' at least once before using this
   * @type {number} pointer corrected for renderer zoom, width, height
   * Offset in pixels in the world
   */
  static get pointerWorldX() {
    return GameInput.SINGLETON.pointerWorldX;
  }
  /**@type {number} pointer corrected for renderer zoom, width, height
   * Offset in pixels in the world
   */
  get pointerWorldY() {
    return this.pointerScreenCenteredY - this.renderer.center.y;
  }
  /**STATIC version (convenience), please make sure to use 'get' at least once before using this
   * @type {number} pointer corrected for renderer zoom, width, height
   * Offset in pixels in the world
   */
  static get pointerWorldY() {
    return GameInput.SINGLETON.pointerWorldY;
  }
  /**@type {number} pointer corrected for renderer zoom, width, height
   * Centered in the renderer (screen)
   */
  get pointerScreenCenteredX() {
    return (this.pointerScreenX - (this.renderer.rect.width / 2)) / this.renderer.zoom;
  }
  /**STATIC version (convenience), please make sure to use 'get' at least once before using this
   * @type {number} pointer corrected for renderer zoom, width, height
   * Centered in the renderer (screen)
   */
  static get pointerScreenCenteredX() {
    return GameInput.SINGLETON.pointerScreenCenteredX;
  }
  /**@type {number} pointer corrected for renderer zoom, width, height
   * Centered in the renderer (screen)
   */
  get pointerScreenCenteredY() {
    return (this.pointerScreenY - (this.renderer.rect.height / 2)) / this.renderer.zoom;
  }
  /**STATIC version (convenience), please make sure to use 'get' at least once before using this
   * @type {number} pointer corrected for renderer zoom, width, height
   * Centered in the renderer (screen)
   */
  static get pointerScreenCenteredY() {
    return GameInput.SINGLETON.pointerScreenCenteredY;
  }
  /**Is the primary pointer button down
   * @type {boolean}
   */
  get pointerPrimary() {
    return this.raw.pointer.leftDown;
  }
  /**STATIC version (convenience), please make sure to use 'get' at least once before using this
   * Is the primary pointer button down
   * @type {boolean}
   */
  static get pointerPrimary() {
    return GameInput.SINGLETON.pointerPrimary;
  }
  /**Is the secondary pointer button down
   * @type {boolean}
   */
  get pointerSecondary() {
    return this.raw.pointer.rightDown;
  }
  /**STATIC version (convenience), please make sure to use 'get' at least once before using this
   * Is the secondary pointer button down
   * @type {boolean}
   */
  static get pointerSecondary() {
    return GameInput.SINGLETON.pointerSecondary;
  }
  /**@type {number} between 0 and 1, 0 being leftmost and 1 being rightmost
   * Normalized to screen width
   */
  get pointerNormalizedX() {
    return this.raw.pointer.x / this.renderer.rect.width;
  }
  /**STATIC version (convenience), please make sure to use 'get' at least once before using this
   * @type {number} between 0 and 1, 0 being leftmost and 1 being rightmost
   * Normalized to screen width
   */
  static get pointerNormalizedX() {
    return GameInput.SINGLETON.pointerNormalizedX;
  }
  /**@type {number} between 0 and 1, 0 being leftmost and 1 being rightmost
   * Normalized to screen height
   */
  get pointerNormalizedY() {
    return this.raw.pointer.y / this.renderer.rect.height;
  }
  /**STATIC version (convenience), please make sure to use 'get' at least once before using this
   * @type {number} between 0 and 1, 0 being leftmost and 1 being rightmost
   * Normalized to screen height
   */
  static get pointerNormalizedY() {
    return GameInput.SINGLETON.pointerNormalizedY;
  }
  /**Get gamepad manager
   * @returns {GamePadManager}
   */
  getGamePadManager() {
    return this.gamePadManager;
  }
}
module.exports.GameInput = GameInput;
