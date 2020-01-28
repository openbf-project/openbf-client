
let { Clock } = require("three");

class TimeManager {
  constructor (fps=20) {
    this.clock = new Clock(true);
    this.updateCallbacks = new Array();
    this.loop = true;
    this.timer;
    this.fps = fps;
    this.delta = 0;
    this.lastTime = 0;
    this.now = 0;
  }

  /**Listen to updates (game loop)
   * @param {Function} cb callback
   */
  listen (cb) {
    this.updateCallbacks.push(cb);
  }

  start () {
    this.stop();
    this.timer = setInterval(()=>this.onTick(), this.fps);
  }

  stop () {
    if (this.timer !== undefined) clearInterval(this.timer);
  }

  onTick () {
    this.now = Date.now();
    this.delta = (this.now - this.lastTime)/1000;
    this.lastTime = this.now;
    for (let cb of this.updateCallbacks) {
      cb();
    }
  }
}

export default TimeManager;
