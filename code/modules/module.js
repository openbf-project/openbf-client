
const API = require("../api.js");
const api = API.get();

const path = require("path");

// class Module {
//   constructor () {

//   }
// }
// module.exports.Module = Module;

class ModuleManager {
  static SINGLETON = undefined;
  constructor() {
    if (!ModuleManager.SINGLETON) {
      ModuleManager.SINGLETON = this;
    } else {
      throw "Module should not be instantiated more than once";
    }
    this.loadedModules = new Map();
  }
  /**Get or create the module manager
   * @returns {ModuleManager}
   */
  static get() {
    if (!ModuleManager.SINGLETON) {
      new ModuleManager();
    }
    return ModuleManager.SINGLETON;
  }
  /**Load modules from a directory
   * @param {string} dir
   * @returns {Promise<boolean>} true when successful
   */
  loadModuleFolder(dir) {
    return new Promise(async (resolve, reject) => {
      try {
        let results = await api.readDir(dir);
        for (let subdir of results.dirs) {
          await this.load( path.join(dir, subdir) );
        }
        resolve(true);
      } catch (ex) {
        reject(ex);
      }
    });
  }
  /**Load a module
   * @param {string} dir parent directory of package.json
   * @returns {Promise<Module>}
   */
  load(dir) {
    return new Promise(async (resolve, reject) => {
      
      let pkgFile = path.join(dir, "package.json");
      let pkgJson;
      try {
        pkgJson = await api.readJsonFile(pkgFile);
      } catch (ex) {
        reject(`Couldn't load package.json for: ${pkgFile}`);
        return;
      }

      let modNameSpace = dir.split(path.sep).pop();

      let hadExports = false;
      if (pkgJson.exports) {
        if (!pkgJson.exports instanceof Array) {
          reject(`Package.json exports is not an ${pkgJson.exports}`);
          return;
        }
        hadExports = true;
        let expFile;
        let expMod;
        for (let exp of pkgJson.exports) {
          expFile = path.join(dir, exp);

          try {
            expMod = require(expFile);
            this.addModule(`${modNameSpace}:${expFile}`, expMod);
          } catch (ex) {
            reject(ex);
            return;
          }
        }
      }
      if (pkgJson.main) {
        let mainFile = path.join(dir, pkgJson.main);

        let mod = require(mainFile);
        if (mod.register) {
          if (pkgJson.enabled !== false) {
            await mod.register(dir);
          } else {
            console.log("Not registering module because package.json says it is disabled");
          }
        } else {
          console.warn(`Module ${modNameSpace} has package.json, main, but main did not export a register function`);
        }
        this.addModule(modNameSpace, mod);
      } else {
        if (!hadExports) {
          console.warn(`package.json for ${modNameSpace} had neither exports or main`);
        }
      }
    });
  }
  /**Add a module
   * internal
   * @param {Module} mod
   */
  addModule(name, mod) {
    if (this.hasModule(name)) throw `Adding module of same name ${name}`;
    this.setModule(name, mod);
  }
  /**Check if a module has been added
   * @param {string} name
   * @returns {boolean}
   */
  hasModule(name) {
    return this.loadedModules.has(name);
  }
  /**Sets a module without checking for overwrite
   * @param {string} name 
   * @param {any} mod 
   */
  setModule(name, mod) {
    this.loadedModules.set(name, mod);
  }
  /**Get a module by its namespace
   * @param {string} name
   * @returns {any}
   */
  getModule(name) {
    return this.loadedModules.get(name);
  }
  /**List all the loaded modules
   * @returns {Array<string>}
   */
  listModules () {
    let result = new Array();
    this.loadedModules.forEach((v, k)=>{
      result.push(k);
    });
    return result;
  }
}
module.exports.ModuleManager = ModuleManager;
