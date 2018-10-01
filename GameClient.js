
const THREE = require("three");
const Scene = THREE.Scene;
const PerspectiveCamera = THREE.PerspectiveCamera;
const WebGLRenderer = THREE.WebGLRenderer;

const LogicClock = require("./LogicClock.js");

let elem = (id)=>document.getElementById(id);
let rect = (e)=>e.getBoundingClientRect();

class GameClient {
    constructor () {
        this.domContainer = elem("container");
        this.domRect = rect(this.domContainer);

        //Three.js renderer code
        this.renderer = new WebGLRenderer();
        this.renderer.setSize(
            this.domRect.width,
            this.domRect.height
        );
        this.domContainer.appendChild(this.renderer.domElement);
        
        //Three.js scene and camera code
        this.currentScene = new Scene();
        this.currentCamera = new PerspectiveCamera(
            this.domRect.width / this.domRect.height, //Aspect ratio
            0.01, //Near clip
            500, //Far clip
        );

        this.clock = new LogicClock();
        this.clock.onUpdate = ()=>this.onUpdate();
        this.clock.start();

        window.addEventListener("resize", ()=>this.onResize());
    }

    onUpdate () {
        this.updates++;
        this.frameRate++;
        this.secondTimer += this.timeEnlapsed;
        if (this.secondTimer >= this.resolutionPerSecond) {
            this.secondTimer = 0;
            this.frameRate = 0;
        }
        
        this.renderer.render(this.currentScene, this.currentCamera);
    }

    onResize () {
        this.domRect = rect(this.domContainer);
        this.renderer.setSize(
            this.domRect.width,
            this.domRect.height
        );
        this.currentCamera.aspect = this.domRect.width / this.domRect.height;
        this.currentCamera.updateProjectionMatrix();
    }
}

module.exports = GameClient;