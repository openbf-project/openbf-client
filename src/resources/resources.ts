
import { Scene, Object3D } from "../libs/three/Three.js";
import { GLTFLoader } from "../libs/three-gltf/GLTFLoader.js";

import API from "../api.js";
const api: API = API.get();

const textDec = new TextDecoder();

//This will be replaced by gltf-ts when it is ready
const gltfLoader = new GLTFLoader();

//Because babel is fucking stupid
const MODULE_DEF_JSON_NAME = "module.json";

export class Resource {
  isLoaded: boolean = false;
  arrayBuffer: ArrayBuffer;
  url: string;
  resourceManager: ResourceManager;
  constructor() {
  }
  setLoaded(loaded: boolean): Resource {
    this.isLoaded = loaded;
    return this;
  }
  getLoaded(): boolean {
    return this.isLoaded;
  }
  setArrayBuffer(ab: ArrayBuffer): Resource {
    this.arrayBuffer = ab;
    return this;
  }
  text(): string {
    let result = textDec.decode(this.arrayBuffer);
    return result;
  }
  json(): any {
    return JSON.parse(this.text());
  }
  setResourceManager(manager: ResourceManager): Resource {
    this.resourceManager = manager;
    return this;
  }
  getResourceManager(): ResourceManager {
    return this.resourceManager;
  }
}

export class ModelResource extends Resource {
  scenes: Array<Object3D>;

  constructor() {
    super();
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
        let sepInd = name.indexOf(":");
        if (sepInd > 0) {
          let modName = name.substring(1, sepInd);
          name = name.substring(1 + sepInd);
          if (ModuleManager.get().hasModule(modName)) {
            let mod = ModuleManager.get().loadedModules.get(modName);
            name = `${mod.url}${name}`;
            break;
          } else {
            throw `cannot get relative resource of module before module is queryed or loaded ${modName}`;
          }
        }
        break;
    }
    return `${this.resourceTransport}://${this.resourceDomain}/${name}`;
  }
  /**Internal - used to load resources
   * @param name of resource
   */
  _loadResource(name: string, premadeRes: Resource = undefined): Promise<Resource> {
    return new Promise(async (resolve, reject) => {
      let url: string;
      try {
        url = this.resourceNameToURL(name);
      } catch (ex) {
        reject(`Couldn't parse resource name to url ${name}`);
      }
      let data = await fetch(url)
        .then((res) => res.arrayBuffer())
        .catch(reject);
      if (data) {
        let result: Resource = premadeRes;;
        if (!result) result = new Resource();
        result.url = url;
        result.setArrayBuffer(data).setResourceManager(this);
        resolve(result);
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
  getResource(name: string, premadeRes: Resource = undefined): Promise<Resource> {
    return new Promise(async (resolve, reject) => {
      let result: Resource | void = premadeRes;
      if (this.hasResource(name)) {
        result = this.resources.get(name);
      } else {
        result = await this._loadResource(name, result).catch((reason) => {
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
  getResourceModel(name: string): Promise<ModelResource> {
    return new Promise(async (resolve, reject) => {
      let res = await this.getResource(name).catch(reject) as ModelResource;
      if (!res) return;

      if (res.getLoaded()) {
        resolve(res);
      } else {
        gltfLoader.load(res.url, (gltf) => {
          res.scenes = gltf.scenes;
          resolve(res);
        }, undefined, reject);
      }

    });
  }
}

export class Module extends Resource {
  imps: any;
  moduleManager: ModuleManager;
  setImports(imps: any): Module {
    this.imps = imps;
    return this;
  }
  getImports(): any {
    return this.imps;
  }
  setModuleManager(manager: ModuleManager): Module {
    this.moduleManager = manager;
    return this;
  }
  getModuleManager(): ModuleManager {
    return this.moduleManager;
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
  async _loadModule(mod: Module) {
    let pkgJson = await fetch(`${mod.url}/${MODULE_DEF_JSON_NAME}`).then((r) => r.json());
    if (pkgJson.main) {
      let _path = ResourceManager.get().resourceNameToURL(
        `${mod.url}/${pkgJson.main}`
      )
      let imps = await import(_path);
      mod.setImports(imps);
      mod.setLoaded(true);
      mod.setModuleManager(this);
      mod.setResourceManager(ResourceManager.get());
    }
  }
  getModule(name: string): Promise<Module> {
    return new Promise(async (resolve, reject) => {
      if (this.hasModule(name)) {
        let result: Module = this.loadedModules.get(name);
        if (!result.getLoaded()) {
          await this._loadModule(result);
        }
        resolve(result);
      } else {
        reject(`No module is known for ${name}, did you forget to queryModules() ?`);
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
  queryModules(): Promise<Array<string>> {
    return new Promise(async (resolve, reject) => {
      let json = (
        await ResourceManager.get()
          .getResource("~query.modules")
      ).json();
      let keys = Object.keys(json.data);
      for (let key of keys) {
        let mod = new Module();
        mod.setArrayBuffer(undefined);
        mod.url = json.data[key];
        mod.setLoaded(false);
        this.addModule(key, mod);
      }
      resolve(keys);
    });
  }
}

