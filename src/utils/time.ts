
export interface updateCallback {
  (delta: number):void;
}

export class TimeManager {
  private updateCallbacks: Set<updateCallback>;
  loop: boolean;
  intervalId: number = -1;
  fps: number;
  delta: number = 0;
  lastTime: number = 0;
  now: number = 0;
  secondCounter: number = 0;
  fpsCounter: number = 0;
  avgfps: number = 0;
  intervalDelay: number = 0;

  constructor (fps: number = 60) {
    this.updateCallbacks = new Set();
    this.loop = true;
    this.intervalId;
    this.fps = fps;
    this.delta = 0;
    this.lastTime = 0;
    this.now = 0;

    this.secondCounter = 0;
    this.fpsCounter = 0;
    this.avgfps = 0;
  }
  isListening (cb: updateCallback): boolean {
    return this.updateCallbacks.has(cb);
  }
  listen (cb: updateCallback): TimeManager {
    if (this.isListening(cb)) throw "Cannot listen with same listener twice";
    this.updateCallbacks.add(cb);
    return this;
  }
  deafen (cb: updateCallback): TimeManager {
    if (this.isListening(cb)) this.updateCallbacks.delete(cb);
    return this;
  }
  start (): TimeManager {
    this.stop();
    this.intervalDelay = 1000/this.fps;
    this.intervalId = setInterval(()=>this.onTick(), this.intervalDelay);
    return this;
  }
  stop (): TimeManager {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = -1;
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
