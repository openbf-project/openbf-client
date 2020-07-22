
import API from "../api.js";
const api: API = API.get();

export interface Module {
}

export class ModuleManager {
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
  loadModuleFolder(dir: string):Promise<Module> {
    return new Promise(async (resolve, reject) => {
      try {
        reject("Not implemented yet");
        // let results = await api.readDir(dir);
        // for (let subdir of results.dirs) {
        //   await this.load( path.join(dir, subdir) );
        // }
        // resolve(true);
      } catch (ex) {
        reject(ex);
      }
    });
  }
  // load(dir) {
  //   return new Promise(async (resolve, reject) => {
      
  //     let pkgFile = path.join(dir, "package.json");
  //     let pkgJson;
  //     try {
  //       pkgJson = await api.readJsonFile(pkgFile);
  //     } catch (ex) {
  //       reject(`Couldn't load package.json for: ${pkgFile}`);
  //       return;
  //     }

  //     let modNameSpace = dir.split(path.sep).pop();

  //     let hadExports = false;
  //     if (pkgJson.exports) {
  //       if (!pkgJson.exports instanceof Array) {
  //         reject(`Package.json exports is not an ${pkgJson.exports}`);
  //         return;
  //       }
  //       hadExports = true;
  //       let expFile;
  //       let expMod;
  //       for (let exp of pkgJson.exports) {
  //         expFile = path.join(dir, exp);

  //         try {
  //           expMod = require(expFile);
  //           this.addModule(`${modNameSpace}:${expFile}`, expMod);
  //         } catch (ex) {
  //           reject(ex);
  //           return;
  //         }
  //       }
  //     }
  //     if (pkgJson.main) {
  //       let mainFile = path.join(dir, pkgJson.main);

  //       let mod = require(mainFile);
  //       if (mod.register) {
  //         if (pkgJson.enabled !== false) {
  //           await mod.register(dir);
  //         } else {
  //           console.log("Not registering module because package.json says it is disabled");
  //         }
  //       } else {
  //         console.warn(`Module ${modNameSpace} has package.json, main, but main did not export a register function`);
  //       }
  //       this.addModule(modNameSpace, mod);
  //     } else {
  //       if (!hadExports) {
  //         console.warn(`package.json for ${modNameSpace} had neither exports or main`);
  //       }
  //     }
  //   });
  // }
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
  getModule(name: string): Module {
    return this.loadedModules.get(name);
  }
  listModules (): Array<Module> {
    let result = new Array();
    this.loadedModules.forEach((v, k)=>{
      result.push(k);
    });
    return result;
  }
}
