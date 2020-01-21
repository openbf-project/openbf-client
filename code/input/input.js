import { on } from "../aliases.js";

class Input {
  /**@param {HTMLElement} element 
   */
  constructor (element) {
    /**@type {HTMLElement} */
    this.element = element;
    this.mouse = {x:0, y:0, left:false, right:false};

    /**@type {Map<String, Boolean>} */
    this.keys = new Map();

    on(this.element, "mousemove", (e)=>this.onMouseMove(e));
    on(this.element, "mousedown", (e)=>this.onMouseDown(e));
    on(this.element, "mouseup", (e)=>this.onMouseUp(e));
    on(this.element, "keyup", (e)=>this.onKeyUp(e));
    on(this.element, "keydown", (e)=>this.onKeyDown(e));
  }
  onMouseMove (e) {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
  }
  onMouseDown (e) {
    if (e.button === 0) {
      this.mouse.left = true;
    } else if (e.button === 2) {
      this.mouse.right = true;
    }
  }
  onMouseUp (e) {
    if (e.button === 0) {
      this.mouse.left = false;
    } else if (e.button === 2) {
      this.mouse.right = false;
    }
  }
  onKeyUp (e) {
    this.keys.set(e.key, false);
  }
  onKeyDown (e) {
    this.keys.set(e.key, true);
  }
  getKey (key) {
    return this.keys.get(key);
  }
}

export default Input;
