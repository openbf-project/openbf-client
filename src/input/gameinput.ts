
import { Input } from "./input.js";
import { on, off } from "../aliases.js";

export class InputBinding {
  keys: Set<string>;
  rects: Set<TouchRect>;
  gpBtns: Set<number>;
  padAxes: Set<AxisRule>;
  constructor() {
    this.keys = new Set<string>();
    this.rects = new Set<TouchRect>();
    this.gpBtns = new Set<number>();
    this.padAxes = new Set<AxisRule>();
  }
  setKeys(...keys:string[]): InputBinding {
    if (keys.length < 1) throw "Use at least one key";
    this.keys.clear();
    this.addKeys(...keys);
    return this;
  }
  addKeys(...keys: string[]): InputBinding {
    for (let k of keys) {
      this.addKey(k);
    }
    return this;
  }
  addKey(key: string): InputBinding {
    if (typeof (key) !== "string") throw `Key must be type of string, got ${typeof (key)}`;
    if (this.keys.has(key)) throw `Cannot add keyboard key ${key} twice!`;
    this.keys.add(key);
    return this;
  }
  addRect(r: TouchRect): InputBinding {
    if (!(r instanceof TouchRect)) throw `${r} not an instance of TouchRect`;
    if (this.rects.has(r)) throw "Cannot add TouchRect twice!";
    this.rects.add(r);
    return this;
  }
  addPadButton(btn: number): InputBinding {
    if (typeof (btn) !== "number") throw `${btn} not a number: is ${typeof (btn)}`;
    if (this.gpBtns.has(btn)) throw `Cannot add gamepad button ${btn} twice!`;
    this.gpBtns.add(btn);
    return this;
  }
  addPadButtons(...btns: number[]): InputBinding {
    for (let btn of btns) {
      this.addPadButton(btn);
    }
    return this;
  }
  addPadAxisRule(rule: AxisRule): InputBinding {
    if (!(rule instanceof AxisRule)) {
      throw `${rule} not instanceof AxisRule`;
    }
    if (this.padAxes.has(rule)) throw "Cannot add axis rule twice";
    this.padAxes.add(rule);
    return this;
  }
  createPadAxisRule(axisId: number, rule: number, compareValue: number): AxisRule {
    let result = new AxisRule()
      .setAxisId(axisId)
      .setCompareRule(rule)
      .setCompareValue(compareValue);
    this.addPadAxisRule(result);
    return result;
  }
  test(input: GameInput): boolean {
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
          // if (gp.vibrationActuator) {
          //   gp.vibrationActuator.playEffect("dual-rumble", {
          //     startDelay: 0,
          //     duration: parseInt(30 * Math.random()),
          //     weakMagnitude: Math.random(),
          //     strongMagnitude: Math.random()
          //   })
          // }
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

export class GamePadManager {
  static SINGLETON:GamePadManager|undefined = undefined;
  primary: Gamepad|undefined;
  allGamePadsFix: Array<Gamepad>;

  onGamePadConnected: (evt: GamepadEvent) =>void;
  onGamePadDisconnected: (evt) =>void;
  constructor() {
    if (!GamePadManager.SINGLETON) {
      GamePadManager.SINGLETON = this;
    } else {
      throw "GamePadManager should not be instantiated more than once";
    }
    this.primary = undefined;

    this.allGamePadsFix = new Array();

    this.onGamePadConnected = (evt) => {
      if (evt.gamepad !== null) {
        this.allGamePadsFix.push(evt.gamepad);
        console.log("Added gamepad", evt.gamepad);
      } else {
        console.log("Couldn't add null gamepad");
      }
    }
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
  static get(): GamePadManager {
    if (!GamePadManager.SINGLETON) {
      new GamePadManager();
    }
    return GamePadManager.SINGLETON;
  }
  registerEvents() {
    on(window, "gamepadconnected", this.onGamePadConnected);
    on(window, "gamepaddisconnected", this.onGamePadDisconnected);
  }
  unregisterEvents() {
    off(window, "gamepadconnected", this.onGamePadConnected);
    off(window, "gamepaddisconnected", this.onGamePadDisconnected);
  }
  nativeGetAllGamepads(): Array<Gamepad> {
    return navigator.getGamepads();
  }
  findGamepad(): Gamepad|undefined {
    let gps = this.nativeGetAllGamepads();
    for (let gp of gps) {
      if (gp && gp.connected) {
        return gp;
      }
    }
    return undefined;
  }
  /**Tries to populate the primary controller
   * Returns success or not
   */
  ensure() {
    if (!this.primary || !this.primary.connected) {
      this.primary = this.findGamepad();
      if (this.primary === undefined) {
        //console.warn("Couldn't find any valid game pads in navigator..");
        return false;
      }
      return true;
    }
    return true;
  }
  getPrimary(): Gamepad {
    return this.primary;
  }
  getPrimaryButton(btn: number): boolean {
    if (this.ensure()) {
      return this.getPrimary().buttons[btn].pressed;
    }
    return false;
  }
}

export interface RendererInterface {
  rect: DOMRect;
  center: {x: number, y: number};
  zoom: number;
}

export class AxisRule {
  static GREATER_THAN = 0;
  static LESS_THAN = 1;

  axisId = 0;
  rule: number;
  compareValue: number;

  constructor() {
    this.axisId = 0;
    this.rule = AxisRule.GREATER_THAN;
    this.compareValue = 0.5;
  }
  setAxisId(id: number): AxisRule {
    this.axisId = id;
    return this;
  }
  getAxisId(): number {
    return this.axisId;
  }
  setCompareValue(v: number): AxisRule {
    this.compareValue = v;
    return this;
  }
  getCompareValue(): number {
    return this.compareValue;
  }
  setCompareRule(rule: number): AxisRule {
    if (typeof (rule) !== "number") throw `Rule ${rule} not a number`;
    this.rule = rule;
    return this;
  }
  getCompareRule(): number {
    return this.rule;
  }
  test(gp: Gamepad): boolean {
    let ax = gp.axes[this.axisId];
    if (this.rule === AxisRule.GREATER_THAN) {
      return (ax > this.compareValue);
    } else if (this.rule === AxisRule.LESS_THAN) {
      return (ax < this.compareValue);
    }
  }
}

export class TouchRect {
  top: number;
  left: number;
  width: number;
  height: number;
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
  setPosition(top: number, left:number): TouchRect {
    this.top = top;
    this.left = left;
    return this;
  }
  setSize(width: number, height:number): TouchRect {
    this.width = width;
    this.height = height;
    return this;
  }
  pointInside(nx: number, ny: number): boolean {
    return (
      nx > this.left &&
      nx < this.left + this.width &&
      ny > this.top &&
      ny < this.top + this.height
    );
  }
}

export class GameInput {
  static SINGLETON: GameInput = undefined;
  raw: Input;
  inputBindings: Map<string, InputBinding>;
  renderer: RendererInterface;
  gamePadManager: GamePadManager;

  constructor() {
    if (!GameInput.SINGLETON) {
      GameInput.SINGLETON = this;
    } else {
      throw "GameInput should not be instantiated more than once";
    }
    this.raw = new Input();
    this.raw.registerEvents();

    this.inputBindings = new Map();

    this.renderer = undefined;
    this.gamePadManager = GamePadManager.get();
  }

  setRenderer(renderer: RendererInterface) {
    this.renderer = renderer;
  }
  static get(): GameInput {
    if (!GameInput.SINGLETON) {
      new GameInput();
    }
    return GameInput.SINGLETON;
  }
  addBinding(name: string, binding: InputBinding) {
    if (this.inputBindings.has(name)) throw `Cannot add ${name} as it is in use already`;
    this.inputBindings.set(name, binding);
  }
  createBinding(name: string): InputBinding {
    let result = new InputBinding();
    this.addBinding(name, result);
    return result;
  }
  hasBinding(name: string): boolean {
    return this.inputBindings.has(name);
  }
  getBinding(name: string): InputBinding {
    if (!this.hasBinding(name)) throw `No binding found for ${name}`;
    return this.inputBindings.get(name);
  }
  getButton(name: string): boolean {
    return this.getBinding(name).test(this);
  }
  static getButton(name: string): boolean {
    return GameInput.SINGLETON.getButton(name);
  }
  get pointerScreenX(): number {
    return this.raw.pointer.x;
  }
  static get pointerScreenX(): number {
    return GameInput.SINGLETON.pointerScreenX;
  }
  get pointerScreenY(): number {
    return this.raw.pointer.y;
  }
  static get pointerScreenY(): number {
    return GameInput.SINGLETON.pointerScreenY;
  }
  get pointerWorldX(): number {
    return this.pointerScreenCenteredX - this.renderer.center.x;
  }
  static get pointerWorldX(): number {
    return GameInput.SINGLETON.pointerWorldX;
  }
  get pointerWorldY(): number {
    return this.pointerScreenCenteredY - this.renderer.center.y;
  }
  static get pointerWorldY(): number {
    return GameInput.SINGLETON.pointerWorldY;
  }
  get pointerScreenCenteredX(): number {
    return (this.pointerScreenX - (this.renderer.rect.width / 2)) / this.renderer.zoom;
  }
  static get pointerScreenCenteredX(): number {
    return GameInput.SINGLETON.pointerScreenCenteredX;
  }
  get pointerScreenCenteredY(): number {
    return (this.pointerScreenY - (this.renderer.rect.height / 2)) / this.renderer.zoom;
  }
  static get pointerScreenCenteredY(): number {
    return GameInput.SINGLETON.pointerScreenCenteredY;
  }
  get pointerPrimary(): boolean {
    return this.raw.pointer.leftDown;
  }
  static get pointerPrimary(): boolean {
    return GameInput.SINGLETON.pointerPrimary;
  }
  get pointerSecondary(): boolean {
    return this.raw.pointer.rightDown;
  }
  static get pointerSecondary(): boolean {
    return GameInput.SINGLETON.pointerSecondary;
  }
  get pointerNormalizedX(): number {
    return this.raw.pointer.x / this.renderer.rect.width;
  }
  static get pointerNormalizedX(): number {
    return GameInput.SINGLETON.pointerNormalizedX;
  }
  get pointerNormalizedY(): number {
    return this.raw.pointer.y / this.renderer.rect.height;
  }
  static get pointerNormalizedY(): number {
    return GameInput.SINGLETON.pointerNormalizedY;
  }
  getGamePadManager(): GamePadManager {
    return this.gamePadManager;
  }
}
