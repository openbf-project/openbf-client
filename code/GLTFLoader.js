
/**Heavily refactored to use modules/headless by Jonathan Crowder
 * @author Jonathan Crowder / https://github.com/RepComm
 * @author Rich Tibbett / https://github.com/richtr
 * @author mrdoob / http://mrdoob.com/
 * @author Tony Parisi / http://www.tonyparisi.com/
 * @author Takahiro / https://github.com/takahirox
 * @author Don McCurdy / https://www.donmccurdy.com
 */

let THREE = require("three");

class GLTFRegistry {
  /**@type {Map<String, Object>} */
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

class GLTFLoader {
  constructor(manager, headless = false) {
    this.headless = headless;
    if (manager !== null && manager !== undefined) {
      this.manager = manager;
    } else {
      this.manager = THREE.DefaultLoadingManager;
    }
    this.dracoLoader = null;
  }

  load(url, onLoad, onProgress, onError) {
    let resourcePath;
    if (this.resourcePath !== undefined) {
      resourcePath = this.resourcePath;
    } else if (this.path !== undefined) {
      resourcePath = this.path;
    } else {
      resourcePath = THREE.LoaderUtils.extractUrlBase(url);
    }
    // Tells the LoadingManager to track an extra item, which resolves after
    // the model is fully loaded. This means the count of items loaded will
    // be incorrect, but ensures manager.onLoad() does not fire early.
    this.manager.itemStart(url);
    let _onError = (e) => {
      if (onError) {
        onError(e);
      } else {
        console.error(e);
      }
      this.manager.itemEnd(url);
      this.manager.itemError(url);
    };
    let loader = new THREE.FileLoader(this.manager);
    loader.setPath(this.path);
    loader.setResponseType('arraybuffer');
    loader.load(url, (data) => {
      try {
        this.parse(data, resourcePath, (gltf) => {
          onLoad(gltf);
          this.manager.itemEnd(url);
        }, _onError);
      } catch (e) {
        _onError(e);
      }
    }, onProgress, _onError);
  }
  setCrossOrigin(value) {
    this.crossOrigin = value;
    return this;
  }
  setPath(value) {
    this.path = value;
    return this;
  }
  setResourcePath(value) {
    this.resourcePath = value;
    return this;
  }
  setDRACOLoader(dracoLoader) {
    this.dracoLoader = dracoLoader;
    return this;
  }
  parse(data, path, onLoad, onError) {
    let content;
    let extensions = {};
    if (typeof data === 'string') {
      content = data;
    } else {
      let magic = THREE.LoaderUtils.decodeText(new Uint8Array(data, 0, 4));
      if (magic === BINARY_EXTENSION_HEADER_MAGIC) {
        try {
          extensions[EXTENSIONS.KHR_BINARY_GLTF] = new GLTFBinaryExtension(data);
        } catch (error) {
          if (onError) onError(error);
          return;
        }
        content = extensions[EXTENSIONS.KHR_BINARY_GLTF].content;
      } else {
        content = THREE.LoaderUtils.decodeText(new Uint8Array(data));
      }
    }
    let json = JSON.parse(content);
    if (json.asset === undefined || json.asset.version[0] < 2) {
      if (onError) onError(new Error('THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported. Use LegacyGLTFLoader instead.'));
      return;
    }
    if (json.extensionsUsed) {
      for (let i = 0; i < json.extensionsUsed.length; ++i) {
        let extensionName = json.extensionsUsed[i];
        let extensionsRequired = json.extensionsRequired || [];
        switch (extensionName) {
          case EXTENSIONS.KHR_LIGHTS_PUNCTUAL:
            extensions[extensionName] = new GLTFLightsExtension(json);
            break;
          case EXTENSIONS.KHR_MATERIALS_UNLIT:
            extensions[extensionName] = new GLTFMaterialsUnlitExtension(json);
            break;
          case EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS:
            extensions[extensionName] = new GLTFMaterialsPbrSpecularGlossinessExtension();
            break;
          case EXTENSIONS.KHR_DRACO_MESH_COMPRESSION:
            extensions[extensionName] = new GLTFDracoMeshCompressionExtension(json, this.dracoLoader);
            break;
          case EXTENSIONS.MSFT_TEXTURE_DDS:
            extensions[EXTENSIONS.MSFT_TEXTURE_DDS] = new GLTFTextureDDSExtension();
            break;
          default:
            if (extensionsRequired.indexOf(extensionName) >= 0) {
              console.warn('THREE.GLTFLoader: Unknown extension "' + extensionName + '".');
            }
        }
      }
    }
    let parser = new GLTFParser(json, extensions, {
      path: path || this.resourcePath || '',
      crossOrigin: this.crossOrigin,
      manager: this.manager,
      headless: this.headless
    });
    parser.parse((scene, scenes, cameras, animations, json) => {
      let glTF = {
        scene: scene,
        scenes: scenes,
        cameras: cameras,
        animations: animations,
        asset: json.asset,
        parser: parser,
        userData: {}
      };
      addUnknownExtensionsToUserData(extensions, glTF, json);
      onLoad(glTF);
    }, onError);
  }
}

let EXTENSIONS = {
  KHR_BINARY_GLTF: 'KHR_binary_glTF',
  KHR_DRACO_MESH_COMPRESSION: 'KHR_draco_mesh_compression',
  KHR_LIGHTS_PUNCTUAL: 'KHR_lights_punctual',
  KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS: 'KHR_materials_pbrSpecularGlossiness',
  KHR_MATERIALS_UNLIT: 'KHR_materials_unlit',
  MSFT_TEXTURE_DDS: 'MSFT_texture_dds'
};

class GLTFTextureDDSExtension {
  constructor() {
    if (!THREE.DDSLoader) {
      throw new Error('THREE.GLTFLoader: Attempting to load .dds texture without importing THREE.DDSLoader');
    }
    this.name = EXTENSIONS.MSFT_TEXTURE_DDS;
    this.ddsLoader = new THREE.DDSLoader();
  }
}

class GLTFLightsExtension {
  constructor(json) {
    this.name = EXTENSIONS.KHR_LIGHTS_PUNCTUAL;
    this.lights = new Array();

    let extension = (json.extensions && json.extensions[EXTENSIONS.KHR_LIGHTS_PUNCTUAL]) || {};
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

class GLTFMaterialsUnlitExtension {
  constructor(json) {
    this.name = EXTENSIONS.KHR_MATERIALS_UNLIT;
  }

  getMaterialType() {
    return THREE.MeshBasicMaterial;
  }

  extendParams(materialParams, material, parser) {
    let pending = new Array();
    materialParams.color = new THREE.Color(1.0, 1.0, 1.0);
    materialParams.opacity = 1.0;
    let metallicRoughness = material.pbrMetallicRoughness;
    if (metallicRoughness) {
      if (Array.isArray(metallicRoughness.baseColorFactor)) {
        let array = metallicRoughness.baseColorFactor;
        materialParams.color.fromArray(array);
        materialParams.opacity = array[3];
      }
      if (metallicRoughness.baseColorTexture !== undefined) {
        pending.push(parser.assignTexture(materialParams, 'map', metallicRoughness.baseColorTexture.index));
      }
    }
    return Promise.all(pending);
  }
}

let BINARY_EXTENSION_BUFFER_NAME = 'binary_glTF';
let BINARY_EXTENSION_HEADER_MAGIC = 'glTF';
let BINARY_EXTENSION_HEADER_LENGTH = 12;
let BINARY_EXTENSION_CHUNK_TYPES = { JSON: 0x4E4F534A, BIN: 0x004E4942 };

class GLTFBinaryExtension {
  constructor(data) {
    this.name = EXTENSIONS.KHR_BINARY_GLTF;
    this.content = null;
    this.body = null;
    let headerView = new DataView(data, 0, BINARY_EXTENSION_HEADER_LENGTH);
    this.header = {
      magic: THREE.LoaderUtils.decodeText(new Uint8Array(data.slice(0, 4))),
      version: headerView.getUint32(4, true),
      length: headerView.getUint32(8, true)
    };
    if (this.header.magic !== BINARY_EXTENSION_HEADER_MAGIC) {
      throw new Error('THREE.GLTFLoader: Unsupported glTF-Binary header.');
    } else if (this.header.version < 2.0) {
      throw new Error('THREE.GLTFLoader: Legacy binary file detected. Use LegacyGLTFLoader instead.');
    }
    let chunkView = new DataView(data, BINARY_EXTENSION_HEADER_LENGTH);
    let chunkIndex = 0;
    while (chunkIndex < chunkView.byteLength) {
      let chunkLength = chunkView.getUint32(chunkIndex, true);
      chunkIndex += 4;
      let chunkType = chunkView.getUint32(chunkIndex, true);
      chunkIndex += 4;
      if (chunkType === BINARY_EXTENSION_CHUNK_TYPES.JSON) {
        let contentArray = new Uint8Array(data, BINARY_EXTENSION_HEADER_LENGTH + chunkIndex, chunkLength);
        this.content = THREE.LoaderUtils.decodeText(contentArray);
      } else if (chunkType === BINARY_EXTENSION_CHUNK_TYPES.BIN) {
        let byteOffset = BINARY_EXTENSION_HEADER_LENGTH + chunkIndex;
        this.body = data.slice(byteOffset, byteOffset + chunkLength);
      }
      // Clients must ignore chunks with unknown types.
      chunkIndex += chunkLength;
    }
    if (this.content === null) {
      throw new Error('THREE.GLTFLoader: JSON content not found.');
    }
  }

}

class GLTFDracoMeshCompressionExtension {
  constructor(json, dracoLoader) {
    if (!dracoLoader) {
      throw new Error('THREE.GLTFLoader: No DRACOLoader instance provided.');
    }

    this.name = EXTENSIONS.KHR_DRACO_MESH_COMPRESSION;
    this.json = json;
    this.dracoLoader = dracoLoader;
  }

  decodePrimitive(primitive, parser) {
    let bufferViewIndex = primitive.extensions[this.name].bufferView;
    let gltfAttributeMap = primitive.extensions[this.name].attributes;
    let threeAttributeMap = {};
    let attributeNormalizedMap = {};
    let attributeTypeMap = {};

    for (let attributeName in gltfAttributeMap) {
      if (!(attributeName in ATTRIBUTES)) continue;
      threeAttributeMap[ATTRIBUTES[attributeName]] = gltfAttributeMap[attributeName];
    }
    for (attributeName in primitive.attributes) {
      if (ATTRIBUTES[attributeName] !== undefined && gltfAttributeMap[attributeName] !== undefined) {
        let accessorDef = this.json.accessors[primitive.attributes[attributeName]];
        let componentType = WEBGL_COMPONENT_TYPES[accessorDef.componentType];
        attributeTypeMap[ATTRIBUTES[attributeName]] = componentType;
        attributeNormalizedMap[ATTRIBUTES[attributeName]] = accessorDef.normalized === true;
      }
    }
    return parser.getDependency('bufferView', bufferViewIndex).then(function (bufferView) {
      return new Promise(function (resolve) {
        this.dracoLoader.decodeDracoFile(bufferView, function (geometry) {
          for (let attributeName in geometry.attributes) {
            let attribute = geometry.attributes[attributeName];
            let normalized = attributeNormalizedMap[attributeName];
            if (normalized !== undefined) attribute.normalized = normalized;
          }
          resolve(geometry);
        }, threeAttributeMap, attributeTypeMap);
      });
    });
  }
}

class GLTFMaterialsPbrSpecularGlossinessExtension {
  constructor() {
    name = EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS;
    specularGlossinessParams = [
      'color',
      'map',
      'lightMap',
      'lightMapIntensity',
      'aoMap',
      'aoMapIntensity',
      'emissive',
      'emissiveIntensity',
      'emissiveMap',
      'bumpMap',
      'bumpScale',
      'normalMap',
      'displacementMap',
      'displacementScale',
      'displacementBias',
      'specularMap',
      'specular',
      'glossinessMap',
      'glossiness',
      'alphaMap',
      'envMap',
      'envMapIntensity',
      'refractionRatio'
    ];
  }
  getMaterialType() {
    return THREE.ShaderMaterial;
  }
  extendParams(params, material, parser) {
    let pbrSpecularGlossiness = material.extensions[this.name];
    let shader = THREE.ShaderLib['standard'];
    let uniforms = THREE.UniformsUtils.clone(shader.uniforms);
    let specularMapParsFragmentChunk = [
      '#ifdef USE_SPECULARMAP',
      '	uniform sampler2D specularMap;',
      '#endif'
    ].join('\n');
    let glossinessMapParsFragmentChunk = [
      '#ifdef USE_GLOSSINESSMAP',
      '	uniform sampler2D glossinessMap;',
      '#endif'
    ].join('\n');
    let specularMapFragmentChunk = [
      'vec3 specularFactor = specular;',
      '#ifdef USE_SPECULARMAP',
      '	vec4 texelSpecular = texture2D( specularMap, vUv );',
      '	texelSpecular = sRGBToLinear( texelSpecular );',
      '	// reads channel RGB, compatible with a glTF Specular-Glossiness (RGBA) texture',
      '	specularFactor *= texelSpecular.rgb;',
      '#endif'
    ].join('\n');
    let glossinessMapFragmentChunk = [
      'float glossinessFactor = glossiness;',
      '#ifdef USE_GLOSSINESSMAP',
      '	vec4 texelGlossiness = texture2D( glossinessMap, vUv );',
      '	// reads channel A, compatible with a glTF Specular-Glossiness (RGBA) texture',
      '	glossinessFactor *= texelGlossiness.a;',
      '#endif'
    ].join('\n');
    let lightPhysicalFragmentChunk = [
      'PhysicalMaterial material;',
      'material.diffuseColor = diffuseColor.rgb;',
      'material.specularRoughness = clamp( 1.0 - glossinessFactor, 0.04, 1.0 );',
      'material.specularColor = specularFactor.rgb;',
    ].join('\n');
    let fragmentShader = shader.fragmentShader
      .replace('uniform float roughness;', 'uniform vec3 specular;')
      .replace('uniform float metalness;', 'uniform float glossiness;')
      .replace('#include <roughnessmap_pars_fragment>', specularMapParsFragmentChunk)
      .replace('#include <metalnessmap_pars_fragment>', glossinessMapParsFragmentChunk)
      .replace('#include <roughnessmap_fragment>', specularMapFragmentChunk)
      .replace('#include <metalnessmap_fragment>', glossinessMapFragmentChunk)
      .replace('#include <lights_physical_fragment>', lightPhysicalFragmentChunk);
    delete uniforms.roughness;
    delete uniforms.metalness;
    delete uniforms.roughnessMap;
    delete uniforms.metalnessMap;
    uniforms.specular = { value: new THREE.Color().setHex(0x111111) };
    uniforms.glossiness = { value: 0.5 };
    uniforms.specularMap = { value: null };
    uniforms.glossinessMap = { value: null };
    params.vertexShader = shader.vertexShader;
    params.fragmentShader = fragmentShader;
    params.uniforms = uniforms;
    params.defines = { 'STANDARD': '' };
    params.color = new THREE.Color(1.0, 1.0, 1.0);
    params.opacity = 1.0;
    let pending = new Array();
    if (Array.isArray(pbrSpecularGlossiness.diffuseFactor)) {
      let array = pbrSpecularGlossiness.diffuseFactor;
      params.color.fromArray(array);
      params.opacity = array[3];
    }
    if (pbrSpecularGlossiness.diffuseTexture !== undefined) {
      pending.push(parser.assignTexture(params, 'map', pbrSpecularGlossiness.diffuseTexture.index));
    }
    params.emissive = new THREE.Color(0.0, 0.0, 0.0);
    params.glossiness = pbrSpecularGlossiness.glossinessFactor !== undefined ? pbrSpecularGlossiness.glossinessFactor : 1.0;
    params.specular = new THREE.Color(1.0, 1.0, 1.0);
    if (Array.isArray(pbrSpecularGlossiness.specularFactor)) {
      params.specular.fromArray(pbrSpecularGlossiness.specularFactor);
    }
    if (pbrSpecularGlossiness.specularGlossinessTexture !== undefined) {
      let specGlossIndex = pbrSpecularGlossiness.specularGlossinessTexture.index;
      pending.push(parser.assignTexture(params, 'glossinessMap', specGlossIndex));
      pending.push(parser.assignTexture(params, 'specularMap', specGlossIndex));
    }
    return Promise.all(pending);
  }
  createMaterial(params) {
    let material = new THREE.ShaderMaterial({
      defines: params.defines,
      vertexShader: params.vertexShader,
      fragmentShader: params.fragmentShader,
      uniforms: params.uniforms,
      fog: true,
      lights: true,
      opacity: params.opacity,
      transparent: params.transparent
    });
    material.isGLTFSpecularGlossinessMaterial = true;
    material.color = params.color;
    material.map = params.map === undefined ? null : params.map;
    material.lightMap = null;
    material.lightMapIntensity = 1.0;
    material.aoMap = params.aoMap === undefined ? null : params.aoMap;
    material.aoMapIntensity = 1.0;
    material.emissive = params.emissive;
    material.emissiveIntensity = 1.0;
    material.emissiveMap = params.emissiveMap === undefined ? null : params.emissiveMap;
    material.bumpMap = params.bumpMap === undefined ? null : params.bumpMap;
    material.bumpScale = 1;
    material.normalMap = params.normalMap === undefined ? null : params.normalMap;
    if (params.normalScale) material.normalScale = params.normalScale;
    material.displacementMap = null;
    material.displacementScale = 1;
    material.displacementBias = 0;
    material.specularMap = params.specularMap === undefined ? null : params.specularMap;
    material.specular = params.specular;
    material.glossinessMap = params.glossinessMap === undefined ? null : params.glossinessMap;
    material.glossiness = params.glossiness;
    material.alphaMap = null;
    material.envMap = params.envMap === undefined ? null : params.envMap;
    material.envMapIntensity = 1.0;
    material.refractionRatio = 0.98;
    material.extensions.derivatives = true;
    return material;
  }
  /**Clones a GLTFSpecularGlossinessMaterial instance. The ShaderMaterial.copy() method can
   * copy only properties it knows about or inherits, and misses many properties that would
   * normally be defined by MeshStandardMaterial.
   *
   * This method allows GLTFSpecularGlossinessMaterials to be cloned in the process of
   * loading a glTF model, but cloning later (e.g. by the user) would require these changes
   * AND also updating `.onBeforeRender` on the parent mesh.
   *
   * @param  {THREE.ShaderMaterial} source
   * @return {THREE.ShaderMaterial}
   */
  cloneMaterial(source) {
    let target = source.clone();
    target.isGLTFSpecularGlossinessMaterial = true;
    let params = this.specularGlossinessParams;
    for (let i = 0, il = params.length; i < il; i++) {
      target[params[i]] = source[params[i]];
    }
    return target;
  }
  // Here's based on refreshUniformsCommon() and refreshUniformsStandard() in WebGLRenderer.
  refreshUniforms(renderer, scene, camera, geometry, material, group) {
    if (!material.isGLTFSpecularGlossinessMaterial) {
      return;
    }

    let uniforms = material.uniforms;
    let defines = material.defines;

    uniforms.opacity.value = material.opacity;
    uniforms.diffuse.value.copy(material.color);
    uniforms.emissive.value.copy(material.emissive).multiplyScalar(material.emissiveIntensity);
    uniforms.map.value = material.map;
    uniforms.specularMap.value = material.specularMap;
    uniforms.alphaMap.value = material.alphaMap;
    uniforms.lightMap.value = material.lightMap;
    uniforms.lightMapIntensity.value = material.lightMapIntensity;
    uniforms.aoMap.value = material.aoMap;
    uniforms.aoMapIntensity.value = material.aoMapIntensity;

    let uvScaleMap;
    if (material.map) {
      uvScaleMap = material.map;
    } else if (material.specularMap) {
      uvScaleMap = material.specularMap;
    } else if (material.displacementMap) {
      uvScaleMap = material.displacementMap;
    } else if (material.normalMap) {
      uvScaleMap = material.normalMap;
    } else if (material.bumpMap) {
      uvScaleMap = material.bumpMap;
    } else if (material.glossinessMap) {
      uvScaleMap = material.glossinessMap;
    } else if (material.alphaMap) {
      uvScaleMap = material.alphaMap;
    } else if (material.emissiveMap) {
      uvScaleMap = material.emissiveMap;
    }
    if (uvScaleMap !== undefined) {
      // backwards compatibility
      if (uvScaleMap.isWebGLRenderTarget) {
        uvScaleMap = uvScaleMap.texture;
      }
      if (uvScaleMap.matrixAutoUpdate === true) {
        uvScaleMap.updateMatrix();
      }
      uniforms.uvTransform.value.copy(uvScaleMap.matrix);
    }
    uniforms.envMap.value = material.envMap;
    uniforms.envMapIntensity.value = material.envMapIntensity;
    uniforms.flipEnvMap.value = (material.envMap && material.envMap.isCubeTexture) ? - 1 : 1;
    uniforms.refractionRatio.value = material.refractionRatio;
    uniforms.specular.value.copy(material.specular);
    uniforms.glossiness.value = material.glossiness;
    uniforms.glossinessMap.value = material.glossinessMap;
    uniforms.emissiveMap.value = material.emissiveMap;
    uniforms.bumpMap.value = material.bumpMap;
    uniforms.normalMap.value = material.normalMap;
    uniforms.displacementMap.value = material.displacementMap;
    uniforms.displacementScale.value = material.displacementScale;
    uniforms.displacementBias.value = material.displacementBias;
    if (uniforms.glossinessMap.value !== null && defines.USE_GLOSSINESSMAP === undefined) {
      defines.USE_GLOSSINESSMAP = '';
      // set USE_ROUGHNESSMAP to enable vUv
      defines.USE_ROUGHNESSMAP = '';
    }
    if (uniforms.glossinessMap.value === null && defines.USE_GLOSSINESSMAP !== undefined) {
      delete defines.USE_GLOSSINESSMAP;
      delete defines.USE_ROUGHNESSMAP;
    }
  }
}

class GLTFCubicSplineInterpolant extends THREE.Interpolant {
  constructor(parameterPositions, sampleValues, sampleSize, resultBuffer) {
    THREE.Interpolant.call(this, parameterPositions, sampleValues, sampleSize, resultBuffer);
  }
  copySampleValue_(index) {
    // Copies a sample value to the result buffer. See description of glTF
    // CUBICSPLINE values layout in interpolate_() function below.
    let result = this.resultBuffer,
      values = this.sampleValues,
      valueSize = this.valueSize,
      offset = index * valueSize * 3 + valueSize;
    for (let i = 0; i !== valueSize; i++) {
      result[i] = values[offset + i];
    }
    return result;
  }
  beforeStart_(index) {
    return this.copySampleValue_(index);
  }
  afterEnd_(index) {
    return this.copySampleValue_(index);
  }
  interpolate_(i1, t0, t, t1) {
    let result = this.resultBuffer;
    let values = this.sampleValues;
    let stride = this.valueSize;
    let stride2 = stride * 2;
    let stride3 = stride * 3;
    let td = t1 - t0;
    let p = (t - t0) / td;
    let pp = p * p;
    let ppp = pp * p;
    let offset1 = i1 * stride3;
    let offset0 = offset1 - stride3;
    let s0 = 2 * ppp - 3 * pp + 1;
    let s1 = ppp - 2 * pp + p;
    let s2 = - 2 * ppp + 3 * pp;
    let s3 = ppp - pp;
    // Layout of keyframe output values for CUBICSPLINE animations:
    //   [ inTangent_1, splineVertex_1, outTangent_1, inTangent_2, splineVertex_2, ... ]
    for (let i = 0; i !== stride; i++) {
      let p0 = values[offset0 + i + stride]; // splineVertex_k
      let m0 = values[offset0 + i + stride2] * td; // outTangent_k * (t_k+1 - t_k)
      let p1 = values[offset1 + i + stride]; // splineVertex_k+1
      let m1 = values[offset1 + i] * td; // inTangent_k+1 * (t_k+1 - t_k)
      result[i] = s0 * p0 + s1 * m0 + s2 * p1 + s3 * m1;
    }
    return result;
  };
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
  35675: THREE.Matrix3,
  35676: THREE.Matrix4,
  35664: THREE.Vector2,
  35665: THREE.Vector3,
  35666: THREE.Vector4,
  35678: THREE.Texture
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
  9728: THREE.NearestFilter,
  9729: THREE.LinearFilter,
  9984: THREE.NearestMipMapNearestFilter,
  9985: THREE.LinearMipMapNearestFilter,
  9986: THREE.NearestMipMapLinearFilter,
  9987: THREE.LinearMipMapLinearFilter
};

const WEBGL_WRAPPINGS = {
  33071: THREE.ClampToEdgeWrapping,
  33648: THREE.MirroredRepeatWrapping,
  10497: THREE.RepeatWrapping
};

const WEBGL_SIDES = {
  1028: THREE.BackSide, // Culling front
  1029: THREE.FrontSide // Culling back
  //1032: THREE.NoSide   // Culling front and back, what to do?
};

const WEBGL_DEPTH_FUNCS = {
  512: THREE.NeverDepth,
  513: THREE.LessDepth,
  514: THREE.EqualDepth,
  515: THREE.LessEqualDepth,
  516: THREE.GreaterEqualDepth,
  517: THREE.NotEqualDepth,
  518: THREE.GreaterEqualDepth,
  519: THREE.AlwaysDepth
};

const WEBGL_BLEND_EQUATIONS = {
  32774: THREE.AddEquation,
  32778: THREE.SubtractEquation,
  32779: THREE.ReverseSubtractEquation
};

const WEBGL_BLEND_FUNCS = {
  0: THREE.ZeroFactor,
  1: THREE.OneFactor,
  768: THREE.SrcColorFactor,
  769: THREE.OneMinusSrcColorFactor,
  770: THREE.SrcAlphaFactor,
  771: THREE.OneMinusSrcAlphaFactor,
  772: THREE.DstAlphaFactor,
  773: THREE.OneMinusDstAlphaFactor,
  774: THREE.DstColorFactor,
  775: THREE.OneMinusDstColorFactor,
  776: THREE.SrcAlphaSaturateFactor
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
  CUBICSPLINE: THREE.InterpolateSmooth,
  LINEAR: THREE.InterpolateLinear,
  STEP: THREE.InterpolateDiscrete
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
  'image/png': THREE.RGBAFormat,
  'image/jpeg': THREE.RGBFormat
};

function resolveURL(url, path) {
  // Invalid URL
  if (typeof url !== 'string' || url === '') return '';
  // Absolute URL http://,https://,//
  if (/^(https?:)?\/\//i.test(url)) return url;
  // Data URI
  if (/^data:.*,.*$/i.test(url)) return url;
  // Blob URL
  if (/^blob:.*$/i.test(url)) return url;
  // Relative URL
  return path + url;
}

function createDefaultMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xFFFFFF,
    emissive: 0x000000,
    metalness: 1,
    roughness: 1,
    transparent: false,
    depthTest: true,
    side: THREE.FrontSide
  });
}

function addUnknownExtensionsToUserData(knownExtensions, object, objectDef) {
  for (let name in objectDef.extensions) {
    if (knownExtensions[name] === undefined) {
      object.userData.gltfExtensions = object.userData.gltfExtensions || {};
      object.userData.gltfExtensions[name] = objectDef.extensions[name];
    }
  }
}

/**@param {THREE.Object3D|THREE.Material|THREE.BufferGeometry} object
 * @param {GLTF.definition} def
 */
function assignExtrasToUserData(object, gltfDef) {
  if (gltfDef.extras !== undefined) {
    if (typeof gltfDef.extras === 'object') {
      object.userData = gltfDef.extras;
    } else {
      console.warn('THREE.GLTFLoader: Ignoring primitive type .extras, ' + gltfDef.extras);
    }
  }
}

/**Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#morph-targets
 * @param {THREE.BufferGeometry} geometry
 * @param {Array<GLTF.Target>} targets
 * @param {Array<THREE.BufferAttribute>} accessors
 */
function addMorphTargets(geometry, targets, accessors) {
  let hasMorphPosition = false;
  let hasMorphNormal = false;
  for (let i = 0, il = targets.length; i < il; i++) {
    let target = targets[i];
    if (target.POSITION !== undefined) hasMorphPosition = true;
    if (target.NORMAL !== undefined) hasMorphNormal = true;
    if (hasMorphPosition && hasMorphNormal) break;
  }
  if (!hasMorphPosition && !hasMorphNormal) return;
  let morphPositions = [];
  let morphNormals = [];
  for (let i = 0, il = targets.length; i < il; i++) {
    let target = targets[i];
    let attributeName = 'morphTarget' + i;
    if (hasMorphPosition) {
      if (target.POSITION !== undefined) {
        let positionAttribute = cloneBufferAttribute(accessors[target.POSITION]);
        positionAttribute.name = attributeName;
        let position = geometry.attributes.position;
        for (let j = 0, jl = positionAttribute.count; j < jl; j++) {
          positionAttribute.setXYZ(
            j,
            positionAttribute.getX(j) + position.getX(j),
            positionAttribute.getY(j) + position.getY(j),
            positionAttribute.getZ(j) + position.getZ(j)
          );
        }
      } else {
        positionAttribute = geometry.attributes.position;
      }
      morphPositions.push(positionAttribute);
    }
    if (hasMorphNormal) {
      let normalAttribute;
      if (target.NORMAL !== undefined) {
        let normalAttribute = cloneBufferAttribute(accessors[target.NORMAL]);
        normalAttribute.name = attributeName;
        let normal = geometry.attributes.normal;
        for (let j = 0, jl = normalAttribute.count; j < jl; j++) {
          normalAttribute.setXYZ(
            j,
            normalAttribute.getX(j) + normal.getX(j),
            normalAttribute.getY(j) + normal.getY(j),
            normalAttribute.getZ(j) + normal.getZ(j)
          );
        }
      } else {
        normalAttribute = geometry.attributes.normal;
      }
      morphNormals.push(normalAttribute);
    }
  }
  if (hasMorphPosition) geometry.morphAttributes.position = morphPositions;
  if (hasMorphNormal) geometry.morphAttributes.normal = morphNormals;
}

/**@param {THREE.Mesh} mesh
 * @param {GLTF.Mesh} meshDef
 */
function updateMorphTargets(mesh, meshDef) {
  mesh.updateMorphTargets();
  if (meshDef.weights !== undefined) {
    for (let i = 0, il = meshDef.weights.length; i < il; i++) {
      mesh.morphTargetInfluences[i] = meshDef.weights[i];
    }
  }
  // .extras has user-defined data, so check that .extras.targetNames is an array.
  if (meshDef.extras && Array.isArray(meshDef.extras.targetNames)) {
    let targetNames = meshDef.extras.targetNames;
    if (mesh.morphTargetInfluences.length === targetNames.length) {
      mesh.morphTargetDictionary = {};
      for (let i = 0, il = targetNames.length; i < il; i++) {
        mesh.morphTargetDictionary[targetNames[i]] = i;
      }
    } else {
      console.warn('THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.');
    }
  }
}

function isPrimitiveEqual(a, b) {
  if (a.indices !== b.indices) {
    return false;
  }
  return isObjectEqual(a.attributes, b.attributes);
}

function isObjectEqual(a, b) {
  if (Object.keys(a).length !== Object.keys(b).length) return false;
  for (let key in a) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

function isArrayEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0, il = a.length; i < il; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function getCachedGeometry(cache, newPrimitive) {
  for (let i = 0, il = cache.length; i < il; i++) {
    let cached = cache[i];
    if (isPrimitiveEqual(cached.primitive, newPrimitive)) return cached.promise;
  }
  return null;
}

function getCachedCombinedGeometry(cache, geometries) {
  for (let i = 0, il = cache.length; i < il; i++) {
    let cached = cache[i];
    if (isArrayEqual(geometries, cached.baseGeometries)) return cached.geometry;
  }
  return null;
}

function getCachedMultiPassGeometry(cache, geometry, primitives) {
  for (let i = 0, il = cache.length; i < il; i++) {
    let cached = cache[i];
    if (geometry === cached.baseGeometry && isArrayEqual(primitives, cached.primitives)) return cached.geometry;
  }
  return null;
}

function cloneBufferAttribute(attribute) {
  if (attribute.isInterleavedBufferAttribute) {
    let count = attribute.count;
    let itemSize = attribute.itemSize;
    let array = attribute.array.slice(0, count * itemSize);
    for (let i = 0; i < count; ++i) {
      array[i] = attribute.getX(i);
      if (itemSize >= 2) array[i + 1] = attribute.getY(i);
      if (itemSize >= 3) array[i + 2] = attribute.getZ(i);
      if (itemSize >= 4) array[i + 3] = attribute.getW(i);
    }
    return new THREE.BufferAttribute(array, itemSize, attribute.normalized);
  }
  return attribute.clone();
}

/**Checks if we can build a single Mesh with MultiMaterial from multiple primitives.
 * Returns true if all primitives use the same attributes/morphAttributes/mode
 * and also have index. Otherwise returns false.
 * @param {Array<GLTF.Primitive>} primitives
 * @return {Boolean}
 */
function isMultiPassGeometry(primitives) {
  if (primitives.length < 2) return false;
  let primitive0 = primitives[0];
  let targets0 = primitive0.targets || [];
  if (primitive0.indices === undefined) return false;
  for (let i = 1, il = primitives.length; i < il; i++) {
    let primitive = primitives[i];
    if (primitive0.mode !== primitive.mode) return false;
    if (primitive.indices === undefined) return false;
    if (!isObjectEqual(primitive0.attributes, primitive.attributes)) return false;
    let targets = primitive.targets || [];
    if (targets0.length !== targets.length) return false;
    for (let j = 0, jl = targets0.length; j < jl; j++) {
      if (!isObjectEqual(targets0[j], targets[j])) return false;
    }
  }
  return true;
}

function buildNodeHierachy(nodeId, parentObject, json, allNodes, skins) {
  let node = allNodes[nodeId];
  let nodeDef = json.nodes[nodeId];
  if (nodeDef.skin !== undefined) {
    let meshes = node.isGroup === true ? node.children : [node];
    for (let i = 0, il = meshes.length; i < il; i++) {
      let mesh = meshes[i];
      let skinEntry = skins[nodeDef.skin];
      let bones = [];
      let boneInverses = [];
      for (let j = 0, jl = skinEntry.joints.length; j < jl; j++) {
        let jointId = skinEntry.joints[j];
        let jointNode = allNodes[jointId];
        if (jointNode) {
          bones.push(jointNode);
          let mat = new THREE.Matrix4();
          if (skinEntry.inverseBindMatrices !== undefined) {
            mat.fromArray(skinEntry.inverseBindMatrices.array, j * 16);
          }
          boneInverses.push(mat);
        } else {
          console.warn('THREE.GLTFLoader: Joint "%s" could not be found.', jointId);
        }
      }
      mesh.bind(new THREE.Skeleton(bones, boneInverses), mesh.matrixWorld);
    }
  }
  // build node hierachy
  parentObject.add(node);
  if (nodeDef.children) {
    let children = nodeDef.children;
    for (let i = 0, il = children.length; i < il; i++) {
      let child = children[i];
      buildNodeHierachy(child, node, json, allNodes, skins);
    }
  }
}

/* GLTF PARSER */
class GLTFParser {
  constructor(json, extensions, options) {
    this.json = json || {};
    this.extensions = extensions || {};
    this.options = options || { headless: false };
    // loader object cache
    this.cache = new GLTFRegistry();
    // BufferGeometry caching
    this.primitiveCache = [];
    this.multiplePrimitivesCache = [];
    this.multiPassGeometryCache = [];
    this.textureLoader = new THREE.TextureLoader(this.options.manager);
    this.textureLoader.setCrossOrigin(this.options.crossOrigin);

    this.fileLoader = new THREE.FileLoader(this.options.manager);
    this.fileLoader.setResponseType('arraybuffer');
  }

  parse(onLoad, onError) {
    let json = this.json;
    // Clear the loader cache
    this.cache.removeAll();
    // Mark the special nodes/meshes in json for efficient parse
    this.markDefs();
    // Fire the callback on complete
    this.getMultiDependencies([
      'scene',
      'animation',
      'camera'
    ]).then(function (dependencies) {
      let scenes = dependencies.scenes || [];
      let scene = scenes[json.scene || 0];
      let animations = dependencies.animations || [];
      let cameras = dependencies.cameras || [];
      onLoad(scene, scenes, cameras, animations, json);
    }).catch(onError);
  }

  markDefs() {
    let nodeDefs = this.json.nodes || [];
    let skinDefs = this.json.skins || [];
    let meshDefs = this.json.meshes || [];
    let meshReferences = {};
    let meshUses = {};
    // Nothing in the node definition indicates whether it is a Bone or an
    // Object3D. Use the skins' joint references to mark bones.
    for (let skinIndex = 0, skinLength = skinDefs.length; skinIndex < skinLength; skinIndex++) {
      let joints = skinDefs[skinIndex].joints;
      for (let i = 0, il = joints.length; i < il; i++) {
        nodeDefs[joints[i]].isBone = true;
      }
    }
    for (let nodeIndex = 0, nodeLength = nodeDefs.length; nodeIndex < nodeLength; nodeIndex++) {
      let nodeDef = nodeDefs[nodeIndex];
      if (nodeDef.mesh !== undefined) {
        if (meshReferences[nodeDef.mesh] === undefined) {
          meshReferences[nodeDef.mesh] = meshUses[nodeDef.mesh] = 0;
        }
        meshReferences[nodeDef.mesh]++;
        if (nodeDef.skin !== undefined) {
          meshDefs[nodeDef.mesh].isSkinnedMesh = true;
        }
      }
    }
    this.json.meshReferences = meshReferences;
    this.json.meshUses = meshUses;
  }

  /**Requests the specified dependency asynchronously, with caching.
	 * @param {string} type
	 * @param {number} index
	 * @return {Promise<Object>}
	 */
  getDependency(type, index) {
    let cacheKey = type + ':' + index;
    let dependency = this.cache.get(cacheKey);
    if (!dependency) {
      switch (type) {
        case 'scene':
          dependency = this.loadScene(index);
          break;
        case 'node':
          dependency = this.loadNode(index);
          break;
        case 'mesh':
          dependency = this.loadMesh(index);
          break;
        case 'accessor':
          dependency = this.loadAccessor(index);
          break;
        case 'bufferView':
          dependency = this.loadBufferView(index);
          break;
        case 'buffer':
          dependency = this.loadBuffer(index);
          break;
        case 'material':
          if (!this.options.headless) {
            dependency = this.loadMaterial(index);
          }
          break;
        case 'texture':
          if (!this.options.headless) {
            dependency = this.loadTexture(index);
          }
          break;
        case 'skin':
          dependency = this.loadSkin(index);
          break;
        case 'animation':
          dependency = this.loadAnimation(index);
          break;
        case 'camera':
          if (!this.options.headless) {
            dependency = this.loadCamera(index);
          }
          break;
        default:
          throw new Error('Unknown type: ' + type);
      }
      this.cache.add(cacheKey, dependency);
    }
    return dependency;
  }

  /**Requests all dependencies of the specified type asynchronously, with caching.
	 * @param {string} type
	 * @return {Promise<Array<Object>>}
	 */
  getDependencies(type) {
    let dependencies = this.cache.get(type);
    if (!dependencies) {
      let defs = this.json[type + (type === 'mesh' ? 'es' : 's')] || [];
      dependencies = Promise.all(defs.map((def, index) => {
        return this.getDependency(type, index);
      }));
      this.cache.add(type, dependencies);
    }
    return dependencies;
  }

  /**
	 * Requests all multiple dependencies of the specified types asynchronously, with caching.
	 * @param {Array<string>} types
	 * @return {Promise<Object<Array<Object>>>}
	 */
  getMultiDependencies(types) {
    let results = {};
    let pendings = [];
    for (let i = 0, il = types.length; i < il; i++) {
      let type = types[i];
      let value = this.getDependencies(type);
      value = value.then(function (key, value) {
        results[key] = value;
      }.bind(this, type + (type === 'mesh' ? 'es' : 's')));
      pendings.push(value);
    }
    return Promise.all(pendings).then(function () {
      return results;
    });
  };

  /**@param {number} bufferIndex
   * @return {Promise<ArrayBuffer>}
   */
  loadBuffer(bufferIndex) {
    let bufferDef = this.json.buffers[bufferIndex];
    let loader = this.fileLoader;
    if (bufferDef.type && bufferDef.type !== 'arraybuffer') {
      throw new Error('THREE.GLTFLoader: ' + bufferDef.type + ' buffer type is not supported.');
    }
    // If present, GLB container is required to be the first buffer.
    if (bufferDef.uri === undefined && bufferIndex === 0) {

      return Promise.resolve(this.extensions[EXTENSIONS.KHR_BINARY_GLTF].body);

    }
    let options = this.options;
    return new Promise((resolve, reject) => {
      loader.load(resolveURL(bufferDef.uri, options.path), resolve, undefined, () => {
        reject(new Error('THREE.GLTFLoader: Failed to load buffer "' + bufferDef.uri + '".'));
      });
    });
  }

  /**Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#buffers-and-buffer-views
   * @param {number} bufferViewIndex
   * @return {Promise<ArrayBuffer>}
   */
  loadBufferView(bufferViewIndex) {
    let bufferViewDef = this.json.bufferViews[bufferViewIndex];
    return this.getDependency('buffer', bufferViewDef.buffer).then(function (buffer) {
      let byteLength = bufferViewDef.byteLength || 0;
      let byteOffset = bufferViewDef.byteOffset || 0;
      return buffer.slice(byteOffset, byteOffset + byteLength);
    });
  }

  /**Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#accessors
   * @param {number} accessorIndex
   * @return {Promise<THREE.BufferAttribute|THREE.InterleavedBufferAttribute>}
   */
  loadAccessor(accessorIndex) {
    let parser = this;
    let accessorDef = this.json.accessors[accessorIndex];
    if (accessorDef.bufferView === undefined && accessorDef.sparse === undefined) {
      return null;
    }
    let pendingBufferViews = [];
    if (accessorDef.bufferView !== undefined) {
      pendingBufferViews.push(this.getDependency('bufferView', accessorDef.bufferView));
    } else {
      pendingBufferViews.push(null);
    }
    if (accessorDef.sparse !== undefined) {
      pendingBufferViews.push(this.getDependency('bufferView', accessorDef.sparse.indices.bufferView));
      pendingBufferViews.push(this.getDependency('bufferView', accessorDef.sparse.values.bufferView));
    }
    return Promise.all(pendingBufferViews).then((bufferViews) => {
      let bufferView = bufferViews[0];
      let itemSize = WEBGL_TYPE_SIZES[accessorDef.type];
      let TypedArray = WEBGL_COMPONENT_TYPES[accessorDef.componentType];
      // For VEC3: itemSize is 3, elementBytes is 4, itemBytes is 12.
      let elementBytes = TypedArray.BYTES_PER_ELEMENT;
      let itemBytes = elementBytes * itemSize;
      let byteOffset = accessorDef.byteOffset || 0;
      let byteStride = accessorDef.bufferView !== undefined ? this.json.bufferViews[accessorDef.bufferView].byteStride : undefined;
      let normalized = accessorDef.normalized === true;
      let array, bufferAttribute;
      // The buffer is not interleaved if the stride is the item size in bytes.
      if (byteStride && byteStride !== itemBytes) {
        let ibCacheKey = 'InterleavedBuffer:' + accessorDef.bufferView + ':' + accessorDef.componentType;
        let ib = parser.cache.get(ibCacheKey);
        if (!ib) {
          // Use the full buffer if it's interleaved.
          array = new TypedArray(bufferView);
          // Integer parameters to IB/IBA are in array elements, not bytes.
          ib = new THREE.InterleavedBuffer(array, byteStride / elementBytes);
          parser.cache.add(ibCacheKey, ib);
        }
        bufferAttribute = new THREE.InterleavedBufferAttribute(ib, itemSize, byteOffset / elementBytes, normalized);
      } else {
        if (bufferView === null) {
          array = new TypedArray(accessorDef.count * itemSize);
        } else {
          array = new TypedArray(bufferView, byteOffset, accessorDef.count * itemSize);
        }
        bufferAttribute = new THREE.BufferAttribute(array, itemSize, normalized);
      }
      if (accessorDef.sparse !== undefined) {
        let itemSizeIndices = WEBGL_TYPE_SIZES.SCALAR;
        let TypedArrayIndices = WEBGL_COMPONENT_TYPES[accessorDef.sparse.indices.componentType];
        let byteOffsetIndices = accessorDef.sparse.indices.byteOffset || 0;
        let byteOffsetValues = accessorDef.sparse.values.byteOffset || 0;
        let sparseIndices = new TypedArrayIndices(bufferViews[1], byteOffsetIndices, accessorDef.sparse.count * itemSizeIndices);
        let sparseValues = new TypedArray(bufferViews[2], byteOffsetValues, accessorDef.sparse.count * itemSize);
        if (bufferView !== null) {
          // Avoid modifying the original ArrayBuffer, if the bufferView wasn't initialized with zeroes.
          bufferAttribute.setArray(bufferAttribute.array.slice());
        }
        for (let i = 0, il = sparseIndices.length; i < il; i++) {
          let index = sparseIndices[i];
          bufferAttribute.setX(index, sparseValues[i * itemSize]);
          if (itemSize >= 2) bufferAttribute.setY(index, sparseValues[i * itemSize + 1]);
          if (itemSize >= 3) bufferAttribute.setZ(index, sparseValues[i * itemSize + 2]);
          if (itemSize >= 4) bufferAttribute.setW(index, sparseValues[i * itemSize + 3]);
          if (itemSize >= 5) throw new Error('THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.');
        }
      }
      return bufferAttribute;
    });
  }

  /**@param {number} textureIndex
   * @return {Promise<THREE.Texture>}
   */
  loadTexture(textureIndex) {
    let parser = this;
    let json = this.json;
    let options = this.options;
    let textureLoader = this.textureLoader;
    let URL = window.URL || window.webkitURL;
    let textureDef = json.textures[textureIndex];
    let textureExtensions = textureDef.extensions || {};
    let source;
    if (textureExtensions[EXTENSIONS.MSFT_TEXTURE_DDS]) {
      source = json.images[textureExtensions[EXTENSIONS.MSFT_TEXTURE_DDS].source];
    } else {
      source = json.images[textureDef.source];
    }
    let sourceURI = source.uri;
    let isObjectURL = false;
    if (source.bufferView !== undefined) {
      sourceURI = parser.getDependency('bufferView', source.bufferView).then(function (bufferView) {

        isObjectURL = true;
        let blob = new Blob([bufferView], { type: source.mimeType });
        sourceURI = URL.createObjectURL(blob);
        return sourceURI;

      });
    }
    return Promise.resolve(sourceURI).then(function (sourceURI) {

      // Load Texture resource.

      let loader = THREE.Loader.Handlers.get(sourceURI);

      if (!loader) {

        loader = textureExtensions[EXTENSIONS.MSFT_TEXTURE_DDS]
          ? parser.extensions[EXTENSIONS.MSFT_TEXTURE_DDS].ddsLoader
          : textureLoader;

      }

      return new Promise(function (resolve, reject) {

        loader.load(resolveURL(sourceURI, options.path), resolve, undefined, reject);

      });

    }).then(function (texture) {

      // Clean up resources and configure Texture.

      if (isObjectURL === true) {

        URL.revokeObjectURL(sourceURI);

      }

      texture.flipY = false;

      if (textureDef.name !== undefined) texture.name = textureDef.name;

      // Ignore unknown mime types, like DDS files.
      if (source.mimeType in MIME_TYPE_FORMATS) {

        texture.format = MIME_TYPE_FORMATS[source.mimeType];

      }

      let samplers = json.samplers || {};
      let sampler = samplers[textureDef.sampler] || {};

      texture.magFilter = WEBGL_FILTERS[sampler.magFilter] || THREE.LinearFilter;
      texture.minFilter = WEBGL_FILTERS[sampler.minFilter] || THREE.LinearMipMapLinearFilter;
      texture.wrapS = WEBGL_WRAPPINGS[sampler.wrapS] || THREE.RepeatWrapping;
      texture.wrapT = WEBGL_WRAPPINGS[sampler.wrapT] || THREE.RepeatWrapping;

      return texture;

    });
  }

  /**Asynchronously assigns a texture to the given material parameters.
   * @param {Object} materialParams
   * @param {string} textureName
   * @param {number} textureIndex
   * @return {Promise}
   */
  assignTexture(materialParams, textureName, textureIndex) {
    return this.getDependency('texture', textureIndex).then(function (texture) {
      materialParams[textureName] = texture;
    });
  }

  /**@param {number} materialIndex
   * @return {Promise<THREE.Material>}
   */
  loadMaterial(materialIndex) {
    let parser = this;
    let json = this.json;
    let extensions = this.extensions;
    let materialDef = json.materials[materialIndex];
    let materialType;
    let materialParams = {};
    let materialExtensions = materialDef.extensions || {};
    let pending = [];
    if (materialExtensions[EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS]) {
      let sgExtension = extensions[EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS];
      materialType = sgExtension.getMaterialType(materialDef);
      pending.push(sgExtension.extendParams(materialParams, materialDef, parser));
    } else if (materialExtensions[EXTENSIONS.KHR_MATERIALS_UNLIT]) {
      let kmuExtension = extensions[EXTENSIONS.KHR_MATERIALS_UNLIT];
      materialType = kmuExtension.getMaterialType(materialDef);
      pending.push(kmuExtension.extendParams(materialParams, materialDef, parser));
    } else {
      materialType = THREE.MeshStandardMaterial;
      let metallicRoughness = materialDef.pbrMetallicRoughness || {};
      materialParams.color = new THREE.Color(1.0, 1.0, 1.0);
      materialParams.opacity = 1.0;
      if (Array.isArray(metallicRoughness.baseColorFactor)) {
        let array = metallicRoughness.baseColorFactor;
        materialParams.color.fromArray(array);
        materialParams.opacity = array[3];
      }
      if (metallicRoughness.baseColorTexture !== undefined) {
        pending.push(parser.assignTexture(materialParams, 'map', metallicRoughness.baseColorTexture.index));
      }
      materialParams.metalness = metallicRoughness.metallicFactor !== undefined ? metallicRoughness.metallicFactor : 1.0;
      materialParams.roughness = metallicRoughness.roughnessFactor !== undefined ? metallicRoughness.roughnessFactor : 1.0;
      if (metallicRoughness.metallicRoughnessTexture !== undefined) {
        let textureIndex = metallicRoughness.metallicRoughnessTexture.index;
        pending.push(parser.assignTexture(materialParams, 'metalnessMap', textureIndex));
        pending.push(parser.assignTexture(materialParams, 'roughnessMap', textureIndex));
      }
    }
    if (materialDef.doubleSided === true) {
      materialParams.side = THREE.DoubleSide;
    }
    let alphaMode = materialDef.alphaMode || ALPHA_MODES.OPAQUE;
    if (alphaMode === ALPHA_MODES.BLEND) {
      materialParams.transparent = true;
    } else {
      materialParams.transparent = false;
      if (alphaMode === ALPHA_MODES.MASK) {
        materialParams.alphaTest = materialDef.alphaCutoff !== undefined ? materialDef.alphaCutoff : 0.5;
      }
    }
    if (materialDef.normalTexture !== undefined && materialType !== THREE.MeshBasicMaterial) {
      pending.push(parser.assignTexture(materialParams, 'normalMap', materialDef.normalTexture.index));
      materialParams.normalScale = new THREE.Vector2(1, 1);
      if (materialDef.normalTexture.scale !== undefined) {
        materialParams.normalScale.set(materialDef.normalTexture.scale, materialDef.normalTexture.scale);
      }
    }
    if (materialDef.occlusionTexture !== undefined && materialType !== THREE.MeshBasicMaterial) {
      pending.push(parser.assignTexture(materialParams, 'aoMap', materialDef.occlusionTexture.index));
      if (materialDef.occlusionTexture.strength !== undefined) {
        materialParams.aoMapIntensity = materialDef.occlusionTexture.strength;
      }
    }
    if (materialDef.emissiveFactor !== undefined && materialType !== THREE.MeshBasicMaterial) {
      materialParams.emissive = new THREE.Color().fromArray(materialDef.emissiveFactor);
    }
    if (materialDef.emissiveTexture !== undefined && materialType !== THREE.MeshBasicMaterial) {
      pending.push(parser.assignTexture(materialParams, 'emissiveMap', materialDef.emissiveTexture.index));
    }
    return Promise.all(pending).then(function () {
      let material;
      if (materialType === THREE.ShaderMaterial) {
        material = extensions[EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS].createMaterial(materialParams);
      } else {
        material = new materialType(materialParams);
      }
      if (materialDef.name !== undefined) material.name = materialDef.name;
      if (material.normalScale) {
        material.normalScale.y = - material.normalScale.y;
      }
      if (material.map) material.map.encoding = THREE.sRGBEncoding;
      if (material.emissiveMap) material.emissiveMap.encoding = THREE.sRGBEncoding;
      if (material.specularMap) material.specularMap.encoding = THREE.sRGBEncoding;
      assignExtrasToUserData(material, materialDef);
      if (materialDef.extensions) addUnknownExtensionsToUserData(extensions, material, materialDef);
      return material;
    });
  }

  /**@param  {THREE.BufferGeometry} geometry
   * @param  {GLTF.Primitive} primitiveDef
   * @param  {Array<THREE.BufferAttribute>} accessors
   */
  addPrimitiveAttributes(geometry, primitiveDef, accessors) {
    let attributes = primitiveDef.attributes;
    for (let gltfAttributeName in attributes) {
      let threeAttributeName = ATTRIBUTES[gltfAttributeName];
      let bufferAttribute = accessors[attributes[gltfAttributeName]];
      if (!threeAttributeName) continue;
      if (threeAttributeName in geometry.attributes) continue;
      geometry.addAttribute(threeAttributeName, bufferAttribute);
    }
    if (primitiveDef.indices !== undefined && !geometry.index) {
      geometry.setIndex(accessors[primitiveDef.indices]);
    }
    if (primitiveDef.targets !== undefined) {
      addMorphTargets(geometry, primitiveDef.targets, accessors);
    }
    assignExtrasToUserData(geometry, primitiveDef);
  }

  /**@param {Array<Object>} primitives
   * @return {Promise<Array<THREE.BufferGeometry>>}
   */
  loadGeometries(primitives) {
    let parser = this;
    let extensions = this.extensions;
    let cache = this.primitiveCache;
    let isMultiPass = isMultiPassGeometry(primitives);
    let originalPrimitives;
    if (isMultiPass) {
      originalPrimitives = primitives;
      primitives = [primitives[0]];
    }
    return this.getDependencies('accessor').then((accessors) => {
      let pending = [];
      for (let i = 0, il = primitives.length; i < il; i++) {
        let primitive = primitives[i];
        // See if we've already created this geometry
        let cached = getCachedGeometry(cache, primitive);
        if (cached) {
          pending.push(cached);
        } else if (primitive.extensions && primitive.extensions[EXTENSIONS.KHR_DRACO_MESH_COMPRESSION]) {
          let geometryPromise = extensions[EXTENSIONS.KHR_DRACO_MESH_COMPRESSION]
            .decodePrimitive(primitive, parser)
            .then(function (geometry) {

              this.addPrimitiveAttributes(geometry, primitive, accessors);

              return geometry;

            });
          cache.push({ primitive: primitive, promise: geometryPromise });
          pending.push(geometryPromise);
        } else {
          let geometry = new THREE.BufferGeometry();
          this.addPrimitiveAttributes(geometry, primitive, accessors);
          let geometryPromise = Promise.resolve(geometry);
          cache.push({ primitive: primitive, promise: geometryPromise });
          pending.push(geometryPromise);
        }
      }
      return Promise.all(pending).then(function (geometries) {
        if (isMultiPass) {
          let baseGeometry = geometries[0];
          let cache = parser.multiPassGeometryCache;
          let cached = getCachedMultiPassGeometry(cache, baseGeometry, originalPrimitives);
          if (cached !== null) return [cached.geometry];
          let geometry = new THREE.BufferGeometry();
          geometry.name = baseGeometry.name;
          geometry.userData = baseGeometry.userData;
          for (let key in baseGeometry.attributes) geometry.addAttribute(key, baseGeometry.attributes[key]);
          for (let key in baseGeometry.morphAttributes) geometry.morphAttributes[key] = baseGeometry.morphAttributes[key];
          let indices = [];
          let offset = 0;
          for (let i = 0, il = originalPrimitives.length; i < il; i++) {
            let accessor = accessors[originalPrimitives[i].indices];
            for (let j = 0, jl = accessor.count; j < jl; j++) indices.push(accessor.array[j]);
            geometry.addGroup(offset, accessor.count, i);
            offset += accessor.count;
          }
          geometry.setIndex(indices);
          cache.push({ geometry: geometry, baseGeometry: baseGeometry, primitives: originalPrimitives });
          return [geometry];
        } else if (geometries.length > 1 && THREE.BufferGeometryUtils !== undefined) {
          for (let i = 1, il = primitives.length; i < il; i++) {
            if (primitives[0].mode !== primitives[i].mode) return geometries;
          }
          let cache = parser.multiplePrimitivesCache;
          let cached = getCachedCombinedGeometry(cache, geometries);
          if (cached) {
            if (cached.geometry !== null) return [cached.geometry];
          } else {
            let geometry = THREE.BufferGeometryUtils.mergeBufferGeometries(geometries, true);
            cache.push({ geometry: geometry, baseGeometries: geometries });
            if (geometry !== null) return [geometry];
          }
        }
        return geometries;
      });
    });
  }

  /**@param {number} meshIndex
   * @return {Promise<THREE.Group|THREE.Mesh|THREE.SkinnedMesh>}
   */
  loadMesh(meshIndex) {
    let json = this.json;
    let meshDef = json.meshes[meshIndex];
    return this.getMultiDependencies([
      'accessor',
      'material'
    ]).then((dependencies) => {
      let primitives = meshDef.primitives;
      let originalMaterials = [];
      for (let i = 0, il = primitives.length; i < il; i++) {
        originalMaterials[i] = primitives[i].material === undefined
          ? createDefaultMaterial()
          : dependencies.materials[primitives[i].material];
      }
      return this.loadGeometries(primitives).then((geometries) => {
        let isMultiMaterial = geometries.length === 1 && geometries[0].groups.length > 0;
        let meshes = [];
        for (let i = 0, il = geometries.length; i < il; i++) {
          let geometry = geometries[i];
          let primitive = primitives[i];
          let mesh;
          let material = isMultiMaterial ? originalMaterials : originalMaterials[i];
          if (primitive.mode === WEBGL_CONSTANTS.TRIANGLES ||
            primitive.mode === WEBGL_CONSTANTS.TRIANGLE_STRIP ||
            primitive.mode === WEBGL_CONSTANTS.TRIANGLE_FAN ||
            primitive.mode === undefined) {
            mesh = meshDef.isSkinnedMesh === true
              ? new THREE.SkinnedMesh(geometry, material)
              : new THREE.Mesh(geometry, material);
            if (primitive.mode === WEBGL_CONSTANTS.TRIANGLE_STRIP) {
              mesh.drawMode = THREE.TriangleStripDrawMode;
            } else if (primitive.mode === WEBGL_CONSTANTS.TRIANGLE_FAN) {
              mesh.drawMode = THREE.TriangleFanDrawMode;
            }
          } else if (primitive.mode === WEBGL_CONSTANTS.LINES) {
            mesh = new THREE.LineSegments(geometry, material);
          } else if (primitive.mode === WEBGL_CONSTANTS.LINE_STRIP) {
            mesh = new THREE.Line(geometry, material);
          } else if (primitive.mode === WEBGL_CONSTANTS.LINE_LOOP) {
            mesh = new THREE.LineLoop(geometry, material);
          } else if (primitive.mode === WEBGL_CONSTANTS.POINTS) {
            mesh = new THREE.Points(geometry, material);
          } else {
            throw new Error('THREE.GLTFLoader: Primitive mode unsupported: ' + primitive.mode);
          }
          if (Object.keys(mesh.geometry.morphAttributes).length > 0) {
            updateMorphTargets(mesh, meshDef);
          }
          mesh.name = meshDef.name || ('mesh_' + meshIndex);
          if (geometries.length > 1) mesh.name += '_' + i;
          assignExtrasToUserData(mesh, meshDef);
          meshes.push(mesh);
          let materials = isMultiMaterial ? mesh.material : [mesh.material];
          let useVertexColors = geometry.attributes.color !== undefined;
          let useFlatShading = geometry.attributes.normal === undefined;
          let useSkinning = mesh.isSkinnedMesh === true;
          let useMorphTargets = Object.keys(geometry.morphAttributes).length > 0;
          let useMorphNormals = useMorphTargets && geometry.morphAttributes.normal !== undefined;
          for (let j = 0, jl = materials.length; j < jl; j++) {
            let material = materials[j];
            if (mesh.isPoints) {
              let cacheKey = 'PointsMaterial:' + material.uuid;
              let pointsMaterial = this.cache.get(cacheKey);
              if (!pointsMaterial) {
                pointsMaterial = new THREE.PointsMaterial();
                THREE.Material.prototype.copy.call(pointsMaterial, material);
                pointsMaterial.color.copy(material.color);
                pointsMaterial.map = material.map;
                pointsMaterial.lights = false; // PointsMaterial doesn't support lights yet
                this.cache.add(cacheKey, pointsMaterial);
              }
              material = pointsMaterial;
            } else if (mesh.isLine) {
              let cacheKey = 'LineBasicMaterial:' + material.uuid;
              let lineMaterial = this.cache.get(cacheKey);
              if (!lineMaterial) {
                lineMaterial = new THREE.LineBasicMaterial();
                THREE.Material.prototype.copy.call(lineMaterial, material);
                lineMaterial.color.copy(material.color);
                lineMaterial.lights = false; // LineBasicMaterial doesn't support lights yet
                this.cache.add(cacheKey, lineMaterial);
              }
              material = lineMaterial;
            }
            if (useVertexColors || useFlatShading || useSkinning || useMorphTargets) {
              let cacheKey = 'ClonedMaterial:' + material.uuid + ':';
              if (material.isGLTFSpecularGlossinessMaterial) cacheKey += 'specular-glossiness:';
              if (useSkinning) cacheKey += 'skinning:';
              if (useVertexColors) cacheKey += 'vertex-colors:';
              if (useFlatShading) cacheKey += 'flat-shading:';
              if (useMorphTargets) cacheKey += 'morph-targets:';
              if (useMorphNormals) cacheKey += 'morph-normals:';
              let cachedMaterial = this.cache.get(cacheKey);
              if (!cachedMaterial) {
                cachedMaterial = material.isGLTFSpecularGlossinessMaterial
                  ? extensions[EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS].cloneMaterial(material)
                  : material.clone();
                if (useSkinning) cachedMaterial.skinning = true;
                if (useVertexColors) cachedMaterial.vertexColors = THREE.VertexColors;
                if (useFlatShading) cachedMaterial.flatShading = true;
                if (useMorphTargets) cachedMaterial.morphTargets = true;
                if (useMorphNormals) cachedMaterial.morphNormals = true;
                this.cache.add(cacheKey, cachedMaterial);
              }
              material = cachedMaterial;
            }
            materials[j] = material;
            if (material.aoMap && geometry.attributes.uv2 === undefined && geometry.attributes.uv !== undefined) {
              console.log('THREE.GLTFLoader: Duplicating UVs to support aoMap.');
              geometry.addAttribute('uv2', new THREE.BufferAttribute(geometry.attributes.uv.array, 2));
            }
            if (material.isGLTFSpecularGlossinessMaterial) {
              mesh.onBeforeRender = extensions[EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS].refreshUniforms;
            }
          }
          mesh.material = isMultiMaterial ? materials : materials[0];
        }
        if (meshes.length === 1) {
          return meshes[0];
        }
        let group = new THREE.Group();
        for (let i = 0, il = meshes.length; i < il; i++) {
          group.add(meshes[i]);
        }
        return group;
      });
    });
  }

  /**@param {number} cameraIndex
   * @return {Promise<THREE.Camera>}
   */
  loadCamera(cameraIndex) {
    let camera;
    let cameraDef = this.json.cameras[cameraIndex];
    let params = cameraDef[cameraDef.type];
    if (!params) {
      console.warn('THREE.GLTFLoader: Missing camera parameters.');
      return;
    }
    if (cameraDef.type === 'perspective') {
      camera = new THREE.PerspectiveCamera(THREE.Math.radToDeg(params.yfov), params.aspectRatio || 1, params.znear || 1, params.zfar || 2e6);
    } else if (cameraDef.type === 'orthographic') {
      camera = new THREE.OrthographicCamera(params.xmag / - 2, params.xmag / 2, params.ymag / 2, params.ymag / - 2, params.znear, params.zfar);
    }
    if (cameraDef.name !== undefined) camera.name = cameraDef.name;
    assignExtrasToUserData(camera, cameraDef);
    return Promise.resolve(camera);
  }

  /**@param {number} skinIndex
   * @return {Promise<Object>}
   */
  loadSkin(skinIndex) {
    let skinDef = this.json.skins[skinIndex];
    let skinEntry = { joints: skinDef.joints };
    if (skinDef.inverseBindMatrices === undefined) {
      return Promise.resolve(skinEntry);
    }
    return this.getDependency('accessor', skinDef.inverseBindMatrices).then(function (accessor) {
      skinEntry.inverseBindMatrices = accessor;
      return skinEntry;
    });
  }

  /**@param {number} animationIndex
   * @return {Promise<THREE.AnimationClip>}
   */
  loadAnimation(animationIndex) {
    let json = this.json;
    let animationDef = json.animations[animationIndex];
    return this.getMultiDependencies([
      'accessor',
      'node'
    ]).then((dependencies) => {
      let tracks = [];
      for (let i = 0, il = animationDef.channels.length; i < il; i++) {
        let channel = animationDef.channels[i];
        let sampler = animationDef.samplers[channel.sampler];
        if (sampler) {
          let target = channel.target;
          let name = target.node !== undefined ? target.node : target.id; // NOTE: target.id is deprecated.
          let input = animationDef.parameters !== undefined ? animationDef.parameters[sampler.input] : sampler.input;
          let output = animationDef.parameters !== undefined ? animationDef.parameters[sampler.output] : sampler.output;
          let inputAccessor = dependencies.accessors[input];
          let outputAccessor = dependencies.accessors[output];
          let node = dependencies.nodes[name];
          if (node) {
            node.updateMatrix();
            node.matrixAutoUpdate = true;
            let TypedKeyframeTrack;
            switch (PATH_PROPERTIES[target.path]) {
              case PATH_PROPERTIES.weights:
                TypedKeyframeTrack = THREE.NumberKeyframeTrack;
                break;
              case PATH_PROPERTIES.rotation:
                TypedKeyframeTrack = THREE.QuaternionKeyframeTrack;
                break;
              case PATH_PROPERTIES.position:
              case PATH_PROPERTIES.scale:
              default:
                TypedKeyframeTrack = THREE.VectorKeyframeTrack;
                break;
            }
            let targetName = node.name ? node.name : node.uuid;
            let interpolation = sampler.interpolation !== undefined ? INTERPOLATION[sampler.interpolation] : THREE.InterpolateLinear;
            let targetNames = [];
            if (PATH_PROPERTIES[target.path] === PATH_PROPERTIES.weights) {
              node.traverse(function (object) {
                if (object.isMesh === true && object.morphTargetInfluences) {
                  targetNames.push(object.name ? object.name : object.uuid);
                }
              });
            } else {
              targetNames.push(targetName);
            }
            for (let j = 0, jl = targetNames.length; j < jl; j++) {
              let track = new TypedKeyframeTrack(
                targetNames[j] + '.' + PATH_PROPERTIES[target.path],
                THREE.AnimationUtils.arraySlice(inputAccessor.array, 0),
                THREE.AnimationUtils.arraySlice(outputAccessor.array, 0),
                interpolation
              );
              if (sampler.interpolation === 'CUBICSPLINE') {
                track.createInterpolant = function InterpolantFactoryMethodGLTFCubicSpline(result) {
                  return new GLTFCubicSplineInterpolant(this.times, this.values, this.getValueSize() / 3, result);
                };
                track.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline = true;
              }
              tracks.push(track);
            }
          }
        }
      }
      let name = animationDef.name !== undefined ? animationDef.name : 'animation_' + animationIndex;
      return new THREE.AnimationClip(name, undefined, tracks);
    });
  }

  /**@param {number} nodeIndex
   * @return {Promise<THREE.Object3D>}
   */
  loadNode(nodeIndex) {
    let json = this.json;
    let extensions = this.extensions;
    let meshReferences = json.meshReferences;
    let meshUses = json.meshUses;
    let nodeDef = json.nodes[nodeIndex];
    return this.getMultiDependencies([
      'mesh',
      'skin',
      'camera',
      'light'
    ]).then(function (dependencies) {
      let node;
      if (nodeDef.isBone === true) {
        node = new THREE.Bone();
      } else if (nodeDef.mesh !== undefined) {
        let mesh = dependencies.meshes[nodeDef.mesh];
        if (meshReferences[nodeDef.mesh] > 1) {
          let instanceNum = meshUses[nodeDef.mesh]++;
          node = mesh.clone();
          node.name += '_instance_' + instanceNum;
          node.onBeforeRender = mesh.onBeforeRender;
          for (let i = 0, il = node.children.length; i < il; i++) {
            node.children[i].name += '_instance_' + instanceNum;
            node.children[i].onBeforeRender = mesh.children[i].onBeforeRender;
          }
        } else {
          node = mesh;
        }
      } else if (nodeDef.camera !== undefined) {
        node = dependencies.cameras[nodeDef.camera];
      } else if (nodeDef.extensions
        && nodeDef.extensions[EXTENSIONS.KHR_LIGHTS_PUNCTUAL]
        && nodeDef.extensions[EXTENSIONS.KHR_LIGHTS_PUNCTUAL].light !== undefined) {
        let lights = extensions[EXTENSIONS.KHR_LIGHTS_PUNCTUAL].lights;
        node = lights[nodeDef.extensions[EXTENSIONS.KHR_LIGHTS_PUNCTUAL].light];
      } else {
        node = new THREE.Object3D();
      }
      if (nodeDef.name !== undefined) {
        node.name = THREE.PropertyBinding.sanitizeNodeName(nodeDef.name);
      }
      assignExtrasToUserData(node, nodeDef);
      if (nodeDef.extensions) addUnknownExtensionsToUserData(extensions, node, nodeDef);
      if (nodeDef.matrix !== undefined) {
        let matrix = new THREE.Matrix4();
        matrix.fromArray(nodeDef.matrix);
        node.applyMatrix(matrix);
      } else {
        if (nodeDef.translation !== undefined) {
          node.position.fromArray(nodeDef.translation);
        }
        if (nodeDef.rotation !== undefined) {
          node.quaternion.fromArray(nodeDef.rotation);
        }
        if (nodeDef.scale !== undefined) {
          node.scale.fromArray(nodeDef.scale);
        }
      }
      return node;
    });
  }

  /**@param {number} sceneIndex
 * @return {Promise<THREE.Scene>}
 */
  loadScene(sceneIndex) {
    let json = this.json;
    let extensions = this.extensions;
    let sceneDef = this.json.scenes[sceneIndex];
    return this.getMultiDependencies([
      'node',
      'skin'
    ]).then((dependencies) => {
      let scene = new THREE.Scene();
      if (sceneDef.name !== undefined) scene.name = sceneDef.name;
      assignExtrasToUserData(scene, sceneDef);
      if (sceneDef.extensions) addUnknownExtensionsToUserData(extensions, scene, sceneDef);
      let nodeIds = sceneDef.nodes || [];
      for (let i = 0, il = nodeIds.length; i < il; i++) {
        buildNodeHierachy(nodeIds[i], scene, json, dependencies.nodes, dependencies.skins);
      }
      return scene;
    });
  }
}

module.exports = GLTFLoader;
