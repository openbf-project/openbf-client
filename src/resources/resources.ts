
export class Resource {
  arrayBuffer: ArrayBuffer;
  constructor () {
  }
  setArrayBuffer( ab: ArrayBuffer ): Resource {
    this.arrayBuffer = ab;
    return this;
  }
}

export class ResourceManager {
  resources: Map<string, Resource>;
  resourceRootURL: "http://localhost/resource";
  constructor () {
    this.resources = new Map();
  }
  resourceNameToURL (name: string): string {
    return `${this.resourceRootURL}/${name}`;
  }
  /**Internal - used to load resources
   * @param name of resource
   */
  _loadResource (name: string): Promise<Resource> {
    return new Promise(async (resolve, reject)=>{
      let url: string;
      try {
        url = this.resourceNameToURL(name);
      } catch (ex) {
        reject(`Couldn't parse resource name to url ${name}`);
      }
      let result = await fetch(url)
        .then((res)=>res.arrayBuffer())
        .catch(reject);
      if (result) {
        resolve(new Resource().setArrayBuffer(result));
      } else {
        reject("Could not parse resource to array buffer");
      }
    });
  }
  hasResource (name: string): boolean {
    return this.resources.has(name);
  }
  deleteResource (name: string): ResourceManager {
    this.resources.delete(name);
    return this;
  }
  setResource (name: string, res: Resource): ResourceManager {
    this.resources.set(name, res);
    return this;
  }
  /**Gets a resource, which may or may not be loaded already
   * Rejects if resource couldn't be fetched
   * @param name of resource
   */
  getResource (name: string): Promise<Resource> {
    return new Promise(async (resolve, reject)=>{
      if (this.hasResource(name)) {
        resolve(this.resources.get(name));
      } else {
        resolve(await this._loadResource(name));
      }
    });
  }
  // loadModel(fname, parseExtras = false) {
  //   return new Promise((resolve, reject) => {
  //     try {
  //       this.getGLTFLoader().load(fname, (model) => {
  //         if (parseExtras) {
  //           model.scene.traverse((child) => {
  //             this.onParseModelExtras(model, child);
  //           });
  //           if (model.animations && model.animations.length > 0) {
  //             model.scene.userData.animMixer = new AnimationMixer(model.scene);
  //             model.animations.forEach((clip) => {
  //               model.scene.userData.animMixer.clipAction(clip).play();
  //             });
  //           }
  //         }
  //         resolve(model);
  //       }, undefined, reject);
  //     } catch (ex) {
  //       reject(ex);
  //     }
  //   });
  // }
}
