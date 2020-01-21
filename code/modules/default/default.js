
let three = require("three");

export function register(api) {
  api.renderer.scene.add(
    new three.DirectionalLight(0xffffff, 0.8)
  );
  api.renderer.scene.add(
    new three.AmbientLight(0xffffff, 0.2)
  );
  
  let tex = new three.TextureLoader().load("./code/modules/default/test.png");
  tex.magFilter = three.NearestFilter;
  tex.minFilter = three.LinearMipMapLinearFilter;
  let cube = new three.Mesh(
    new three.BoxBufferGeometry(
      2,
      2,
      2,
      1,
      1,
      1
    ),
    new three.MeshLambertMaterial({
      map: tex,
      color: 0xffffff,
      reflectivity: 2,
      transparent: true
    })
  );
  api.renderer.scene.add(cube);
  cube.position.set(0, 0, -5);
  
  let ground = new three.Mesh(
    new three.BoxBufferGeometry(
      50,
      1,
      50,
      1,
      1,
      1
    ),
    new three.MeshPhongMaterial({ color: 0x808080 })
  );
  api.renderer.scene.add(ground);
  ground.position.set(0, -4, 0);
}
