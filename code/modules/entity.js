
let Object3D = require("three").Object3D;

export function register (api) {
  console.log("Entity", api);
}

export class Entity extends Object3D {
  constructor () {
    super();
  }
}
