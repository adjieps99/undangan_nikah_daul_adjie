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

    // 2. Scene & Indonesian Sunset Twilight Atmosphere
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#b86a82'); // Warm Twilight Rose horizon
    this.scene.fog = new THREE.FogExp2('#b86a82', 0.0048); // Gentle atmospheric distance haze

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
    this.cameraController.setTarget(this.character.getPosition());

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
    // Warm Twilight Hemisphere Ambient Light (Rose-Peach Sky / Tea Green Ground)
    const ambientLight = new THREE.HemisphereLight('#ffa285', '#24421b', 1.05);
    this.scene.add(ambientLight);

    // Warm Sunset Directional Sun Light
    const sunLight = new THREE.DirectionalLight('#ffe2ce', 1.35);
    sunLight.position.set(35, 45, 25);
    this.scene.add(sunLight);

    // Soft Rim Light from Mountain Horizon (Atmospheric Depth)
    const rimLight = new THREE.DirectionalLight('#a36b9c', 0.55);
    rimLight.position.set(-30, 25, -50);
    this.scene.add(rimLight);
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
