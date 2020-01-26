
export const ENTITY_PROP_TYPE = [
  "int",
  "float",
  "bool",
  "string",
  "bytearray",
  "byte"
];

export const TYPE_ENTITY_MAP = {
  "int":0,
  "float":1,
  "bool":2,
  "string":3,
  "bytearray":4,
  "byte":5
};

export class Entity {
  /**@param {Integer} networkId used to identify over the network
   * @param {Integer} priority used to order in case of latency
   * @param {Object} object to sync props of
   */
  constructor (networkId, priority, object) {
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

  track (propPath, type) {
    this.properties.set(propPath, type);
  }

  /**Get size required for data in binary
   */
  calcDataSize () {
    let result = 0;

    this.properties.forEach((type, key)=>{
      //TODO - need to include names of properties, or figure out ID system
      result ++; //One for type
      result += 1 + key.length; //Some for prop name
      switch (type) {
        case TYPE_ENTITY_MAP.bool:
          result += 1;
          break;
        case TYPE_ENTITY_MAP.bytearray:
          result += 1 + this.object[key].length;
          break;
        case TYPE_ENTITY_MAP.float:
          result += 4;
          break;
        case TYPE_ENTITY_MAP.int:
          result += 4;
          break;
        case TYPE_ENTITY_MAP.string:
          result += 1 + this.object[key].length;
          break;
        default:
          throw "Unknown type!";
      }
    });
    return result;
  }

  static buildString (dataView, index, str) {
    let originalIndex = index;
    let sizeByte = str.length & 0xff;
    dataView.setUint8(index, sizeByte);
    index++;
    for (let i=0; i<sizeByte; i++) {
      dataView.setUint8(index, str.charCodeAt(i));
      index++;
    }
    return index - originalIndex;
  }

  /**Sets a value in dataview based on type
   * @param {DataView} dataView 
   * @param {Integer} index 
   * @param {Integer} type 
   * @param {*} value 
   */
  static buildValue (dataView, index, type, value) {
    let originalIndex = index;
    let sizeByte;
    //Write the type of value
    dataView.setUint8(index, type & 0xff);
    index++;
    switch (type) {
      case TYPE_ENTITY_MAP.bool:
        dataView.setUint8(index, value & 0b1);
        index++;
        break;
      case TYPE_ENTITY_MAP.bytearray:
        sizeByte = value.length & 0xff;
        dataView.setUint8(index, sizeByte);
        index++;
        for (let i=0; i<sizeByte; i++) {
          dataView.setUint8(index, value[i]);
          index++;
        }
        break;
      case TYPE_ENTITY_MAP.float:
        dataView.setFloat32(index, value);
        index+=4;
        break;
      case TYPE_ENTITY_MAP.int:
        dataView.setInt32(index, value);
        index+=4;
        break;
      case TYPE_ENTITY_MAP.string:
        index+= this.buildString(this.dataView, index, value);
        break;
      default:
        throw "Unknown type!";
    }
    return index - originalIndex;
  }

  /**Builds all values for broadcasting */
  getData () {
    if (!this.data) {
      this.data = new Uint8Array(this.calcDataSize());
      this.dataView = new DataView(this.data.buffer);
    }
    let index = 0;
    let value;
    this.properties.forEach((type, key)=>{
      value = this.object[key];
      //TODO - only record if value changed? Maybe make an option..
      index += Entity.buildString(this.dataView, index, key);
      index += Entity.buildValue(this.dataView, index, type, value);
    });

    return this.data;
  }
}
