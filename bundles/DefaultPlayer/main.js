
let {Bundle} = require("node-openbf-bundle");

class DefaultPlayer extends Bundle {
    constructor (game, name, displayName) {
        super(game, name, displayName);
    }

    onReady () {
        console.log("Hello from DefaultPlayer bundle! I've loaded!");
    }
}

module.exports = DefaultPlayer;
