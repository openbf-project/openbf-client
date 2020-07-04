
//import { Clock } from "three";

class TimeManager {
  constructor (fps=60) {
    //this.clock = new Clock(true);
    /**@type {Array<updateCallback>}*/
    this.updateCallbacks = new Array();
    this.loop = true;
    this.timer;
    this.fps = fps;
    this.delta = 0;
    this.lastTime = 0;
    this.now = 0;

    this.secondCounter = 0;
    this.fpsCounter = 0;
    this.avgfps = 0;
  }

  /**Listen to updates (game loop)
   * @param {updateCallback} cb callback
   * @callback updateCallback
   * @param {number} delta
   */
  listen (cb) {
    this.updateCallbacks.push(cb);
    return this;
  }

  start () {
    this.stop();
    this.frameTime = 1000/this.fps;
    this.timer = setInterval(()=>this.onTick(), this.frameTime);
    return this;
  }

  stop () {
    if (this.timer !== undefined) clearInterval(this.timer);
    return this;
  }

  onTick () {
    this.now = Date.now();
    this.delta = (this.now - this.lastTime)/1000;
    this.secondCounter += this.delta;
    this.fpsCounter ++;
    if (this.secondCounter >= 0.99) {
      this.secondCounter = 0;
      this.avgfps = this.fpsCounter;
      this.fpsCounter = 0;
    }
    this.lastTime = this.now;
    for (let cb of this.updateCallbacks) {
      cb(this.delta);
    }
  }
}

module.exports = TimeManager;
