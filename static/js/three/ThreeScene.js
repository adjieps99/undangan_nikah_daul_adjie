import * as THREE from 'three';
import { CameraController } from './CameraController.js';
import { CharacterController } from './CharacterController.js';
import { InteractionSystem } from './InteractionSystem.js';
import { HachiGarden3D } from '../world/HachiGarden3D.js';

export class ThreeScene {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    this.isRunning = false;

    // 1. WebGL Renderer with Mobile Pixel Ratio Cap
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(containerWidth(this.container), containerHeight(this.container));
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = false; // Fast mobile WebGL rendering
    this.container.appendChild(this.renderer.domElement);

    // 2. Scene & Golden Hour Warm Sunset Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#2b1e16'); // Warm Golden Sunset background
    this.scene.fog = new THREE.FogExp2('#2b1e16', 0.012);

    this.camera = new THREE.PerspectiveCamera(
      50,
      containerWidth(this.container) / containerHeight(this.container),
      0.1,
      1000
    );

    // 3. Camera Controller (Third-Person Soft Follow)
    this.cameraController = new CameraController(this.camera);

    // 4. Golden Hour Warm Lighting
    this.setupGoldenHourLighting();

    // 5. Hachi Garden 3D Environment
    this.garden = new HachiGarden3D(this.scene);

    // 6. Character Controller
    this.character = new CharacterController(this.scene);

    // 7. Interaction System
    this.interactionSystem = new InteractionSystem(this.scene);

    // 8. Internal Dev Performance Diagnostics
    this.frameCount = 0;
    this.lastFpsTime = performance.now();
    this.fps = 60;

    // Resize Handler
    this.onWindowResize = () => this.handleResize();
    window.addEventListener('resize', this.onWindowResize);
  }

  setupGoldenHourLighting() {
    // Warm Sunset Hemisphere Ambient Light
    const ambientLight = new THREE.HemisphereLight('#ffd1a9', '#3a5e2d', 0.9);
    this.scene.add(ambientLight);

    // Golden Directional Sun Light
    const sunLight = new THREE.DirectionalLight('#fff0d6', 1.2);
    sunLight.position.set(25, 35, 20);
    this.scene.add(sunLight);
  }

  start() {
    this.isRunning = true;
    this.loop();
  }

  stop() {
    this.isRunning = false;
  }

  update() {
    if (this.character) {
      this.character.update();
      // Target camera to 3D character position
      this.cameraController.setTarget(this.character.getPosition());
      // Update Interaction System proximity
      if (this.interactionSystem) {
        this.interactionSystem.update(this.character.getPosition());
      }
    }
    this.cameraController.update();
    if (this.garden) this.garden.update();

    // Internal Dev Performance Logging
    this.updateDiagnostics();
  }

  updateDiagnostics() {
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsTime));
      this.frameCount = 0;
      this.lastFpsTime = now;

      // Dev Diagnostics
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.debug(
          `[WebGL Diagnostics] FPS: ${this.fps} | Draw Calls: ${this.renderer.info.render.calls} | Geometries: ${this.renderer.info.memory.geometries} | Textures: ${this.renderer.info.memory.textures}`
        );
      }
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  loop() {
    if (!this.isRunning) return;
    this.update();
    this.render();
    requestAnimationFrame(() => this.loop());
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

    // Traverse scene and dispose geometries/materials
    this.scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((mat) => mat.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });

    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}

function containerWidth(c) { return c.clientWidth || window.innerWidth; }
function containerHeight(c) { return c.clientHeight || window.innerHeight; }
