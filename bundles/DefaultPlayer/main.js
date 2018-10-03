
let path = require("path");

let {nodemsh} = require("node-openbf-io");
let {Bundle} = require("node-openbf-bundle");

class DefaultPlayer extends Bundle {
    constructor (game, name, displayName) {
        super(game, name, displayName);
    }

    onReady () {
        console.log("[Bundle]", "DefaultPlayer", "Testing capabilities");

        let parser = new nodemsh();

        //Get the file's path within this module's directory
        let f = path.join(__dirname, "imp_weap_inf_rifle.msh");

        parser.parse(f, (result)=>{
            console.log(result);
        });
    }
}

module.exports = DefaultPlayer;
