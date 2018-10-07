
let path = require("path");

let {nodemsh} = require("node-openbf-io");
let {Bundle} = require("node-openbf-bundle");
let THREE = require("three");

class DefaultPlayer extends Bundle {
    constructor (game, name, displayName) {
        super(game, name, displayName);
    }

    onReady () {
        console.log("[Bundle][DefaultPlayer] I loaded!");


        let light = new THREE.DirectionalLight( 0xffffff, 1.0 );
        this.game.currentScene.add(light);

        let cube = new THREE.Mesh(
            new THREE.BoxBufferGeometry(
                2,
                2,
                2,
                1,
                1,
                1
            ),
            new THREE.MeshBasicMaterial({
                map:new THREE.TextureLoader().load(path.join(__dirname, "test.png")),
                color: 0xffffff
            })
        );
        this.game.currentScene.add(cube);
        document.addEventListener("click", ()=>{
            this.game.inputManager.lockMouse(this.game.renderer.domElement);
        });
        document.addEventListener("keyup", (evt)=>{
            if (evt.code === "Escape") {
                this.game.inputManager.unlockMouse();
            }
        });

        //Create an MSH file parser
        /*let parser = new nodemsh();

        //Get the file's path within this module's directory
        let f = path.join(__dirname, "imp_weap_inf_rifle.msh");

        //Parse the file
        parser.parse(f, (result)=>{
            //Do stuff with the parsed data
            console.log(result);
        });*/
    }

    onUpdate () {
        if (!this.game && !this.game.inputManager) {
            console.log(this.game, this.game.inputManager);
            return;
        }
        
        if (this.game.inputManager.mouse.isLocked) {
            this.game.currentCamera.rotation.y -= this.game.inputManager.mouse.xdelta * 0.001;
        }
        if (this.game.inputManager.mouse.isLocked) {
            this.game.currentCamera.rotation.x -= this.game.inputManager.mouse.ydelta * 0.001;
        }

        if (this.game.inputManager.isKeyDown("w")) {
            this.game.currentCamera.position.z -= 0.1;
        } else if (this.game.inputManager.isKeyDown("s")) {
            this.game.currentCamera.position.z += 0.1;
        }
        if (this.game.inputManager.isKeyDown("a")) {
            this.game.currentCamera.position.x -= 0.1;
        } else if (this.game.inputManager.isKeyDown("d")) {
            this.game.currentCamera.position.x += 0.1;
        }
    }
}

module.exports = DefaultPlayer;
