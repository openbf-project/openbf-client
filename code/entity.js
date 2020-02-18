
class EntityManager {
  constructor() {
    /**@type {Map<Integer, Entity>}*/
    this.entities = new Map();
  }
  /**@param {Integer} networkId used to identify over the network
   * @param {Integer} priority used to order in case of latency
   * @param {Object} object to sync props of
   */
  createEntity(networkId, priority, object) {
    let e = new Entity(networkId, priority, object);
    this.entities.set(networkId, e);
    return e;
  }
}
module.exports.EntityManager = EntityManager;

class Entity {
  static TYPE_INT = 0;
  static TYPE_BOOL = 1;
  static TYPE_STRING = 2;
  static TYPE_BYTEARRAY = 3;
  static TYPE_FLOAT = 4;
  /**@param {Number} networkId used to identify over the network
   * @param {Number} priority used to order in case of latency
   * @param {Object} object to sync props of
   */
  constructor(networkId, priority, object) {
    this.networkId = networkId;
    this.enabled = true;
    this.frequency = 2; //Dividion of update time (higher is less often)
    this.lastPushTime = 0; //Used to calculate delta time
    this.priority = priority;
    /**@type {Map<String, Integer>} */
    this.properties = new Map();
    /**@type {Object} */
    this.object = object;
  }
  /**Track a property
   * @param {String} propPath path to get the value
   * @param {Number} type see Entity TYPE constants
   * @returns {Entity} chaining
   */
  track(propPath, type) {
    this.properties.set(propPath, type);
    return this;
  }

  /**Get size required for data in binary
   * @returns {Number} byte length
   */
  calcDataSize() {
    let result = 0;

    this.properties.forEach((type, key) => {
      //TODO - need to include names of properties, or figure out ID system
      result++; //One for type
      result += 2 + key.length; //Some for prop name
      switch (type) {
        case Entity.TYPE_BOOL:
          result += 1;
          break;
        case Entity.TYPE_BYTEARRAY:
          result += 1 + this.object[key].length;
          break;
        case Entity.TYPE_FLOAT:
          result += 4;
          break;
        case Entity.TYPE_INT:
          result += 4;
          break;
        case Entity.TYPE_STRING:
          result += 1 + this.object[key].length;
          break;
        default:
          throw "Unknown type " + type;
      }
    });
    return result;
  }

  /**build a binary string data
   * @param {DataView} dataView to write to 
   * @param {Number} index offset to write it in
   * @param {String} value to write
   * @returns {Number} written bytes: type(1) + size(1) + str.len
   */
  static buildString(dataView, index, value) {
    let originalIndex = index;
    let sizeByte = value.length & 0xff;
    dataView.setUint8(index, Entity.TYPE_STRING);
    index++;
    dataView.setUint8(index, sizeByte);
    index++;
    for (let i = 0; i < sizeByte; i++) {
      dataView.setUint8(index, value.charCodeAt(i));
      index++;
    }
    return index - originalIndex;
  }
  /**build a binary string data
   * @param {DataView} dataView to write to 
   * @param {Number} index offset to write it in
   * @param {Uint8ClampedArray|Uint8Array} value to write
   * @returns {Number} written bytes: type(1) + size(1) + str.len
   */
  static buildByteArray(dataView, index, value) {
    let originalIndex = index;
    let sizeByte;
    //Write the type of value
    dataView.setUint8(index, Entity.TYPE_BYTEARRAY);
    index++;
    sizeByte = value.length & 0xff;
    dataView.setUint8(index, sizeByte);
    index++;
    for (let i = 0; i < sizeByte; i++) {
      dataView.setUint8(index, value[i]);
      index++;
    }
    return index - originalIndex;
  }
  /**build a binary string data
   * @param {DataView} dataView to write to 
   * @param {Number} index offset to write it in
   * @param {Boolean} value to write
   * @returns {Number} written bytes: type(1) + size(1) + str.len
   */
  static buildBool(dataView, index, value) {
    let originalIndex = index;
    dataView.setUint8(index, Entity.TYPE_BOOL);
    index++;
    dataView.setUint8(index, value & 0b1);
    index++;
    return index - originalIndex;
  }
  /**build a binary string data
   * @param {DataView} dataView to write to 
   * @param {Number} index offset to write it in
   * @param {Number} value to write
   * @returns {Number} written bytes: type(1) + size(1) + str.len
   */
  static buildFloat(dataView, index, value) {
    let originalIndex = index;
    dataView.setUint8(index, Entity.TYPE_FLOAT);
    index++;
    dataView.setFloat32(index, value);
    index += 4;
    return index - originalIndex;
  }
  /**build a binary string data
   * @param {DataView} dataView to write to 
   * @param {Number} index offset to write it in
   * @param {Number} value to write
   * @returns {Number} written bytes: type(1) + size(1) + str.len
   */
  static buildInt(dataView, index, value) {
    let originalIndex = index;
    dataView.setUint8(index, Entity.TYPE_INT);
    index++;
    dataView.setInt32(index, value);
    index += 4;
    return index - originalIndex;
  }
  /**build a value based on type and value
   * @param {DataView} dataView to write with
   * @param {Number} index offset to write to
   * @param {Number} type type of value, see Entity TYPE constants
   * @param {any} value to write
   * @returns {Number} number of bytes written
   */
  static buildValue(dataView, index, type, value) {
    switch (type) {
      case Entity.TYPE_BOOL:
        return Entity.buildBool(dataView, index, value);
      case Entity.TYPE_BYTEARRAY:
        return Entity.buildByteArray(dataView, index, value);
      case Entity.TYPE_FLOAT:
        return Entity.buildFloat(dataView, index, value);
      case Entity.TYPE_INT:
        return Entity.buildInt(dataView, index, value);
      case Entity.TYPE_STRING:
        return Entity.buildString(dataView, index, value);
      default:
        throw "Unknown value type " + type;
    }
  }
  /**Builds all values for broadcasting */
  getData() {
    if (!this.data) {
      this.data = new Uint8Array(this.calcDataSize());
      this.dataView = new DataView(this.data.buffer);
    }
    let index = 0;
    let value;
    this.properties.forEach((type, key) => {
      value = this.object[key];
      //TODO - only record if value changed? Maybe make an option..
      index += Entity.buildString(this.dataView, index, key);
      index += Entity.buildValue(this.dataView, index, type, value);
    });

    return this.data;
  }
}
module.exports.Entity = Entity;
