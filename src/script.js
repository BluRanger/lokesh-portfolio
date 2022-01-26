import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as Pageable from "pageable";
// import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

// import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
// import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";

import { DotScreenPass } from "three/examples/jsm/postprocessing/DotScreenPass.js";
new Pageable("#container", {
  childSelector: "[data-anchor]", // CSS3 selector string for the pages
  anchors: [], // define the page anchors
  pips: true, // display the pips
  animation: 1000, // the duration in ms of the scroll animation
  delay: 0, // the delay in ms before the scroll animation starts
  throttle: 50, // the interval in ms that the resize callback is fired
  orientation: "vertical", // or horizontal or vertical
  swipeThreshold: 50, // swipe / mouse drag distance (px) before firing the page change event
  freeScroll: true, // allow manual scrolling when dragging instead of automatically moving to next page
  navPrevEl: false, // define an element to use to scroll to the previous page (CSS3 selector string or Element reference)
  navNextEl: false, // define an element to use to scroll to the next page (CSS3 selector string or Element reference)
  infinite: false, // enable infinite scrolling (from 0.4.0)
  // slideshow: {
  //   // enable slideshow that cycles through your pages automatically (from 0.4.0)
  //   interval: 3000, // time in ms between page change,
  //   delay: 0, // delay in ms after the interval has ended and before changing page
  // },
  events: {
    wheel: true, // enable / disable mousewheel scrolling
    mouse: true, // enable / disable mouse drag scrolling
    touch: true, // enable / disable touch / swipe scrolling
    keydown: true, // enable / disable keyboard navigation
  },
  easing: function (currentTime, startPos, endPos, interval) {
    // the easing function used for the scroll animation
    return -endPos * (currentTime /= interval) * (currentTime - 2) + startPos;
  },
  onInit: function () {
    // do something when the instance is ready
  },
  onUpdate: function () {
    // do something when the instance updates
  },
  onBeforeStart: function () {
    // do something before scrolling begins
  },
  onStart: function () {
    // do something when scrolling begins
  },
  onScroll: function () {
    // do something during scroll
  },
  onFinish: function () {
    // do something when scrolling ends
  },
});

/**
 * Base
 */

// Canvas
const canvas = document.querySelector("canvas.webgl");
const canvas1 = document.querySelector("canvas.webgl1");

// Scene
const scene = new THREE.Scene();
const scene1 = new THREE.Scene();
const cursor = {};
cursor.x = 0;
cursor.y = 0;
const rotations = {};
rotations.x = 0;
rotations.y = 0;

const cpositions = {};
cpositions.x = 0;
cpositions.y = 0;
cpositions.z = 0;
const cpositions1 = {};
cpositions1.x = 0;
cpositions1.y = 0;
cpositions1.z = 0;
/**
 * Models
 */
// const axesHelper = new THREE.AxesHelper(10);
// scene.add(axesHelper);
const textureLoader = new THREE.TextureLoader();
const moonTexture = textureLoader.load("moon.jpg");
const starTexture = textureLoader.load("star.png");
const cloudsTexture = textureLoader.load("cloud2.png");
const moonGeometry = new THREE.SphereGeometry(1.6, 50, 50);
const moonMaterial = new THREE.MeshBasicMaterial({
  map: moonTexture,
});
const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
moonMesh.rotation.y = -Math.PI * 0.5;
moonMesh.rotation.x = Math.PI * 0.15;
rotations.x = moonMesh.rotation.x;
rotations.y = moonMesh.rotation.y;
moonMesh.position.y = 3.5;
moonMesh.position.z = -5;

scene.add(moonMesh);
const cloudPlane = new THREE.PlaneGeometry(7, 3, 3, 3);
const cloudMaterial = new THREE.MeshBasicMaterial({
  map: cloudsTexture,
  transparent: true,
});
const cloudMesh = new THREE.Mesh(cloudPlane, cloudMaterial);
const cloudMesh1 = new THREE.Mesh(cloudPlane, cloudMaterial);

cloudMesh.position.x = 2;
cloudMesh.position.y = -0.5;
cloudMesh.position.z = 1.5;
cloudMesh1.position.x = -2;
cloudMesh1.position.y = -0.5;
cloudMesh1.position.z = 2;

cpositions.x = cloudMesh.position.x;
cpositions.y = cloudMesh.position.y;
cpositions.z = cloudMesh.position.z;
cpositions1.x = cloudMesh1.position.x;
cpositions1.y = cloudMesh1.position.y;
cpositions1.z = cloudMesh1.position.z;
scene.add(cloudMesh);
scene.add(cloudMesh1);

// Geometry
const particlesGeometry = new THREE.BufferGeometry();
const count = 1500;

const positions = new Float32Array(count * 3); // Multiply by 3 because each position is composed of 3 values (x, y, z)

for (
  let i = 0;
  i < count * 3;
  i++ // Multiply by 3 for same reason
) {
  positions[i] = (Math.random() - 0.5) * 10; // Math.random() - 0.5 to have a random value between -0.5 and +0.5
}

particlesGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(positions, 3)
);
const particlesMaterial = new THREE.PointsMaterial({
  map: starTexture,
  transparent: true,
});
particlesMaterial.size = 0.03;
particlesMaterial.sizeAttenuation = true;
const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene1.add(particles);
/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
directionalLight.position.set(-5, 5, 0);
scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};
window.addEventListener("mousemove", (event) => {
  // moonMesh.rotation.x = rotations.x;
  // moonMesh.rotation.y = rotations.y;

  // cloudMesh.position.x=cpositions.x
  // cloudMesh.position.y=cpositions.y
  // cloudMesh.position.z= cpositions.z
  // cloudMesh1.position.x=cpositions1.x
  // cloudMesh1.position.y=cpositions1.y
  // cloudMesh1.position.z=cpositions1.z
  cursor.x = event.clientX / sizes.width - 0.5;
  cursor.y = event.clientY / sizes.height - 0.5;
});

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer1.setSize(sizes.width, sizes.height);
  renderer1.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  //   effectComposer.setSize(sizes.width, sizes.height);
  //   effectComposer1.setSize(sizes.width, sizes.height);
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  1000
);
camera.position.set(0, 0, 4);
scene.add(camera);
scene1.add(camera);
// Controls
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0.75, 0);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true,
  antialias: true,
});
const renderer1 = new THREE.WebGLRenderer({
  canvas: canvas1,
  alpha: true,
});

// renderer.shadowMap.enabled = true;
// renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer1.setSize(sizes.width, sizes.height);
renderer1.setPixelRatio(Math.min(window.devicePixelRatio, 2));
// const effectComposer = new EffectComposer(renderer);
// effectComposer.setSize(sizes.width, sizes.height);
// effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
// const effectComposer1 = new EffectComposer(renderer1);
// effectComposer1.setSize(sizes.width, sizes.height);
// effectComposer1.setPixelRatio(Math.min(window.devicePixelRatio, 2));
// const renderPass = new RenderPass(scene, camera);

// effectComposer.addPass(renderPass);
// const renderPass1 = new RenderPass(scene1, camera);

// effectComposer1.addPass(renderPass1);

// const unrealBloomPass = new UnrealBloomPass();
// effectComposer.addPass(unrealBloomPass);
// effectComposer1.addPass(unrealBloomPass);
/**
 * Animate
 */
const clock = new THREE.Clock();
let previousTime = 0;

const tick = () => {
  const parallaxX = cursor.x;
  const parallaxY = cursor.y;
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;
  particles.position.x = parallaxX * 0.1;
  particles.position.y = parallaxY * 0.1;
  cloudMesh.position.x = cpositions.x + parallaxX * 0.08;
  cloudMesh1.position.x = cpositions1.x + parallaxX * 0.08;
  // cloudMesh.position.y = cpositions.y + parallaxY * 0.1;
  // cloudMesh1.position.y = cpositions1.y + parallaxY * 0.1;
  moonMesh.rotation.x = rotations.x + parallaxY * 0.3;
  moonMesh.rotation.y = rotations.y + parallaxX * 0.3;

  // Model animation

  // Update controls
  controls.update();

  //prevent canvas from being erased with next .render call

  //just render scene2 on top of scene1

  renderer1.render(scene1, camera);

  renderer.render(scene, camera);
  //   effectComposer.render();
  //   effectComposer1.render();

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
