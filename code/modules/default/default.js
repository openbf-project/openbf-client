
let three = require("three");
let AnimationMixer = three.AnimationMixer;
import GLTFLoader from "../../GLTFLoader.js";

export function register(api, _modpath) {
  api.renderer.scene.add(
    new three.DirectionalLight(0xffffff, 1)
  );
  api.renderer.scene.add(
    new three.AmbientLight(0xffffff, 1)
  );
  api.renderer.scene.add(
    new three.PointLight(0xffffff, 1, 100)
  );
  
  let tex = new three.TextureLoader().load(_modpath + "/test.png");
  tex.magFilter = three.NearestFilter;
  tex.minFilter = three.LinearMipMapLinearFilter;

  let fLoader = new GLTFLoader();
  fLoader.load(_modpath + "/demo-map.glb", (gltf)=>{
    api.renderer.scene.add(gltf.scene);
    console.log(gltf);
    let mixer = new AnimationMixer(gltf.scene);
    gltf.animations.forEach((clip)=>{
      mixer.clipAction(clip).play();
    });

    api.timeManager.listen(()=>{
      mixer.update(api.timeManager.delta);
    });
  });


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
  //api.renderer.scene.add(cube);
  //cube.position.set(0, 0, -5);
  
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
  //api.renderer.scene.add(ground);
  //ground.position.set(0, -4, 0);
}
