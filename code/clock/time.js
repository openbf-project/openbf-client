
let { Clock } = require("three");

class TimeManager {
  constructor (fps=20) {
    this.clock = new Clock(true);
    this.updateCallbacks = new Array();
    this.loop = true;
    this.timer;
    this.fps = fps;
  }

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
    for (let cb of this.updateCallbacks) {
      cb();
    }
  }
}

export default TimeManager;
