
const { on, off } = require("../utils/aliases.js");

module.export.Input = class Input {
  constructor () {
    this.pointer = {
      x:0,
      y:0,
      lx:0,
      ly:0,
      leftDown:false,
      rightDown:false
    };
    /**@type {Map<string,boolean>} keyname:state*/
    this.keyboard = new Map();
    /**@param {MouseEvent} evt*/
    this.onMouseMove = (evt)=>{
      if (evt.buttons > 0) {
        if (evt.button === 0) {
          this.pointer.leftDown = true;
        } else if (evt.button === 2) {
          this.pointer.rightDown = true;
        }
      }
      this.setPointerXY(evt.clientX, evt.clientY);
      this.onEvent("pointer-move");
    };
    /**@param {TouchEvent} evt*/
    this.onTouchMove = (evt)=>{
      let item = evt.changedTouches.item(0);
      this.pointer.leftDown = true;
      this.setPointerXY(item.clientX, item.clientY);
      this.onEvent("pointer-move");
    };

    /**@param {MouseEvent} evt*/
    this.onMouseDown = (evt)=>{
      evt.preventDefault();
      this.setPointerXY(evt.clientX, evt.clientY);
      if (evt.button === 0) {
        this.pointer.leftDown = true;
      } else if (evt.button === 2) {
        this.pointer.rightDown = true;
      }
      this.onEvent("pointer-down");
    }
    /**@param {TouchEvent} evt*/
    this.onTouchStart = (evt)=>{
      this.pointer.leftDown = true;
      let item = evt.changedTouches.item(0);
      this.setPointerXY(item.clientX, item.clientY);
      this.onEvent("pointer-down");
    }
    /**@param {MouseEvent} evt*/
    this.onMouseUp = (evt)=>{
      this.setPointerXY(evt.clientX, evt.clientY);
      if (evt.button === 0) {
        this.pointer.leftDown = false;
      } else if (evt.button === 2) {
        this.pointer.rightDown = false;
      }
      this.onEvent("pointer-up");
    }
    /**@param {TouchEvent} evt*/
    this.onTouchEnd = (evt)=>{
      this.pointer.leftDown = false;
      let item = evt.changedTouches.item(0);
      this.setPointerXY(item.clientX, item.clientY);
      this.onEvent("pointer-up");
    }
    /**@param {TouchEvent} evt*/
    this.onTouchCancel = (evt)=> {
      this.pointer.leftDown = false;
      let item = evt.changedTouches.item(0);
      this.setPointerXY(item.clientX, item.clientY);
      this.onEvent("pointer-up");
    }
    /**@param {KeyboardEvent} evt*/
    this.onKeyDown = (evt)=>{
      this.keyboard.set(evt.key, true);
      this.onEvent("key-down");
    }
    /**@param {KeyboardEvent} evt*/
    this.onKeyUp = (evt)=>{
      this.keyboard.set(evt.key, false);
      this.onEvent("key-up");
    }
    this.onContextMenu = (evt)=>{
      evt.preventDefault();
    }
    /**@callback eventCallback
     * @param {"key-up"|"key-down"|"pointer-up"|"pointer-down"} type
     * @type {Array<eventCallback>} */
    this.listeners = new Array();

    /**@type {HTMLCanvasElement}*/
    this.pointerLockElement;
    
    this.pointerLockChange = (e) => {
      this.mouse.locked = document.pointerLockElement !== null;
    }
  }
  setPointerXY (x, y) {
    this.pointer.lx = this.pointer.x;
    this.pointer.ly = this.pointer.y;
    this.pointer.x = x;
    this.pointer.y = y;
  }
  /**Listen to events
   * @param {eventCallback} cb
   * @callback eventCallback
   * @param {"key-up"|"key-down"|"pointer-up"|"pointer-down"} type
   */
  listen (cb) {
    if (!cb) throw "Callback cannot be " + cb;
    this.listeners.push(cb);
  }
  /**Remove a listener
   * @param {eventCallback} cb
   * @returns {boolean} false if callback wasn't contained in the listeners
   */
  deafen (cb) {
    let ind = this.listeners.indexOf(cb);
    if (ind === -1) return false;
    this.listeners.splice(ind, 1);
    return true;
  }
  unregisterEvents () {
    off(window, "mousemove", this.onMouseMove);
    off(window, "touchmove", this.onTouchMove);

    off(window, "mousedown", this.onMouseDown);
    off(window, "touchstart", this.onTouchStart);

    off(window, "mouseup", this.onMouseUp);
    off(window, "touchend", this.onTouchEnd);
    off(window, "touchcancel", this.onTouchCancel);

    off(window, "keyup", this.onKeyUp);
    off(window, "keydown", this.onKeyDown);
    off(window, "contextmenu", this.onContextMenu);
  }
  registerEvents () {
    on(window, "mousemove", this.onMouseMove);
    on(window, "touchmove", this.onTouchMove);

    on(window, "mousedown", this.onMouseDown);
    on(window, "touchstart", this.onTouchStart);

    on(window, "mouseup", this.onMouseUp);
    on(window, "touchend", this.onTouchEnd);
    on(window, "touchcancel", this.onTouchCancel);

    on(window, "keyup", this.onKeyUp);
    on(window, "keydown", this.onKeyDown);
    on(window, "contextmenu", this.onContextMenu);
  }
  /**@param {"key-up"|"key-down"|"pointer-up"|"pointer-down"} type*/
  onEvent (type) {
    for (let l of this.listeners) {
      l(type);
    }
  }
  tryLock(canvas) {
    this.pointerLockElement = canvas;
    document.addEventListener("pointerlockchange", (e)=>this.pointerLockChange(e));
    this.pointerLockElement.requestPointerLock();
  }
  unlock () {
    document.exitPointerLock();
  }
}
