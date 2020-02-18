
class StateData {
  /**All requirements tested every time*/
  static REQUIREMENT_CURRENT = 0;
  /**All given requirements must have been met at some point*/
  static REQUIREMENT_EVER = 0;
  /**Same as ever, but it resets after they're all met*/
  static REQUIREMENT_EVER_RESET = 1;

  /**Don't record the result of a requirement test*/
  static RESULT_RECORD_NEVER = 0;
  /**Record requirement test only if it was met*/
  static RESULT_RECORD_IF_MET = 1;
  /**Record requirement test only if it wasn't met*/
  static RESULT_RECORD_IF_NOT_MET = 2;
  /**Record requirement test regardless of result*/
  static RESULT_RECORD_ALWAYS = 3;

  constructor () {
    /**@type {Map<String, Function>} */
    this.requirements = new Map();
  }
  /**Add a requirement function
   * @param {String} name of the requirement (unique)
   * @param {Function} fn to ask return value of truthy from
   */
  addRequirement (name, fn) {
    this.requirements.push(name, fn);
  }
  /**Is a given requirement met
   * @param {String} name requirement name
   * @param {Boolean} notMetRecord if not met
   */
  isRequirementMet (name, record=StateData.RESULT_RECORD_ALWAYS) {
    return this.requirements.get(name)();
  }
  allRequirementsMet (record=StateData.RESULT_RECORD_ALWAYS) {
    this.requirements.forEach((fn, name)=>{
      if (!fn()) {
        switch (record){
          case StateData.RESULT_RECORD_IF_MET:
          break;
          case StateData.RESULT_RECORD_IF_NOT_MET:
            break;
        }
        return false;
      } else {

      }
    })
  }
}
module.exports.StateData = StateData;

class StateInstance {
  constructor () {
    /**@type {Map<String, StateData>} */
    this.states = new Map();

    /**@type {String} */
    this.currentState;
    /**@type {Number} */
    this.currentStateTimeStarted = 0;

    /**@type {String} */
    this.lastState;
    /**@type {Number} */
    this.lastStateTimeStarted = 0;
    /**@type {String} */
    this.lastStateTimeEnded = 0;

    /**@type {Array<Function>} */
    this.listeners = new Array();
  }

  listen (listener) {
    if (this.hasListener(listener)) throw "Listener in collection";
    this.listeners.push(listener);
  }

  hasListener (listener) {
    return this.listeners.includes(listener);
  }

  removeListener (listener) {
    let offset = this.listeners.indexOf(listener);
    if (offset === -1) throw "Listener not in collection. Use hasListener to check";
    this.listeners.splice(offset, 1);
  }

  addState (name, stateData=undefined) {
    if (!stateData) stateData = new StateData(name);
    this.states.set(name, stateData);
    return stateData;
  }

  setCurrentState (name, time=Date.now()) {
    this.lastState = this.currentState;
    this.lastStateTimeEnded = (this.currentStateTimeStarted||time);
    this.currentState = name;
    this.currentStateTimeStarted = time;
    this.onStateChanged();
  }

  onStateChanged () {
    for (let listener of this.listeners) {
      setTimeout(()=>listener(this), 0);
    }
  }
}
module.exports.StateInstance = this.StateInstance;

class StateManager {
  constructor () {
    /**@type {Array<StateInstance>}*/
    this.stateInstances = new Array();
  }

  createStateInstance () {
    let result = new StateInstance();
    this.stateInstances.push(result);
    return result;
  }

  removeStateInstance (instance) {
    let offset = this.stateInstances.indexOf(instance);
    if (offset !== -1) throw "Instance not in collection";
    this.stateInstances.splice(offset, 1);
  }
}
module.exports.StateManager = StateManager;
