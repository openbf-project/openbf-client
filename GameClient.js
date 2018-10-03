
const THREE = require("three");
const Scene = THREE.Scene;
const PerspectiveCamera = THREE.PerspectiveCamera;
const WebGLRenderer = THREE.WebGLRenderer;

let {nodemsh, nodeter} = require("node-openbf-io");
let {BundleManager} = require("node-openbf-bundle");

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

        //Test nodemsh from node-openbf-io project
        let parser = new nodemsh();
        parser.parse("imp_weap_inf_rifle.msh", (result)=>{
            console.log(result);
        });
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