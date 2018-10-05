
const path = require("path");

const THREE = require("three");
const Scene = THREE.Scene;
const PerspectiveCamera = THREE.PerspectiveCamera;
const WebGLRenderer = THREE.WebGLRenderer;

let {BundleManager} = require("node-openbf-bundle");

const LogicClock = require("./LogicClock.js");
const Input = require("./input.js");

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
            75,
            this.domRect.width / this.domRect.height, //Aspect ratio
            0.1, //Near clip
            500, //Far clip
        );
        this.currentCamera.position.z = 5;

        this.clock = new LogicClock(30);
        this.clock.onUpdate = ()=>this.onUpdate();
        this.clock.start();

        this.bundleManager = new BundleManager(this);
        this.bundleManager.importBundles("./bundles", (bundles)=>{
            for (let i=0; i<bundles.length; i++) {
                bundles[i].onReady();
            }
        });

        this.secondTimer = 0;
        this.frameRate = 0;
        this.fps = 0;

        window.addEventListener("resize", ()=>this.onResize());
        this.inputManager = new Input(window.document);
    }

    onUpdate () {
        this.secondTimer += this.clock.timeEnlapsed;
        this.frameCounter++;
        if (this.secondTimer >= this.clock.resolutionPerSecond) {
            this.secondTimer = 0;
            this.fps = this.frameCounter;
            document.title = this.fps;
            this.frameCounter = 0;
        }
        for (let i=0; i<this.bundleManager.loadedBundles.length; i++) {
            this.bundleManager.loadedBundles[i].onUpdate();
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