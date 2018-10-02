
class LogicClock {
    constructor (updatesPerSecond) {
        this.updatesPerSecond = 30; //How many times to fire a loop iteration per second
        if (updatesPerSecond) this.updatesPerSecond = updatesPerSecond;
        this.resolutionPerSecond = 1000; //Milliseconds
        this.timeBetweenUpdates = this.resolutionPerSecond/this.updatesPerSecond;
        this.timeEnlapsed = 0; //Enlapsed time since last loop iteration
        this.timeNow = 0; //Current time
        this.timeDelta = 0;
        this.timeLast = 0;

        this.updates = 0;

        /*Create a callback to this class's method 'onFrame' because
        if we call requestAnimationFrame on the method directly
        the keyword 'this' will be 'window' instead of the class the method belongs to..

        The arrow function allows you to keep the context 'this' to whatever the
        function actually belongs to, instead of 'window'
        */
        this.onAnimationFrameCallback = ()=>this.onFrame();
    }

    start () {
        window.requestAnimationFrame(this.onAnimationFrameCallback);
    }

    onFrame () {
        window.requestAnimationFrame(this.onAnimationFrameCallback);
        this.timeNow = window.performance.now();
        this.timeEnlapsed = this.timeNow - this.timeLast;
        if (this.timeEnlapsed >= this.timeBetweenUpdates) {
            this.timeDelta = this.timeEnlapsed / this.timeBetweenUpdates;
            this.onUpdate();
            //Get new now because functions take time to execute
            this.timeLast = window.performance.now();
        }
    }

    onUpdate () {
        //Empty function! Overwrite this in your code
    }
}

module.exports = LogicClock;