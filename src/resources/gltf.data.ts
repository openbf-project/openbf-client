
//https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#reference-perspective

/**Heavily refactored to use modules/headless by Jonathan Crowder
 * @author Jonathan Crowder / https://github.com/RepComm
 * @author Rich Tibbett / https://github.com/richtr
 * @author mrdoob / http://mrdoob.com/
 * @author Tony Parisi / http://www.tonyparisi.com/
 * @author Takahiro / https://github.com/takahirox
 * @author Don McCurdy / https://www.donmccurdy.com
 */

export class GLTFRegistry {
  /**@type {Map<string, any>} */
  objects = new Map();
  get(key) {
    return this.objects.get(key);
  }
  add(key, object) {
    this.objects.set(key, object);
  }
  remove(key) {
    this.objects.delete(key);
  }
  removeAll() {
    this.objects.clear();
  }
}

const textDec = new TextDecoder();

export interface GLTFExtension {
  name: string;
}

export interface GLTFExtensionsMap {
  [key: string]: GLTFExtension;
}

export class GLTF {
  headless: boolean = false;
  dracoLoader: any;
  constructor(headless: boolean = false) {
    this.headless = headless;
  }
  static headerType(data: Uint8Array): string {
    return textDec.decode(data.subarray(0, 4));
  }
  static isGLB(data: Uint8Array): boolean {
    return GLTF.headerType(data) === BINARY_EXTENSION_HEADER_MAGIC;
  }
  parse(data: Uint8Array | string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      let content: string|void;
      let extensions: GLTFExtensionsMap = {};
      if (typeof (data) == "string") {
        content = data;
      } else {
        //If gltf header specified binary type, run converter over it
        if (GLTF.isGLB(data)) {
          //Handle binary
          content = await GLTFBinaryHelper.parse(data).catch(reject);
          //Catch exception and reject
        } else {
          content = textDec.decode(data);
        }
      }
      if (!content) {
        reject("No content"); return;
      }
      let json: any;
      try {
        json = JSON.parse(content);
      } catch (ex) {
        reject("Couldn't parse json");
      }
      if (!json.asset) {
        reject(`gltf asset field is invalid -> ${json.asset}`);
        return;
      }
      if (!json.asset.version || json.asset.version.length < 1) {
        reject(`gltf asset.version field is invalid -> ${json.asset.version}`);
        return;
      }
      if (json.asset.version[0] < 2) {
        reject(`gltf unsupported asset version ${json.asset.version[0]}, only >= 2 supported`);
        return;
      }
      if (json.extensionsUsed) {
        for (let extName of json.extensionsUsed) {
          switch (extName) {
            case EXTS.KHR_LIGHTS_PUNCTUAL:
              extensions[extName] = new GLTFLightsExtension(json);
              break;
            case EXTS.KHR_MATERIALS_UNLIT:
              extensions[extName] = new GLTFMaterialsUnlitExtension(json);
              break;
            case EXTS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS:
              extensions[extName] = new GLTFMaterialsPbrSpecularGlossinessExtension();
              break;
            case EXTS.KHR_DRACO_MESH_COMPRESSION:
              extensions[extName] = new GLTFDracoMeshCompressionExtension(json, this.dracoLoader);
              break;
            default:
              console.warn(`gltf unknown extension ${extName}`);
          }
        }
      }
    });
  }
}

let EXTS = {
  KHR_BINARY_GLTF: 'KHR_binary_glTF',
  KHR_DRACO_MESH_COMPRESSION: 'KHR_draco_mesh_compression',
  KHR_LIGHTS_PUNCTUAL: 'KHR_lights_punctual',
  KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS: 'KHR_materials_pbrSpecularGlossiness',
  KHR_MATERIALS_UNLIT: 'KHR_materials_unlit'
};

export class GLTFLightsExtension implements GLTFExtension {
  name: string = EXTS.KHR_LIGHTS_PUNCTUAL;
  lights: Array<any>;
  constructor(json) {
    this.lights = new Array();

    let extension = (json.extensions && json.extensions[EXTS.KHR_LIGHTS_PUNCTUAL]) || {};
    let lightDefs = extension.lights || [];

    for (let i = 0; i < lightDefs.length; i++) {
      let lightDef = lightDefs[i];
      let lightNode;
      let color = new THREE.Color(0xffffff);
      if (lightDef.color !== undefined) color.fromArray(lightDef.color);
      let range = lightDef.range !== undefined ? lightDef.range : 0;
      switch (lightDef.type) {
        case 'directional':
          lightNode = new THREE.DirectionalLight(color);
          lightNode.target.position.set(0, 0, -1);
          lightNode.add(lightNode.target);
          break;
        case 'point':
          lightNode = new THREE.PointLight(color);
          lightNode.distance = range;
          break;
        case 'spot':
          lightNode = new THREE.SpotLight(color);
          lightNode.distance = range;
          // Handle spotlight properties.
          lightDef.spot = lightDef.spot || {};
          lightDef.spot.innerConeAngle = lightDef.spot.innerConeAngle !== undefined ? lightDef.spot.innerConeAngle : 0;
          lightDef.spot.outerConeAngle = lightDef.spot.outerConeAngle !== undefined ? lightDef.spot.outerConeAngle : Math.PI / 4.0;
          lightNode.angle = lightDef.spot.outerConeAngle;
          lightNode.penumbra = 1.0 - lightDef.spot.innerConeAngle / lightDef.spot.outerConeAngle;
          lightNode.target.position.set(0, 0, -1);
          lightNode.add(lightNode.target);
          break;
        default:
          throw new Error('THREE.GLTFLoader: Unexpected light type, "' + lightDef.type + '".');
      }
      lightNode.decay = 2;
      if (lightDef.intensity !== undefined) lightNode.intensity = lightDef.intensity;
      lightNode.name = lightDef.name || ('light_' + i);
      this.lights.push(lightNode);
    }
  }
}

const BINARY_EXTENSION_BUFFER_NAME: string = "binary_glTF";
const BINARY_EXTENSION_HEADER_MAGIC: string = 'glTF';
const BINARY_EXTENSION_HEADER_LENGTH: number = 12;
const BINARY_EXTENSION_CHUNK_TYPES = { JSON: 0x4E4F534A, BIN: 0x004E4942 };

class GLTFBinaryHelper {
  static parse(data: Uint8Array): Promise<string> {
    return new Promise((resolve, reject) => {
      let content: string = undefined;
      let body: Uint8Array = undefined;
      let headerView: DataView = new DataView(data, 0, BINARY_EXTENSION_HEADER_LENGTH);
      let chunkView: DataView;

      let header: any = {
        magic: GLTF.headerType(data),
        version: headerView.getUint32(4, true),
        length: headerView.getUint32(8, true)
      };
      if (header.magic !== BINARY_EXTENSION_HEADER_MAGIC) {
        reject(`gltf binary header unsupported ${header.magic}`);
        return;
      } else if (header.version < 2.0) {
        reject(`gltf version not supported ${header.version}`);
        return;
      }
      chunkView = new DataView(data, BINARY_EXTENSION_HEADER_LENGTH);
      let chunkIndex: number = 0;
      while (chunkIndex < chunkView.byteLength) {
        let chunkLength = chunkView.getUint32(chunkIndex, true);
        chunkIndex += 4;
        let chunkType = chunkView.getUint32(chunkIndex, true);
        chunkIndex += 4;
        if (chunkType === BINARY_EXTENSION_CHUNK_TYPES.JSON) {
          content = textDec.decode(
            data.subarray(BINARY_EXTENSION_HEADER_LENGTH + chunkIndex, chunkLength)
          );
        } else if (chunkType === BINARY_EXTENSION_CHUNK_TYPES.BIN) {
          let byteOffset = BINARY_EXTENSION_HEADER_LENGTH + chunkIndex;
          body = data.slice(
            byteOffset,
            byteOffset + chunkLength
          );
        } else {
          //Unknown chunk type
        }
        chunkIndex += chunkLength;
      }
      if (!content) {
        reject(`gltf no content!`);
        return;
      }
      resolve(content);
    });
  }
}

const WEBGL_CONSTANTS = {
  FLOAT: 5126,
  //FLOAT_MAT2: 35674,
  FLOAT_MAT3: 35675,
  FLOAT_MAT4: 35676,
  FLOAT_VEC2: 35664,
  FLOAT_VEC3: 35665,
  FLOAT_VEC4: 35666,
  LINEAR: 9729,
  REPEAT: 10497,
  SAMPLER_2D: 35678,
  POINTS: 0,
  LINES: 1,
  LINE_LOOP: 2,
  LINE_STRIP: 3,
  TRIANGLES: 4,
  TRIANGLE_STRIP: 5,
  TRIANGLE_FAN: 6,
  UNSIGNED_BYTE: 5121,
  UNSIGNED_SHORT: 5123
};

const WEBGL_TYPE = {
  5126: Number,
  //35674: THREE.Matrix2,
  35675: "Matrix3",
  35676: "Matrix4",
  35664: "Vector2",
  35665: "Vector3",
  35666: "Vector4",
  35678: "Texture"
};

const WEBGL_COMPONENT_TYPES = {
  5120: Int8Array,
  5121: Uint8Array,
  5122: Int16Array,
  5123: Uint16Array,
  5125: Uint32Array,
  5126: Float32Array
};

const WEBGL_FILTERS = {
  9728: "NearestFilter",
  9729: "LinearFilter",
  9984: "NearestMipMapNearestFilter",
  9985: "LinearMipMapNearestFilter",
  9986: "NearestMipMapLinearFilter",
  9987: "LinearMipMapLinearFilter"
};

const WEBGL_WRAPPINGS = {
  33071: "ClampToEdgeWrapping",
  33648: "MirroredRepeatWrapping",
  10497: "RepeatWrapping"
};

const WEBGL_SIDES = {
  1028: "BackSide", // Culling front
  1029: "THREE.FrontSide" // Culling back
  //1032: THREE.NoSide   // Culling front and back, what to do?
};

const WEBGL_DEPTH_FUNCS = {
  512: "NeverDepth",
  513: "LessDepth",
  514: "EqualDepth",
  515: "LessEqualDepth",
  516: "GreaterEqualDepth",
  517: "NotEqualDepth",
  518: "GreaterEqualDepth",
  519: "AlwaysDepth"
};

const WEBGL_BLEND_EQUATIONS = {
  32774: "AddEquation",
  32778: "SubtractEquation",
  32779: "ReverseSubtractEquation"
};

const WEBGL_BLEND_FUNCS = {
  0: "ZeroFactor",
  1: "OneFactor",
  768: ".SrcColorFactor",
  769: ".OneMinusSrcColorFactor",
  770: ".SrcAlphaFactor",
  771: ".OneMinusSrcAlphaFactor",
  772: ".DstAlphaFactor",
  773: ".OneMinusDstAlphaFactor",
  774: ".DstColorFactor",
  775: ".OneMinusDstColorFactor",
  776: ".SrcAlphaSaturateFactor"
  // The followings are not supported by Three.js yet
  //32769: CONSTANT_COLOR,
  //32770: ONE_MINUS_CONSTANT_COLOR,
  //32771: CONSTANT_ALPHA,
  //32772: ONE_MINUS_CONSTANT_COLOR
};

const WEBGL_TYPE_SIZES = {
  'SCALAR': 1,
  'VEC2': 2,
  'VEC3': 3,
  'VEC4': 4,
  'MAT2': 4,
  'MAT3': 9,
  'MAT4': 16
};

const ATTRIBUTES = {
  POSITION: 'position',
  NORMAL: 'normal',
  TEXCOORD_0: 'uv',
  TEXCOORD0: 'uv', // deprecated
  TEXCOORD: 'uv', // deprecated
  TEXCOORD_1: 'uv2',
  COLOR_0: 'color',
  COLOR0: 'color', // deprecated
  COLOR: 'color', // deprecated
  WEIGHTS_0: 'skinWeight',
  WEIGHT: 'skinWeight', // deprecated
  JOINTS_0: 'skinIndex',
  JOINT: 'skinIndex' // deprecated
};

const PATH_PROPERTIES = {
  scale: 'scale',
  translation: 'position',
  rotation: 'quaternion',
  weights: 'morphTargetInfluences'
};

const INTERPOLATION = {
  CUBICSPLINE: "InterpolateSmooth",
  LINEAR: "InterpolateLinear",
  STEP: "InterpolateDiscrete"
};

const STATES_ENABLES = {
  2884: 'CULL_FACE',
  2929: 'DEPTH_TEST',
  3042: 'BLEND',
  3089: 'SCISSOR_TEST',
  32823: 'POLYGON_OFFSET_FILL',
  32926: 'SAMPLE_ALPHA_TO_COVERAGE'
};

const ALPHA_MODES = {
  OPAQUE: 'OPAQUE',
  MASK: 'MASK',
  BLEND: 'BLEND'
};

const MIME_TYPE_FORMATS = {
  'image/png': "RGBAFormat",
  'image/jpeg': "RGBFormat"
};
