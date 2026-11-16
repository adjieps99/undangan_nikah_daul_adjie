import * as THREE from 'three';
import { CameraController } from './CameraController.js';
import { CharacterController } from './CharacterController.js';
import { InteractionSystem } from './InteractionSystem.js';
import { HachiGarden3D } from '../world/HachiGarden3D.js';
import {
  detectSoftwareWebGL,
  configurePBRPipeline,
  scheduleAfterDraw,
  disposeSceneResources
} from './WebGLUtils.js';

export class ThreeScene {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    this.isRunning = false;
    this.isSoftwareGl = detectSoftwareWebGL();
    this._rafId = null;
    this._afterDrawHandle = null;
    this._lastFrameTime = performance.now();

    // 1. WebGL Renderer with standardized PBR Pipeline
    this.renderer = new THREE.WebGLRenderer({ antialias: !this.isSoftwareGl, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(containerWidth(this.container), containerHeight(this.container));
    this.renderer.shadowMap.enabled = false;
    this.renderer.domElement.dataset.testid = 'garden-webgl-canvas';
    this.container.appendChild(this.renderer.domElement);

    // 2. Scene & Indonesian Sunset Twilight Atmosphere
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#b86a82');
    this.scene.fog = new THREE.FogExp2('#b86a82', 0.0048);

    configurePBRPipeline(this.renderer, this.scene, this.isSoftwareGl);

    this.camera = new THREE.PerspectiveCamera(
      48,
      containerWidth(this.container) / containerHeight(this.container),
      0.1,
      1200
    );

    // 3. Camera Controller (Third-Person Soft Follow with Wide Vista)
    this.cameraController = new CameraController(this.camera);

    // 4. Indonesian Twilight Romantic Lighting
    this.setupGoldenHourLighting();

    // 5. Hachi Garden 3D Environment
    this.garden = new HachiGarden3D(this.scene);

    // 6. Character Controller
    this.character = new CharacterController(this.scene);
    this.character.setWalkableMeshes(this.garden.walkableMeshes);
    this.cameraController.setOccluderMeshes(this.garden.cameraOccluders);
    this.cameraController.setTarget(this.character.getPosition());

    // 7. Interaction System
    this.interactionSystem = new InteractionSystem(this.scene);

    // Resize Handler
    this.onWindowResize = () => this.handleResize();
    window.addEventListener('resize', this.onWindowResize);
  }

  setupGoldenHourLighting() {
    const ambientLight = new THREE.HemisphereLight('#ffa285', '#24421b', 1.05);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight('#ffe2ce', 1.35);
    sunLight.position.set(35, 45, 25);
    this.scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight('#a36b9c', 0.55);
    rimLight.position.set(-30, 25, -50);
    this.scene.add(rimLight);
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this._lastFrameTime = performance.now();
    this.loop();
  }

  stop() {
    this.isRunning = false;
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    if (this._afterDrawHandle !== null) {
      clearTimeout(this._afterDrawHandle);
      this._afterDrawHandle = null;
    }
  }

  update(delta = 0.016) {
    if (this.character) {
      this.character.update(delta);
      this.cameraController.setTarget(this.character.getPosition());
      if (this.interactionSystem) {
        this.interactionSystem.update(this.character.getPosition());
      }
    }
    this.cameraController.update(delta);
    if (this.garden) this.garden.update(delta);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  loop() {
    if (!this.isRunning) return;
    const now = performance.now();
    const rawDelta = (now - this._lastFrameTime) / 1000;
    this._lastFrameTime = now;
    const delta = Math.max(0.001, Math.min(0.05, rawDelta || 0.016));

    this.update(delta);
    this.render();

    if (this.isSoftwareGl) {
      scheduleAfterDraw(this.renderer, () => this.loop(), (id) => {
        this._afterDrawHandle = id;
      });
    } else {
      this._rafId = requestAnimationFrame(() => this.loop());
    }
  }

  handleResize() {
    if (!this.container) return;
    const width = containerWidth(this.container);
    const height = containerHeight(this.container);

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  dispose() {
    this.stop();
    window.removeEventListener('resize', this.onWindowResize);

    if (this.character && typeof this.character.destroy === 'function') {
      this.character.destroy();
    }

    disposeSceneResources(this.scene);

    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}

function containerWidth(c) { return c.clientWidth || window.innerWidth; }
function containerHeight(c) { return c.clientHeight || window.innerHeight; }
