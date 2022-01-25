"use strict";
var __extends =
  (this && this.__extends) ||
  (function () {
    var extendStatics = function (d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (d, b) {
            d.__proto__ = b;
          }) ||
        function (d, b) {
          for (var p in b)
            if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function (d, b) {
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype =
        b === null
          ? Object.create(b)
          : ((__.prototype = b.prototype), new __());
    };
  })();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnrealBloomPass = void 0;
var three_1 = require("three");
var Pass_1 = require("three/examples/jsm/postprocessing/Pass");
// typescript definitions doesn't have FullScreenQuad
//@ts-ignore
var Pass_2 = require("three/examples/jsm/postprocessing/Pass");
var CopyShader_js_1 = require("three/examples/jsm/shaders/CopyShader.js");
var LuminosityHighPassShader_js_1 = require("three/examples/jsm/shaders/LuminosityHighPassShader.js");
/**
 * Thanks to https://github.com/mrdoob/three.js/issues/14104#issuecomment-429664412 for this fragmentShaderfix
 *
 * UnrealBloomPass is inspired by the bloom pass of Unreal Engine. It creates a
 * mip map chain of bloom textures and blurs them with different radii. Because
 * of the weighted combination of mips, and because larger blurs are done on
 * higher mips, this effect provides good quality and performance.
 *
 * Reference:
 * - https://docs.unrealengine.com/latest/INT/Engine/Rendering/PostProcessEffects/Bloom/
 */
var TransparentBackgroundFixedUnrealBloomPass = /** @class */ (function (
  _super
) {
  __extends(TransparentBackgroundFixedUnrealBloomPass, _super);
  function TransparentBackgroundFixedUnrealBloomPass(
    resolution,
    strength,
    radius,
    threshold
  ) {
    var _this = _super.call(this) || this;
    _this.strength = strength !== undefined ? strength : 1;
    _this.radius = radius;
    _this.threshold = threshold;
    _this.resolution =
      resolution !== undefined
        ? new three_1.Vector2(resolution.x, resolution.y)
        : new three_1.Vector2(256, 256);
    // create color only once here, reuse it later inside the render function
    _this.clearColor = new three_1.Color(0, 0, 0);
    // render targets
    var pars = {
      minFilter: three_1.LinearFilter,
      magFilter: three_1.LinearFilter,
      format: three_1.RGBAFormat,
    };
    _this.renderTargetsHorizontal = [];
    _this.renderTargetsVertical = [];
    _this.nMips = 5;
    var resx = Math.round(_this.resolution.x / 2);
    var resy = Math.round(_this.resolution.y / 2);
    _this.renderTargetBright = new three_1.WebGLRenderTarget(resx, resy, pars);
    _this.renderTargetBright.texture.name = "UnrealBloomPass.bright";
    _this.renderTargetBright.texture.generateMipmaps = false;
    for (var i = 0; i < _this.nMips; i++) {
      var renderTargetHorizonal = new three_1.WebGLRenderTarget(
        resx,
        resy,
        pars
      );
      renderTargetHorizonal.texture.name = "UnrealBloomPass.h" + i;
      renderTargetHorizonal.texture.generateMipmaps = false;
      _this.renderTargetsHorizontal.push(renderTargetHorizonal);
      var renderTargetVertical = new three_1.WebGLRenderTarget(
        resx,
        resy,
        pars
      );
      renderTargetVertical.texture.name = "UnrealBloomPass.v" + i;
      renderTargetVertical.texture.generateMipmaps = false;
      _this.renderTargetsVertical.push(renderTargetVertical);
      resx = Math.round(resx / 2);
      resy = Math.round(resy / 2);
    }
    // luminosity high pass material
    if (LuminosityHighPassShader_js_1.LuminosityHighPassShader === undefined)
      console.error("THREE.UnrealBloomPass relies on LuminosityHighPassShader");
    var highPassShader = LuminosityHighPassShader_js_1.LuminosityHighPassShader;
    _this.highPassUniforms = three_1.UniformsUtils.clone(
      highPassShader.uniforms
    );
    _this.highPassUniforms["luminosityThreshold"].value = threshold;
    _this.highPassUniforms["smoothWidth"].value = 0.01;
    _this.materialHighPassFilter = new three_1.ShaderMaterial({
      uniforms: _this.highPassUniforms,
      vertexShader: highPassShader.vertexShader,
      fragmentShader: highPassShader.fragmentShader,
      defines: {},
    });
    // Gaussian Blur Materials
    _this.separableBlurMaterials = [];
    var kernelSizeArray = [3, 5, 7, 9, 11];
    resx = Math.round(_this.resolution.x / 2);
    resy = Math.round(_this.resolution.y / 2);
    for (var i = 0; i < _this.nMips; i++) {
      _this.separableBlurMaterials.push(
        _this.getSeperableBlurMaterial(kernelSizeArray[i])
      );
      _this.separableBlurMaterials[i].uniforms["texSize"].value =
        new three_1.Vector2(resx, resy);
      resx = Math.round(resx / 2);
      resy = Math.round(resy / 2);
    }
    // Composite material
    _this.compositeMaterial = _this.getCompositeMaterial(_this.nMips);
    _this.compositeMaterial.uniforms["blurTexture1"].value =
      _this.renderTargetsVertical[0].texture;
    _this.compositeMaterial.uniforms["blurTexture2"].value =
      _this.renderTargetsVertical[1].texture;
    _this.compositeMaterial.uniforms["blurTexture3"].value =
      _this.renderTargetsVertical[2].texture;
    _this.compositeMaterial.uniforms["blurTexture4"].value =
      _this.renderTargetsVertical[3].texture;
    _this.compositeMaterial.uniforms["blurTexture5"].value =
      _this.renderTargetsVertical[4].texture;
    _this.compositeMaterial.uniforms["bloomStrength"].value = strength;
    _this.compositeMaterial.uniforms["bloomRadius"].value = 0.1;
    _this.compositeMaterial.needsUpdate = true;
    var bloomFactors = [1.0, 0.8, 0.6, 0.4, 0.2];
    _this.compositeMaterial.uniforms["bloomFactors"].value = bloomFactors;
    _this.bloomTintColors = [
      new three_1.Vector3(1, 1, 1),
      new three_1.Vector3(1, 1, 1),
      new three_1.Vector3(1, 1, 1),
      new three_1.Vector3(1, 1, 1),
      new three_1.Vector3(1, 1, 1),
    ];
    _this.compositeMaterial.uniforms["bloomTintColors"].value =
      _this.bloomTintColors;
    // copy material
    if (CopyShader_js_1.CopyShader === undefined) {
      console.error("THREE.UnrealBloomPass relies on CopyShader");
    }
    var copyShader = CopyShader_js_1.CopyShader;
    _this.copyUniforms = three_1.UniformsUtils.clone(copyShader.uniforms);
    _this.copyUniforms["opacity"].value = 1.0;
    _this.materialCopy = new three_1.ShaderMaterial({
      uniforms: _this.copyUniforms,
      vertexShader: copyShader.vertexShader,
      fragmentShader: copyShader.fragmentShader,
      blending: three_1.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      transparent: true,
    });
    _this.enabled = true;
    _this.needsSwap = false;
    _this._oldClearColor = new three_1.Color();
    _this.oldClearAlpha = 1;
    _this.basic = new three_1.MeshBasicMaterial();
    _this.fsQuad = new Pass_2.FullScreenQuad(null);
    return _this;
  }
  TransparentBackgroundFixedUnrealBloomPass.prototype.dispose = function () {
    for (var i = 0; i < this.renderTargetsHorizontal.length; i++) {
      this.renderTargetsHorizontal[i].dispose();
    }
    for (var i = 0; i < this.renderTargetsVertical.length; i++) {
      this.renderTargetsVertical[i].dispose();
    }
    this.renderTargetBright.dispose();
  };
  TransparentBackgroundFixedUnrealBloomPass.prototype.setSize = function (
    width,
    height
  ) {
    var resx = Math.round(width / 2);
    var resy = Math.round(height / 2);
    this.renderTargetBright.setSize(resx, resy);
    for (var i = 0; i < this.nMips; i++) {
      this.renderTargetsHorizontal[i].setSize(resx, resy);
      this.renderTargetsVertical[i].setSize(resx, resy);
      this.separableBlurMaterials[i].uniforms["texSize"].value =
        new three_1.Vector2(resx, resy);
      resx = Math.round(resx / 2);
      resy = Math.round(resy / 2);
    }
  };
  TransparentBackgroundFixedUnrealBloomPass.prototype.render = function (
    renderer,
    writeBuffer,
    readBuffer,
    deltaTime,
    maskActive
  ) {
    renderer.getClearColor(this._oldClearColor);
    this.oldClearAlpha = renderer.getClearAlpha();
    var oldAutoClear = renderer.autoClear;
    renderer.autoClear = false;
    renderer.setClearColor(this.clearColor, 0);
    if (maskActive) renderer.state.buffers.stencil.setTest(false);
    // Render input to screen
    if (this.renderToScreen) {
      this.fsQuad.material = this.basic;
      this.basic.map = readBuffer.texture;
      renderer.setRenderTarget(null);
      renderer.clear();
      this.fsQuad.render(renderer);
    }
    // 1. Extract Bright Areas
    this.highPassUniforms["tDiffuse"].value = readBuffer.texture;
    this.highPassUniforms["luminosityThreshold"].value = this.threshold;
    this.fsQuad.material = this.materialHighPassFilter;
    renderer.setRenderTarget(this.renderTargetBright);
    renderer.clear();
    this.fsQuad.render(renderer);
    // 2. Blur All the mips progressively
    var inputRenderTarget = this.renderTargetBright;
    for (var i = 0; i < this.nMips; i++) {
      this.fsQuad.material = this.separableBlurMaterials[i];
      this.separableBlurMaterials[i].uniforms["colorTexture"].value =
        inputRenderTarget.texture;
      this.separableBlurMaterials[i].uniforms["direction"].value =
        TransparentBackgroundFixedUnrealBloomPass.BlurDirectionX;
      renderer.setRenderTarget(this.renderTargetsHorizontal[i]);
      renderer.clear();
      this.fsQuad.render(renderer);
      this.separableBlurMaterials[i].uniforms["colorTexture"].value =
        this.renderTargetsHorizontal[i].texture;
      this.separableBlurMaterials[i].uniforms["direction"].value =
        TransparentBackgroundFixedUnrealBloomPass.BlurDirectionY;
      renderer.setRenderTarget(this.renderTargetsVertical[i]);
      renderer.clear();
      this.fsQuad.render(renderer);
      inputRenderTarget = this.renderTargetsVertical[i];
    }
    // Composite All the mips
    this.fsQuad.material = this.compositeMaterial;
    this.compositeMaterial.uniforms["bloomStrength"].value = this.strength;
    this.compositeMaterial.uniforms["bloomRadius"].value = this.radius;
    this.compositeMaterial.uniforms["bloomTintColors"].value =
      this.bloomTintColors;
    renderer.setRenderTarget(this.renderTargetsHorizontal[0]);
    renderer.clear();
    this.fsQuad.render(renderer);
    // Blend it additively over the input texture
    this.fsQuad.material = this.materialCopy;
    this.copyUniforms["tDiffuse"].value =
      this.renderTargetsHorizontal[0].texture;
    if (maskActive) renderer.state.buffers.stencil.setTest(true);
    if (this.renderToScreen) {
      renderer.setRenderTarget(null);
      this.fsQuad.render(renderer);
    } else {
      renderer.setRenderTarget(readBuffer);
      this.fsQuad.render(renderer);
    }
    // Restore renderer settings
    renderer.setClearColor(this._oldClearColor, this.oldClearAlpha);
    renderer.autoClear = oldAutoClear;
  };
  TransparentBackgroundFixedUnrealBloomPass.prototype.getSeperableBlurMaterial =
    function (kernelRadius) {
      return new three_1.ShaderMaterial({
        defines: {
          KERNEL_RADIUS: kernelRadius,
          SIGMA: kernelRadius,
        },
        uniforms: {
          colorTexture: { value: null },
          texSize: { value: new three_1.Vector2(0.5, 0.5) },
          direction: { value: new three_1.Vector2(0.5, 0.5) },
        },
        vertexShader:
          "varying vec2 vUv;\n\t\t\t\tvoid main() {\n\t\t\t\t\tvUv = uv;\n\t\t\t\t\tgl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n\t\t\t\t}",
        fragmentShader:
          "#include <common>\n\t\t\t\tvarying vec2 vUv;\n\t\t\t\tuniform sampler2D colorTexture;\n\t\t\t\tuniform vec2 texSize;\n\t\t\t\tuniform vec2 direction;\n\n\t\t\t\tfloat gaussianPdf(in float x, in float sigma) {\n\t\t\t\t\treturn 0.39894 * exp( -0.5 * x * x/( sigma * sigma))/sigma;\n\t\t\t\t}\n\t\t\t\tvoid main() {\n          vec2 invSize = 1.0 / texSize;          float fSigma = float(SIGMA);          float weightSum = gaussianPdf(0.0, fSigma);          float alphaSum = 0.0;          vec3 diffuseSum = texture2D( colorTexture, vUv).rgb * weightSum;          for( int i = 1; i < KERNEL_RADIUS; i ++ ) {            float x = float(i);            float w = gaussianPdf(x, fSigma);            vec2 uvOffset = direction * invSize * x;            vec4 sample1 = texture2D( colorTexture, vUv + uvOffset);            vec4 sample2 = texture2D( colorTexture, vUv - uvOffset);            diffuseSum += (sample1.rgb + sample2.rgb) * w;            alphaSum += (sample1.a + sample2.a) * w;            weightSum += 2.0 * w;          }          gl_FragColor = vec4(diffuseSum/weightSum, alphaSum/weightSum);\n        }",
      });
    };
  TransparentBackgroundFixedUnrealBloomPass.prototype.getCompositeMaterial =
    function (nMips) {
      return new three_1.ShaderMaterial({
        defines: {
          NUM_MIPS: nMips,
        },
        uniforms: {
          blurTexture1: { value: null },
          blurTexture2: { value: null },
          blurTexture3: { value: null },
          blurTexture4: { value: null },
          blurTexture5: { value: null },
          dirtTexture: { value: null },
          bloomStrength: { value: 1.0 },
          bloomFactors: { value: null },
          bloomTintColors: { value: null },
          bloomRadius: { value: 0.0 },
        },
        vertexShader:
          "varying vec2 vUv;\n\t\t\t\tvoid main() {\n\t\t\t\t\tvUv = uv;\n\t\t\t\t\tgl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n\t\t\t\t}",
        fragmentShader:
          "varying vec2 vUv;\n\t\t\t\tuniform sampler2D blurTexture1;\n\t\t\t\tuniform sampler2D blurTexture2;\n\t\t\t\tuniform sampler2D blurTexture3;\n\t\t\t\tuniform sampler2D blurTexture4;\n\t\t\t\tuniform sampler2D blurTexture5;\n\t\t\t\tuniform sampler2D dirtTexture;\n\t\t\t\tuniform float bloomStrength;\n\t\t\t\tuniform float bloomRadius;\n\t\t\t\tuniform float bloomFactors[NUM_MIPS];\n\t\t\t\tuniform vec3 bloomTintColors[NUM_MIPS];\n\n\t\t\t\tfloat lerpBloomFactor(const in float factor) {\n\t\t\t\t\tfloat mirrorFactor = 1.2 - factor;\n\t\t\t\t\treturn mix(factor, mirrorFactor, bloomRadius);\n\t\t\t\t}\n\n\t\t\t\tvoid main() {\n\t\t\t\t\tgl_FragColor = bloomStrength * ( lerpBloomFactor(bloomFactors[0]) * vec4(bloomTintColors[0], 1.0) * texture2D(blurTexture1, vUv) +\n\t\t\t\t\t\tlerpBloomFactor(bloomFactors[1]) * vec4(bloomTintColors[1], 1.0) * texture2D(blurTexture2, vUv) +\n\t\t\t\t\t\tlerpBloomFactor(bloomFactors[2]) * vec4(bloomTintColors[2], 1.0) * texture2D(blurTexture3, vUv) +\n\t\t\t\t\t\tlerpBloomFactor(bloomFactors[3]) * vec4(bloomTintColors[3], 1.0) * texture2D(blurTexture4, vUv) +\n\t\t\t\t\t\tlerpBloomFactor(bloomFactors[4]) * vec4(bloomTintColors[4], 1.0) * texture2D(blurTexture5, vUv) );\n\t\t\t\t}",
      });
    };
  return TransparentBackgroundFixedUnrealBloomPass;
})(Pass_1.Pass);
exports.UnrealBloomPass = TransparentBackgroundFixedUnrealBloomPass;
TransparentBackgroundFixedUnrealBloomPass.BlurDirectionX = new three_1.Vector2(
  1.0,
  0.0
);
TransparentBackgroundFixedUnrealBloomPass.BlurDirectionY = new three_1.Vector2(
  0.0,
  1.0
);
