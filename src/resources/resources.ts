

import API from "../api.js";
const api: API = API.get();

const textDec = new TextDecoder();

export class Resource {
  arrayBuffer: ArrayBuffer;
  url: string;
  constructor() {
  }
  setArrayBuffer(ab: ArrayBuffer): Resource {
    this.arrayBuffer = ab;
    return this;
  }
  text(): string {
    let result = textDec.decode(this.arrayBuffer);
    console.log(result);
    return result;
  }
  json(): any {
    return JSON.parse(this.text());
  }
}

export class ResourceManager {
  resources: Map<string, Resource>;
  resourceTransport: string = "http";
  resourceDomain: string = "localhost:8080";
  static SINGLETON: ResourceManager = undefined;
  constructor() {
    if (ResourceManager.SINGLETON) throw "Cannot instance ResourceManager twice";
    this.resources = new Map();
  }
  static get(): ResourceManager {
    if (!ResourceManager.SINGLETON) {
      ResourceManager.SINGLETON = new ResourceManager();
    }
    return ResourceManager.SINGLETON;
  }
  resourceNameToURL(name: string, mod: Module | undefined = undefined): string {
    switch (name.charAt(0)) {
      case ModuleManager.MODULE_RESOURCE_PREFIX:
        //Relative to module/resources
        break;
      case "~":
        //JSON query
        console.log(name);
        break;
    }
    return `${this.resourceTransport}://${this.resourceDomain}/${name}`;
  }
  /**Internal - used to load resources
   * @param name of resource
   */
  _loadResource(name: string): Promise<Resource> {
    return new Promise(async (resolve, reject) => {
      let url: string;
      try {
        url = this.resourceNameToURL(name);
        console.log(url);
      } catch (ex) {
        reject(`Couldn't parse resource name to url ${name}`);
      }
      let result = await fetch(url)
        .then((res) => res.arrayBuffer())
        .catch(reject);
      if (result) {
        resolve(new Resource().setArrayBuffer(result));
      } else {
        reject("Could not parse resource to array buffer");
      }
    });
  }
  hasResource(name: string): boolean {
    return this.resources.has(name);
  }
  deleteResource(name: string): ResourceManager {
    this.resources.delete(name);
    return this;
  }
  setResource(name: string, res: Resource): ResourceManager {
    this.resources.set(name, res);
    return this;
  }
  /**Gets a resource, which may or may not be loaded already
   * Rejects if resource couldn't be fetched
   * @param name of resource
   */
  getResource(name: string): Promise<Resource> {
    return new Promise(async (resolve, reject) => {
      let result: Resource | void;
      if (this.hasResource(name)) {
        result = this.resources.get(name);
      } else {
        result = await this._loadResource(name).catch((reason) => {
          reject(reason);
        });
      }
      if (result) {
        resolve(result);
      } else {
        //Doesn't happen
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

export class Module extends Resource {
  isLoaded: boolean = false;
  imps: any;
  setLoaded (loaded:boolean): Module {
    this.isLoaded = loaded;
    return this;
  }
  getLoaded (): boolean {
    return this.isLoaded;
  }
  setImports (imps: any): Module {
    this.imps = imps;
    return this;
  }
  getImports (): any {
    return this.imps;
  }
}

export class ModuleManager {
  static MODULE_RESOURCE_PREFIX = "@";
  static MODULE_FETCH_PREFIX = "$";
  static SINGLETON: ModuleManager = undefined;
  loadedModules: Map<string, Module>;
  constructor() {
    if (!ModuleManager.SINGLETON) {
      ModuleManager.SINGLETON = this;
    } else {
      throw "Module should not be instantiated more than once";
    }
    this.loadedModules = new Map();
  }
  static get(): ModuleManager {
    if (!ModuleManager.SINGLETON) {
      new ModuleManager();
    }
    return ModuleManager.SINGLETON;
  }
  addModule(name: string, mod: Module): ModuleManager {
    if (this.hasModule(name)) throw `Adding module of same name ${name}`;
    this.setModule(name, mod);
    return this;
  }
  hasModule(name: string): boolean {
    return this.loadedModules.has(name);
  }
  setModule(name: string, mod: Module): ModuleManager {
    this.loadedModules.set(name, mod);
    return this;
  }
  async _loadModule (mod: Module) {
    let pkgJson = await fetch(`${mod.url}/package.json`).then((r)=>r.json());
    if (pkgJson.main) {
      let _path = ResourceManager.get().resourceNameToURL(
        `${mod.url}/${pkgJson.main}`
      )
      let imps = await import (_path);
      mod.setImports(imps);
      mod.setLoaded(true);
    }
  }
  getModule(name: string): Promise<Module> {
    return new Promise(async (resolve, reject) => {
      if (this.hasModule(name)) {
        let result: Module = this.loadedModules.get(name);
        if (!result.getLoaded()) {
          console.log("Loading not loaded module", name);
          await this._loadModule (result);
        }
        resolve(result);
      } else {
        reject("No module is known for ${name}, did you forget to queryModules() ?");
      }
    });
  }
  listModules(): Array<Module> {
    let result = new Array();
    this.loadedModules.forEach((v, k) => {
      result.push(k);
    });
    return result;
  }
  queryModules(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      let json = (
        await ResourceManager.get()
          .getResource("~query.modules")
      ).json();
      console.log(json);
      let keys = Object.keys(json.data);
      for (let key of keys) {
        let mod = new Module();
        mod.setArrayBuffer(undefined);
        mod.url = json.data[key];
        mod.setLoaded(false);
        this.addModule(key, mod);
      }
      resolve(json);
    });
  }
}

